package com.architecturalthinking.mediaos.workflow;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/production-flow")
public class ProductionFlowController {

    private final JdbcClient jdbc;
    private final ProductionOverviewService overview;
    private final ProductionMemoryService memory;

    public ProductionFlowController(JdbcClient jdbc, ProductionOverviewService overview, ProductionMemoryService memory) {
        this.jdbc = jdbc;
        this.overview = overview;
        this.memory = memory;
    }

    @GetMapping
    public Map<String, Object> state() {
        Map<String, Object> script = jdbc.sql("""
                select status, current_revision
                from production_stage
                where episode_id=:episodeId and stage_key='SCRIPT'
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "status", rs.getString("status"),
                        "revision", rs.getInt("current_revision")
                ))
                .single();

        int revision = ((Number) script.get("revision")).intValue();
        Map<String, Object> voice = jdbc.sql("""
                select count(*) total,
                       count(*) filter (where generated_audio is not null) generated,
                       count(*) filter (where voice_approved_at is not null) approved
                from voice_clip_workflow
                where episode_id=:episodeId and script_revision=:revision
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "total", rs.getLong("total"),
                        "generated", rs.getLong("generated"),
                        "approved", rs.getLong("approved")
                ))
                .single();

        long visualReady = jdbc.sql("""
                select count(distinct input_props->>'shotKey')
                from remotion_render
                where episode_id=:episodeId
                  and status='SUCCEEDED'
                  and composition_id like 'EP001-Shot%-VoiceSynced'
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query(Long.class)
                .single();

        long qaPassed = jdbc.sql("""
                select count(distinct shot_key)
                from visual_shot_qa
                where episode_id=:episodeId
                  and script_revision=:revision
                  and phase='POST_RENDER'
                  and status='PASS'
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .query(Long.class)
                .single();

        Map<String, Object> preview = jdbc.sql("""
                select id, duration_in_frames, fps, size_bytes, finished_at
                from remotion_render
                where episode_id=:episodeId
                  and composition_id='EP001-Voice-CurrentPreview'
                  and status='SUCCEEDED'
                order by finished_at desc nulls last, updated_at desc
                limit 1
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("renderId", rs.getObject("id", UUID.class));
                    row.put("durationInFrames", rs.getInt("duration_in_frames"));
                    row.put("fps", rs.getInt("fps"));
                    row.put("sizeBytes", rs.getObject("size_bytes"));
                    row.put("ready", true);
                    return row;
                })
                .optional()
                .orElseGet(() -> Map.of("ready", false));

        long totalClips = ((Number) voice.get("total")).longValue();
        long approvedClips = ((Number) voice.get("approved")).longValue();

        List<Map<String, Object>> stages = new ArrayList<>();
        stages.add(stage("SCRIPT", "Script Agent", "#/agents/script",
                "LOCKED".equals(script.get("status")) ? "LOCKED" : "ACTIVE",
                "LOCKED".equals(script.get("status")) ? "Current episode script is locked and read-only." : "Finish and lock the current episode script."));
        stages.add(stage("VOICE", "Voice Agent", "#/agents/voice",
                totalClips > 0 && approvedClips == totalClips ? "READY" : approvedClips > 0 ? "ACTIVE" : "READY",
                totalClips == 0 ? "Voice clips have not been initialized." : approvedClips + "/" + totalClips + " clips approved."));
        stages.add(stage("VISUAL", "Visual Agent", "#/agents/visual",
                qaPassed > 0 ? "ACTIVE" : "READY",
                qaPassed + " shot(s) passed post-render QA; " + visualReady + " render(s) ready."));
        stages.add(stage("FINAL", "Current Episode", "#/agents/visual",
                Boolean.TRUE.equals(preview.get("ready")) ? "READY" : "WAITING",
                Boolean.TRUE.equals(preview.get("ready")) ? "A cumulative preview is ready." : "Waiting for the first QA-approved visual shot."));

        String nextRoute;
        String nextLabel;
        if (!"LOCKED".equals(script.get("status"))) {
            nextRoute = "#/agents/script";
            nextLabel = "Review Script";
        } else if (totalClips == 0 || approvedClips < totalClips) {
            nextRoute = "#/agents/voice";
            nextLabel = "Continue Voice";
        } else {
            nextRoute = "#/agents/visual";
            nextLabel = "Continue Visual";
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("episode", overview.episode());
        result.put("scriptRevision", revision);
        result.put("stages", stages);
        result.put("nextRoute", nextRoute);
        result.put("nextLabel", nextLabel);
        result.put("voice", voice);
        result.put("visualQaPassed", qaPassed);
        result.put("preview", preview);
        long memoryRuleCount = jdbc.sql("""
                select count(*)
                from production_memory_rule
                where project_id=:projectId
                  and active=true
                  and (episode_id is null or episode_id=:episodeId)
                """)
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query(Long.class)
                .single();
        result.put("memoryRuleCount", memoryRuleCount);
        return result;
    }

    private Map<String, Object> stage(String key, String label, String route, String status, String detail) {
        Map<String, Object> stage = new LinkedHashMap<>();
        stage.put("key", key);
        stage.put("label", label);
        stage.put("route", route);
        stage.put("status", status);
        stage.put("detail", detail);
        return stage;
    }
}
