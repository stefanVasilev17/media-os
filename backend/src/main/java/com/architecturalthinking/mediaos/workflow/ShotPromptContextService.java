package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ShotPromptContextService {
    private static final int MAX_REQUIRED_CHARACTERS = 26000;
    private static final int MAX_CANONICAL_CHARACTERS = 9000;
    private static final int MAX_OPTIONAL_CHARACTERS = 2200;
    private static final int MAX_OPTIONAL_RULES = 5;

    private final ProductionMemoryService memory;
    private final CreativePolicyService policies;

    public ShotPromptContextService(ProductionMemoryService memory, CreativePolicyService policies) {
        this.memory = memory;
        this.policies = policies;
    }

    public record PreparedPrompt(String appendix, String fingerprint, String policyVersion,
                                 int mandatoryRuleCount, int optionalRuleCount,
                                 int promptCharacters, List<String> memoryRuleIds) {}

    public PreparedPrompt prepare(UUID episodeId, String shotKey, String directorMessage,
                                  String currentNarration) {
        return prepareForStage(episodeId, "SHOT", shotKey, directorMessage, currentNarration);
    }

    public PreparedPrompt prepareForStage(UUID episodeId, String stageKey, String subject,
                                          String creatorMessage, String sourceText) {
        List<Map<String, Object>> rules = memory.rulesFor("ALL", episodeId);
        Map<String, Object> policy = policies.current();
        return assembleForStage(episodeId, stageKey, subject, creatorMessage, sourceText, policy, rules);
    }

    static PreparedPrompt assemble(UUID episodeId, String shotKey, String directorMessage,
                                   String currentNarration, Map<String, Object> policy,
                                   List<Map<String, Object>> rules) {
        return assembleForStage(episodeId, "SHOT", shotKey, directorMessage,
                currentNarration, policy, rules);
    }

    static PreparedPrompt assembleForStage(UUID episodeId, String stageKey, String subject,
                                           String directorMessage, String currentNarration,
                                           Map<String, Object> policy, List<Map<String, Object>> rules) {

    // Pure version for regression tests: no network or AI tokens.
        if (episodeId == null || subject == null || subject.isBlank()
                || stageKey == null || stageKey.isBlank()
                || directorMessage == null || directorMessage.isBlank()) {
            throw new IllegalArgumentException("Episode, shot and original Director request are required.");
        }
        String policyVersion = clean(policy.get("version"));
        Object policyPayload = policy.get("payload");
        if (!(policyPayload instanceof Map<?, ?> config)
                || !(config.get("canonicalCreationRules") instanceof Map<?, ?> canonical)
                || !Boolean.TRUE.equals(canonical.get("supersedesConflictingLegacyPolicy"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "PROMPT_PREFLIGHT_BLOCKED: canonical production rules are missing.");
        }

        ObjectMapper mapper = new ObjectMapper();
        String canonicalJson;
        try {
            canonicalJson = mapper.writeValueAsString(canonical);
        } catch (JsonProcessingException error) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "PROMPT_PREFLIGHT_BLOCKED: canonical policy serialization failed.", error);
        }
        if (canonicalJson.length() > MAX_CANONICAL_CHARACTERS)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "PROMPT_PREFLIGHT_BLOCKED: canonical policy exceeds the safe prompt budget. Consolidate it before a paid call.");

        String scopeText = clean(directorMessage) + " " + clean(currentNarration);
        Set<String> relevantWords = significantWords(scopeText);
        List<Map<String, Object>> ordered = new ArrayList<>(rules);
        ordered.sort(Comparator
                .comparingInt((Map<String, Object> r) -> "REQUIRED".equalsIgnoreCase(clean(r.get("severity"))) ? 0 : 1)
                .thenComparing(r -> clean(r.get("id"))));

        StringBuilder must = new StringBuilder();
        StringBuilder optional = new StringBuilder();
        Set<String> dedup = new LinkedHashSet<>();
        List<String> ids = new ArrayList<>();
        int requiredCount = 0;
        int optionalCount = 0;

        for (Map<String, Object> rule : ordered) {
            String id = clean(rule.get("id"));
            String scope = clean(rule.get("scope")).toUpperCase(Locale.ROOT);
            String severity = clean(rule.get("severity")).toUpperCase(Locale.ROOT);
            String content = clean(rule.get("content")).replaceAll("\\s+", " ");
            if (id.isBlank() || content.isBlank() || !relevantScope(stageKey, scope)) continue;
            if (!dedup.add(scope + "|" + content.toLowerCase(Locale.ROOT))) continue;

            String formatted = "- [" + id + "] " + scope + "/" + severity + ": " + content + "\n";
            if ("REQUIRED".equals(severity)) {
                if (must.length() + formatted.length() > MAX_REQUIRED_CHARACTERS)
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "PROMPT_PREFLIGHT_BLOCKED: mandatory rules exceed safe input budget. No rules were silently omitted.");
                must.append(formatted);
                ids.add(id);
                requiredCount++;
            } else if (optionalCount < MAX_OPTIONAL_RULES && relevant(rule, relevantWords)
                    && optional.length() + formatted.length() <= MAX_OPTIONAL_CHARACTERS) {
                optional.append(formatted);
                ids.add(id);
                optionalCount++;
            }
        }
        if (requiredCount == 0) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "PROMPT_PREFLIGHT_BLOCKED: no active REQUIRED Production Memory rules were found.");

        String appendix = """
                MEDIAOS FIRST-PASS PRODUCTION CONTRACT (automatic, read-only).
                The Director's message is the task, not the source of production policy.
                Treat these as binding production constraints, not optional suggestions.
                Preserve approved scripts, unrelated shots, real architecture facts, and revision scope.
                Never claim the existence of an approval, file, audio render or video render unless supplied.
                Resolve any conflict by preserving existing Director LOCKs and canonical policy.
                If a requirement cannot be satisfied, explain the conflict in the reply and preserve the locked facts.
                Do not silently drop a required rule or invent a substitute.

                EPISODE / SHOT:
                """ + episodeId + " / " + stageKey + " / " + subject + "\n" +
                "CANONICAL POLICY v" + policyVersion + ":\n" + canonicalJson + "\n\n" +
                "ACTIVE MANDATORY PRODUCTION MEMORY RULES:\n" + must +
                (optionalCount == 0 ? "" : "\nRELEVANT ADDITIONAL RULES:\n" + optional) +
                "\nEND OF MEDIAOS PRODUCTION CONTRACT.";
        return new PreparedPrompt(appendix, sha256(appendix), policyVersion,
                requiredCount, optionalCount, appendix.length(), List.copyOf(ids));
    }

    private static boolean relevantScope(String stageKey, String ruleScope) {
        if ("ALL".equals(ruleScope)) return true;
        return switch (stageKey.toUpperCase(Locale.ROOT)) {
            case "TOPIC" -> false;
            case "TRUTH", "SCRIPT" -> "SCRIPT".equals(ruleScope);
            case "SCENE", "SHOT", "DIRECTOR" ->
                    "SCRIPT".equals(ruleScope) || "VOICE".equals(ruleScope) || "VISUAL".equals(ruleScope);
            default -> throw new IllegalArgumentException("Unsupported generation stage: " + stageKey);
        };
    }

    private static boolean relevant(Map<String, Object> rule, Set<String> words) {
        if (words.isEmpty()) return false;
        for (String term : significantWords(clean(rule.get("content")))) {
            if (words.contains(term)) return true;
        }
        return false;
    }

    private static Set<String> significantWords(String raw) {
        Set<String> words = new LinkedHashSet<>();
        for (String term : raw.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}]+")) {
            if (term.length() >= 5 && !Set.of("there", "after", "about", "which",
                    "their", "should", "would", "these", "where", "before", "never",
                    "every", "always", "script", "voice", "video", "episode", "shot").contains(term))
                words.add(term);
        }
        return words;
    }

    private static String clean(Object input) {
        return input == null ? "" : String.valueOf(input).trim();
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 is required", error);
        }
    }
}
