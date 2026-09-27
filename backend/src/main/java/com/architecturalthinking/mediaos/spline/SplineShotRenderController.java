package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/spline/renders")
public class SplineShotRenderController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String SHOT_TASK_TYPE = "CREATE_RUNTIME_SHOT_V1";
    private static final String TOKEN_PREFIX = "GPU_TOKEN:";
    private static final int WIDTH = 1920;
    private static final int HEIGHT = 1080;
    private static final int FPS = 60;

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final RunpodGpuRenderDispatcher gpuDispatcher;
    private final String runtimeUrl;

    public SplineShotRenderController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            RunpodGpuRenderDispatcher gpuDispatcher,
            @Value("${MEDIA_OS_SPLINE_RUNTIME_URL:}") String runtimeUrl
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.gpuDispatcher = gpuDispatcher;
        this.runtimeUrl = runtimeUrl == null ? "" : runtimeUrl.trim();
    }

    @PostMapping("/shots/{shotId}")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, Object> ensureRender(@PathVariable UUID shotId) {
        ShotSource source = loadShotSource(shotId);
        String renderHash = renderHash(source.spec());

        Optional<RenderRow> existing = findByShotAndHash(shotId, renderHash);
        if (existing.isPresent()) {
            RenderRow row = existing.get();
            if (!"FAILED".equals(row.status())) {
                return response(row);
            }
            requireGpuConfigured();
            String callbackToken = newCallbackToken();
            jdbc.sql("""
                    update spline_shot_render
                    set status='QUEUED', progress=0, worker_id=:workerId, error=null,
                        claimed_at=null, started_at=null, finished_at=null, updated_at=now()
                    where id=:id
                    """)
                    .param("workerId", TOKEN_PREFIX + callbackToken)
                    .param("id", row.id())
                    .update();
            dispatchOrFail(row.id(), callbackToken);
            return response(findById(row.id()).orElseThrow());
        }

        requireGpuConfigured();
        UUID renderId = UUID.randomUUID();
        String callbackToken = newCallbackToken();
        jdbc.sql("""
                insert into spline_shot_render(
                    id, project_id, shot_id, shot_key, revision, render_hash, status,
                    width, height, fps, duration_ms, progress, worker_id
                )
                values (
                    :id, :projectId, :shotId, :shotKey, :revision, :renderHash, 'QUEUED',
                    :width, :height, :fps, :durationMs, 0, :workerId
                )
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .param("shotId", shotId)
                .param("shotKey", source.shotKey())
                .param("revision", source.revision())
                .param("renderHash", renderHash)
                .param("width", WIDTH)
                .param("height", HEIGHT)
                .param("fps", FPS)
                .param("durationMs", source.durationMs())
                .param("workerId", TOKEN_PREFIX + callbackToken)
                .update();

        dispatchOrFail(renderId, callbackToken);
        return response(findById(renderId).orElseThrow());
    }

    @GetMapping("/shots/{shotId}/latest")
    public Map<String, Object> latestForShot(@PathVariable UUID shotId) {
        ShotSource source = loadShotSource(shotId);
        String renderHash = renderHash(source.spec());
        return jdbc.sql("""
                select id, shot_id, shot_key, revision, status, width, height, fps, duration_ms,
                       progress, size_bytes, error, created_at, finished_at
                from spline_shot_render
                where project_id=:projectId and shot_id=:shotId and render_hash=:renderHash
                order by created_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .param("shotId", shotId)
                .param("renderHash", renderHash)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(() -> Map.of("status", "EMPTY", "shotId", shotId));
    }

    @GetMapping("/gpu-status")
    public Map<String, Object> gpuStatus() {
        return Map.of(
                "configured", gpuDispatcher.isConfigured(),
                "engine", "RUNPOD_SERVERLESS_GPU",
                "width", WIDTH,
                "height", HEIGHT,
                "fps", FPS
        );
    }

    @GetMapping("/{renderId}/video")
    public ResponseEntity<byte[]> video(
            @PathVariable UUID renderId,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String range
    ) {
        VideoArtifact artifact = jdbc.sql("""
                select video_data, coalesce(media_type, 'video/mp4') as media_type
                from spline_shot_render
                where id=:id and project_id=:projectId and status='SUCCEEDED'
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> new VideoArtifact(rs.getBytes("video_data"), rs.getString("media_type")))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rendered preview is not available."));

        byte[] bytes = artifact.bytes();
        if (bytes == null || bytes.length == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rendered preview is empty.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(artifact.mediaType()));
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        headers.setCacheControl("private, max-age=31536000, immutable");

        if (range == null || !range.startsWith("bytes=")) {
            headers.setContentLength(bytes.length);
            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
        }

        long[] parsed = parseRange(range, bytes.length);
        int start = (int) parsed[0];
        int end = (int) parsed[1];
        byte[] slice = java.util.Arrays.copyOfRange(bytes, start, end + 1);
        headers.setContentLength(slice.length);
        headers.set(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + bytes.length);
        return new ResponseEntity<>(slice, headers, HttpStatus.PARTIAL_CONTENT);
    }

    private void requireGpuConfigured() {
        if (!gpuDispatcher.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Cloud GPU rendering is not configured yet."
            );
        }
    }

    private String newCallbackToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }

    private void dispatchOrFail(UUID renderId, String callbackToken) {
        try {
            gpuDispatcher.dispatch(renderId, callbackToken);
        } catch (RuntimeException ex) {
            String message = ex.getMessage() == null || ex.getMessage().isBlank()
                    ? "Could not dispatch the GPU render job."
                    : ex.getMessage();
            if (message.length() > 1800) message = message.substring(0, 1800);
            jdbc.sql("""
                    update spline_shot_render
                    set status='FAILED', progress=0, error=:error, finished_at=now(), updated_at=now()
                    where id=:id
                    """)
                    .param("error", message)
                    .param("id", renderId)
                    .update();
            throw ex;
        }
    }

    private long[] parseRange(String range, int length) {
        try {
            String value = range.substring("bytes=".length()).split(",", 2)[0].trim();
            String[] parts = value.split("-", 2);
            long start = parts[0].isBlank() ? 0 : Long.parseLong(parts[0]);
            long end = parts.length < 2 || parts[1].isBlank() ? length - 1L : Long.parseLong(parts[1]);
            start = Math.max(0, Math.min(start, length - 1L));
            end = Math.max(start, Math.min(end, length - 1L));
            return new long[]{start, end};
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE, "Invalid video range.");
        }
    }

    private ShotSource loadShotSource(UUID shotId) {
        return jdbc.sql("""
                select status, payload::text as payload, coalesce(result, '{}'::jsonb)::text as result
                from production_job
                where id=:id and project_id=:projectId and task_type=:taskType
                """)
                .param("id", shotId)
                .param("projectId", PROJECT_ID)
                .param("taskType", SHOT_TASK_TYPE)
                .query((rs, rowNum) -> {
                    if (!"SUCCEEDED".equals(rs.getString("status"))) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "ShotSpec is not ready to render.");
                    }
                    Map<String, Object> payload = readMap(rs.getString("payload"));
                    Map<String, Object> result = readMap(rs.getString("result"));
                    Map<String, Object> spec = parseSpec(result);
                    return new ShotSource(
                            String.valueOf(payload.getOrDefault("shotKey", "SHOT_01")),
                            number(payload.get("revision"), 1),
                            number(spec.get("durationMs"), 8000),
                            spec
                    );
                })
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shot was not found."));
    }

    private Map<String, Object> parseSpec(Map<String, Object> result) {
        String output = String.valueOf(result.getOrDefault("output", "")).trim();
        int start = output.indexOf('{');
        int end = output.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "ShotSpec is missing from the shot result.");
        }
        return readMap(output.substring(start, end + 1));
    }

    private String renderHash(Map<String, Object> spec) {
        try {
            String material = runtimeUrl + "\n"
                    + objectMapper.writeValueAsString(spec) + "\n"
                    + WIDTH + "x" + HEIGHT + "@" + FPS
                    + "-runpod-gpu-safe-group-centering-v6";
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(material.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not hash the shot render input.", ex);
        }
    }

    private Optional<RenderRow> findByShotAndHash(UUID shotId, String renderHash) {
        return jdbc.sql("""
                select id, shot_id, shot_key, revision, status, width, height, fps, duration_ms,
                       progress, size_bytes, error, created_at, finished_at
                from spline_shot_render
                where shot_id=:shotId and render_hash=:renderHash
                """)
                .param("shotId", shotId)
                .param("renderHash", renderHash)
                .query(this::mapRenderRow)
                .optional();
    }

    private Optional<RenderRow> findById(UUID renderId) {
        return jdbc.sql("""
                select id, shot_id, shot_key, revision, status, width, height, fps, duration_ms,
                       progress, size_bytes, error, created_at, finished_at
                from spline_shot_render
                where id=:id
                """)
                .param("id", renderId)
                .query(this::mapRenderRow)
                .optional();
    }

    private RenderRow mapRenderRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new RenderRow(
                rs.getObject("id", UUID.class),
                rs.getObject("shot_id", UUID.class),
                rs.getString("shot_key"),
                rs.getInt("revision"),
                rs.getString("status"),
                rs.getInt("width"),
                rs.getInt("height"),
                rs.getInt("fps"),
                rs.getInt("duration_ms"),
                rs.getInt("progress"),
                (Long) rs.getObject("size_bytes"),
                rs.getString("error"),
                rs.getObject("created_at", OffsetDateTime.class),
                rs.getObject("finished_at", OffsetDateTime.class)
        );
    }

    private Map<String, Object> response(RenderRow row) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("renderId", row.id());
        result.put("shotId", row.shotId());
        result.put("shotKey", row.shotKey());
        result.put("revision", row.revision());
        result.put("status", publicStatus(row.status()));
        result.put("width", row.width());
        result.put("height", row.height());
        result.put("fps", row.fps());
        result.put("durationMs", row.durationMs());
        result.put("progress", row.progress());
        result.put("sizeBytes", row.sizeBytes());
        result.put("error", row.error());
        result.put("createdAt", row.createdAt());
        result.put("finishedAt", row.finishedAt());
        if ("SUCCEEDED".equals(row.status())) {
            result.put("videoUrl", "/api/v1/spline/renders/" + row.id() + "/video");
        }
        return result;
    }

    private String publicStatus(String status) {
        return switch (status) {
            case "SUCCEEDED" -> "READY";
            case "RUNNING" -> "RENDERING";
            default -> status;
        };
    }

    private Map<String, Object> readMap(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Could not parse render source JSON.", ex);
        }
    }

    private int number(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private record ShotSource(String shotKey, int revision, int durationMs, Map<String, Object> spec) {}
    private record VideoArtifact(byte[] bytes, String mediaType) {}
    private record RenderRow(
            UUID id,
            UUID shotId,
            String shotKey,
            int revision,
            String status,
            int width,
            int height,
            int fps,
            int durationMs,
            int progress,
            Long sizeBytes,
            String error,
            OffsetDateTime createdAt,
            OffsetDateTime finishedAt
    ) {}
}
