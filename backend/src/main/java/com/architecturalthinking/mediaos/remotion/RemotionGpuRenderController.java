package com.architecturalthinking.mediaos.remotion;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/remotion/gpu-renders")
public class RemotionGpuRenderController {

    private static final Logger log = LoggerFactory.getLogger(RemotionGpuRenderController.class);
    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final int MAX_VIDEO_BYTES = 128 * 1024 * 1024;
    private static final String TOKEN_PREFIX = "REMOTION_GPU_TOKEN:";

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    public RemotionGpuRenderController(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public record RenderFailure(String error) {}

    @GetMapping("/{renderId}/work")
    public Map<String, Object> work(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-GPU-Token", required = false) String token
    ) {
        requireToken(renderId, token);
        Map<String, Object> result = jdbc.sql("""
                select id, composition_id, render_key, engine_version, input_props::text as input_props,
                       profile, status, width, height, fps, duration_in_frames
                from remotion_render
                where id=:id and project_id=:projectId
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("renderId", rs.getObject("id", UUID.class));
                    row.put("compositionId", rs.getString("composition_id"));
                    row.put("renderKey", rs.getString("render_key"));
                    row.put("engineVersion", rs.getString("engine_version"));
                    row.put("inputProps", readMap(rs.getString("input_props")));
                    row.put("profile", rs.getString("profile"));
                    row.put("status", rs.getString("status"));
                    row.put("width", rs.getInt("width"));
                    row.put("height", rs.getInt("height"));
                    row.put("fps", rs.getInt("fps"));
                    row.put("durationInFrames", rs.getInt("duration_in_frames"));
                    row.put("durationMs", Math.round(rs.getInt("duration_in_frames") * 1000d / rs.getInt("fps")));
                    return row;
                })
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Remotion render job was not found."));

        log.info(
                "Remotion render work fetched renderId={} composition={} profile={} size={}x{} fps={} frames={}",
                renderId,
                result.get("compositionId"),
                result.get("profile"),
                result.get("width"),
                result.get("height"),
                result.get("fps"),
                result.get("durationInFrames")
        );
        return result;
    }

    @PostMapping("/{renderId}/start")
    @Transactional
    public Map<String, Object> start(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-GPU-Token", required = false) String token
    ) {
        requireToken(renderId, token);
        int updated = jdbc.sql("""
                update remotion_render
                set status='RUNNING', progress=5,
                    claimed_at=coalesce(claimed_at, now()),
                    started_at=coalesce(started_at, now()),
                    error=null, updated_at=now()
                where id=:id and project_id=:projectId and status in ('QUEUED', 'RUNNING')
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .update();
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Remotion render is not available to start.");
        }
        log.info("Remotion render started renderId={}", renderId);
        return Map.of("renderId", renderId, "status", "RUNNING");
    }

    @PutMapping(value = "/{renderId}/complete", consumes = "video/mp4")
    @Transactional
    public Map<String, Object> complete(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-GPU-Token", required = false) String token,
            @RequestBody byte[] video
    ) {
        requireToken(renderId, token);
        if (video.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rendered Remotion preview is empty.");
        }
        if (video.length > MAX_VIDEO_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "Rendered Remotion preview is larger than 128 MB. Use object storage for larger artifacts."
            );
        }

        int updated = jdbc.sql("""
                update remotion_render
                set status='SUCCEEDED', progress=100, media_type='video/mp4', video_data=:video,
                    size_bytes=:sizeBytes, error=null, finished_at=now(), updated_at=now()
                where id=:id and project_id=:projectId and status='RUNNING'
                """)
                .param("video", video)
                .param("sizeBytes", video.length)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .update();
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Remotion render is not in RUNNING state.");
        }
        linkVoiceWorkflowRender(renderId);
        log.info("Remotion render completed renderId={} sizeBytes={}", renderId, video.length);
        return Map.of("renderId", renderId, "status", "READY", "sizeBytes", video.length);
    }

    @PostMapping("/{renderId}/fail")
    @Transactional
    public Map<String, Object> fail(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-GPU-Token", required = false) String token,
            @RequestBody RenderFailure failure
    ) {
        requireToken(renderId, token);
        String error = failure.error() == null || failure.error().isBlank()
                ? "Remotion render failed."
                : failure.error().trim();
        if (error.length() > 1800) error = error.substring(0, 1800);

        jdbc.sql("""
                update remotion_render
                set status='FAILED', progress=0, error=:error,
                    finished_at=now(), updated_at=now()
                where id=:id and project_id=:projectId
                """)
                .param("error", error)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .update();
        log.error("Remotion render failed renderId={} error={}", renderId, error);
        return Map.of("renderId", renderId, "status", "FAILED", "error", error);
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
                            .param("episodeId", UUID.fromString("22222222-2222-2222-2222-222222222222"))
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

    private void requireToken(UUID renderId, String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Remotion GPU render callback token.");
        }
        String expected = jdbc.sql("""
                select coalesce(worker_id, '')
                from remotion_render
                where id=:id and project_id=:projectId
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query(String.class)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Remotion render job was not found."));

        String actual = TOKEN_PREFIX + token.trim();
        if (!constantTimeEquals(expected, actual)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Remotion GPU render callback token.");
        }
    }

    private boolean constantTimeEquals(String left, String right) {
        if (left.length() != right.length()) return false;
        int result = 0;
        for (int index = 0; index < left.length(); index++) {
            result |= left.charAt(index) ^ right.charAt(index);
        }
        return result == 0;
    }

    private Map<String, Object> readMap(String json) {
        try {
            if (json == null || json.isBlank()) return Map.of();
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Could not parse Remotion render input props.", ex);
        }
    }
}
