package com.architecturalthinking.mediaos.spline;

import org.springframework.beans.factory.annotation.Value;
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

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final int MAX_VIDEO_BYTES = 96 * 1024 * 1024;

    private final JdbcClient jdbc;
    private final String workerToken;

    public SplineGpuRenderController(
            JdbcClient jdbc,
            @Value("${MEDIA_OS_GPU_WORKER_TOKEN:}") String workerToken
    ) {
        this.jdbc = jdbc;
        this.workerToken = workerToken == null ? "" : workerToken.trim();
    }

    public record RenderFailure(String error) {}

    @GetMapping("/{renderId}/work")
    public Map<String, Object> work(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-GPU-Token", required = false) String token
    ) {
        requireToken(token);
        return jdbc.sql("""
                select id, shot_id, shot_key, revision, status, width, height, fps, duration_ms
                from spline_shot_render
                where id=:id and project_id=:projectId
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("renderId", rs.getObject("id", UUID.class));
                    result.put("shotId", rs.getObject("shot_id", UUID.class));
                    result.put("shotKey", rs.getString("shot_key"));
                    result.put("revision", rs.getInt("revision"));
                    result.put("status", rs.getString("status"));
                    result.put("width", rs.getInt("width"));
                    result.put("height", rs.getInt("height"));
                    result.put("fps", rs.getInt("fps"));
                    result.put("durationMs", rs.getInt("duration_ms"));
                    result.put("renderPagePath", "/#/render/spline-shot/" + rs.getObject("shot_id", UUID.class));
                    return result;
                })
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GPU render job was not found."));
    }

    @PostMapping("/{renderId}/start")
    @Transactional
    public Map<String, Object> start(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-GPU-Token", required = false) String token,
            @RequestHeader(value = "X-Media-OS-GPU-Worker", defaultValue = "RUNPOD_GPU") String workerId
    ) {
        requireToken(token);
        int updated = jdbc.sql("""
                update spline_shot_render
                set status='RUNNING', progress=5, worker_id=:workerId,
                    claimed_at=coalesce(claimed_at, now()),
                    started_at=coalesce(started_at, now()),
                    error=null, updated_at=now()
                where id=:id and project_id=:projectId and status in ('QUEUED', 'RUNNING')
                """)
                .param("workerId", workerId)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .update();
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "GPU render is not available to start.");
        }
        return Map.of("renderId", renderId, "status", "RUNNING");
    }

    @PutMapping(value = "/{renderId}/complete", consumes = "video/mp4")
    @Transactional
    public Map<String, Object> complete(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-GPU-Token", required = false) String token,
            @RequestHeader(value = "X-Media-OS-GPU-Worker", defaultValue = "RUNPOD_GPU") String workerId,
            @RequestBody byte[] video
    ) {
        requireToken(token);
        if (video.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rendered video is empty.");
        }
        if (video.length > MAX_VIDEO_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Rendered preview is larger than 96 MB.");
        }

        int updated = jdbc.sql("""
                update spline_shot_render
                set status='SUCCEEDED', progress=100, media_type='video/mp4', video_data=:video,
                    size_bytes=:sizeBytes, worker_id=:workerId, error=null,
                    finished_at=now(), updated_at=now()
                where id=:id and project_id=:projectId and status='RUNNING'
                """)
                .param("video", video)
                .param("sizeBytes", video.length)
                .param("workerId", workerId)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .update();
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "GPU render is not in RUNNING state.");
        }
        return Map.of("renderId", renderId, "status", "READY", "sizeBytes", video.length);
    }

    @PostMapping("/{renderId}/fail")
    @Transactional
    public Map<String, Object> fail(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-GPU-Token", required = false) String token,
            @RequestHeader(value = "X-Media-OS-GPU-Worker", defaultValue = "RUNPOD_GPU") String workerId,
            @RequestBody RenderFailure failure
    ) {
        requireToken(token);
        String error = failure.error() == null || failure.error().isBlank()
                ? "GPU render failed."
                : failure.error().trim();
        if (error.length() > 1800) error = error.substring(0, 1800);

        jdbc.sql("""
                update spline_shot_render
                set status='FAILED', progress=0, worker_id=:workerId, error=:error,
                    finished_at=now(), updated_at=now()
                where id=:id and project_id=:projectId
                """)
                .param("workerId", workerId)
                .param("error", error)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .update();
        return Map.of("renderId", renderId, "status", "FAILED", "error", error);
    }

    private void requireToken(String token) {
        if (workerToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "GPU worker authentication is not configured.");
        }
        if (token == null || !constantTimeEquals(workerToken, token.trim())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid GPU worker token.");
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
