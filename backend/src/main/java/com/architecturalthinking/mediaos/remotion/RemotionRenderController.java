package com.architecturalthinking.mediaos.remotion;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Arrays;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/remotion/renders")
public class RemotionRenderController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID EP001_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final String ENGINE_VERSION = "AT_REMOTION_V0_1";
    private static final String TOKEN_PREFIX = "REMOTION_GPU_TOKEN:";

    private static final Map<String, CompositionProfile> COMPOSITIONS = Map.of(
            "EP001-VerticalSlice",
            new CompositionProfile(
                    "EP001_VERTICAL_SLICE",
                    EP001_ID,
                    1920,
                    1080,
                    30,
                    1920
            )
    );

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final RemotionRunpodRenderDispatcher dispatcher;

    public RemotionRenderController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            RemotionRunpodRenderDispatcher dispatcher
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.dispatcher = dispatcher;
    }

    public record RenderRequest(String profile, Map<String, Object> inputProps) {}

    @PostMapping("/compositions/{compositionId}")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, Object> ensureRender(
            @PathVariable String compositionId,
            @RequestBody(required = false) RenderRequest request
    ) {
        CompositionProfile composition = requireComposition(compositionId);
        String profileName = request == null || request.profile() == null || request.profile().isBlank()
                ? "FAST_PREVIEW"
                : request.profile().trim().toUpperCase();
        OutputProfile output = requireOutputProfile(profileName, composition);
        Map<String, Object> inputProps = request == null || request.inputProps() == null
                ? Map.of()
                : new LinkedHashMap<>(request.inputProps());
        String renderHash = renderHash(compositionId, profileName, output, inputProps);

        Optional<RenderRow> existing = findByHash(renderHash);
        if (existing.isPresent()) {
            RenderRow row = existing.get();
            if (!"FAILED".equals(row.status())) {
                return response(row);
            }
            requireProviderConfigured();
            String callbackToken = newCallbackToken();
            jdbc.sql("""
                    update remotion_render
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

        requireProviderConfigured();
        UUID renderId = UUID.randomUUID();
        String callbackToken = newCallbackToken();
        String inputPropsJson = writeJson(inputProps);

        jdbc.sql("""
                insert into remotion_render(
                    id, project_id, episode_id, composition_id, render_key, engine_version,
                    input_props, render_hash, profile, status, width, height, fps,
                    duration_in_frames, progress, worker_id
                )
                values (
                    :id, :projectId, :episodeId, :compositionId, :renderKey, :engineVersion,
                    cast(:inputProps as jsonb), :renderHash, :profile, 'QUEUED', :width, :height, :fps,
                    :durationInFrames, 0, :workerId
                )
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .param("episodeId", composition.episodeId())
                .param("compositionId", compositionId)
                .param("renderKey", composition.renderKey())
                .param("engineVersion", ENGINE_VERSION)
                .param("inputProps", inputPropsJson)
                .param("renderHash", renderHash)
                .param("profile", profileName)
                .param("width", output.width())
                .param("height", output.height())
                .param("fps", composition.fps())
                .param("durationInFrames", composition.durationInFrames())
                .param("workerId", TOKEN_PREFIX + callbackToken)
                .update();

        dispatchOrFail(renderId, callbackToken);
        return response(findById(renderId).orElseThrow());
    }

    @GetMapping("/{renderId}")
    public Map<String, Object> render(@PathVariable UUID renderId) {
        return findById(renderId)
                .map(this::response)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Remotion render was not found."));
    }

    @GetMapping("/compositions/{compositionId}/latest")
    public Map<String, Object> latest(
            @PathVariable String compositionId,
            @RequestParam(defaultValue = "FAST_PREVIEW") String profile
    ) {
        CompositionProfile composition = requireComposition(compositionId);
        String profileName = profile.trim().toUpperCase();
        requireOutputProfile(profileName, composition);
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId and composition_id=:compositionId and profile=:profile
                order by created_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .param("compositionId", compositionId)
                .param("profile", profileName)
                .query(this::mapRenderRow)
                .optional()
                .map(this::response)
                .orElseGet(() -> Map.of(
                        "status", "EMPTY",
                        "compositionId", compositionId,
                        "profile", profileName
                ));
    }

    @GetMapping("/provider-status")
    public Map<String, Object> providerStatus() {
        return Map.of(
                "configured", dispatcher.isConfigured(),
                "engine", "REMOTION_RUNPOD_V0_1",
                "engineVersion", ENGINE_VERSION,
                "compositions", COMPOSITIONS.keySet(),
                "profiles", Arrays.asList("FAST_PREVIEW", "REVIEW")
        );
    }

    @GetMapping("/{renderId}/video")
    public ResponseEntity<byte[]> video(
            @PathVariable UUID renderId,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String range
    ) {
        VideoArtifact artifact = jdbc.sql("""
                select video_data, coalesce(media_type, 'video/mp4') as media_type
                from remotion_render
                where id=:id and project_id=:projectId and status='SUCCEEDED'
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> new VideoArtifact(rs.getBytes("video_data"), rs.getString("media_type")))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rendered Remotion preview is not available."));

        byte[] bytes = artifact.bytes();
        if (bytes == null || bytes.length == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rendered Remotion preview is empty.");
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
        byte[] slice = Arrays.copyOfRange(bytes, start, end + 1);
        headers.setContentLength(slice.length);
        headers.set(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + bytes.length);
        return new ResponseEntity<>(slice, headers, HttpStatus.PARTIAL_CONTENT);
    }

    private CompositionProfile requireComposition(String compositionId) {
        CompositionProfile composition = COMPOSITIONS.get(compositionId);
        if (composition == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Remotion composition is not registered for production rendering.");
        }
        return composition;
    }

    private OutputProfile requireOutputProfile(String profile, CompositionProfile composition) {
        return switch (profile) {
            case "FAST_PREVIEW" -> new OutputProfile(1280, 720);
            case "REVIEW" -> new OutputProfile(composition.width(), composition.height());
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Remotion Engine v0.1 supports FAST_PREVIEW and REVIEW profiles only."
            );
        };
    }

    private void requireProviderConfigured() {
        if (!dispatcher.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Remotion cloud rendering is not configured yet."
            );
        }
    }

    private String newCallbackToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }

    private void dispatchOrFail(UUID renderId, String callbackToken) {
        try {
            dispatcher.dispatch(renderId, callbackToken);
        } catch (RuntimeException ex) {
            String message = ex.getMessage() == null || ex.getMessage().isBlank()
                    ? "Could not dispatch the Remotion render job."
                    : ex.getMessage();
            if (message.length() > 1800) message = message.substring(0, 1800);
            jdbc.sql("""
                    update remotion_render
                    set status='FAILED', progress=0, error=:error, finished_at=now(), updated_at=now()
                    where id=:id
                    """)
                    .param("error", message)
                    .param("id", renderId)
                    .update();
            throw ex;
        }
    }

    private String renderHash(
            String compositionId,
            String profile,
            OutputProfile output,
            Map<String, Object> inputProps
    ) {
        try {
            String material = ENGINE_VERSION + "\n"
                    + compositionId + "\n"
                    + profile + "\n"
                    + output.width() + "x" + output.height() + "\n"
                    + objectMapper.writeValueAsString(new TreeMap<>(inputProps));
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(material.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not hash the Remotion render input.", ex);
        }
    }

    private Optional<RenderRow> findByHash(String renderHash) {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where project_id=:projectId and render_hash=:renderHash
                """)
                .param("projectId", PROJECT_ID)
                .param("renderHash", renderHash)
                .query(this::mapRenderRow)
                .optional();
    }

    private Optional<RenderRow> findById(UUID renderId) {
        return jdbc.sql("""
                select id, composition_id, render_key, engine_version, profile, status,
                       width, height, fps, duration_in_frames, progress, size_bytes, error,
                       created_at, finished_at
                from remotion_render
                where id=:id and project_id=:projectId
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query(this::mapRenderRow)
                .optional();
    }

    private RenderRow mapRenderRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new RenderRow(
                rs.getObject("id", UUID.class),
                rs.getString("composition_id"),
                rs.getString("render_key"),
                rs.getString("engine_version"),
                rs.getString("profile"),
                rs.getString("status"),
                rs.getInt("width"),
                rs.getInt("height"),
                rs.getInt("fps"),
                rs.getInt("duration_in_frames"),
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
        result.put("compositionId", row.compositionId());
        result.put("renderKey", row.renderKey());
        result.put("engineVersion", row.engineVersion());
        result.put("profile", row.profile());
        result.put("status", publicStatus(row.status()));
        result.put("width", row.width());
        result.put("height", row.height());
        result.put("fps", row.fps());
        result.put("durationInFrames", row.durationInFrames());
        result.put("durationMs", Math.round(row.durationInFrames() * 1000d / row.fps()));
        result.put("progress", row.progress());
        result.put("sizeBytes", row.sizeBytes());
        result.put("error", row.error());
        result.put("createdAt", row.createdAt());
        result.put("finishedAt", row.finishedAt());
        if ("SUCCEEDED".equals(row.status())) {
            result.put("videoUrl", "/api/v1/remotion/renders/" + row.id() + "/video");
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

    private String writeJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize Remotion render input props.", ex);
        }
    }

    private record CompositionProfile(
            String renderKey,
            UUID episodeId,
            int width,
            int height,
            int fps,
            int durationInFrames
    ) {}

    private record OutputProfile(int width, int height) {}
    private record VideoArtifact(byte[] bytes, String mediaType) {}

    private record RenderRow(
            UUID id,
            String compositionId,
            String renderKey,
            String engineVersion,
            String profile,
            String status,
            int width,
            int height,
            int fps,
            int durationInFrames,
            int progress,
            Long sizeBytes,
            String error,
            OffsetDateTime createdAt,
            OffsetDateTime finishedAt
    ) {}
}
