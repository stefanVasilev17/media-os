package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class ProductionMemoryService {

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    public ProductionMemoryService(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> rulesFor(String rawScope) {
        return rulesFor(rawScope, ProductionOverviewService.EPISODE_ID);
    }

    public List<Map<String, Object>> rulesFor(String rawScope, UUID episodeId) {
        if (episodeId == null) throw new IllegalArgumentException("Episode ID is required for scoped memory lookup.");
        String scope = normalizeScope(rawScope);
        return jdbc.sql("""
                select id, scope, rule_type, severity, content, source, created_at
                from production_memory_rule
                where project_id=:projectId
                  and active=true
                  and (episode_id is null or episode_id=:episodeId)
                  and (
                    :scope='ALL'
                    or scope='ALL'
                    or scope=:scope
                    or (scope='SCRIPT' and :scope in ('VOICE','VISUAL'))
                    or (scope='VOICE' and :scope='VISUAL')
                  )
                order by
                  case severity when 'REQUIRED' then 0 else 1 end,
                  case rule_type when 'CORRECTION' then 0 when 'LOCK' then 1 when 'QA' then 2 else 3 end,
                  created_at
                """)
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .param("episodeId", episodeId)
                .param("scope", scope)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("scope", rs.getString("scope"));
                    row.put("type", rs.getString("rule_type"));
                    row.put("severity", rs.getString("severity"));
                    row.put("content", rs.getString("content"));
                    row.put("source", rs.getString("source"));
                    row.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    return row;
                })
                .list();
    }

    public boolean hasSingleEpisode() {
        long count = jdbc.sql("select count(*) from episode where project_id=:projectId")
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .query(Long.class).single();
        return count == 1L;
    }

    public List<Map<String, Object>> approvedAssets() {
        return jdbc.sql("""
                select asset_key, status, source_path
                from production_asset_catalog
                where project_id=:projectId and status='LOCKED'
                order by asset_key
                """)
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .query((rs, n) -> Map.<String, Object>of(
                        "assetKey", rs.getString("asset_key"),
                        "status", rs.getString("status"),
                        "sourcePath", rs.getString("source_path")
                )).list();
    }

    public List<Map<String, Object>> directorLockedShots(UUID episodeId) {
        if (episodeId == null) throw new IllegalArgumentException("Episode ID required.");
        return jdbc.sql("""
                select shot_key, script_revision, render_id, locked_at
                from visual_shot_lock
                where episode_id=:episodeId
                order by script_revision, shot_key
                """)
                .param("episodeId", episodeId)
                .query((rs, n) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("shotKey", rs.getString("shot_key"));
                    row.put("scriptRevision", rs.getInt("script_revision"));
                    row.put("renderId", rs.getObject("render_id", UUID.class));
                    row.put("lockedAt", rs.getObject("locked_at", OffsetDateTime.class));
                    return row;
                }).list();
    }

    public Map<String, Object> preflight(String rawScope, String rawAction) {
        return preflight(rawScope, rawAction, ProductionOverviewService.EPISODE_ID);
    }

    public Map<String, Object> preflight(String rawScope, String rawAction, UUID episodeId) {
        if (episodeId == null) throw new ResponseStatusException(HttpStatus.CONFLICT, "An episode ID is required.");
        String scope = normalizeScope(rawScope);
        String action = rawAction == null || rawAction.isBlank() ? "UNSPECIFIED" : rawAction.trim().toUpperCase(Locale.ROOT);
        List<Map<String, Object>> rules = rulesFor(scope, episodeId);
        List<String> ids = rules.stream().map(rule -> String.valueOf(rule.get("id"))).toList();

        Map<String, String> policyRow = jdbc.sql("select version, payload::text from project_creative_policy where project_id=:projectId")
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .query((rs, n) -> Map.of("version", rs.getString("version"), "payload", rs.getString("payload")))
                .optional().orElse(Map.of());
        String policyJson = policyRow.getOrDefault("payload", "");
        String policyVersion = policyRow.getOrDefault("version", "");
        List<Map<String, Object>> approvedAssets = approvedAssets();
        List<Map<String, Object>> lockedShots = directorLockedShots(episodeId);
        boolean policyReady = false;
        try {
            var payload = objectMapper.readTree(policyJson);
            policyReady = payload.path("creationPreflight").path("version").asInt() >= 1
                    && payload.path("creationPreflight").path("required").asBoolean(false)
                    && payload.path("canonicalCreationRules").path("supersedesConflictingLegacyPolicy").asBoolean(false);
        } catch (Exception ignored) {
            // Fail closed when the canonical policy is missing, invalid or stale.
        }
        boolean globalRulePresent = rules.stream().anyMatch(rule ->
                "ALL".equals(rule.get("scope"))
                        && "REQUIRED".equals(rule.get("severity"))
                        && String.valueOf(rule.get("content")).startsWith("GLOBAL_CREATION_PREFLIGHT:"));
        boolean episodeExists = jdbc.sql("select exists(select 1 from episode where id=:episodeId and project_id=:projectId)")
                .param("episodeId", episodeId)
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .query(Boolean.class).single();
        boolean passed = policyReady && globalRulePresent && episodeExists && !approvedAssets.isEmpty();
        UUID auditId = UUID.randomUUID();
        jdbc.sql("""
                insert into production_preflight_audit(id, episode_id, scope, action_key, rule_count, rule_ids, passed, policy_version, approved_asset_count)
                values (:id,:episodeId,:scope,:action,:count,cast(:ids as jsonb),:passed,:policyVersion,:assetCount)
                """)
                .param("id", auditId)
                .param("episodeId", episodeId)
                .param("scope", scope)
                .param("action", action.length() > 100 ? action.substring(0, 100) : action)
                .param("count", rules.size())
                .param("ids", writeJson(ids))
                .param("passed", passed)
                .param("policyVersion", policyVersion)
                .param("assetCount", approvedAssets.size())
                .update();

        if (!passed) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "GLOBAL_CREATION_PREFLIGHT_BLOCKED: missing canonical policy, required memory rule, valid episode, or approved asset catalog. Audit=" + auditId);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("auditId", auditId);
        result.put("scope", scope);
        result.put("action", action);
        result.put("passed", true);
        result.put("status", "CONTEXT_READY");
        result.put("ruleCount", rules.size());
        result.put("rules", rules);
        result.put("policyReady", true);
        result.put("policyVersion", policyVersion);
        result.put("approvedAssets", approvedAssets);
        result.put("approvedAssetCount", approvedAssets.size());
        result.put("directorLockedShots", lockedShots);
        result.put("semanticApproval", false);
        return result;
    }

    public Map<String, Object> rememberCorrection(String rawScope, String content, String source) {
        String scope = normalizeScope(rawScope);
        String normalized = content == null ? "" : content.trim();
        if (normalized.isBlank()) throw new IllegalArgumentException("Correction cannot be blank.");

        Map<String, Object> existing = jdbc.sql("""
                select id, scope, rule_type, severity, content, source, created_at
                from production_memory_rule
                where project_id=:projectId
                  and active=true
                  and scope=:scope
                  and lower(content)=lower(:content)
                order by created_at desc
                limit 1
                """)
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .param("scope", scope)
                .param("content", normalized)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("scope", rs.getString("scope"));
                    row.put("type", rs.getString("rule_type"));
                    row.put("severity", rs.getString("severity"));
                    row.put("content", rs.getString("content"));
                    row.put("source", rs.getString("source"));
                    row.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    return row;
                })
                .optional()
                .orElse(null);
        if (existing != null) return existing;

        UUID id = UUID.randomUUID();
        jdbc.sql("""
                insert into production_memory_rule(
                  id, project_id, episode_id, scope, rule_type, severity, content, source
                ) values (
                  :id,:projectId,:episodeId,:scope,'CORRECTION','REQUIRED',:content,:source
                )
                """)
                .param("id", id)
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .param("episodeId", "ALL".equals(scope) ? null : ProductionOverviewService.EPISODE_ID)
                .param("scope", scope)
                .param("content", normalized)
                .param("source", source == null || source.isBlank() ? "Creator correction" : source.trim())
                .update();

        return rulesFor(scope).stream()
                .filter(rule -> id.equals(rule.get("id")))
                .findFirst()
                .orElse(Map.of("id", id, "scope", scope, "type", "CORRECTION", "content", normalized));
    }

    private String normalizeScope(String raw) {
        String scope = raw == null ? "ALL" : raw.trim().toUpperCase(Locale.ROOT);
        return switch (scope) {
            case "SCRIPT", "VOICE", "VISUAL", "ALL" -> scope;
            default -> "ALL";
        };
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize production memory audit.", ex);
        }
    }
}
