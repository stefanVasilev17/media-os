package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/spline/catalog")
public class SplineCatalogController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    public SplineCatalogController(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/latest")
    public Map<String, Object> latest() {
        return jdbc.sql("""
                select id, scene_name, object_count, root_section_count, worker_id, catalog::text, synced_at
                from spline_scene_catalog
                where project_id = :projectId
                order by synced_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("status", "READY");
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("sceneName", rs.getString("scene_name"));
                    item.put("objectCount", rs.getInt("object_count"));
                    item.put("rootSectionCount", rs.getInt("root_section_count"));
                    item.put("workerId", rs.getString("worker_id"));
                    item.put("syncedAt", rs.getObject("synced_at", OffsetDateTime.class));
                    item.put("catalog", readJson(rs.getString("catalog")));
                    return item;
                })
                .optional()
                .orElseGet(() -> Map.of("status", "EMPTY"));
    }

    @PostMapping("/refresh")
    @Transactional
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, Object> refresh() {
        var existing = jdbc.sql("""
                select p.id, p.status
                from production_job p
                where p.project_id = :projectId
                  and p.agent_key = 'SPLINE_AGENT'
                  and p.task_type = 'SYNC_SCENE_CATALOG_V1'
                  and p.status in ('QUEUED', 'CLAIMED', 'RUNNING')
                order by p.created_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("productionJobId", rs.getObject("id", UUID.class));
                    item.put("status", rs.getString("status"));
                    return item;
                })
                .optional();

        if (existing.isPresent()) {
            return existing.get();
        }

        UUID orchestrationJobId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID productionJobId = UUID.randomUUID();

        jdbc.sql("""
                insert into job(id, project_id, name, job_type, status, progress)
                values (:id, :projectId, 'Spline scene catalog sync', 'SPLINE_CATALOG_SYNC', 'QUEUED', 20)
                """)
                .param("id", orchestrationJobId)
                .param("projectId", PROJECT_ID)
                .update();

        jdbc.sql("""
                insert into task(id, job_id, name, task_type, status, sequence_no)
                values (:id, :jobId, 'Read current Spline scene catalog', 'SYNC_SCENE_CATALOG_V1', 'PENDING', 1)
                """)
                .param("id", taskId)
                .param("jobId", orchestrationJobId)
                .update();

        jdbc.sql("""
                insert into production_job(
                    id, project_id, task_id, agent_key, task_type, target, instructions,
                    permissions, protected_objects, payload, status
                )
                values (
                    :id, :projectId, :taskId, 'SPLINE_AGENT', 'SYNC_SCENE_CATALOG_V1',
                    'FOCUSED_SPLINE_3D_TAB',
                    'Read the current focused Spline scene hierarchy only. Do not modify anything. Return a compact categorized scene catalog for Media OS.',
                    '["READ_SCENE_CATALOG"]'::jsonb,
                    '["ALL_OBJECTS"]'::jsonb,
                    '{"executionProfile":"SCENE_CATALOG_V1","readOnly":true}'::jsonb,
                    'QUEUED'
                )
                """)
                .param("id", productionJobId)
                .param("projectId", PROJECT_ID)
                .param("taskId", taskId)
                .update();

        writeEvent(
                orchestrationJobId,
                taskId,
                "SPLINE_CATALOG_REFRESH_QUEUED",
                "Read-only Spline scene catalog refresh queued for the Local Runner.",
                Map.of("productionJobId", productionJobId)
        );

        return Map.of(
                "productionJobId", productionJobId,
                "jobId", orchestrationJobId,
                "taskId", taskId,
                "status", "QUEUED"
        );
    }

    private void writeEvent(
            UUID orchestrationJobId,
            UUID taskId,
            String type,
            String message,
            Map<String, Object> payload
    ) {
        jdbc.sql("""
                insert into event(id, project_id, job_id, task_id, event_type, message, payload)
                values (:id, :projectId, :jobId, :taskId, :type, :message, cast(:payload as jsonb))
                """)
                .param("id", UUID.randomUUID())
                .param("projectId", PROJECT_ID)
                .param("jobId", orchestrationJobId)
                .param("taskId", taskId)
                .param("type", type)
                .param("message", message)
                .param("payload", writeJson(payload))
                .update();
    }

    private Object readJson(String json) {
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            throw new IllegalStateException("Invalid stored Spline scene catalog JSON.", e);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialize Spline catalog event.", e);
        }
    }
}
