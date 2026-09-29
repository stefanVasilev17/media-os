package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ProductionOverviewService {

    public static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    public static final UUID EPISODE_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    public ProductionOverviewService(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> overview() {
        Map<String, Object> episode = episode();
        List<Map<String, Object>> stages = new ArrayList<>(stages());
        Map<String, Object> live = liveMetrics();
        applyLiveState(stages, live);

        List<String> completed = new ArrayList<>();
        List<String> nextActions = new ArrayList<>();
        List<String> improvements = new ArrayList<>();
        double score = 0.0d;

        for (Map<String, Object> stage : stages) {
            String status = String.valueOf(stage.get("status"));
            String summary = String.valueOf(stage.getOrDefault("summary", ""));
            String nextAction = String.valueOf(stage.getOrDefault("nextAction", ""));
            String name = String.valueOf(stage.get("displayName"));

            if (isComplete(status) && !summary.isBlank()) {
                completed.add(name + ": " + summary);
            }
            if (!isComplete(status) && !nextAction.isBlank() && nextActions.size() < 4) {
                nextActions.add(name + ": " + nextAction);
            }

            Map<String, Object> readiness = asMap(stage.get("readiness"));
            for (Object remaining : asList(readiness.get("remainingTasks"))) {
                String text = String.valueOf(remaining);
                if (!text.isBlank() && !text.toLowerCase().startsWith("waiting for")) {
                    improvements.add(name + ": " + text);
                }
            }
            for (Object improvement : asList(readiness.get("improvements"))) {
                String text = String.valueOf(improvement);
                if (!text.isBlank()) improvements.add(name + ": " + text);
            }
            score += statusScore(status);
        }

        boolean scriptLocked = stageLocked(stages, "SCRIPT");
        boolean sceneLocked = stageLocked(stages, "SCENE");
        long shots = number(live.get("shotsPrepared"));
        long rendersReady = number(live.get("rendersReady"));
        long rendersFailed = number(live.get("rendersFailed"));

        if (shots > 0 && (!scriptLocked || !sceneLocked)) {
            improvements.add(0, "Formalize and lock the Script and Scene contracts before treating the existing Spline work as final episode structure.");
        }
        if (shots > 0 && rendersReady == 0) {
            improvements.add("Spline work exists, but no shot render is ready for review yet.");
        }
        if (rendersFailed > 0) {
            improvements.add("Resolve " + rendersFailed + " failed render" + (rendersFailed == 1 ? "" : "s") + " before QA.");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("episode", episode);
        result.put("progressPercent", stages.isEmpty() ? 0 : Math.round((score / stages.size()) * 100.0d));
        result.put("currentFocus", currentFocus(stages));
        result.put("completed", completed);
        result.put("nextActions", nextActions);
        result.put("improvements", dedupe(improvements));
        result.put("stages", publicStages(stages));
        result.put("live", live);
        result.put("source", sourceSnapshot());
        return result;
    }

    public Map<String, Object> episode() {
        return jdbc.sql("""
                select e.id, e.episode_number, e.title, e.current_stage, e.status,
                       e.source_of_truth_version, p.name as project_name
                from episode e
                join project p on p.id=e.project_id
                where e.id=:episodeId
                """)
                .param("episodeId", EPISODE_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("episodeNumber", rs.getString("episode_number"));
                    row.put("title", rs.getString("title"));
                    row.put("currentStage", rs.getString("current_stage"));
                    row.put("status", rs.getString("status"));
                    row.put("sourceOfTruthVersion", rs.getString("source_of_truth_version"));
                    row.put("projectName", rs.getString("project_name"));
                    return row;
                })
                .single();
    }

    public Map<String, Object> sourceSnapshot() {
        return jdbc.sql("""
                select version, source_type, payload::text, created_at
                from episode_source_snapshot
                where episode_id=:episodeId and is_current=true
                order by created_at desc
                limit 1
                """)
                .param("episodeId", EPISODE_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("version", rs.getString("version"));
                    row.put("sourceType", rs.getString("source_type"));
                    row.put("payload", readMap(rs.getString("payload")));
                    row.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    return row;
                })
                .optional()
                .orElseGet(LinkedHashMap::new);
    }

    public List<Map<String, Object>> stages() {
        return jdbc.sql("""
                select id, stage_key, agent_key, display_name, sequence_no, route, status,
                       summary, next_action, artifact::text, artifact_schema_version,
                       current_revision, readiness::text, locked_at, updated_at
                from production_stage
                where episode_id=:episodeId
                order by sequence_no
                """)
                .param("episodeId", EPISODE_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("stageKey", rs.getString("stage_key"));
                    row.put("agentKey", rs.getString("agent_key"));
                    row.put("displayName", rs.getString("display_name"));
                    row.put("sequence", rs.getInt("sequence_no"));
                    row.put("route", rs.getString("route"));
                    row.put("status", rs.getString("status"));
                    row.put("summary", rs.getString("summary"));
                    row.put("nextAction", rs.getString("next_action"));
                    row.put("artifact", readNullableMap(rs.getString("artifact")));
                    row.put("artifactSchemaVersion", rs.getString("artifact_schema_version"));
                    row.put("revision", rs.getInt("current_revision"));
                    row.put("readiness", readMap(rs.getString("readiness")));
                    row.put("lockedAt", rs.getObject("locked_at", OffsetDateTime.class));
                    row.put("updatedAt", rs.getObject("updated_at", OffsetDateTime.class));
                    return row;
                })
                .list();
    }

    public Map<String, Object> liveMetrics() {
        long shotsPrepared = jdbc.sql("""
                select count(*) from production_job
                where project_id=:projectId
                  and agent_key='SPLINE_SHOT_AGENT'
                  and task_type='CREATE_RUNTIME_SHOT_V1'
                  and status='SUCCEEDED'
                """)
                .param("projectId", PROJECT_ID)
                .query(Long.class)
                .single();
        long rendersReady = renderCount("READY");
        long rendersActive = jdbc.sql("""
                select count(*) from spline_shot_render
                where project_id=:projectId and status in ('QUEUED','RENDERING')
                """)
                .param("projectId", PROJECT_ID)
                .query(Long.class)
                .single();
        long rendersFailed = renderCount("FAILED");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("shotsPrepared", shotsPrepared);
        result.put("rendersReady", rendersReady);
        result.put("rendersActive", rendersActive);
        result.put("rendersFailed", rendersFailed);
        return result;
    }

    private List<Map<String, Object>> publicStages(List<Map<String, Object>> stages) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> stage : stages) {
            Map<String, Object> compact = new LinkedHashMap<>(stage);
            compact.remove("artifact");
            result.add(compact);
        }
        return result;
    }

    private void applyLiveState(List<Map<String, Object>> stages, Map<String, Object> live) {
        long shots = number(live.get("shotsPrepared"));
        long ready = number(live.get("rendersReady"));
        long active = number(live.get("rendersActive"));
        long failed = number(live.get("rendersFailed"));

        for (Map<String, Object> stage : stages) {
            String key = String.valueOf(stage.get("stageKey"));
            if ("SPLINE".equals(key)) {
                if (shots > 0) {
                    stage.put("status", "ACTIVE");
                    stage.put("summary", shots + " prepared runtime shot revision" + (shots == 1 ? " exists." : "s exist."));
                    stage.put("nextAction", "Use the locked Scene shot prompts as the canonical structure while preserving the current Spline workspace and reusable world.");
                }
            } else if ("RENDER".equals(key)) {
                if (active > 0) {
                    stage.put("status", "ACTIVE");
                    stage.put("summary", active + " render" + (active == 1 ? " is" : "s are") + " currently in flight.");
                } else if (ready > 0) {
                    stage.put("status", "READY");
                    stage.put("summary", ready + " shot render" + (ready == 1 ? " is" : "s are") + " ready for review.");
                } else if (failed > 0) {
                    stage.put("status", "NEEDS_ATTENTION");
                    stage.put("summary", failed + " render" + (failed == 1 ? " has" : "s have") + " failed and require attention.");
                }
            } else if ("QA".equals(key) && ready > 0 && !isComplete(String.valueOf(stage.get("status")))) {
                stage.put("status", "READY");
                stage.put("summary", "Rendered shots are available for quality review.");
                stage.put("nextAction", "Review technical correctness, framing, pacing, readability, and render quality.");
            }
        }
    }

    private String currentFocus(List<Map<String, Object>> stages) {
        Map<String, Object> script = findStage(stages, "SCRIPT");
        if (script != null && !stageLocked(script)) return "Lock the complete timecoded Script contract.";
        Map<String, Object> scene = findStage(stages, "SCENE");
        if (scene != null && !stageLocked(scene)) return "Lock the combined Scene plan and shot-by-shot Spline handoff.";
        Map<String, Object> spline = findStage(stages, "SPLINE");
        if (spline != null && !isComplete(String.valueOf(spline.get("status")))) return "Finish the current Spline shot execution.";
        Map<String, Object> render = findStage(stages, "RENDER");
        if (render != null && !isComplete(String.valueOf(render.get("status")))) return "Create and review the required shot renders.";
        return "Finish the next unlocked production stage.";
    }

    private Map<String, Object> findStage(List<Map<String, Object>> stages, String key) {
        for (Map<String, Object> stage : stages) {
            if (key.equals(stage.get("stageKey"))) return stage;
        }
        return null;
    }

    private boolean stageLocked(List<Map<String, Object>> stages, String key) {
        Map<String, Object> stage = findStage(stages, key);
        return stage != null && stageLocked(stage);
    }

    private boolean stageLocked(Map<String, Object> stage) {
        return isComplete(String.valueOf(stage.get("status")));
    }

    private boolean isComplete(String status) {
        return "LOCKED".equals(status) || "COMPLETE".equals(status) || "PUBLISHED".equals(status);
    }

    private double statusScore(String status) {
        return switch (status) {
            case "LOCKED", "COMPLETE", "PUBLISHED" -> 1.0d;
            case "READY" -> 0.7d;
            case "ACTIVE" -> 0.4d;
            case "NEEDS_ATTENTION" -> 0.25d;
            default -> 0.0d;
        };
    }

    private long renderCount(String status) {
        return jdbc.sql("select count(*) from spline_shot_render where project_id=:projectId and status=:status")
                .param("projectId", PROJECT_ID)
                .param("status", status)
                .query(Long.class)
                .single();
    }

    private long number(Object value) {
        return value instanceof Number n ? n.longValue() : 0L;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) return (Map<String, Object>) map;
        return Map.of();
    }

    private List<?> asList(Object value) {
        return value instanceof List<?> list ? list : List.of();
    }

    private Map<String, Object> readMap(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception ex) {
            return new LinkedHashMap<>();
        }
    }

    private Map<String, Object> readNullableMap(String json) {
        if (json == null || json.isBlank()) return null;
        return readMap(json);
    }

    private List<String> dedupe(List<String> values) {
        return new ArrayList<>(values.stream().distinct().toList());
    }
}
