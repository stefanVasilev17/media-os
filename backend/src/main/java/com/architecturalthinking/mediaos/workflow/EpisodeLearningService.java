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
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Two-tier durable learning: episode facts remain episode-scoped; project lessons
 * are copied only after explicit, authenticated-capability Director review.
 * A secret capability alone is not user identity/role-based authentication.
 */
@Service
public class EpisodeLearningService {
    private static final UUID PROJECT = ProductionOverviewService.PROJECT_ID;
    private final JdbcClient jdbc;
    private final boolean writesEnabled;
    private final boolean promotionEnabled;
    private final String directorApprovalSecret;

    public EpisodeLearningService(
            JdbcClient jdbc,
            @Value("${mediaos.episodes.writes-enabled:false}") boolean writesEnabled,
            @Value("${mediaos.learning.promotion-enabled:false}") boolean promotionEnabled,
            @Value("${mediaos.learning.approval-secret:}") String directorApprovalSecret) {
        this.jdbc = jdbc;
        this.writesEnabled = writesEnabled;
        this.promotionEnabled = promotionEnabled;
        this.directorApprovalSecret = directorApprovalSecret == null ? "" : directorApprovalSecret;
    }

    private void requireEpisode(UUID episodeId) {
        boolean exists = jdbc.sql("""
                select exists(select 1 from episode
                              where id=:id and project_id=:projectId)
                """).param("id", episodeId).param("projectId", PROJECT).query(Boolean.class).single();
        if (!exists) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown project episode.");
    }

    private void requireWritesEnabled() {
        if (!writesEnabled)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Episode Learning writes are disabled.");
    }

