package com.architecturalthinking.mediaos.workflow;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class DirectorRuleStudioService {
    private static final UUID PROJECT = ProductionOverviewService.PROJECT_ID;
    private static final Set<String> SCOPES =
            Set.of("ALL", "SCRIPT", "VOICE", "VISUAL", "VOICE_VISUAL");
    private final JdbcClient jdbc;
    private final EpisodeWorkspaceService episodes;
    private final ProductionMemoryService memory;
    private final CreativePolicyService policy;
    private final ShotPromptContextService firstPass;
    private final String directorSecret;
    private final boolean enabled;

    public DirectorRuleStudioService(JdbcClient jdbc, EpisodeWorkspaceService episodes,
                                     ProductionMemoryService memory, CreativePolicyService policy,
                                     ShotPromptContextService firstPass,
                                     @Value("${mediaos.learning.approval-secret:}") String directorSecret,
                                     @Value("${mediaos.rule-studio.enabled:false}") boolean enabled) {
        this.jdbc = jdbc;
        this.episodes = episodes;
        this.memory = memory;
        this.policy = policy;
        this.firstPass = firstPass;
        this.directorSecret = directorSecret == null ? "" : directorSecret;
        this.enabled = enabled;
    }

    public boolean writesEnabled() {
        return enabled && episodes.writesEnabled() && directorSecret.length() >= 32;
    }

    public void requireDirector(String raw) {
        if (!writesEnabled()) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Director Rule Studio writes are disabled until the reviewed rollout and authentication gates are enabled.");
        if (raw == null || !MessageDigest.isEqual(
                directorSecret.getBytes(StandardCharsets.UTF_8),
                raw.getBytes(StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Director approval capability required.");
    }

    public record RuleComparison(String fingerprint, String exactDuplicateRuleId,
                                 List<Map<String, Object>> relatedRules) {}

    public record DraftInput(UUID episodeId, String scope, UUID parentProposalId, String creatorPrompt,
                             String ruleEnglish, String explanationBg,
                             String positiveExample, String negativeExample, String sourceKind,
                             String fingerprint) {}

    public static void validateScope(String scope) {
        if (!SCOPES.contains(scope))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Rule scope must be ALL, SCRIPT, VOICE, VISUAL or VOICE_VISUAL.");
    }

    public void checkEpisode(UUID episodeId) {
        if (episodeId != null) episodes.episode(episodeId);
    }

    public Map<String, Object> previewContext(UUID episodeId, String scope,
                                               String message, UUID parentProposalId) {
        validateScope(scope);
        checkEpisode(episodeId);
        if (message == null || message.isBlank() || message.length() > 4000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rule request needs 1–4000 characters.");
        String parentRule = "";
        if (parentProposalId != null) {
            Map<String, Object> parent = proposal(parentProposalId);
            if (!Objects.equals(parent.get("episodeId"), episodeId == null ? null : episodeId.toString())
                    || !scope.equals(parent.get("scope")))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "A follow-up can revise only a proposal with the same target episode and scope.");
            parentRule = String.valueOf(parent.get("proposedRule"));
        }
        String stage = switch (scope) {
            case "SCRIPT" -> "SCRIPT";
            case "VOICE" -> "VOICE";
            case "VISUAL" -> "VIDEO";
            default -> "SHOT";
        };
        UUID referenceEpisode = episodeId == null ? ProductionOverviewService.EPISODE_ID : episodeId;
        var active = episodeId == null ? globalRules() : memory.rulesFor("ALL", episodeId);
        var context = ShotPromptContextService.assembleForStage(
                referenceEpisode, stage, "RULE_STUDIO_" + scope,
                message, parentRule, policy.current(), active);
        RuleComparison compare = compare(episodeId, scope, parentRule.isBlank() ? message : parentRule);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("compiledRules", context.appendix());
        result.put("rulesFingerprint", context.fingerprint());
        result.put("currentRulesFingerprint", compare.fingerprint());
        result.put("policyVersion", context.policyVersion());
        result.put("mandatoryRuleCount", context.mandatoryRuleCount());
        result.put("optionalRuleCount", context.optionalRuleCount());
        result.put("parentRule", parentRule);
        result.put("relatedRules", compare.relatedRules());
        return result;
    }

    private List<Map<String, Object>> globalRules() {
        return jdbc.sql("""
                select id,scope,rule_type,severity,content,source
                from production_memory_rule
                where project_id=:project and episode_id is null and active=true
                order by case severity when 'REQUIRED' then 0 else 1 end,id
                """).param("project", PROJECT)
                .query((rs, n) -> Map.<String, Object>of(
                        "id", rs.getObject("id", UUID.class),
                        "scope", rs.getString("scope"), "type", rs.getString("rule_type"),
                        "severity", rs.getString("severity"), "content", rs.getString("content"),
                        "source", rs.getString("source")))
                .list();
    }

    public List<Map<String, Object>> recent() {
        return jdbc.sql("""
                select id from production_rule_studio_proposal
                where project_id=:project order by created_at desc limit 50
                """).param("project", PROJECT)
                .query((rs, n) -> rs.getObject("id", UUID.class))
                .list().stream().map(this::proposal).toList();
    }

    public Map<String, Object> proposal(UUID id) {
        return jdbc.sql("""
                select id,episode_id,parent_proposal_id,scope,source_prompt,proposed_rule,
                       explanation_bg,positive_example,negative_example,source_kind,status,
                       rule_fingerprint,published_memory_rule_id,director_note,reviewer,
                       reviewed_at,created_at
                from production_rule_studio_proposal
                where id=:id and project_id=:project
                """).param("id", id).param("project", PROJECT)
                .query((rs, row) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getObject("id", UUID.class).toString());
                    UUID ep = rs.getObject("episode_id", UUID.class);
                    item.put("episodeId", ep == null ? null : ep.toString());
                    UUID parent = rs.getObject("parent_proposal_id", UUID.class);
                    item.put("parentProposalId", parent == null ? null : parent.toString());
                    item.put("scope", rs.getString("scope"));
                    item.put("creatorPrompt", rs.getString("source_prompt"));
                    item.put("proposedRule", rs.getString("proposed_rule"));
                    item.put("explanationBg", rs.getString("explanation_bg"));
                    item.put("positiveExample", rs.getString("positive_example"));
                    item.put("negativeExample", rs.getString("negative_example"));
                    item.put("sourceKind", rs.getString("source_kind"));
                    item.put("status", rs.getString("status"));
                    item.put("ruleFingerprint", rs.getString("rule_fingerprint"));
                    UUID memoryId = rs.getObject("published_memory_rule_id", UUID.class);
                    item.put("memoryRuleId", memoryId == null ? null : memoryId.toString());
                    item.put("directorNote", rs.getString("director_note"));
                    item.put("reviewer", rs.getString("reviewer"));
                    item.put("reviewedAt", rs.getObject("reviewed_at") == null ? null : rs.getString("reviewed_at"));
                    item.put("createdAt", rs.getString("created_at"));
                    return item;
                }).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Unknown Director Rule Studio proposal."));
    }

    @Transactional
    public Map<String, Object> create(DraftInput input, String capability) {
        requireDirector(capability);
        validateScope(input.scope());
        checkEpisode(input.episodeId());
        if (!Set.of("OPENAI","MANUAL").contains(input.sourceKind()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown proposal source.");
        if (input.creatorPrompt() == null || input.creatorPrompt().isBlank()
                || input.creatorPrompt().length() > 4000
                || input.ruleEnglish() == null || input.ruleEnglish().trim().length() < 15
                || input.ruleEnglish().length() > 2000
                || input.explanationBg() == null || input.explanationBg().length() > 2000
                || input.positiveExample() == null || input.positiveExample().length() > 1500
                || input.negativeExample() == null || input.negativeExample().length() > 1500)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid rule or example text length.");
        var liveContext = previewContext(input.episodeId(), input.scope(),
                input.creatorPrompt(), input.parentProposalId());
        if (!liveContext.get("rulesFingerprint").equals(input.fingerprint()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Production rules changed. Re-preview the proposal instead of saving stale wording.");
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                insert into production_rule_studio_proposal(
                  id,project_id,episode_id,parent_proposal_id,scope,source_prompt,
                  proposed_rule,explanation_bg,positive_example,negative_example,
                  source_kind,rule_fingerprint,status)
                values(:id,:project,:episode,:parent,:scope,:prompt,:rule,:explanation,
                       :positive,:negative,:kind,:fingerprint,'DRAFT')
                """)
                .param("id", id).param("project", PROJECT)
                .param("episode", input.episodeId())
                .param("parent", input.parentProposalId())
                .param("scope", input.scope())
                .param("prompt", input.creatorPrompt().trim())
                .param("rule", input.ruleEnglish().trim())
                .param("explanation", input.explanationBg().trim())
                .param("positive", input.positiveExample().trim())
                .param("negative", input.negativeExample().trim())
                .param("kind", input.sourceKind())
                .param("fingerprint", input.fingerprint()).update();
        return proposal(id);
    }

    public RuleComparison compare(UUID episodeId, String scope, String candidateRule) {
        validateScope(scope);
        checkEpisode(episodeId);
        List<Map<String, Object>> current = jdbc.sql("""
                select id,episode_id,scope,content,updated_at
                from production_memory_rule
                where project_id=:project and active=true
                  and (episode_id is null or episode_id=:episode)
                order by id
                """).param("project", PROJECT).param("episode", episodeId)
                .query((rs, n) -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", rs.getObject("id", UUID.class).toString());
                    UUID ep = rs.getObject("episode_id", UUID.class);
                    map.put("episodeId", ep == null ? "GLOBAL" : ep.toString());
                    map.put("scope", rs.getString("scope"));
                    map.put("content", rs.getString("content"));
                    map.put("version", rs.getString("updated_at"));
                    return map;
                }).list();
        List<Map<String, Object>> overlaps = new ArrayList<>();
        String exact = null;
        for (Map<String, Object> row : current) {
            String previous = normalize(String.valueOf(row.get("content")));
            String candidate = normalize(candidateRule);
            String id = String.valueOf(row.get("id"));
            boolean sameTarget = Objects.equals(
                    row.get("episodeId"), episodeId == null ? "GLOBAL" : episodeId.toString());
            if (sameTarget && scope.equals(row.get("scope")) && candidate.equals(previous)) exact = id;
            double overlap = ProductionMemoryImportService.similarity(candidate, previous);
            if (overlap >= 0.33 && overlaps.size() < 10) overlaps.add(Map.of(
                    "ruleId", id, "scope", row.get("scope"),
                    "content", row.get("content"), "similarity", Math.round(overlap * 100.0)/100.0));
        }
        return new RuleComparison(sha(current.toString()), exact, List.copyOf(overlaps));
    }

    @Transactional
    public Map<String, Object> decide(UUID proposalId, String action, String expectedFingerprint,
                                      boolean compared, String reviewer, String note, String capability) {
        requireDirector(capability);
        if (!Set.of("APPROVE","REJECT").contains(action)
                || !compared || reviewer == null || reviewer.trim().length() < 3
                || reviewer.length() > 120
                || note == null || note.trim().length() < 15 || note.length() > 1500)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Director approval needs a meaningful review note and comparison confirmation.");
        // Serialize decisions with the imported memory activation and Episode Learning promotions.
        jdbc.sql("select pg_advisory_xact_lock(90200123456789)")
                .query((rs, n) -> 1).single();
        var item = jdbc.sql("""
                select id,episode_id,scope,proposed_rule,status
                from production_rule_studio_proposal
                where id=:id and project_id=:project for update
                """).param("id", proposalId).param("project", PROJECT)
                .query((rs, n) -> Map.<String, Object>of(
                        "id", rs.getObject("id", UUID.class),
                        "episode", rs.getObject("episode_id", UUID.class) == null
                                ? "GLOBAL" : rs.getString("episode_id"),
                        "scope", rs.getString("scope"), "rule", rs.getString("proposed_rule"),
                        "status", rs.getString("status")))
                .optional().orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown proposal."));
        if (!"DRAFT".equals(item.get("status")))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A reviewed proposal cannot be activated again.");
        UUID episodeId = "GLOBAL".equals(item.get("episode")) ? null
                : UUID.fromString((String)item.get("episode"));
        RuleComparison report = compare(episodeId, (String)item.get("scope"), (String)item.get("rule"));
        if (!report.fingerprint().equals(expectedFingerprint))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Production Memory changed since your last comparison. Refresh the rule before approval.");

        UUID newRuleId = null;
        if ("APPROVE".equals(action)) {
            if (report.exactDuplicateRuleId() != null)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "An identical rule is already active in this scope.");
            newRuleId = UUID.randomUUID();
            jdbc.sql("""
                    insert into production_memory_rule(
                      id,project_id,episode_id,scope,rule_type,severity,content,source)
                    values(:id,:project,:episode,:scope,'CORRECTION','REQUIRED',:rule,:source)
                    """).param("id", newRuleId).param("project", PROJECT)
                    .param("episode", episodeId).param("scope", item.get("scope"))
                    .param("rule", item.get("rule"))
                    .param("source", "Director Rule Studio " + proposalId).update();
        }
        jdbc.sql("""
                update production_rule_studio_proposal
                set status=:status,published_memory_rule_id=:rule,
                    reviewed_at=now(),director_note=:note,reviewer=:reviewer
                where id=:id and status='DRAFT'
                """).param("status", "APPROVE".equals(action) ? "APPROVED" : "REJECTED")
                .param("rule", newRuleId).param("id", proposalId)
                .param("note", note.trim()).param("reviewer", reviewer.trim()).update();
        jdbc.sql("""
                insert into production_rule_studio_decision_audit(
                  id,proposal_id,decision,comparison_fingerprint,director_note,reviewer,published_memory_rule_id)
                values(:id,:proposal,:decision,:fingerprint,:note,:reviewer,:rule)
                """).param("id", UUID.randomUUID()).param("proposal", proposalId)
                .param("decision", action).param("fingerprint", expectedFingerprint)
                .param("note", note.trim()).param("reviewer", reviewer.trim())
                .param("rule", newRuleId).update();
        return proposal(proposalId);
    }

    public List<Map<String, Object>> effectiveRules(UUID episodeId, String scope) {
        validateScope(scope);
        checkEpisode(episodeId);
        return (episodeId == null ? globalRules() : memory.rulesFor("ALL", episodeId)).stream()
                .filter(r -> applies(scope, String.valueOf(r.get("scope"))))
                .map(r -> Map.of("id", r.get("id").toString(),
                        "scope", r.get("scope"), "severity", r.get("severity"),
                        "content", r.get("content")))
                .toList();
    }

    static boolean applies(String requested, String actual) {
        if ("ALL".equals(actual)) return true;
        return switch(requested) {
            case "SCRIPT" -> "SCRIPT".equals(actual);
            case "VOICE" -> "VOICE".equals(actual) || "VOICE_VISUAL".equals(actual)
                    || "SCRIPT".equals(actual);
            case "VISUAL" -> "VISUAL".equals(actual) || "VOICE_VISUAL".equals(actual)
                    || "SCRIPT".equals(actual) || "VOICE".equals(actual);
            case "VOICE_VISUAL" -> "VOICE".equals(actual) || "VISUAL".equals(actual)
                    || "VOICE_VISUAL".equals(actual) || "SCRIPT".equals(actual);
            case "ALL" -> true;
            default -> false;
        };
    }

    private static String normalize(String text) {
        return text == null ? "" : text.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    private static String sha(String text) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(text.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }
}
