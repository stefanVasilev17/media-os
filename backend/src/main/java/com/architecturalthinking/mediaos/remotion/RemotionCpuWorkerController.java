package com.architecturalthinking.mediaos.remotion;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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
    private static final UUID EP001_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final int MAX_VIDEO_BYTES = 256 * 1024 * 1024;

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final String workerKey;

    public RemotionCpuWorkerController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            @Value("${MEDIA_OS_RENDER_WORKER_KEY:}") String workerKey
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.workerKey = workerKey == null ? "" : workerKey.trim();
    }

    public record ProgressRequest(int progress) {}
    public record FailureRequest(String error) {}

    @PostMapping("/claim")
    @Transactional
    public ResponseEntity<Map<String, Object>> claim(
            @RequestHeader(value = "X-Media-OS-Worker-Key", required = false) String key,
            @RequestHeader(value = "X-Media-OS-Worker", required = false) String workerId
    ) {
        requireWorker(key, workerId);

        Map<String, Object> work = jdbc.sql("""
                select id, composition_id, render_key, engine_version, input_props::text as input_props,
                       profile, width, height, fps, duration_in_frames
                from remotion_render
                where project_id=:projectId and status='QUEUED'
                order by created_at
                for update skip locked
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("renderId", rs.getObject("id", UUID.class));
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

        jdbc.sql("""
                update remotion_render
                set status='FAILED', progress=0, error=:error, finished_at=now(), updated_at=now()
                where id=:id and project_id=:projectId and worker_id=:workerId
                """)
                .param("error", error)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .param("workerId", workerId.trim())
                .update();
        return Map.of("renderId", renderId, "status", "FAILED", "error", error);
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

    private void linkVoiceWorkflowRender(UUID renderId) {
        jdbc.sql("""
                select input_props::text
                from remotion_render
                where id=:id and project_id=:projectId
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query(String.class)
                .optional()
                .ifPresent(json -> {
                    Map<String, Object> props = readMap(json);
                    String shotKey = String.valueOf(props.getOrDefault("shotKey", "")).trim();
                    int scriptRevision = intValue(props.get("scriptRevision"), 0);
                    int generationRevision = intValue(props.get("generationRevision"), 0);
                    if (shotKey.isBlank() || scriptRevision <= 0) return;

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
                            """)
                            .param("renderId", renderId)
                            .param("generationRevision", generationRevision)
                            .param("episodeId", EP001_ID)
                            .param("scriptRevision", scriptRevision)
                            .param("shotKey", shotKey)
                            .update();
                });
    }

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
