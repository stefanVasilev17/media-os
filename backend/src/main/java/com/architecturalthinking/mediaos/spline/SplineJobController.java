package com.architecturalthinking.mediaos.spline;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/spline/jobs")
public class SplineJobController {

    private final JdbcClient jdbc;

    public SplineJobController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/latest")
    public Map<String, Object> latest() {
        return jdbc.sql("""
                select id, task_type, target, status, worker_id, error,
                       created_at, claimed_at, started_at, finished_at,
                       coalesce(result, '{}'::jsonb)::text as result
                from production_job
                where agent_key = 'SPLINE_AGENT'
                order by created_at desc
                limit 1
                """)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("taskType", rs.getString("task_type"));
                    item.put("target", rs.getString("target"));
                    item.put("status", rs.getString("status"));
                    item.put("workerId", rs.getString("worker_id"));
                    item.put("error", rs.getString("error"));
                    item.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    item.put("claimedAt", rs.getObject("claimed_at", OffsetDateTime.class));
                    item.put("startedAt", rs.getObject("started_at", OffsetDateTime.class));
                    item.put("finishedAt", rs.getObject("finished_at", OffsetDateTime.class));
                    item.put("result", rs.getString("result"));
                    return item;
                })
                .optional()
                .orElseGet(() -> Map.of("status", "NONE"));
    }
}
