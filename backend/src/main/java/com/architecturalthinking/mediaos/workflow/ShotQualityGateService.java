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
import java.util.UUID;

@Service
public class ShotQualityGateService {
    private static final UUID PROJECT = ProductionOverviewService.PROJECT_ID;
    private final JdbcClient jdbc;
    private final EpisodeWorkspaceService episodes;
    private final boolean writesEnabled;
    private final String directorSecret;

    public ShotQualityGateService(JdbcClient jdbc, EpisodeWorkspaceService episodes,
                                  @Value("${mediaos.episodes.writes-enabled:false}") boolean writesEnabled,
                                  @Value("${mediaos.learning.approval-secret:}") String directorSecret) {
        this.jdbc = jdbc;
        this.episodes = episodes;
        this.writesEnabled = writesEnabled;
        this.directorSecret = directorSecret == null ? "" : directorSecret;
    }

    public record Assertion(UUID id, UUID memoryRuleId, String target, String predicate,
                            String literalValue, String sourceRule, String scope) {}

    public record Violation(UUID assertionId, UUID memoryRuleId, String target,
                            String predicate, String literalValue, String sourceRule) {}

    public record QualityReport(boolean passed, int assertionCount, String ruleFingerprint,
                                List<Violation> violations) {}

    public List<Assertion> assertions(UUID episodeId) {
        episodes.episode(episodeId);
        return jdbc.sql("""
                select q.id, q.memory_rule_id, q.target, q.predicate, q.literal_value,
                       m.content, m.scope
                from production_quality_assertion q
                join production_memory_rule m on m.id=q.memory_rule_id
                where q.active and m.active and m.project_id=:project
                  and (m.episode_id is null or m.episode_id=:episode)
                order by q.id
                """)
                .param("project", PROJECT).param("episode", episodeId)
                .query((rs, n) -> new Assertion(
                        rs.getObject("id", UUID.class),
                        rs.getObject("memory_rule_id", UUID.class),
                        rs.getString("target"), rs.getString("predicate"),
                        rs.getString("literal_value"), rs.getString("content"),
                        rs.getString("scope")))
                .list();
    }

    public QualityReport inspect(UUID episodeId, String narration,
                                 String voiceDirection, String visualDirection) {
        List<Assertion> rules = assertions(episodeId);
        return evaluate(rules, Map.of(
                "NARRATION", nullToEmpty(narration),
                "VOICE_DIRECTION", nullToEmpty(voiceDirection),
                "VISUAL_DIRECTION", nullToEmpty(visualDirection)));
    }

    public void requirePass(UUID episodeId, String narration,
                            String voiceDirection, String visualDirection) {
        QualityReport report = inspect(episodeId, narration, voiceDirection, visualDirection);
        if (!report.passed()) {
            Violation first = report.violations().get(0);
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "SHOT_QUALITY_GATE_FAILED: " + report.violations().size() + " deterministic violation(s). "
                            + first.target() + ": " + first.predicate() + " [" + first.literalValue()
                            + "]. Production Memory rule " + first.memoryRuleId()
                            + ". This candidate cannot be saved or Director LOCKED.");
        }
    }

    public String fingerprint(UUID episodeId) {
        return fingerprintOf(assertions(episodeId));
    }

    static QualityReport evaluate(List<Assertion> rules, Map<String, String> fields) {
        List<Violation> errors = new ArrayList<>();
        for (Assertion rule : rules) {
            String actual = normalize(fields.getOrDefault(rule.target(), ""));
            String expected = normalize(rule.literalValue());
            boolean found = actual.contains(expected);
            boolean violated = ("FORBIDDEN_LITERAL".equals(rule.predicate()) && found)
                    || ("REQUIRED_LITERAL".equals(rule.predicate()) && !found);
            if (violated) {
                errors.add(new Violation(rule.id(), rule.memoryRuleId(), rule.target(),
                        rule.predicate(), rule.literalValue(), rule.sourceRule()));
            }
        }
        return new QualityReport(errors.isEmpty(), rules.size(),
                fingerprintOf(rules), List.copyOf(errors));
    }

    private static String normalize(String input) {
        return nullToEmpty(input).trim().toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ");
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static String fingerprintOf(List<Assertion> rules) {
        StringBuilder material = new StringBuilder();
        for (Assertion rule : rules) {
            material.append(rule.id()).append('|').append(rule.memoryRuleId()).append('|')
                    .append(rule.target()).append('|').append(rule.predicate()).append('|')
                    .append(rule.literalValue()).append('|').append(rule.scope()).append('|')
                    .append(rule.sourceRule()).append('\n');
        }
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(
                    material.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 not available", error);
        }
    }

    @Transactional
    public Map<String, Object> register(UUID episodeId, UUID memoryRuleId,
                                        String target, String predicate, String literal,
                                        String note, String authorization) {
        if (!writesEnabled || !episodes.writesEnabled() || directorSecret.length() < 32) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Reviewed quality assertion publishing is disabled until Director authentication rollout.");
        }
        if (authorization == null || !MessageDigest.isEqual(
                directorSecret.getBytes(StandardCharsets.UTF_8),
                authorization.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Director approval capability is required.");
        }
        episodes.episode(episodeId);
        if (!List.of("NARRATION", "VOICE_DIRECTION", "VISUAL_DIRECTION").contains(target)
                || !List.of("FORBIDDEN_LITERAL", "REQUIRED_LITERAL").contains(predicate)
                || literal == null || literal.trim().length() < 2 || literal.length() > 600
                || note == null || note.trim().length() < 15 || note.length() > 1500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Provide a supported assertion, an exact literal and a meaningful Director note.");
        }
        Map<String, String> source = jdbc.sql("""
                select scope,rule_type from production_memory_rule
                where id=:rule and project_id=:project and active
                  and (episode_id=:episode or episode_id is null)
                """).param("rule", memoryRuleId).param("project", PROJECT).param("episode", episodeId)
                .query((rs, n) -> Map.of("scope", rs.getString("scope"),
                        "type", rs.getString("rule_type")))
                .optional().orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.CONFLICT, "Unknown, inactive, or unrelated memory rule."));
        if (!List.of("CORRECTION", "LOCK", "QA").contains(source.get("type")))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only an approved Correction, Lock or QA rule can provide an executable assertion.");

        String scope = source.get("scope");
        if (!("ALL".equals(scope)
                || ("NARRATION".equals(target) && "SCRIPT".equals(scope))
                || ("VOICE_DIRECTION".equals(target) && "VOICE".equals(scope))
                || ("VISUAL_DIRECTION".equals(target) && "VISUAL".equals(scope)))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This check cannot target a field outside the source rule's scope.");
        }

        UUID id = UUID.randomUUID();
        int changed = jdbc.sql("""
                insert into production_quality_assertion(
                  id,memory_rule_id,target,predicate,literal_value,director_note)
                values(:id,:rule,:target,:predicate,:literal,:note)
                on conflict(memory_rule_id,target,predicate,literal_value) do nothing
                """).param("id", id).param("rule", memoryRuleId)
                .param("target", target).param("predicate", predicate)
                .param("literal", literal.trim()).param("note", note.trim()).update();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("created", changed == 1);
        result.put("episodeId", episodeId);
        result.put("memoryRuleId", memoryRuleId);
        result.put("ruleFingerprint", fingerprint(episodeId));
        return result;
    }
}
