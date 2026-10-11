package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

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
        String scope = normalizeScope(rawScope);
        return jdbc.sql("""
                select id, scope, rule_type, severity, content, source, created_at
                from production_memory_rule
                where project_id=:projectId
                  and active=true
                  and (episode_id is null or episode_id=:episodeId)
                  and (scope='ALL' or scope=:scope)
                order by
                  case severity when 'REQUIRED' then 0 else 1 end,
                  case rule_type when 'CORRECTION' then 0 when 'LOCK' then 1 when 'QA' then 2 else 3 end,
                  created_at
                """)
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
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

    public Map<String, Object> preflight(String rawScope, String rawAction) {
        String scope = normalizeScope(rawScope);
        String action = rawAction == null || rawAction.isBlank() ? "UNSPECIFIED" : rawAction.trim().toUpperCase(Locale.ROOT);
        List<Map<String, Object>> rules = rulesFor(scope);
        List<String> ids = rules.stream().map(rule -> String.valueOf(rule.get("id"))).toList();
        UUID auditId = UUID.randomUUID();

        jdbc.sql("""
                insert into production_preflight_audit(id, episode_id, scope, action_key, rule_count, rule_ids, passed)
                values (:id,:episodeId,:scope,:action,:count,cast(:ids as jsonb),true)
                """)
                .param("id", auditId)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("scope", scope)
                .param("action", action)
                .param("count", rules.size())
                .param("ids", writeJson(ids))
                .update();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("auditId", auditId);
        result.put("scope", scope);
        result.put("action", action);
        result.put("passed", true);
        result.put("ruleCount", rules.size());
        result.put("rules", rules);
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
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
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
