package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ProductionMemoryImportService {
    private static final UUID PROJECT = ProductionOverviewService.PROJECT_ID;
    private static final String EXPECTED_SCHEMA = "architectural-thinking.production-memory-staging.v1";
    private static final Set<String> SCOPES = Set.of("ALL", "SCRIPT", "VOICE", "VISUAL");
    private static final Set<String> TYPES = Set.of("LOCK", "QA", "CORRECTION", "PREFERENCE");
    private static final Set<String> SEVERITIES = Set.of("REQUIRED", "PREFERENCE");
    private final JdbcClient jdbc;
    private final ObjectMapper json;
    private final EpisodeWorkspaceService episodes;
    private final boolean enabled;
    private final String directorSecret;

    public ProductionMemoryImportService(JdbcClient jdbc, ObjectMapper json,
                                         EpisodeWorkspaceService episodes,
                                         @Value("${mediaos.memory-import.enabled:false}") boolean enabled,
                                         @Value("${mediaos.learning.approval-secret:}") String directorSecret) {
        this.jdbc = jdbc;
        this.json = json;
        this.episodes = episodes;
        this.enabled = enabled;
        this.directorSecret = directorSecret == null ? "" : directorSecret;
    }

    public record Candidate(String candidateKey, String episode, String scope, String type,
                            String severity, String content, String sourceFile, int sourceLine,
                            String excerpt, String sourceSha256) {}
    public record Comparison(String fingerprint, String exactDuplicateRuleId,
                             List<Map<String, Object>> potentialOverlaps,
                             boolean episodeRegistered, UUID resolvedEpisodeId) {}

    public boolean writesAvailable() {
        return enabled && episodes.writesEnabled() && directorSecret.length() >= 32;
    }

    public void requireCapability(String supplied) {
        if (!writesAvailable())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Memory import writes are disabled until episode permissions and Director auth are approved.");
        if (supplied == null || !MessageDigest.isEqual(
                directorSecret.getBytes(StandardCharsets.UTF_8),
                supplied.getBytes(StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Director review capability required.");
    }

    @Transactional
    public Map<String, Object> stage(String payload, String supplied) {
        requireCapability(supplied);
        if (payload == null || payload.length() < 50 || payload.length() > 500_000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Import JSON must be 50–500000 characters.");
        JsonNode document;
        try {
            document = json.readTree(payload);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid import JSON.", e);
        }
        if (!EXPECTED_SCHEMA.equals(text(document, "schema"))
                || !"REVIEW_ONLY_NOT_IMPORT_COMPATIBLE".equals(text(document, "status"))
                || !document.path("records").isArray())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only the reviewed staging-v1 envelope is supported; direct-active imports are rejected.");
        JsonNode data = document.path("records");
        if (data.isEmpty() || data.size() > 500)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expected 1–500 candidate records.");

        List<Candidate> candidates = new ArrayList<>();
        Set<String> usedKeys = new java.util.HashSet<>();
        for (JsonNode item : data) {
            if (!"PENDING_DIRECTOR_REVIEW".equals(text(item, "reviewStatus"))
                    || item.path("activationAllowed").asBoolean(true))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "The source must contain only non-active, pending Director review candidates.");
            JsonNode source = item.path("source");
            Candidate candidate = new Candidate(
                    text(item, "candidateId"), text(item, "targetEpisode"),
                    text(item, "scope"), text(item, "ruleType"), text(item, "severity"),
                    text(item, "proposedRule"), text(source, "file"),
                    source.path("line").asInt(0), text(source, "excerpt"),
                    text(source, "sha256"));
            validate(candidate);
            if (!usedKeys.add(candidate.candidateKey()))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Duplicate candidate identifier in import: " + candidate.candidateKey());
            candidates.add(candidate);
        }

        String fileHash = sha(payload);
        UUID existing = jdbc.sql("""
                select id from production_memory_import_batch
                where project_id=:project and file_sha256=:hash
                """).param("project", PROJECT).param("hash", fileHash)
                .query(UUID.class).optional().orElse(null);
        if (existing != null) return Map.of("batchId", existing, "alreadyImported", true,
                "candidateCount", candidates.size(), "activatedRules", 0, "automaticActivation", false);

        UUID batchId = UUID.randomUUID();
        jdbc.sql("""
                insert into production_memory_import_batch(
                id,project_id,file_sha256,source_label,schema_version,candidate_count)
                values(:id,:project,:hash,:label,:schema,:count)
                """).param("id", batchId).param("project", PROJECT).param("hash", fileHash)
                .param("label", "Director-curated staging: " + document.path("createdAt").asText("unknown"))
                .param("schema", EXPECTED_SCHEMA).param("count", candidates.size()).update();
        for (Candidate candidate : candidates) {
            UUID episodeId = resolveEpisode(candidate.episode());
            jdbc.sql("""
                    insert into production_memory_import_candidate(
                    id,batch_id,candidate_key,target_episode,target_episode_id,
                    scope,rule_type,severity,proposed_rule,source_file,source_line,
                    source_excerpt,declared_source_sha256)
                    values (:id,:batch,:key,:episode,:episodeId,
                    :scope,:type,:severity,:content,:file,:line,:excerpt,:hash)
                    """)
                    .param("id", UUID.randomUUID()).param("batch", batchId)
                    .param("key", candidate.candidateKey()).param("episode", candidate.episode())
                    .param("episodeId", episodeId).param("scope", candidate.scope())
                    .param("type", candidate.type()).param("severity", candidate.severity())
                    .param("content", candidate.content()).param("file", candidate.sourceFile())
                    .param("line", candidate.sourceLine()).param("excerpt", candidate.excerpt())
                    .param("hash", candidate.sourceSha256()).update();
        }
        return Map.of("batchId", batchId, "alreadyImported", false,
                "candidateCount", candidates.size(), "activatedRules", 0,
                "automaticActivation", false);
    }

    public List<Map<String, Object>> batches() {
        return jdbc.sql("""
                select b.id,b.source_label,b.file_sha256,b.candidate_count,b.created_at,
                count(c.id) filter (where c.status='PENDING') as pending,
                count(c.id) filter (where c.status='ACTIVATED') as activated
                from production_memory_import_batch b
                left join production_memory_import_candidate c on c.batch_id=b.id
                where b.project_id=:project
                group by b.id order by b.created_at desc
                """).param("project", PROJECT)
                .query((rs, n) -> Map.<String, Object>of(
                        "id", rs.getObject("id", UUID.class).toString(),
                        "sourceLabel", rs.getString("source_label"),
                        "sha256", rs.getString("file_sha256"),
                        "candidateCount", rs.getInt("candidate_count"),
                        "pending", rs.getInt("pending"), "activated", rs.getInt("activated"),
                        "createdAt", rs.getObject("created_at", OffsetDateTime.class).toString()))
                .list();
    }

    public Map<String, Object> batch(UUID batchId) {
        requireBatch(batchId);
        List<Map<String, Object>> candidates = jdbc.sql("""
                select id,candidate_key,target_episode,target_episode_id,scope,rule_type,severity,
                       proposed_rule,source_file,source_line,source_excerpt,
                       declared_source_sha256,source_verification,status,
                       activated_rule_id,review_note,reviewed_by,reviewed_at
                from production_memory_import_candidate
                where batch_id=:batch order by candidate_key
                """).param("batch", batchId)
                .query((rs, n) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    String id = rs.getObject("id", UUID.class).toString();
                    row.put("id", id);
                    row.put("candidateKey", rs.getString("candidate_key"));
                    row.put("targetEpisode", rs.getString("target_episode"));
                    row.put("scope", rs.getString("scope"));
                    row.put("ruleType", rs.getString("rule_type"));
                    row.put("severity", rs.getString("severity"));
                    row.put("proposedRule", rs.getString("proposed_rule"));
                    row.put("sourceFile", rs.getString("source_file"));
                    row.put("sourceLine", rs.getInt("source_line"));
                    row.put("sourceExcerpt", rs.getString("source_excerpt"));
                    row.put("declaredSourceSha256", rs.getString("declared_source_sha256"));
                    row.put("sourceVerification", rs.getString("source_verification"));
                    row.put("status", rs.getString("status"));
                    Object ruleId = rs.getObject("activated_rule_id");
                    row.put("activatedRuleId", ruleId == null ? null : ruleId.toString());
                    row.put("reviewNote", rs.getString("review_note"));
                    row.put("reviewedBy", rs.getString("reviewed_by"));
                    row.put("reviewedAt", rs.getString("reviewed_at") == null ? null
                            : rs.getObject("reviewed_at", OffsetDateTime.class).toString());
                    return row;
                }).list();
        for (Map<String, Object> candidate : candidates) {
            candidate.put("comparison", compare(
                    (String) candidate.get("targetEpisode"),
                    (String) candidate.get("scope"),
                    (String) candidate.get("proposedRule")));
        }
        return Map.of("batchId", batchId.toString(), "writesEnabled", writesAvailable(),
                "automaticActivation", false, "candidates", candidates);
    }

    @Transactional
    public Map<String, Object> decide(UUID batchId, String candidateKey,
                                       String action, String note, String reviewer,
                                       boolean comparedExisting, String expectedFingerprint,
                                       String authorization) {
        requireCapability(authorization);
        requireBatch(batchId);
        if (!List.of("ACTIVATE", "REJECT", "MARK_EXISTING").contains(action))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported review action.");
        if (!comparedExisting || note == null || note.trim().length() < 15 || note.length() > 2000
                || reviewer == null || reviewer.trim().length() < 3 || reviewer.length() > 120)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Director must compare current rules and supply a meaningful review note and reviewer.");
        Map<String, Object> row = jdbc.sql("""
                select c.id,c.target_episode,c.scope,c.rule_type,c.severity,
                       c.proposed_rule,c.source_file,c.status
                from production_memory_import_candidate c
                where c.batch_id=:batch and c.candidate_key=:key
                for update
                """).param("batch", batchId).param("key", candidateKey)
                .query((rs, n) -> Map.<String, Object>of(
                        "id", rs.getObject("id", UUID.class), "episode", rs.getString("target_episode"),
                        "scope", rs.getString("scope"), "type", rs.getString("rule_type"),
                        "severity", rs.getString("severity"), "content", rs.getString("proposed_rule"),
                        "file", rs.getString("source_file"), "status", rs.getString("status")))
                .optional().orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidate not in this batch."));
        if (!"PENDING".equals(row.get("status")))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This candidate was already reviewed and is immutable.");
        // Use the same project advisory lock as Episode Learning global promotion,
        // so two reviewed imports cannot race into duplicate active rules.
        jdbc.sql("select pg_advisory_xact_lock(90200123456789)")
                .query((rs, n) -> 1).single();
        Comparison check = compare((String)row.get("episode"), (String)row.get("scope"),
                (String)row.get("content"));
        if (!check.fingerprint().equals(expectedFingerprint))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Production Memory changed. Refresh the comparison before Director review.");
        UUID activatedId = null;
        String finalStatus = "REJECTED";
        if ("ACTIVATE".equals(action)) {
            if (!check.episodeRegistered())
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Target episode is not registered. Register that episode before activation.");
            if (check.exactDuplicateRuleId() != null)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "An identical rule is already active. Use MARK_EXISTING instead.");
            activatedId = UUID.randomUUID();
            jdbc.sql("""
                    insert into production_memory_rule(
                    id,project_id,episode_id,scope,rule_type,severity,content,source)
                    values(:id,:project,:episode,:scope,:type,:severity,:content,:source)
                    """).param("id", activatedId).param("project", PROJECT)
                    .param("episode", check.resolvedEpisodeId()).param("scope", row.get("scope"))
                    .param("type", row.get("type")).param("severity", row.get("severity"))
                    .param("content", row.get("content"))
                    .param("source", "Reviewed import " + candidateKey).update();
            finalStatus = "ACTIVATED";
        } else if ("MARK_EXISTING".equals(action)) {
            if (check.exactDuplicateRuleId() == null)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "MARK_EXISTING needs an exact active duplicate.");
            activatedId = UUID.fromString(check.exactDuplicateRuleId());
            finalStatus = "EXISTING";
        }
        UUID candidateId = (UUID) row.get("id");
        jdbc.sql("""
                update production_memory_import_candidate
                set status=:status,activated_rule_id=:rule,review_note=:note,
                    reviewed_by=:reviewer,reviewed_at=now()
                where id=:id and status='PENDING'
                """).param("status", finalStatus).param("rule", activatedId)
                .param("note", note.trim()).param("reviewer", reviewer.trim())
                .param("id", candidateId).update();
        jdbc.sql("""
                insert into production_memory_import_review_audit(
                id,candidate_id,action,compared_fingerprint,review_note,reviewer,resulting_rule_id)
                values(:id,:candidate,:action,:fingerprint,:note,:reviewer,:rule)
                """).param("id", UUID.randomUUID()).param("candidate", candidateId)
                .param("action", action).param("fingerprint", expectedFingerprint)
                .param("note", note.trim()).param("reviewer", reviewer.trim())
                .param("rule", activatedId).update();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("candidateKey", candidateKey);
        result.put("status", finalStatus);
        result.put("activatedRuleId", activatedId == null ? null : activatedId.toString());
        result.put("sourceScope", row.get("episode"));
        result.put("nextGenerationUsesUpdatedMemory", "ACTIVATED".equals(finalStatus));
        return result;
    }

    public Comparison compare(String target, String scope, String content) {
        UUID episodeId = resolveEpisode(target);
        List<Map<String, Object>> current = jdbc.sql("""
                select id,scope,content,episode_id,updated_at
                from production_memory_rule
                where project_id=:project and active=true
                  and (episode_id is null or episode_id=:episode)
                order by id
                """).param("project", PROJECT).param("episode", episodeId)
                .query((rs, n) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class).toString());
                    row.put("scope", rs.getString("scope"));
                    row.put("content", rs.getString("content"));
                    row.put("episodeId", rs.getString("episode_id") == null ? "GLOBAL" : rs.getString("episode_id"));
                    row.put("updatedAt", rs.getObject("updated_at", OffsetDateTime.class).toString());
                    return row;
                }).list();
        String fingerprint = sha(current.toString());
        String exactId = null;
        List<Map<String, Object>> overlaps = new ArrayList<>();
        for (Map<String, Object> rule : current) {
            String original = normalize((String) rule.get("content"));
            String proposed = normalize(content);
            double similarity = similarity(original, proposed);
            if (scope.equals(rule.get("scope")) && original.equals(proposed)) exactId = (String)rule.get("id");
            if (similarity >= .36 || (original.contains(proposed) && proposed.length() > 35)
                    || (proposed.contains(original) && original.length() > 35)) {
                if (overlaps.size() < 12) overlaps.add(Map.of(
                        "ruleId", rule.get("id"), "scope", rule.get("scope"),
                        "content", rule.get("content"),
                        "similarity", Math.round(similarity * 100) / 100.0,
                        "note", "Text overlap only; a human must assess semantic contradiction."));
            }
        }
        return new Comparison(fingerprint, exactId, overlaps,
                "GLOBAL".equals(target) || episodeId != null, episodeId);
    }

    static double similarity(String a, String b) {
        Set<String> l = words(a);
        Set<String> r = words(b);
        if (l.isEmpty() || r.isEmpty()) return 0.0;
        Set<String> intersect = new java.util.HashSet<>(l);
        intersect.retainAll(r);
        Set<String> joined = new java.util.HashSet<>(l);
        joined.addAll(r);
        return (double) intersect.size() / joined.size();
    }

    private static Set<String> words(String s) {
        Set<String> terms = new java.util.HashSet<>();
        for (String term : s.split("[^\\p{L}\\p{N}]+"))
            if (term.length() >= 4) terms.add(term);
        return terms;
    }

    static String normalize(String s) {
        return s == null ? "" : s.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    private UUID resolveEpisode(String target) {
        if ("GLOBAL".equals(target)) return null;
        if (!target.matches("EP[0-9]{3}"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid episode scope.");
        return jdbc.sql("""
                select id from episode where project_id=:project and episode_number=:number
                """).param("project", PROJECT).param("number", target)
                .query(UUID.class).optional().orElse(null);
    }

    private void requireBatch(UUID id) {
        boolean found = jdbc.sql("""
                select exists(select 1 from production_memory_import_batch
                where id=:id and project_id=:project)
                """).param("id", id).param("project", PROJECT).query(Boolean.class).single();
        if (!found) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown memory import batch.");
    }

    private void validate(Candidate c) {
        if (!c.candidateKey().matches("[A-Za-z0-9_-]{4,90}")
                || !("GLOBAL".equals(c.episode()) || c.episode().matches("EP[0-9]{3}"))
                || !SCOPES.contains(c.scope()) || !TYPES.contains(c.type())
                || !SEVERITIES.contains(c.severity())
                || c.content().length() < 15 || c.content().length() > 2500
                || c.sourceFile().isBlank() || c.sourceFile().length() > 260
                || c.sourceLine() <= 0
                || c.excerpt().isBlank() || c.excerpt().length() > 2000
                || !c.sourceSha256().matches("[a-f0-9]{64}"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid import candidate or source metadata: " + c.candidateKey());
    }

    private static String text(JsonNode node, String property) {
        return node.path(property).asText("").trim();
    }

    private static String sha(String content) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(content.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Required SHA-256 implementation missing.", e);
        }
    }
}
