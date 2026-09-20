package com.architecturalthinking.mediaos.livemap;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/live-map")
public class LiveMapController {

    private final JdbcClient jdbc;

    public LiveMapController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public Map<String, Object> getLiveMap() {
        Map<String, Object> project = jdbc.sql("""
                select id, name, slug, status
                from project
                order by name
                limit 1
                """)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("name", rs.getString("name"));
                    item.put("slug", rs.getString("slug"));
                    item.put("status", rs.getString("status"));
                    return item;
                })
                .single();

        UUID projectId = (UUID) project.get("id");

        List<Map<String, Object>> jobs = jdbc.sql("""
                select id, name, job_type, status, progress, created_at, updated_at
                from job
                where project_id = :projectId
                order by created_at desc
                """)
                .param("projectId", projectId)
                .query((rs, rowNum) -> {
                    UUID jobId = rs.getObject("id", UUID.class);
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", jobId);
                    item.put("name", rs.getString("name"));
                    item.put("type", rs.getString("job_type"));
                    item.put("status", rs.getString("status"));
                    item.put("progress", rs.getInt("progress"));
                    item.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    item.put("updatedAt", rs.getObject("updated_at", OffsetDateTime.class));
                    item.put("tasks", getTasks(jobId));
                    return item;
                })
                .list();

        List<Map<String, Object>> events = jdbc.sql("""
                select id, event_type, message, created_at
                from event
                where project_id = :projectId
                order by created_at desc
                limit 30
                """)
                .param("projectId", projectId)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("type", rs.getString("event_type"));
                    item.put("message", rs.getString("message"));
                    item.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    return item;
                })
                .list();

        return Map.of(
                "project", project,
                "jobs", jobs,
                "events", events
        );
    }

    private List<Map<String, Object>> getTasks(UUID jobId) {
        return jdbc.sql("""
                select id, parent_task_id, name, task_type, status, sequence_no
                from task
                where job_id = :jobId
                order by sequence_no, created_at
                """)
                .param("jobId", jobId)
                .query((rs, rowNum) -> {
                    UUID taskId = rs.getObject("id", UUID.class);
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", taskId);
                    item.put("parentTaskId", rs.getObject("parent_task_id", UUID.class));
                    item.put("name", rs.getString("name"));
                    item.put("type", rs.getString("task_type"));
                    item.put("status", rs.getString("status"));
                    item.put("sequence", rs.getInt("sequence_no"));
                    item.put("agentRuns", getAgentRuns(taskId));
                    item.put("approvals", getApprovals(taskId));
                    item.put("artifacts", getArtifacts(taskId));
                    return item;
                })
                .list();
    }

    private List<Map<String, Object>> getAgentRuns(UUID taskId) {
        return jdbc.sql("""
                select id, agent_key, status, started_at, finished_at
                from agent_run
                where task_id = :taskId
                order by started_at nulls last
                """)
                .param("taskId", taskId)
                .query((rs, rowNum) -> Map.of(
                        "id", rs.getObject("id", UUID.class),
                        "agentKey", rs.getString("agent_key"),
                        "status", rs.getString("status")
                ))
                .list();
    }

    private List<Map<String, Object>> getApprovals(UUID taskId) {
        return jdbc.sql("""
                select id, status, coalesce(comment, '') as comment
                from approval
                where task_id = :taskId
                order by created_at
                """)
                .param("taskId", taskId)
                .query((rs, rowNum) -> Map.of(
                        "id", rs.getObject("id", UUID.class),
                        "status", rs.getString("status"),
                        "comment", rs.getString("comment")
                ))
                .list();
    }

    private List<Map<String, Object>> getArtifacts(UUID taskId) {
        return jdbc.sql("""
                select id, artifact_type, name, coalesce(uri, '') as uri, status
                from artifact
                where task_id = :taskId
                order by created_at
                """)
                .param("taskId", taskId)
                .query((rs, rowNum) -> Map.of(
                        "id", rs.getObject("id", UUID.class),
                        "type", rs.getString("artifact_type"),
                        "name", rs.getString("name"),
                        "uri", rs.getString("uri"),
                        "status", rs.getString("status")
                ))
                .list();
    }
}
