package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CreativePolicyService {

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    public CreativePolicyService(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> current() {
        return jdbc.sql("select version, payload::text, updated_at from project_creative_policy where project_id=:projectId")
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("version", rs.getString("version"));
                    result.put("payload", readMap(rs.getString("payload")));
                    result.put("updatedAt", rs.getObject("updated_at", OffsetDateTime.class));
                    return result;
                })
                .optional()
                .orElseGet(LinkedHashMap::new);
    }

    private Map<String, Object> readMap(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception ex) {
            return new LinkedHashMap<>();
        }
    }
}