    private void requireDirectorCapability(String supplied) {
        if (!promotionEnabled || !writesEnabled || directorApprovalSecret.length() < 32)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Learning promotions are disabled until Director authentication rollout.");
        if (supplied == null || !MessageDigest.isEqual(
                directorApprovalSecret.getBytes(StandardCharsets.UTF_8),
                supplied.getBytes(StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Director review authorization denied.");
    }

    /**
     * Idempotently discovers episode-level corrections, never promoting them.
     * Safe to run after each stage lock or when opening Learning Review.
     */
    @Transactional
    public Map<String, Object> refresh(UUID episodeId, UUID auditId) {
        requireWritesEnabled();
        requireEpisode(episodeId);
        int discovered = jdbc.sql("""
                insert into episode_learning_proposal
                    (id, project_id, source_episode_id, source_rule_id,
                     scope, proposed_content, preflight_audit_id)
                select gen_random_uuid(), r.project_id, r.episode_id, r.id,
                       r.scope, r.content, :auditId
                from production_memory_rule r
                where r.project_id=:projectId and r.episode_id=:episodeId
                  and r.active=true and r.rule_type='CORRECTION'
                  and not exists (
                      select 1 from episode_learning_proposal p where p.source_rule_id=r.id
                  )
                on conflict (source_rule_id) do nothing
                """).param("projectId", PROJECT).param("episodeId", episodeId)
                .param("auditId", auditId).update();
        return Map.of("episodeId", episodeId, "discovered", discovered,
                "pending", pendingCount(episodeId), "automaticPromotion", false);
    }

    public int pendingCount(UUID episodeId) {
        requireEpisode(episodeId);
        return jdbc.sql("""
                select count(*) from episode_learning_proposal
                where project_id=:projectId and source_episode_id=:episodeId
                  and status='PENDING'
                """).param("projectId", PROJECT).param("episodeId", episodeId)
                .query(Integer.class).single();
    }

    public List<Map<String, Object>> proposals(UUID episodeId) {
        requireEpisode(episodeId);
        return jdbc.sql("""
                select p.id, p.source_rule_id, p.scope, p.proposed_content, p.status,
                       p.classification, p.rationale, p.review_note, p.reviewed_by,
                       p.global_rule_id, p.created_at, p.reviewed_at
                from episode_learning_proposal p
                where p.project_id=:projectId and p.source_episode_id=:episodeId
                order by case when p.status='PENDING' then 0 else 1 end, p.created_at, p.id
                """).param("projectId", PROJECT).param("episodeId", episodeId)
                .query((rs, n) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("sourceRuleId", rs.getObject("source_rule_id", UUID.class));
                    row.put("scope", rs.getString("scope"));
                    row.put("content", rs.getString("proposed_content"));
                    row.put("status", rs.getString("status"));
                    row.put("classification", rs.getString("classification"));
                    row.put("rationale", rs.getString("rationale"));
                    row.put("reviewNote", rs.getString("review_note"));
                    row.put("reviewedBy", rs.getString("reviewed_by"));
                    row.put("globalRuleId", rs.getObject("global_rule_id", UUID.class));
                    row.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    row.put("reviewedAt", rs.getObject("reviewed_at", OffsetDateTime.class));
                    return row;
                }).list();
    }

    /**
     * Shows exactly which existing project rules the Director must compare.
     * The fingerprint changes if any global rule changes before approval.
     */
    public Map<String, Object> reviewContext(UUID episodeId) {
        requireEpisode(episodeId);
        List<Map<String, Object>> globals = globalRules();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("episodeId", episodeId);
        result.put("proposals", proposals(episodeId));
        result.put("pendingCount", pendingCount(episodeId));
        result.put("globalRules", globals);
        result.put("globalFingerprint", fingerprint(globals));
        result.put("automaticPromotion", false);
        result.put("promotionEnabled", promotionEnabled && writesEnabled && directorApprovalSecret.length() >= 32);
        result.put("note", "Global knowledge requires source verification, comparison against existing rules and explicit Director review.");
        return result;
    }

    @Transactional
    public Map<String, Object> decide(UUID episodeId, UUID proposalId, String action,
                                       String note, String reviewer, boolean comparedExistingRules,
                                       String expectedFingerprint, String authorization, UUID auditId) {
        requireDirectorCapability(authorization);
        requireEpisode(episodeId);
        String decision = action == null ? "" : action.trim().toUpperCase(Locale.ROOT);
        if (!List.of("PROMOTE_GLOBAL", "KEEP_EPISODE", "REJECT").contains(decision))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported learning decision.");
        if (note == null || note.trim().length() < 15 || note.length() > 3000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A meaningful Director review note is required.");
        if (reviewer == null || reviewer.trim().length() < 3 || reviewer.length() > 120)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reviewer attribution required.");

        // Serialize promotions for this project. Project policy edits outside this
        // endpoint are detected through the fingerprint before mutation.
        jdbc.sql("select pg_advisory_xact_lock(90200123456789)").query(Long.class).single();
        List<Map<String, Object>> currentGlobals = globalRules();
        String actualFingerprint = fingerprint(currentGlobals);
        if (!actualFingerprint.equals(expectedFingerprint))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Global memory changed. Refresh the comparison and review again.");

        Map<String, Object> proposal = jdbc.sql("""
                select p.scope, p.proposed_content, p.status, p.source_rule_id
                from episode_learning_proposal p
                join production_memory_rule r on r.id=p.source_rule_id
                where p.project_id=:projectId and p.source_episode_id=:episodeId and p.id=:proposalId
                  and r.episode_id=:episodeId and r.active=true
                for update of p
                """).param("projectId", PROJECT).param("episodeId", episodeId)
                .param("proposalId", proposalId)
                .query((rs, n) -> Map.<String, Object>of(
                        "scope", rs.getString("scope"),
                        "content", rs.getString("proposed_content"),
                        "status", rs.getString("status"),
                        "sourceId", rs.getObject("source_rule_id", UUID.class)
                )).optional().orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown/obsolete episode lesson."));

        if (!"PENDING".equals(proposal.get("status")))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This lesson already has a final review decision.");

        String status;
        String classification;
        UUID globalId = null;
        String scope = String.valueOf(proposal.get("scope"));
        String content = String.valueOf(proposal.get("content"));
        if ("PROMOTE_GLOBAL".equals(decision)) {
            if (!comparedExistingRules)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "The Director must review existing project-wide rules before promotion.");
            // Strict equality catches duplicates; semantic conflict evaluation
            // remains the human Director's responsibility.
            for (Map<String, Object> rule : currentGlobals) {
                if (content.trim().equalsIgnoreCase(String.valueOf(rule.get("content")).trim())) {
                    if (!scope.equals(rule.get("scope")))
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "The same global lesson already exists under another scope.");
                    globalId = (UUID) rule.get("id");
                    break;
                }
            }
            if (globalId == null) {
                globalId = UUID.randomUUID();
                jdbc.sql("""
                        insert into production_memory_rule(
                            id, project_id, episode_id, scope, rule_type, severity, content, source)
                        values (:id,:projectId,null,:scope,'CORRECTION','REQUIRED',:content,:source)
                        """)
                        .param("id", globalId).param("projectId", PROJECT)
                        .param("scope", scope).param("content", content)
                        .param("source", "Learning review " + proposalId)
                        .update();
                status = "PROMOTED";
            } else status = "ALREADY_GLOBAL";
            classification = "GLOBAL_REUSABLE";
        } else if ("KEEP_EPISODE".equals(decision)) {
            status = "EPISODE_ONLY";
            classification = "EPISODE_SPECIFIC";
        } else {
            status = "REJECTED";
            classification = "NOT_REUSABLE";
        }

        jdbc.sql("""
                update episode_learning_proposal
                set status=:status, classification=:classification, review_note=:note,
                    reviewed_by=:reviewer, reviewed_at=now(), updated_at=now(),
                    global_rule_id=:globalId, preflight_audit_id=:auditId
                where id=:id and project_id=:projectId and status='PENDING'
                """).param("id", proposalId).param("projectId", PROJECT)
                .param("status", status).param("classification", classification)
                .param("note", note.trim()).param("reviewer", reviewer.trim())
                .param("globalId", globalId).param("auditId", auditId).update();
        return Map.of("proposalId", proposalId, "sourceEpisodeId", episodeId,
                "decision", decision, "status", status,
                "globalRuleId", globalId == null ? "" : globalId.toString(),
                "futureEpisodesInherit", globalId != null);
    }

    private List<Map<String, Object>> globalRules() {
        return jdbc.sql("""
                select id, scope, rule_type, content, updated_at from production_memory_rule
                where project_id=:projectId and episode_id is null and active=true
                order by id
                """).param("projectId", PROJECT)
                .query((rs, n) -> Map.<String, Object>of(
                        "id", rs.getObject("id", UUID.class),
                        "scope", rs.getString("scope"),
                        "type", rs.getString("rule_type"),
                        "content", rs.getString("content"),
                        "updatedAt", rs.getObject("updated_at", OffsetDateTime.class)
                )).list();
    }

    private String fingerprint(List<Map<String, Object>> rules) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            for (Map<String, Object> rule : rules) {
                String line = rule.get("id") + "|" + rule.get("scope") + "|"
                        + rule.get("content") + "|" + rule.get("updatedAt") + "\\n";
                digest.update(line.getBytes(StandardCharsets.UTF_8));
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable.", e);
        }
    }
}
