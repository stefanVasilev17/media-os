package com.architecturalthinking.mediaos.spline;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/spline/snapshot")
public class SplineSnapshotController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final JdbcClient jdbc;

    public SplineSnapshotController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/meta")
    public Map<String, Object> meta() {
        return jdbc.sql("""
                select id, worker_id, width, height, captured_at
                from spline_snapshot
                where project_id = :projectId
                order by captured_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("status", "READY");
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("workerId", rs.getString("worker_id"));
                    item.put("width", rs.getInt("width"));
                    item.put("height", rs.getInt("height"));
                    item.put("capturedAt", rs.getObject("captured_at", OffsetDateTime.class));
                    return item;
                })
                .optional()
                .orElseGet(() -> Map.of("status", "EMPTY"));
    }

    @GetMapping("/image")
    public ResponseEntity<byte[]> image() {
        return jdbc.sql("""
                select content_type, image_data
                from spline_snapshot
                where project_id = :projectId
                order by captured_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> ResponseEntity.ok()
                        .cacheControl(CacheControl.noStore())
                        .contentType(MediaType.parseMediaType(rs.getString("content_type")))
                        .body(rs.getBytes("image_data")))
                .optional()
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/refresh")
    @Transactional
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, Object> refresh() {
        var existing = jdbc.sql("""
                select id, status
                from production_job
                where project_id = :projectId
                  and agent_key = 'SPLINE_AGENT'
                  and task_type = 'CAPTURE_SPLINE_SNAPSHOT'
                  and status in ('QUEUED', 'CLAIMED', 'RUNNING')
                order by created_at desc
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

        UUID jobId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID productionJobId = UUID.randomUUID();

        jdbc.sql("""
                insert into job(id, project_id, name, job_type, status, progress)
                values (:id, :projectId, 'Spline map snapshot', 'SPLINE_SNAPSHOT', 'QUEUED', 20)
                """)
                .param("id", jobId)
                .param("projectId", PROJECT_ID)
                .update();

        jdbc.sql("""
                insert into task(id, job_id, name, task_type, status, sequence_no)
                values (:id, :jobId, 'Capture current Spline map', 'CAPTURE_SPLINE_SNAPSHOT', 'PENDING', 1)
                """)
                .param("id", taskId)
                .param("jobId", jobId)
                .update();

        jdbc.sql("""
                insert into production_job(
                    id, project_id, task_id, agent_key, task_type, target, instructions,
                    permissions, protected_objects, payload, status
                )
                values (
                    :id, :projectId, :taskId, 'SPLINE_AGENT', 'CAPTURE_SPLINE_SNAPSHOT',
                    'LOCAL_SPLINE_WINDOW',
                    'Capture the currently open Spline desktop window as a PNG without changing the Spline scene.',
                    '["READ_LOCAL_SPLINE_WINDOW"]'::jsonb,
                    '["ALL_SPLINE_OBJECTS"]'::jsonb,
                    '{"executionProfile":"LOCAL_SCREENSHOT_V1","readOnly":true,"tokenBudget":0}'::jsonb,
                    'QUEUED'
                )
                """)
                .param("id", productionJobId)
                .param("projectId", PROJECT_ID)
                .param("taskId", taskId)
                .update();

        return Map.of(
                "productionJobId", productionJobId,
                "jobId", jobId,
                "taskId", taskId,
                "status", "QUEUED"
        );
    }
}
