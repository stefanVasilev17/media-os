package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/worker/spline-shot")
public class SplineShotWorkerController {

    private static final String AGENT_KEY = "SPLINE_SHOT_AGENT";
    private static final String TASK_TYPE = "CREATE_RUNTIME_SHOT_V1";

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final String workerKey;

    public SplineShotWorkerController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            @Value("${SPLINE_WORKER_KEY:}") String workerKey
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.workerKey = workerKey;
    }

    public record ShotWorkerResult(
            String output,
            String error,
            Map<String, Object> metrics
    ) {}

    private record ExecutionContext(UUID taskId, UUID orchestrationJobId) {}

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
                  where agent_key=:agentKey
                    and task_type=:taskType
                    and status='QUEUED'
                  order by created_at
                  for update skip locked
                  limit 1
                )
                update production_job p
                set status='CLAIMED', worker_id=:workerId, claimed_at=now(), updated_at=now()
                from candidate c
                where p.id=c.id
                returning p.id, p.task_id, p.task_type, p.instructions,
                          p.permissions::text, p.protected_objects::text, p.payload::text
                """)
                .param("agentKey", AGENT_KEY)
                .param("taskType", TASK_TYPE)
                .param("workerId", workerId)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("taskId", rs.getObject("task_id", UUID.class));
                    item.put("taskType", rs.getString("task_type"));
                    item.put("instructions", rs.getString("instructions"));
                    item.put("permissions", readJsonMap(rs.getString("permissions")));
                    item.put("protectedObjects", readJsonMapOrList(rs.getString("protected_objects")));
                    item.put("payload", readJsonMap(rs.getString("payload")));
                    return item;
                })
                .optional();

        if (job.isEmpty()) return ResponseEntity.noContent().build();

        UUID taskId = (UUID) job.orElseThrow().get("taskId");
        UUID orchestrationJobId = findOrchestrationJobId(taskId);

        jdbc.sql("update task set status='IN_PROGRESS', updated_at=now() where id=:taskId")
                .param("taskId", taskId)
                .update();
        jdbc.sql("update job set status='RUNNING', progress=40, updated_at=now() where id=:jobId")
                .param("jobId", orchestrationJobId)
                .update();

        return ResponseEntity.ok(job.orElseThrow());
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
        if (updated == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Shot job is not claimed by this worker.");
        return Map.of("jobId", jobId, "status", "RUNNING");
    }

    @PostMapping("/jobs/{jobId}/complete")
    @Transactional
    public Map<String, Object> complete(
            @RequestHeader("X-Worker-Key") String key,
            @RequestHeader("X-Worker-Id") String workerId,
            @PathVariable UUID jobId,
            @RequestBody ShotWorkerResult result
    ) {
        verifyKey(key);
        ExecutionContext context = findContext(jobId, workerId);
        String output = result.output() == null ? "" : result.output().trim();
        validateShotOutput(output);

        Map<String, Object> resultPayload = new LinkedHashMap<>();
        resultPayload.put("output", output);
        resultPayload.put("workerId", workerId);
        resultPayload.put("metrics", result.metrics() == null ? Map.of() : result.metrics());

        jdbc.sql("""
                update production_job
                set status='SUCCEEDED', finished_at=now(), updated_at=now(),
                    result=cast(:result as jsonb), error=null
                where id=:jobId and worker_id=:workerId
                """)
                .param("result", writeJson(resultPayload))
                .param("jobId", jobId)
                .param("workerId", workerId)
                .update();
        jdbc.sql("update task set status='COMPLETED', updated_at=now() where id=:taskId")
                .param("taskId", context.taskId())
                .update();
        jdbc.sql("update job set status='COMPLETED', progress=100, updated_at=now() where id=:jobId")
                .param("jobId", context.orchestrationJobId())
                .update();

        return Map.of("jobId", jobId, "status", "SUCCEEDED");
    }

    @PostMapping("/jobs/{jobId}/fail")
    @Transactional
    public Map<String, Object> fail(
            @RequestHeader("X-Worker-Key") String key,
            @RequestHeader("X-Worker-Id") String workerId,
            @PathVariable UUID jobId,
            @RequestBody ShotWorkerResult result
    ) {
        verifyKey(key);
        ExecutionContext context = findContext(jobId, workerId);
        String error = result.error() == null || result.error().isBlank()
                ? "Shot Director worker failed without an error message."
                : result.error().trim();

        Map<String, Object> failed = new LinkedHashMap<>();
        failed.put("output", result.output());
        failed.put("workerId", workerId);
        failed.put("metrics", result.metrics() == null ? Map.of() : result.metrics());

        jdbc.sql("""
                update production_job
                set status='FAILED', finished_at=now(), updated_at=now(),
                    result=cast(:result as jsonb), error=:error
                where id=:jobId and worker_id=:workerId
                """)
                .param("result", writeJson(failed))
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

        return Map.of("jobId", jobId, "status", "FAILED");
    }

    private void validateShotOutput(String output) {
        if (!output.startsWith("MEDIA_OS_SPLINE_RESULT: SUCCEEDED")) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Shot Director did not return a successful ShotSpec result line.");
        }
        int start = output.indexOf('{');
        int end = output.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Shot Director result is missing compact ShotSpec JSON.");
        }
        Map<String, Object> spec = readJsonMap(output.substring(start, end + 1));
        if (!(spec.get("durationMs") instanceof Number) || !(spec.get("beats") instanceof java.util.List<?>)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Shot Director returned an invalid ShotSpec.");
        }
    }

    private ExecutionContext findContext(UUID productionJobId, String workerId) {
        return jdbc.sql("""
                select p.task_id, t.job_id
                from production_job p
                join task t on t.id=p.task_id
                where p.id=:jobId and p.worker_id=:workerId and p.agent_key=:agentKey
                """)
                .param("jobId", productionJobId)
                .param("workerId", workerId)
                .param("agentKey", AGENT_KEY)
                .query((rs, rowNum) -> new ExecutionContext(
                        rs.getObject("task_id", UUID.class),
                        rs.getObject("job_id", UUID.class)
                ))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shot job does not belong to this worker."));
    }

    private UUID findOrchestrationJobId(UUID taskId) {
        return jdbc.sql("select job_id from task where id=:taskId")
                .param("taskId", taskId)
                .query(UUID.class)
                .single();
    }

    private void verifyKey(String key) {
        if (workerKey == null || workerKey.isBlank() || !workerKey.equals(key)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid worker key.");
        }
    }

    private Map<String, Object> readJsonMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid shot worker JSON payload.", ex);
        }
    }

    private Object readJsonMapOrList(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid shot worker JSON payload.", ex);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize Shot Director result.", ex);
        }
    }
}
