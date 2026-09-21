package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/worker/spline")
public class SplineWorkerController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final String workerKey;

    public SplineWorkerController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            @Value("${SPLINE_WORKER_KEY:}") String workerKey
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.workerKey = workerKey;
    }

    public record WorkerResult(
            String output,
            String error,
            Map<String, Object> metrics,
            Map<String, Object> catalog
    ) {}

    private record ExecutionContext(UUID taskId, UUID orchestrationJobId, String taskType) {}

    @GetMapping("/jobs/next")
    @Transactional
    public ResponseEntity<Map<String, Object>> claimNext(
            @RequestHeader("X-Worker-Key") String key,
            @RequestHeader("X-Worker-Id") String workerId
    ) {
        verifyKey(key);

        var job = jdbc.sql("""
                with candidate as (
                  select id
                  from production_job
                  where agent_key = 'SPLINE_AGENT' and status = 'QUEUED'
                  order by created_at
                  for update skip locked
                  limit 1
                )
                update production_job p
                set status = 'CLAIMED',
                    worker_id = :workerId,
                    claimed_at = now(),
                    updated_at = now()
                from candidate c
                where p.id = c.id
                returning p.id, p.task_id, p.task_type, p.target, p.instructions,
                          p.permissions::text, p.protected_objects::text, p.payload::text
                """)
                .param("workerId", workerId)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("taskId", rs.getObject("task_id", UUID.class));
                    item.put("taskType", rs.getString("task_type"));
                    item.put("target", rs.getString("target"));
                    item.put("instructions", rs.getString("instructions"));
                    item.put("permissions", readJson(rs.getString("permissions")));
                    item.put("protectedObjects", readJson(rs.getString("protected_objects")));
                    item.put("payload", readJson(rs.getString("payload")));
                    return item;
                })
                .optional();

        if (job.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        UUID productionJobId = (UUID) job.get().get("id");
        UUID taskId = (UUID) job.get().get("taskId");
        UUID orchestrationJobId = findOrchestrationJobId(taskId);

        jdbc.sql("update task set status='IN_PROGRESS', updated_at=now() where id=:taskId")
                .param("taskId", taskId)
                .update();

        jdbc.sql("update job set status='RUNNING', progress=40, updated_at=now() where id=:jobId")
                .param("jobId", orchestrationJobId)
                .update();

        writeEvent(
                orchestrationJobId,
                taskId,
                "SPLINE_WORKER_CLAIMED",
                "Spline production worker claimed the queued MCP job.",
                Map.of("productionJobId", productionJobId, "workerId", workerId)
        );

        return ResponseEntity.ok(job.get());
    }

    @PostMapping("/jobs/{jobId}/started")
    public Map<String, Object> started(
            @RequestHeader("X-Worker-Key") String key,
            @RequestHeader("X-Worker-Id") String workerId,
            @PathVariable UUID jobId
    ) {
        verifyKey(key);
        int updated = jdbc.sql("""
                update production_job
                set status='RUNNING', started_at=now(), updated_at=now()
                where id=:jobId and worker_id=:workerId and status='CLAIMED'
                """)
                .param("jobId", jobId)
                .param("workerId", workerId)
                .update();

        if (updated == 0) {
            throw new WorkerStateException("Job is not claimed by this worker.");
        }

        return Map.of("jobId", jobId, "status", "RUNNING");
    }

    @PostMapping("/jobs/{jobId}/complete")
    @Transactional
    public Map<String, Object> complete(
            @RequestHeader("X-Worker-Key") String key,
            @RequestHeader("X-Worker-Id") String workerId,
            @PathVariable UUID jobId,
            @RequestBody WorkerResult result
    ) {
        verifyKey(key);

        ExecutionContext context = findContext(jobId, workerId);

        if ("SYNC_SCENE_CATALOG_V1".equals(context.taskType())) {
            saveCatalogSnapshot(result.catalog(), workerId);
        }

        Map<String, Object> resultPayload = new LinkedHashMap<>();
        resultPayload.put("output", result.output() == null ? "" : result.output());
        resultPayload.put("workerId", workerId);
        resultPayload.put("metrics", result.metrics() == null ? Map.of() : result.metrics());
        String resultJson = writeJson(resultPayload);

        jdbc.sql("""
                update production_job
                set status='SUCCEEDED',
                    finished_at=now(),
                    updated_at=now(),
                    result=cast(:result as jsonb),
                    error=null
                where id=:jobId and worker_id=:workerId
                """)
                .param("result", resultJson)
                .param("jobId", jobId)
                .param("workerId", workerId)
                .update();

        jdbc.sql("update task set status='COMPLETED', updated_at=now() where id=:taskId")
                .param("taskId", context.taskId())
                .update();

        jdbc.sql("update job set status='COMPLETED', progress=100, updated_at=now() where id=:jobId")
                .param("jobId", context.orchestrationJobId())
                .update();

        writeEvent(
                context.orchestrationJobId(),
                context.taskId(),
                "SPLINE_JOB_SUCCEEDED",
                "Spline Agent execution completed and verified successfully.",
                readJsonMap(resultJson)
        );

        return Map.of("jobId", jobId, "status", "SUCCEEDED");
    }

    @PostMapping("/jobs/{jobId}/fail")
    @Transactional
    public Map<String, Object> fail(
            @RequestHeader("X-Worker-Key") String key,
            @RequestHeader("X-Worker-Id") String workerId,
            @PathVariable UUID jobId,
            @RequestBody WorkerResult result
    ) {
        verifyKey(key);

        ExecutionContext context = findContext(jobId, workerId);
        String error = result.error() == null ? "Spline worker failed without an error message." : result.error();
        Map<String, Object> failedResult = new LinkedHashMap<>();
        failedResult.put("workerId", workerId);
        failedResult.put("metrics", result.metrics() == null ? Map.of() : result.metrics());
        String failedResultJson = writeJson(failedResult);

        jdbc.sql("""
                update production_job
                set status='FAILED',
                    finished_at=now(),
                    updated_at=now(),
                    result=cast(:result as jsonb),
                    error=:error
                where id=:jobId and worker_id=:workerId
                """)
                .param("result", failedResultJson)
                .param("error", error)
                .param("jobId", jobId)
                .param("workerId", workerId)
                .update();

        jdbc.sql("update task set status='FAILED', updated_at=now() where id=:taskId")
                .param("taskId", context.taskId())
                .update();

        jdbc.sql("update job set status='FAILED', updated_at=now() where id=:jobId")
                .param("jobId", context.orchestrationJobId())
                .update();

        writeEvent(
                context.orchestrationJobId(),
                context.taskId(),
                "SPLINE_JOB_FAILED",
                error,
                Map.of("productionJobId", jobId)
        );

        return Map.of("jobId", jobId, "status", "FAILED");
    }

    private ExecutionContext findContext(UUID productionJobId, String workerId) {
        return jdbc.sql("""
                select p.task_id, t.job_id, p.task_type
                from production_job p
                join task t on t.id = p.task_id
                where p.id=:productionJobId and p.worker_id=:workerId
                """)
                .param("productionJobId", productionJobId)
                .param("workerId", workerId)
                .query((rs, rowNum) -> new ExecutionContext(
                        rs.getObject("task_id", UUID.class),
                        rs.getObject("job_id", UUID.class),
                        rs.getString("task_type")
                ))
                .optional()
                .orElseThrow(() -> new WorkerStateException("Job does not belong to this worker."));
    }

    private void saveCatalogSnapshot(Map<String, Object> catalog, String workerId) {
        if (catalog == null || catalog.isEmpty()) {
            throw new WorkerStateException("Catalog sync completed without a scene catalog payload.");
        }

        Object sceneNameValue = catalog.get("sceneName");
        Object sectionsValue = catalog.get("sections");

        if (!(sceneNameValue instanceof String sceneName) || sceneName.isBlank()) {
            throw new WorkerStateException("Scene catalog is missing sceneName.");
        }
        if (!(sectionsValue instanceof List<?> sections)) {
            throw new WorkerStateException("Scene catalog is missing sections.");
        }

        int objectCount = sections.stream().mapToInt(this::countCatalogNode).sum();
        int rootSectionCount = sections.size();

        jdbc.sql("""
                insert into spline_scene_catalog(
                    id, project_id, scene_name, object_count, root_section_count,
                    worker_id, catalog, synced_at
                )
                values (
                    :id, :projectId, :sceneName, :objectCount, :rootSectionCount,
                    :workerId, cast(:catalog as jsonb), now()
                )
                """)
                .param("id", UUID.randomUUID())
                .param("projectId", PROJECT_ID)
                .param("sceneName", sceneName.trim())
                .param("objectCount", objectCount)
                .param("rootSectionCount", rootSectionCount)
                .param("workerId", workerId)
                .param("catalog", writeJson(catalog))
                .update();
    }

    @SuppressWarnings("unchecked")
    private int countCatalogNode(Object value) {
        if (!(value instanceof Map<?, ?> node)) {
            return 0;
        }

        int count = 1;
        Object childrenValue = node.get("children");
        if (childrenValue instanceof List<?> children) {
            for (Object child : children) {
                count += countCatalogNode(child);
            }
        }
        return count;
    }

    private UUID findOrchestrationJobId(UUID taskId) {
        return jdbc.sql("select job_id from task where id=:taskId")
                .param("taskId", taskId)
                .query(UUID.class)
                .optional()
                .orElseThrow(() -> new WorkerStateException("Task does not belong to an orchestration job."));
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
            throw new IllegalStateException("Invalid stored production job JSON.", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readJsonMap(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            throw new IllegalStateException("Could not parse production job result.", e);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialize production job result.", e);
        }
    }

    private void verifyKey(String key) {
        if (workerKey.isBlank() || !workerKey.equals(key)) {
            throw new WorkerAuthException();
        }
    }

    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    private static class WorkerAuthException extends RuntimeException {}

    @ResponseStatus(HttpStatus.CONFLICT)
    private static class WorkerStateException extends RuntimeException {
        WorkerStateException(String message) {
            super(message);
        }
    }
}
