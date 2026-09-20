package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/worker/spline")
public class SplineWorkerController {

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final String workerKey;

    public SplineWorkerController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            @Value("\${SPLINE_WORKER_KEY:}") String workerKey
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.workerKey = workerKey;
    }

    public record WorkerResult(String output, String error) {}

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

        jdbc.sql("update task set status='IN_PROGRESS', updated_at=now() where id=:taskId")
                .param("taskId", taskId)
                .update();

        jdbc.sql("""
                insert into event(id, project_id, job_id, task_id, event_type, message, payload)
                values (:id,
                        '11111111-1111-1111-1111-111111111111',
                        '77777777-7777-7777-7777-777777777777',
                        :taskId,
                        'SPLINE_WORKER_CLAIMED',
                        'Spline production worker claimed the queued MCP job.',
                        cast(:payload as jsonb))
                """)
                .param("id", UUID.randomUUID())
                .param("taskId", taskId)
                .param("payload", "{\"productionJobId\":\"" + productionJobId + "\",\"workerId\":\"" + workerId + "\"}")
                .update();

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

        UUID taskId = findTask(jobId, workerId);
        String resultJson = writeJson(Map.of(
                "output", result.output() == null ? "" : result.output(),
                "workerId", workerId
        ));

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
                .param("taskId", taskId)
                .update();

        jdbc.sql("update job set progress=90, updated_at=now() where id='77777777-7777-7777-7777-777777777777'")
                .update();

        jdbc.sql("""
                insert into event(id, project_id, job_id, task_id, event_type, message, payload)
                values (:id,
                        '11111111-1111-1111-1111-111111111111',
                        '77777777-7777-7777-7777-777777777777',
                        :taskId,
                        'SPLINE_MCP_PROOF_SUCCEEDED',
                        'Media OS dispatched a job through the production worker and Spline MCP reported success.',
                        cast(:payload as jsonb))
                """)
                .param("id", UUID.randomUUID())
                .param("taskId", taskId)
                .param("payload", resultJson)
                .update();

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

        UUID taskId = findTask(jobId, workerId);
        String error = result.error() == null ? "Spline worker failed without an error message." : result.error();

        jdbc.sql("""
                update production_job
                set status='FAILED',
                    finished_at=now(),
                    updated_at=now(),
                    error=:error
                where id=:jobId and worker_id=:workerId
                """)
                .param("error", error)
                .param("jobId", jobId)
                .param("workerId", workerId)
                .update();

        jdbc.sql("update task set status='FAILED', updated_at=now() where id=:taskId")
                .param("taskId", taskId)
                .update();

        jdbc.sql("""
                insert into event(id, project_id, job_id, task_id, event_type, message)
                values (:id,
                        '11111111-1111-1111-1111-111111111111',
                        '77777777-7777-7777-7777-777777777777',
                        :taskId,
                        'SPLINE_MCP_PROOF_FAILED',
                        :message)
                """)
                .param("id", UUID.randomUUID())
                .param("taskId", taskId)
                .param("message", error)
                .update();

        return Map.of("jobId", jobId, "status", "FAILED");
    }

    private UUID findTask(UUID jobId, String workerId) {
        return jdbc.sql("""
                select task_id
                from production_job
                where id=:jobId and worker_id=:workerId
                """)
                .param("jobId", jobId)
                .param("workerId", workerId)
                .query(UUID.class)
                .optional()
                .orElseThrow(() -> new WorkerStateException("Job does not belong to this worker."));
    }

    private Object readJson(String json) {
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            throw new IllegalStateException("Invalid stored production job JSON.", e);
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
