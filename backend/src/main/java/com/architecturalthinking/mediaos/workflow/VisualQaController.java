package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/visual")
public class VisualQaController {

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final ProductionMemoryService memory;

    public VisualQaController(JdbcClient jdbc, ObjectMapper objectMapper, ProductionMemoryService memory) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.memory = memory;
    }

    public record ShotRequest(@Positive int scriptRevision, @NotBlank String shotKey, boolean technicalRerender) {}
    public record RenderQaRequest(@Positive int scriptRevision, @NotBlank String shotKey, @NotNull UUID renderId) {}
    public record VisualLockRequest(@Positive int scriptRevision, @NotBlank String shotKey, @NotNull UUID renderId) {}

    @GetMapping("/state")
    public Map<String, Object> state(@RequestParam int scriptRevision) {
        assertLockedScriptRevision(scriptRevision);
        List<Map<String, Object>> shots = jdbc.sql("""
                select v.shot_key, v.shot_title, v.start_second, v.end_second,
                       v.voice_approved_at, v.visual_sync_ready_at, v.alignment::text,
                       v.remotion_render_id, v.rendered_at,
                       r.duration_in_frames as render_duration_in_frames,
                       r.fps as render_fps,
                       l.render_id as locked_render_id,
                       l.locked_at,
                       candidate.id as technical_candidate_render_id,
                       candidate.status as technical_candidate_status,
                       candidate.qa_status as technical_candidate_qa_status,
                       (
                         select q.status
                         from visual_shot_qa q
                         where q.episode_id=v.episode_id
                           and q.script_revision=v.script_revision
                           and q.shot_key=v.shot_key
                           and q.phase='POST_RENDER'
                           and q.render_id=coalesce(l.render_id,v.remotion_render_id)
                         order by q.created_at desc
                         limit 1
                       ) as qa_status
                from voice_shot_workflow v
                left join remotion_render r on r.id=v.remotion_render_id
                left join visual_shot_lock l
                  on l.episode_id=v.episode_id
                 and l.script_revision=v.script_revision
                 and l.shot_key=v.shot_key
                left join lateral (
                    select rr.id, rr.status, (
                        select q.status from visual_shot_qa q
                        where q.episode_id=v.episode_id and q.script_revision=v.script_revision
                          and q.shot_key=v.shot_key and q.render_id=rr.id and q.phase='POST_RENDER'
                        order by q.created_at desc limit 1
                    ) as qa_status
                    from remotion_render rr
                    where rr.episode_id=v.episode_id
                      and rr.input_props->>'shotKey'=v.shot_key
                      and rr.input_props->>'scriptRevision'=cast(v.script_revision as text)
                      and rr.input_props->>'technicalRerender'='true'
                      and rr.id is distinct from l.render_id
                    order by rr.created_at desc limit 1
                ) candidate on true
                where v.episode_id=:episodeId and v.script_revision=:revision
                order by v.start_second, v.shot_key
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", scriptRevision)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("shotKey", rs.getString("shot_key"));
                    row.put("title", rs.getString("shot_title"));
                    row.put("startSecond", rs.getInt("start_second"));
                    row.put("endSecond", rs.getInt("end_second"));
                    row.put("voiceReady", rs.getObject("voice_approved_at", OffsetDateTime.class) != null
                            && rs.getObject("visual_sync_ready_at", OffsetDateTime.class) != null);
                    Map<String, Object> alignment = readMap(rs.getString("alignment"));
                    row.put("alignment", alignment);
                    double voiceDurationSeconds = numberValue(alignment.get("durationSeconds"));
                    int renderDurationInFrames = rs.getInt("render_duration_in_frames");
                    int renderFps = rs.getInt("render_fps");
                    double reviewDurationSeconds = renderDurationInFrames > 0 && renderFps > 0
                            ? renderDurationInFrames / (double) renderFps
                            : voiceDurationSeconds;
                    row.put("voiceDurationSeconds", voiceDurationSeconds);
                    row.put("durationSeconds", reviewDurationSeconds);
                    UUID renderId = rs.getObject("remotion_render_id", UUID.class);
                    row.put("renderId", renderId);
                    row.put("rendered", renderId != null && rs.getObject("rendered_at", OffsetDateTime.class) != null);
                    UUID lockedRenderId = rs.getObject("locked_render_id", UUID.class);
                    row.put("locked", lockedRenderId != null);
                    row.put("lockedRenderId", lockedRenderId);
                    row.put("lockedAt", rs.getObject("locked_at", OffsetDateTime.class));
                    row.put("technicalCandidateRenderId", rs.getObject("technical_candidate_render_id", UUID.class));
                    row.put("technicalCandidateStatus", rs.getString("technical_candidate_status"));
                    row.put("technicalCandidateQaStatus", rs.getString("technical_candidate_qa_status"));
                    String qa = rs.getString("qa_status");
                    row.put("qaStatus", qa == null ? "PENDING" : qa);
                    row.put("compositionId", compositionFor(rs.getString("shot_key")));
                    return row;
                })
                .list();

        Map<String, Object> preview = latestEpisodePreview();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("scriptRevision", scriptRevision);
        result.put("shots", shots);
        result.put("preview", preview);
        result.put("memoryRuleCount", memory.rulesFor("VISUAL").size());
        return result;
    }

    @PostMapping("/qa/preflight")
    public Map<String, Object> preflight(@Valid @RequestBody ShotRequest request) {
        assertLockedScriptRevision(request.scriptRevision());
        String shotKey = normalizeShotKey(request.shotKey());
        Map<String, Object> memoryAudit = memory.preflight("VISUAL", "SHOT_PREFLIGHT_" + shotKey.replace(' ', '_'));
        List<Map<String, Object>> checks = new ArrayList<>();

        Map<String, Object> shot = voiceShot(request.scriptRevision(), shotKey);
        boolean locked = isVisualLocked(request.scriptRevision(), shotKey);
        boolean voiceReady = shot.get("voiceApprovedAt") != null && shot.get("visualSyncReadyAt") != null;
        addCheck(checks, "LOCKED_SCRIPT", true, "Visual work is bound to LOCKED Script revision " + request.scriptRevision() + ".");
        boolean technical = request.technicalRerender() && ("SHOT 01".equals(shotKey) || "SHOT 02".equals(shotKey)) && locked;
        addCheck(checks, "VISUAL_NOT_LOCKED", !locked || technical, locked
                ? technical ? "Motion-only technical candidate; original Director LOCK stays protected."
                  : shotKey + " is Director LOCKED and requires explicit technical re-render."
                : "Shot is open for visual production.");
        if (request.technicalRerender()) {
            addCheck(checks, "TECHNICAL_RERENDER_SCOPE", technical,
                    technical ? "Only interpolation correction to SHOT 01 or SHOT 02."
                              : "Technical re-render requires a locked SHOT 01 or SHOT 02.");
        }
        addCheck(checks, "MEMORY_PREFLIGHT", ((Number) memoryAudit.get("ruleCount")).intValue() > 0,
                memoryAudit.get("ruleCount") + " active production-memory rule(s) loaded.");
        addCheck(checks, "VOICE_APPROVED", voiceReady, voiceReady
                ? "Approved voice timing is ready."
                : "Approve every voice clip in this shot first.");

        boolean contractReady = jdbc.sql("""
                select exists(
                  select 1
                  from episode_production_contract c,
                       jsonb_array_elements(c.payload->'timeline') segment
                  where c.episode_id=:episodeId
                    and c.script_revision=:revision
                    and c.active=true
                    and upper(segment->>'shotKey')=:shotKey
                )
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision())
                .param("shotKey", shotKey)
                .query(Boolean.class)
                .single();
        addCheck(checks, "PRODUCTION_CONTRACT", contractReady,
                contractReady
                        ? "Validated HEAR / SEE contract is active for " + shotKey + "."
                        : "Import the HEAR / SEE contract for " + shotKey + " before visual production.");

        Map<String, Object> alignment = asMap(shot.get("alignment"));
        Map<String, Object> anchors = asMap(alignment.get("anchors"));
        addCheck(checks, "SEMANTIC_ANCHORS", !anchors.isEmpty(),
                anchors.isEmpty() ? "No semantic anchors are available." : anchors.size() + " semantic anchor(s) resolved.");

        Map<String, Object> unresolved = asMap(alignment.get("unresolvedAnchors"));
        addCheck(checks, "ANCHOR_COMPLETENESS", unresolved.isEmpty(),
                unresolved.isEmpty() ? "No unresolved semantic anchors." : "Unresolved: " + String.join(", ", unresolved.keySet()));

        String composition = compositionFor(shotKey);
        addCheck(checks, "REMOTION_COMPOSITION", !composition.isBlank(),
                composition.isBlank() ? "This shot does not yet have an approved Remotion composition." : composition);

        int shotNumber = Integer.parseInt(shotKey.substring(5));
        boolean continuity = true;
        String continuityDetail = "Shot continuity is valid.";
        if (shotNumber > 1) {
            String previous = "SHOT " + String.format(Locale.ROOT, "%02d", shotNumber - 1);
            continuity = latestQaPass(request.scriptRevision(), previous);
            continuityDetail = continuity
                    ? previous + " already passed post-render QA."
                    : previous + " must pass post-render QA before this shot enters the cumulative episode.";
        }
        addCheck(checks, "CONTIGUOUS_PREVIOUS_SHOT", continuity, continuityDetail);

        double duration = numberValue(alignment.get("durationSeconds"));
        boolean durationValid = duration > 0.5 && duration < 180;
        addCheck(checks, "VOICE_DURATION", durationValid,
                durationValid ? String.format(Locale.ROOT, "%.3fs approved duration.", duration) : "Approved voice duration is invalid.");

        boolean passed = checks.stream().allMatch(check -> Boolean.TRUE.equals(check.get("passed")));
        saveQa(request.scriptRevision(), shotKey, null, "PRE_RENDER", passed ? "PASS" : "FAIL", checks,
                ((Number) memoryAudit.get("ruleCount")).intValue());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("shotKey", shotKey);
        result.put("passed", passed);
        result.put("compositionId", composition);
        result.put("checks", checks);
        result.put("memoryPreflight", memoryAudit);
        return result;
    }

    @PostMapping("/qa/post-render")
    public Map<String, Object> postRender(@Valid @RequestBody RenderQaRequest request) {
        assertLockedScriptRevision(request.scriptRevision());
        String shotKey = normalizeShotKey(request.shotKey());
        Map<String, Object> audit = memory.preflight("VISUAL", "POST_RENDER_QA_" + shotKey.replace(' ', '_'));
        Map<String, Object> render = jdbc.sql("""
                select id, composition_id, status, width, height, fps, duration_in_frames,
                       media_type, size_bytes, video_data is not null as has_video, error
                from remotion_render
                where id=:renderId and project_id=:projectId and episode_id=:episodeId
                """)
                .param("renderId", request.renderId())
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("compositionId", rs.getString("composition_id"));
                    row.put("status", rs.getString("status"));
                    row.put("width", rs.getInt("width"));
                    row.put("height", rs.getInt("height"));
                    row.put("fps", rs.getInt("fps"));
                    row.put("durationInFrames", rs.getInt("duration_in_frames"));
                    row.put("mediaType", rs.getString("media_type"));
                    row.put("sizeBytes", rs.getObject("size_bytes"));
                    row.put("hasVideo", rs.getBoolean("has_video"));
                    row.put("error", rs.getString("error"));
                    return row;
                })
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Remotion render not found."));

        List<Map<String, Object>> checks = new ArrayList<>();
        addCheck(checks, "RENDER_SUCCEEDED", "SUCCEEDED".equals(render.get("status")),
                "Render status: " + render.get("status"));
        addCheck(checks, "YOUTUBE_FRAME", number(render.get("width")) == 1920 && number(render.get("height")) == 1080,
                render.get("width") + "×" + render.get("height"));
        addCheck(checks, "FPS_30", number(render.get("fps")) == 30, render.get("fps") + " fps");
        addCheck(checks, "H264_MP4_PAYLOAD", Boolean.TRUE.equals(render.get("hasVideo"))
                        && "video/mp4".equals(render.get("mediaType"))
                        && longNumber(render.get("sizeBytes")) > 100_000,
                "media=" + render.get("mediaType") + ", bytes=" + render.get("sizeBytes"));
        addCheck(checks, "DURATION_PRESENT", number(render.get("durationInFrames")) > 15,
                render.get("durationInFrames") + " frames");
        addCheck(checks, "CORRECT_COMPOSITION", compositionFor(shotKey).equals(render.get("compositionId")),
                String.valueOf(render.get("compositionId")));
        addCheck(checks, "MEMORY_RECHECK", ((Number) audit.get("ruleCount")).intValue() > 0,
                audit.get("ruleCount") + " memory rule(s) rechecked.");

        boolean passed = checks.stream().allMatch(check -> Boolean.TRUE.equals(check.get("passed")));
        saveQa(request.scriptRevision(), shotKey, request.renderId(), "POST_RENDER", passed ? "PASS" : "FAIL", checks,
                ((Number) audit.get("ruleCount")).intValue());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("shotKey", shotKey);
        result.put("renderId", request.renderId());
        result.put("passed", passed);
        result.put("status", passed ? "PASS" : "FAIL");
        result.put("checks", checks);
        return result;
    }


    @PostMapping("/technical-rerender/approve")
    @Transactional
    public Map<String, Object> approveTechnicalRerender(@Valid @RequestBody RenderQaRequest request) {
        assertLockedScriptRevision(request.scriptRevision());
        String shotKey = normalizeShotKey(request.shotKey());
        if (!"SHOT 01".equals(shotKey) && !"SHOT 02".equals(shotKey)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only SHOT 01 and SHOT 02 support technical re-render approval.");
        }

        Map<String, Object> approved = jdbc.sql("""
                select l.render_id as lock_id, v.remotion_render_id as active_id, v.generation_revision
                from visual_shot_lock l
                join voice_shot_workflow v on v.episode_id=l.episode_id
                   and v.script_revision=l.script_revision and v.shot_key=l.shot_key
                where l.episode_id=:episodeId and l.script_revision=:revision and l.shot_key=:shotKey
                for update of l, v
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision())
                .param("shotKey", shotKey)
                .query((rs, n) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("lockedId", rs.getObject("lock_id", UUID.class));
                    row.put("activeId", rs.getObject("active_id", UUID.class));
                    row.put("generation", rs.getInt("generation_revision"));
                    return row;
                })
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "The original Director LOCK is missing."));

        if (!approved.get("lockedId").equals(approved.get("activeId"))
                || approved.get("lockedId").equals(request.renderId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The original approved render must remain active until replacement.");
        }

        Map<String, Object> candidate = jdbc.sql("""
                select status, composition_id, input_props::text
                from remotion_render
                where id=:renderId and project_id=:projectId and episode_id=:episodeId
                """)
                .param("renderId", request.renderId())
                .param("projectId", ProductionOverviewService.PROJECT_ID)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, n) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("status", rs.getString("status"));
                    row.put("composition", rs.getString("composition_id"));
                    row.put("props", readMap(rs.getString("input_props")));
                    return row;
                })
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Technical render not found."));

        Map<String, Object> props = asMap(candidate.get("props"));
        if (!"SUCCEEDED".equals(candidate.get("status"))
                || !compositionFor(shotKey).equals(candidate.get("composition"))
                || !Boolean.TRUE.equals(props.get("technicalRerender"))
                || !shotKey.equals(props.get("shotKey"))
                || number(props.get("scriptRevision")) != request.scriptRevision()
                || number(props.get("generationRevision")) != number(approved.get("generation"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Render is not a valid, current, completed technical candidate.");
        }

        boolean passed = jdbc.sql("""
                select exists (
                    select 1 from visual_shot_qa
                    where episode_id=:episodeId and script_revision=:revision
                      and shot_key=:shotKey and render_id=:renderId
                      and phase='POST_RENDER' and status='PASS'
                )
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision())
                .param("shotKey", shotKey)
                .param("renderId", request.renderId())
                .query(Boolean.class)
                .single();
        if (!passed) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Technical candidate must pass post-render QA.");
        }

        jdbc.sql("""
                update voice_shot_workflow
                set remotion_render_id=:renderId, rendered_generation_revision=generation_revision,
                    rendered_at=now(), remotion_synced_at=coalesce(remotion_synced_at,now()), updated_at=now()
                where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                """)
                .param("renderId", request.renderId())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision())
                .param("shotKey", shotKey)
                .update();

        jdbc.sql("""
                update visual_shot_lock
                set render_id=:renderId, locked_at=now(),
                    source='Director-approved smooth-motion technical replacement'
                where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                """)
                .param("renderId", request.renderId())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision())
                .param("shotKey", shotKey)
                .update();

        return Map.of("shotKey", shotKey, "locked", true, "renderId", request.renderId());
    }

    @PostMapping("/lock")
    public Map<String, Object> lock(@Valid @RequestBody VisualLockRequest request) {
        assertLockedScriptRevision(request.scriptRevision());
        String shotKey = normalizeShotKey(request.shotKey());

        Map<String, Object> current = jdbc.sql("""
                select v.remotion_render_id,
                       exists(
                         select 1 from visual_shot_qa q
                         where q.episode_id=v.episode_id
                           and q.script_revision=v.script_revision
                           and q.shot_key=v.shot_key
                           and q.render_id=:renderId
                           and q.phase='POST_RENDER'
                           and q.status='PASS'
                       ) as qa_passed,
                       r.status as render_status
                from voice_shot_workflow v
                left join remotion_render r on r.id=v.remotion_render_id
                where v.episode_id=:episodeId
                  and v.script_revision=:revision
                  and v.shot_key=:shotKey
                """)
                .param("renderId", request.renderId())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision())
                .param("shotKey", shotKey)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("renderId", rs.getObject("remotion_render_id", UUID.class));
                    row.put("qaPassed", rs.getBoolean("qa_passed"));
                    row.put("renderStatus", rs.getString("render_status"));
                    return row;
                })
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Visual shot state is not initialized."));

        if (!request.renderId().equals(current.get("renderId"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only the current shot render can be locked.");
        }
        if (!Boolean.TRUE.equals(current.get("qaPassed")) || !"SUCCEEDED".equals(current.get("renderStatus"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Shot must pass post-render QA before Director LOCK.");
        }

        jdbc.sql("""
                insert into visual_shot_lock(
                  id, episode_id, script_revision, shot_key, render_id, locked_at, source
                ) values (
                  :id,:episodeId,:revision,:shotKey,:renderId,now(),'Director approval'
                )
                on conflict (episode_id, script_revision, shot_key) do update
                set render_id=excluded.render_id,
                    locked_at=now(),
                    source='Director approval'
                """)
                .param("id", UUID.randomUUID())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision())
                .param("shotKey", shotKey)
                .param("renderId", request.renderId())
                .update();

        return Map.of(
                "shotKey", shotKey,
                "locked", true,
                "renderId", request.renderId()
        );
    }

    private boolean isVisualLocked(int revision, String shotKey) {
        return jdbc.sql("""
                select exists(
                  select 1 from visual_shot_lock
                  where episode_id=:episodeId
                    and script_revision=:revision
                    and shot_key=:shotKey
                )
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("shotKey", shotKey)
                .query(Boolean.class)
                .single();
    }

    private Map<String, Object> voiceShot(int revision, String shotKey) {
        return jdbc.sql("""
                select voice_approved_at, visual_sync_ready_at, alignment::text
                from voice_shot_workflow
                where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("shotKey", shotKey)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("voiceApprovedAt", rs.getObject("voice_approved_at", OffsetDateTime.class));
                    row.put("visualSyncReadyAt", rs.getObject("visual_sync_ready_at", OffsetDateTime.class));
                    row.put("alignment", readMap(rs.getString("alignment")));
                    return row;
                })
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Voice shot state is not initialized."));
    }

    private boolean latestQaPass(int revision, String shotKey) {
        return jdbc.sql("""
                select status='PASS'
                from visual_shot_qa
                where episode_id=:episodeId and script_revision=:revision
                  and shot_key=:shotKey and phase='POST_RENDER'
                order by created_at desc
                limit 1
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("shotKey", shotKey)
                .query(Boolean.class)
                .optional()
                .orElse(false);
    }

    private Map<String, Object> latestEpisodePreview() {
        return jdbc.sql("""
                select id, duration_in_frames, fps, size_bytes, finished_at
                from remotion_render
                where episode_id=:episodeId
                  and composition_id='EP001-Voice-CurrentPreview'
                  and status='SUCCEEDED'
                  and video_data is not null
                order by finished_at desc nulls last, updated_at desc
                limit 1
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("ready", true);
                    row.put("renderId", rs.getObject("id", UUID.class));
                    row.put("durationInFrames", rs.getInt("duration_in_frames"));
                    row.put("fps", rs.getInt("fps"));
                    row.put("sizeBytes", rs.getObject("size_bytes"));
                    return row;
                })
                .optional()
                .orElseGet(() -> Map.of("ready", false));
    }

    private void saveQa(int revision, String shotKey, UUID renderId, String phase, String status, List<Map<String, Object>> checks, int memoryRules) {
        jdbc.sql("""
                insert into visual_shot_qa(
                  id, episode_id, script_revision, shot_key, render_id, phase, status, checks, memory_rule_count
                ) values (
                  :id,:episodeId,:revision,:shotKey,:renderId,:phase,:status,cast(:checks as jsonb),:memoryRules
                )
                """)
                .param("id", UUID.randomUUID())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("shotKey", shotKey)
                .param("renderId", renderId)
                .param("phase", phase)
                .param("status", status)
                .param("checks", writeJson(checks))
                .param("memoryRules", memoryRules)
                .update();
    }

    private void addCheck(List<Map<String, Object>> checks, String key, boolean passed, String detail) {
        Map<String, Object> check = new LinkedHashMap<>();
        check.put("key", key);
        check.put("passed", passed);
        check.put("detail", detail);
        checks.add(check);
    }

    private String compositionFor(String shotKey) {
        return switch (shotKey) {
            case "SHOT 01" -> "EP001-Shot01-VoiceSynced";
            case "SHOT 02" -> "EP001-Shot02-VoiceSynced";
            case "SHOT 03" -> "EP001-Shot03-VoiceSynced";
            case "SHOT 04" -> "EP001-Shot04-VoiceSynced";
            case "SHOT 05" -> "EP001-Shot05-VoiceSynced";
            case "SHOT 06" -> "EP001-Shot06-VoiceSynced";
            default -> "";
        };
    }

    private void assertLockedScriptRevision(int requested) {
        Map<String, Object> script = jdbc.sql("""
                select status, current_revision from production_stage
                where episode_id=:episodeId and stage_key='SCRIPT'
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "status", rs.getString("status"), "revision", rs.getInt("current_revision")
                ))
                .single();
        if (!"LOCKED".equals(script.get("status"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Script must be LOCKED before Visual Agent work.");
        }
        if (((Number) script.get("revision")).intValue() != requested) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Visual Agent must use the current LOCKED Script revision.");
        }
    }

    private String normalizeShotKey(String raw) {
        String value = raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT).replace('_', ' ');
        if (!value.matches("SHOT \\d{2}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shot key must look like SHOT 01.");
        return value;
    }

    private int number(Object value) {
        return value instanceof Number n ? n.intValue() : 0;
    }

    private long longNumber(Object value) {
        return value instanceof Number n ? n.longValue() : 0L;
    }

    private double numberValue(Object value) {
        if (value instanceof Number n) return n.doubleValue();
        try { return value == null ? 0.0d : Double.parseDouble(String.valueOf(value)); }
        catch (NumberFormatException ex) { return 0.0d; }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> result = new LinkedHashMap<>();
            map.forEach((key, val) -> result.put(String.valueOf(key), val));
            return result;
        }
        return new LinkedHashMap<>();
    }

    private Map<String, Object> readMap(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try { return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {}); }
        catch (Exception ex) { return new LinkedHashMap<>(); }
    }

    private String writeJson(Object value) {
        try { return objectMapper.writeValueAsString(value); }
        catch (JsonProcessingException ex) { throw new IllegalStateException("Could not serialize Visual QA.", ex); }
    }
}
