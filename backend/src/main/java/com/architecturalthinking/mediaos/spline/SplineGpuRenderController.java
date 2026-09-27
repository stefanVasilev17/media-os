package com.architecturalthinking.mediaos.spline;

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
@RequestMapping("/api/v1/spline/gpu-renders")
public class SplineGpuRenderController {

    private static final Logger log = LoggerFactory.getLogger(SplineGpuRenderController.class);
    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final int MAX_VIDEO_BYTES = 96 * 1024 * 1024;
    private static final String TOKEN_PREFIX = "GPU_TOKEN:";

    private final JdbcClient jdbc;

    public SplineGpuRenderController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record RenderFailure(String error) {}

    @GetMapping("/{renderId}/work")
    public Map<String, Object> work(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-GPU-Token", required = false) String token
    ) {
        requireToken(renderId, token);
        Map<String, Object> result = jdbc.sql("""
                select id, shot_id, shot_key, revision, status, width, height, fps, duration_ms
                from spline_shot_render
                where id=:id and project_id=:projectId
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("renderId", rs.getObject("id", UUID.class));
                    row.put("shotId", rs.getObject("shot_id", UUID.class));
                    row.put("shotKey", rs.getString("shot_key"));
                    row.put("revision", rs.getInt("revision"));
                    row.put("status", rs.getString("status"));
                    row.put("width", rs.getInt("width"));
                    row.put("height", rs.getInt("height"));
                    row.put("fps", rs.getInt("fps"));
                    row.put("durationMs", rs.getInt("duration_ms"));
                    row.put("renderPagePath", "/#/render/spline-shot/" + rs.getObject("shot_id", UUID.class));
                    return row;
                })
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GPU render job was not found."));
        log.info("GPU render work fetched renderId={} shotKey={} revision={} size={}x{} fps={} durationMs={}",
                renderId,
                result.get("shotKey"),
                result.get("revision"),
                result.get("width"),
                result.get("height"),
                result.get("fps"),
                result.get("durationMs"));
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
                update spline_shot_render
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
            throw new ResponseStatusException(HttpStatus.CONFLICT, "GPU render is not available to start.");
        }
        log.info("GPU render started renderId={}", renderId);
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rendered video is empty.");
        }
        if (video.length > MAX_VIDEO_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Rendered preview is larger than 96 MB.");
        }

        int updated = jdbc.sql("""
                update spline_shot_render
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
            throw new ResponseStatusException(HttpStatus.CONFLICT, "GPU render is not in RUNNING state.");
        }
        log.info("GPU render completed renderId={} sizeBytes={}", renderId, video.length);
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
                ? "GPU render failed."
                : failure.error().trim();
        if (error.length() > 1800) error = error.substring(0, 1800);

        jdbc.sql("""
                update spline_shot_render
                set status='FAILED', progress=0, error=:error,
                    finished_at=now(), updated_at=now()
                where id=:id and project_id=:projectId
                """)
                .param("error", error)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .update();
        log.error("GPU render failed renderId={} error={}", renderId, error);
        return Map.of("renderId", renderId, "status", "FAILED", "error", error);
    }

    private void requireToken(UUID renderId, String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing GPU render callback token.");
        }
        String expected = jdbc.sql("""
                select coalesce(worker_id, '')
                from spline_shot_render
                where id=:id and project_id=:projectId
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query(String.class)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GPU render job was not found."));

        String actual = TOKEN_PREFIX + token.trim();
        if (!constantTimeEquals(expected, actual)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid GPU render callback token.");
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
}
