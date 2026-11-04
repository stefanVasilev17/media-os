package com.architecturalthinking.mediaos.remotion;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/remotion/renders/worker")
public class RemotionCpuWorkerController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final int MAX_VIDEO_BYTES = 256 * 1024 * 1024;

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final StorageHealthService storage;
    private final String workerKey;

    public RemotionCpuWorkerController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            StorageHealthService storage,
            @Value("${MEDIA_OS_RENDER_WORKER_KEY:}") String workerKey
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.storage = storage;
        this.workerKey = workerKey == null ? "" : workerKey.trim();
    }

    public record ProgressRequest(int progress) {}
    public record FailureRequest(String error) {}

    @PostMapping("/claim")
    @Transactional
    public ResponseEntity<Map<String, Object>> claim(
            @RequestHeader(value = "X-Media-OS-Worker-Key", required = false) String key,
            @RequestHeader(value = "X-Media-OS-Worker", required = false) String workerId,
            @RequestHeader(value = "X-Media-OS-Worker-Source-Sha", required = false) String sourceSha
    ) {
        requireWorker(key, workerId);

        // An interrupted EP002 preview is terminal until the Director explicitly
        // requests another render. Never spend CPU repeatedly on stale voice mux failures.
        jdbc.sql("""
                update remotion_render
                set status='FAILED', progress=0,
                    error='EP002 preview interrupted after worker heartbeat timeout. No automatic retry.',
                    finished_at=now(), updated_at=now()
                where project_id=:projectId
                  and composition_id='EP002-SHOT01-DRAFT'
                  and status='RUNNING'
                  and updated_at < now() - interval '90 seconds'
                """)
                .param("projectId", PROJECT_ID)
                .update();

        jdbc.sql("""
                update remotion_render
                set status='QUEUED', progress=0, worker_id=null,
                    error='Recovered stale CPU render after worker heartbeat timeout.',
                    claimed_at=null, started_at=null, updated_at=now()
                where project_id=:projectId
                  and composition_id<>'EP002-SHOT01-DRAFT'
                  and status='RUNNING'
                  and updated_at < now() - interval '90 seconds'
                """)
                .param("projectId", PROJECT_ID)
                .update();

        Map<String, Object> work = jdbc.sql("""
                select id, episode_id, composition_id, render_key, engine_version, input_props::text as input_props,
                       profile, width, height, fps, duration_in_frames
                from remotion_render
                where project_id=:projectId and status='QUEUED'
                  and (composition_id not like 'AT-FACTORY-%'
                    or (input_props->>'expectedSourceCommit' = :sourceSha
                      and exists(select 1 from episode_factory_worker_capability cap
                                  where cap.worker_id=:workerId
                                    and cap.source_commit=:sourceSha
                                    and cap.build_checked=true
                                    and cap.last_heartbeat_at>now()-interval '120 seconds')))
                order by created_at
                for update skip locked
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .param("workerId",workerId.trim())
                .param("sourceSha",sourceSha==null?"":sourceSha.trim())
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("renderId", rs.getObject("id", UUID.class));
                    row.put("episodeId", rs.getObject("episode_id", UUID.class));
                    row.put("compositionId", rs.getString("composition_id"));
                    row.put("renderKey", rs.getString("render_key"));
                    row.put("engineVersion", rs.getString("engine_version"));
                    row.put("inputProps", readMap(rs.getString("input_props")));
                    row.put("profile", rs.getString("profile"));
                    row.put("width", rs.getInt("width"));
                    row.put("height", rs.getInt("height"));
                    row.put("fps", rs.getInt("fps"));
                    row.put("durationInFrames", rs.getInt("duration_in_frames"));
                    row.put("durationMs", Math.round(rs.getInt("duration_in_frames") * 1000d / rs.getInt("fps")));
                    return row;
                })
                .optional()
                .orElse(null);

        if (work == null) return ResponseEntity.noContent().build();

        UUID renderId = (UUID) work.get("renderId");
        jdbc.sql("""
                update remotion_render
                set status='RUNNING', progress=5, worker_id=:workerId,
                    claimed_at=now(), started_at=now(), error=null, updated_at=now()
                where id=:id and project_id=:projectId and status='QUEUED'
                """)
                .param("workerId", workerId.trim())
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .update();

        return ResponseEntity.ok(work);
    }

    @GetMapping("/{renderId}/ep002-selected-voice")
    public ResponseEntity<byte[]> selectedVoice(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-Worker-Key",required = false) String key,
            @RequestHeader(value = "X-Media-OS-Worker",required = false) String workerId
    ) {
        requireWorker(key,workerId);
        return jdbc.sql("""
                select t.audio,t.content_type
                from remotion_render r
                join ep002_creative_voice_take t
                  on t.id::text = r.input_props->>'voiceTakeId'
                  and t.shot_key='SHOT01'
                  and t.revision::text = r.input_props->>'scriptRevision'
                where r.id=:render and r.project_id=:project
                  and r.composition_id='EP002-SHOT01-DRAFT'
                  and r.status='RUNNING' and r.worker_id=:worker
                  and t.revision=(
                    select max(s.revision) from ep002_creative_script_revision s
                    where s.shot_key='SHOT01'
                  )
                  and exists (
                    select 1 from ep002_creative_voice_choice choice
                    where choice.shot_key='SHOT01' and choice.revision=t.revision
                      and choice.take_id=t.id
                      and choice.id=(
                        select newest.id from ep002_creative_voice_choice newest
                        where newest.shot_key='SHOT01' and newest.revision=t.revision
                        order by newest.selected_at desc,newest.id desc limit 1
                      )
                  )
                """)
                .param("render",renderId).param("project",PROJECT_ID)
                .param("worker",workerId.trim())
                .query((rs,n)->ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(rs.getString("content_type")))
                        .cacheControl(CacheControl.noStore())
                        .body(rs.getBytes("audio")))
                .optional().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.CONFLICT,"No valid selected voice for this worker-owned EP002 render."));
    }

    @PostMapping("/{renderId}/progress")
    public Map<String, Object> progress(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-Worker-Key", required = false) String key,
            @RequestHeader(value = "X-Media-OS-Worker", required = false) String workerId,
            @RequestBody ProgressRequest request
    ) {
        requireWorker(key, workerId);
        int progress = Math.max(5, Math.min(99, request.progress()));
        int updated = jdbc.sql("""
                update remotion_render
                set progress=:progress, updated_at=now()
                where id=:id and project_id=:projectId and status='RUNNING' and worker_id=:workerId
                """)
                .param("progress", progress)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .param("workerId", workerId.trim())
                .update();
        if (updated == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Render is not owned by this CPU worker.");
        return Map.of("renderId", renderId, "status", "RUNNING", "progress", progress);
    }

    @PutMapping(value = "/{renderId}/complete", consumes = "video/mp4")
    @Transactional
    public Map<String, Object> complete(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-Worker-Key", required = false) String key,
            @RequestHeader(value = "X-Media-OS-Worker", required = false) String workerId,
            @RequestBody byte[] video
    ) {
        requireWorker(key, workerId);
        if (video.length == 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rendered Remotion video is empty.");
        if (video.length > MAX_VIDEO_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Rendered Remotion video is larger than 256 MB.");
        }

        storage.requireUploadHeadroom(video.length);
        int updated = jdbc.sql("""
                update remotion_render
                set status='SUCCEEDED', progress=100, media_type='video/mp4', video_data=:video,
                    size_bytes=:sizeBytes, error=null, finished_at=now(), updated_at=now()
                where id=:id and project_id=:projectId and status='RUNNING' and worker_id=:workerId
                """)
                .param("video", video)
                .param("sizeBytes", video.length)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .param("workerId", workerId.trim())
                .update();
        if (updated == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Render is not owned by this CPU worker.");

        recordFactoryRenderOutput(renderId);
        linkVoiceWorkflowRender(renderId);
        return Map.of("renderId", renderId, "status", "READY", "sizeBytes", video.length);
    }

    @PostMapping("/{renderId}/fail")
    public Map<String, Object> fail(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-Worker-Key", required = false) String key,
            @RequestHeader(value = "X-Media-OS-Worker", required = false) String workerId,
            @RequestBody FailureRequest failure
    ) {
        requireWorker(key, workerId);
        String error = failure.error() == null || failure.error().isBlank() ? "Remotion CPU render failed." : failure.error().trim();
        if (error.length() > 1800) error = error.substring(0, 1800);

        int updated = jdbc.sql("""
                update remotion_render
                set status='FAILED', progress=0, error=:error, finished_at=now(), updated_at=now()
                where id=:id and project_id=:projectId and status='RUNNING' and worker_id=:workerId
                """)
                .param("error", error)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .param("workerId", workerId.trim())
                .update();
        if (updated != 1) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Failed render callback requires a RUNNING job owned by this worker.");
        return Map.of("renderId", renderId, "status", "FAILED", "error", error);
    }

    private void recordFactoryRenderOutput(UUID renderId) {
        String kind=jdbc.sql("""
                select composition_id from remotion_render
                 where id=:render and status='SUCCEEDED' and project_id=:project
                """).param("render",renderId).param("project",PROJECT_ID)
                .query(String.class).single();
        if("AT-FACTORY-SHOT".equals(kind)){
            int linked=jdbc.sql("""
                    update episode_factory_shot fs
                       set last_successful_render=:render,
                           last_render_input_sha256=fs.source_code_dependency_sha256,
                           director_approved=false
                      from episode_factory_production_run run,remotion_render video
                     where fs.run_id=run.id and fs.last_requested_render=:render
                       and video.id=:render and video.status='SUCCEEDED'
                       and video.input_props->>'expectedSourceCommit'=run.verified_pr_commit
                       and video.input_props->>'sourceDigest'=run.verified_source_digest
                       and video.input_props->>'shotInputSha'=fs.source_code_dependency_sha256
                       and not exists(select 1 from episode_factory_director_feedback f
                                       where f.run_id=run.id and f.state='OPEN_FOR_CODEX')
                       and exists(
                         select 1 from episode_package_shot shot
                          where shot.package_id=run.package_id
                            and shot.shot_key=fs.shot_key
                            and fs.narration_revision=(
                              select max(revision) from episode_package_shot_revision revision
                               where revision.shot_id=shot.id)
                            and fs.selected_take_id=(
                              select c.take_id from episode_package_voice_choice c
                               where c.shot_id=shot.id and c.revision=fs.narration_revision
                               order by c.selected_at desc,c.id desc limit 1))
                    """).param("render",renderId).update();
            if(linked!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Factory MP4 source/voice no longer matches the Director-approved production revision.");
        }
        if("AT-FACTORY-MASTER".equals(kind)||"AT-FACTORY-SHORT".equals(kind)){
            int linked=jdbc.sql("""
                    update episode_factory_output_plan plan
                       set review_state='RENDERED_PENDING_DIRECTOR'
                      from episode_factory_production_run run,remotion_render video
                     where plan.run_id=run.id and plan.render_id=:render
                       and video.id=:render and video.status='SUCCEEDED'
                       and video.input_props->>'expectedSourceCommit'=run.verified_pr_commit
                       and video.input_props->>'sourceDigest'=run.verified_source_digest
                       and not exists(select 1 from episode_factory_director_feedback f
                                       where f.run_id=run.id and f.state='OPEN_FOR_CODEX')
                       and not exists(select 1 from episode_factory_shot s
                                       where s.run_id=run.id and s.director_approved=false)
                    """).param("render",renderId).update();
            if(linked!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Factory master/Short has stale or incomplete Director-reviewed source renders.");
        }
    }

    private void requireWorker(String key, String workerId) {
        if (workerKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "MEDIA_OS_RENDER_WORKER_KEY is not configured.");
        }
        if (key == null || key.isBlank() || !constantTimeEquals(workerKey, key.trim())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Remotion CPU worker key.");
        }
        if (workerId == null || workerId.isBlank() || workerId.length() > 160) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing or invalid Remotion CPU worker id.");
        }
    }

    void linkVoiceWorkflowRender(UUID renderId) {
        jdbc.sql("""
                select episode_id, input_props::text as input_props
                from remotion_render
                where id=:id and project_id=:projectId and status='SUCCEEDED'
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query((rs, row) -> new RenderLinkSource(
                        rs.getObject("episode_id", UUID.class),
                        rs.getString("input_props")))
                .optional()
                .ifPresent(source -> {
                    if (source.episodeId() == null) return;
                    Map<String, Object> props = readMap(source.inputProps());
                    String shotKey = String.valueOf(props.getOrDefault("shotKey", "")).trim();
                    int scriptRevision = intValue(props.get("scriptRevision"), 0);
                    int generationRevision = intValue(props.get("generationRevision"), 0);
                    if (shotKey.isBlank() || scriptRevision <= 0) return;
                    if (Boolean.TRUE.equals(props.get("technicalRerender"))) return;

                    jdbc.sql("""
                            update voice_shot_workflow
                            set remotion_render_id=:renderId,
                                rendered_generation_revision=:generationRevision,
                                rendered_at=now(),
                                remotion_synced_at=coalesce(remotion_synced_at, now()),
                                updated_at=now()
                            where episode_id=:episodeId
                              and script_revision=:scriptRevision
                              and shot_key=:shotKey
                              and exists (
                                  select 1 from remotion_render r
                                  where r.id=:renderId
                                    and r.project_id=:projectId
                                    and r.episode_id=voice_shot_workflow.episode_id
                                    and r.status='SUCCEEDED'
                              )
                            """)
                            .param("renderId", renderId)
                            .param("projectId", PROJECT_ID)
                            .param("generationRevision", generationRevision)
                            .param("episodeId", source.episodeId())
                            .param("scriptRevision", scriptRevision)
                            .param("shotKey", shotKey)
                            .update();
                });
    }

    private record RenderLinkSource(UUID episodeId, String inputProps) {}

    private int intValue(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private Map<String, Object> readMap(String json) {
        try {
            if (json == null || json.isBlank()) return Map.of();
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Could not parse Remotion render input props.", ex);
        }
    }

    private boolean constantTimeEquals(String left, String right) {
        byte[] a = left.getBytes(StandardCharsets.UTF_8);
        byte[] b = right.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(a, b);
    }
}
