package com.architecturalthinking.mediaos.runner;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class RunnerController {

    private final JdbcClient jdbc;
    private final String workerKey;
    private final String productionCommit;

    public RunnerController(
            JdbcClient jdbc,
            @Value("${SPLINE_WORKER_KEY:}") String workerKey,
            @Value("${RAILWAY_GIT_COMMIT_SHA:main}") String productionCommit
    ) {
        this.jdbc = jdbc;
        this.workerKey = workerKey;
        this.productionCommit = productionCommit;
    }

    public record HeartbeatRequest(
            String workerId,
            String hostname,
            String status,
            String runnerVersion,
            String workerVersion,
            String productionCommit,
            String lastError
    ) {}

    @GetMapping("/runner/release")
    public Map<String, Object> release() {
        return Map.of(
                "commitSha", productionCommit == null || productionCommit.isBlank() ? "main" : productionCommit,
                "protocolVersion", 2,
                "autoUpdate", true
        );
    }

    @GetMapping("/runner/status")
    public Map<String, Object> status() {
        return jdbc.sql("""
                select worker_id, hostname, status, runner_version, worker_version,
                       production_commit, last_error, last_seen
                from runner_heartbeat
                order by last_seen desc
                limit 1
                """)
                .query((rs, rowNum) -> {
                    OffsetDateTime lastSeen = rs.getObject("last_seen", OffsetDateTime.class);
                    boolean online = lastSeen != null && lastSeen.isAfter(OffsetDateTime.now(ZoneOffset.UTC).minusSeconds(30));
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("online", online);
                    item.put("workerId", rs.getString("worker_id"));
                    item.put("hostname", rs.getString("hostname"));
                    item.put("status", online ? rs.getString("status") : "OFFLINE");
                    item.put("runnerVersion", rs.getString("runner_version"));
                    item.put("workerVersion", rs.getString("worker_version"));
                    item.put("productionCommit", rs.getString("production_commit"));
                    item.put("lastError", rs.getString("last_error"));
                    item.put("lastSeen", lastSeen);
                    return item;
                })
                .optional()
                .orElseGet(() -> Map.of(
                        "online", false,
                        "status", "NOT_REGISTERED"
                ));
    }

    @PostMapping("/worker/runner/heartbeat")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void heartbeat(
            @RequestHeader("X-Worker-Key") String key,
            @RequestBody HeartbeatRequest request
    ) {
        verifyKey(key);

        String workerId = clean(request.workerId(), 180, "unknown-runner");
        String hostname = clean(request.hostname(), 180, "unknown-host");
        String status = clean(request.status(), 80, "ONLINE");
        String runnerVersion = clean(request.runnerVersion(), 80, "unknown");
        String workerVersion = clean(request.workerVersion(), 80, "dynamic");
        String commit = clean(request.productionCommit(), 80, "unknown");
        String lastError = request.lastError() == null ? null : request.lastError().trim();
        if (lastError != null && lastError.length() > 2000) {
            lastError = lastError.substring(0, 2000);
        }

        jdbc.sql("""
                insert into runner_heartbeat(
                    worker_id, hostname, status, runner_version, worker_version,
                    production_commit, last_error, last_seen
                )
                values (
                    :workerId, :hostname, :status, :runnerVersion, :workerVersion,
                    :productionCommit, :lastError, now()
                )
                on conflict (worker_id) do update
                set hostname = excluded.hostname,
                    status = excluded.status,
                    runner_version = excluded.runner_version,
                    worker_version = excluded.worker_version,
                    production_commit = excluded.production_commit,
                    last_error = excluded.last_error,
                    last_seen = now()
                """)
                .param("workerId", workerId)
                .param("hostname", hostname)
                .param("status", status)
                .param("runnerVersion", runnerVersion)
                .param("workerVersion", workerVersion)
                .param("productionCommit", commit)
                .param("lastError", lastError)
                .update();
    }

    private String clean(String value, int maxLength, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        String cleaned = value.replace("\r", "").replace("\n", "").trim();
        return cleaned.length() <= maxLength ? cleaned : cleaned.substring(0, maxLength);
    }

    private void verifyKey(String key) {
        if (workerKey.isBlank() || !workerKey.equals(key)) {
            throw new WorkerAuthException();
        }
    }

    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    private static class WorkerAuthException extends RuntimeException {}
}
