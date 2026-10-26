package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.workflow.ProductionMemoryService;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/remotion/renders")
public class RemotionRenderController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID EP001_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final String ENGINE_VERSION_PREFIX = "AT_REMOTION_";

    private static final Map<String, CompositionProfile> COMPOSITIONS = Map.ofEntries(
            Map.entry("EP001-VerticalSlice",
                new CompositionProfile("EP001_VERTICAL_SLICE", EP001_ID, 1920, 1080, 30, 1920, false)),
            Map.entry("EP001-Shot01-VoiceSynced",
                new CompositionProfile("EP001_SHOT01_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 930, true)),
            Map.entry("EP001-Shot02-VoiceSynced",
                new CompositionProfile("EP001_SHOT02_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 2220, true)),
            Map.entry("EP001-Shot03-VoiceSynced",
                new CompositionProfile("EP001_SHOT03_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 1590, true)),
            Map.entry("EP001-Shot04-VoiceSynced",
                new CompositionProfile("EP001_SHOT04_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 2010, true)),
            Map.entry("EP001-Shot05-VoiceSynced",
                new CompositionProfile("EP001_SHOT05_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 3900, true)),
            Map.entry("EP001-LoadBalancer-Youtube",
                new CompositionProfile("EP001_LOAD_BALANCER_YOUTUBE", EP001_ID, 1920, 1080, 30, 5220, true)),
            Map.entry("EP001-Shot06-VoiceSynced",
                new CompositionProfile("EP001_SHOT06_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 5220, true)),
            Map.entry("EP001-Shot07-VoiceSynced",
                new CompositionProfile("EP001_SHOT07_VOICE_SYNCED", EP001_ID, 1920, 1080, 30, 6000, true)),
            Map.entry("EP001-Shot08-VisualDraft",
                new CompositionProfile("EP001_SHOT08_VISUAL_DRAFT", EP001_ID, 1920, 1080, 30, 2850, true)),
            Map.entry("EP001-Shot08-VisualDraft-V2",
                new CompositionProfile("EP001_SHOT08_VISUAL_DRAFT_V2", EP001_ID, 1920, 1080, 30, 2850, true)),
            Map.entry("EP001-Shot08-PremiumSlice-V3",
                new CompositionProfile("EP001_SHOT08_PREMIUM_SLICE_V3", EP001_ID, 1920, 1080, 30, 900, true)),
            Map.entry("EP001-Shot08-ContinuousDive-V4",
                new CompositionProfile("EP001_SHOT08_CONTINUOUS_DIVE_V4", EP001_ID, 1920, 1080, 30, 900, true)),
            Map.entry("EP001-Shot08-TableLookup-V5",
                new CompositionProfile("EP001_SHOT08_TABLE_LOOKUP_V5", EP001_ID, 1920, 1080, 30, 1650, true)),
            Map.entry("EP001-Shot08-PremiumV6",
                new CompositionProfile("EP001_SHOT08_PREMIUM_V6", EP001_ID, 1920, 1080, 30, 1650, true)),
            Map.entry("EP001-Shot08-PremiumV7",
                new CompositionProfile("EP001_SHOT08_PREMIUM_V7", EP001_ID, 1920, 1080, 30, 1650, true)),
            Map.entry("EP001-Shot08-PremiumV8",
                new CompositionProfile("EP001_SHOT08_PREMIUM_V8", EP001_ID, 1920, 1080, 30, 1650, true)),
            Map.entry("EP001-Shot08-DirectorVoiceV9",
                new CompositionProfile("EP001_SHOT08_DIRECTOR_VOICE_V9", EP001_ID, 1920, 1080, 30, 4690, true)),
            Map.entry("EP001-Shot08-DirectorVoiceV10",
                new CompositionProfile("EP001_SHOT08_DIRECTOR_VOICE_V10", EP001_ID, 1920, 1080, 30, 4690, true)),
            Map.entry("EP001-Shot09-DirectorVoiceV1",
                new CompositionProfile("EP001_SHOT09_DIRECTOR_VOICE_V1", EP001_ID, 1920, 1080, 30, 4090, true)),
            Map.entry("EP001-Shot09-DirectorVoiceV2",
                new CompositionProfile("EP001_SHOT09_DIRECTOR_VOICE_V2", EP001_ID, 1920, 1080, 30, 4090, true)),
            Map.entry("EP001-Shot09-DirectorVoiceV4",
                new CompositionProfile("EP001_SHOT09_DIRECTOR_VOICE_V4", EP001_ID, 1920, 1080, 30, 4090, true)),
            Map.entry("EP001-Shot09-DirectorVoiceV5",
                new CompositionProfile("EP001_SHOT09_DIRECTOR_VOICE_V5", EP001_ID, 1920, 1080, 30, 4090, true)),
            Map.entry("EP001-Shot09-DirectorVoiceV6",
                new CompositionProfile("EP001_SHOT09_DIRECTOR_VOICE_V6", EP001_ID, 1920, 1080, 30, 4090, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV1",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V1", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV2",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V2", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV3",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V3", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV4",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V4", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV5",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V5", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV6",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V6", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationShortV7",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_SHORT_V7", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot10-SessionCreationPresentationV8",
                new CompositionProfile("EP001_SHOT10_SESSION_CREATION_PRESENTATION_V8", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot11-RouteDecisionPresentationV1",
                new CompositionProfile("EP001_SHOT11_ROUTE_DECISION_PRESENTATION_V1", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot11-RouteDecisionPresentationV2",
                new CompositionProfile("EP001_SHOT11_ROUTE_DECISION_PRESENTATION_V2", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot11-RouteDecisionPresentationV3",
                new CompositionProfile("EP001_SHOT11_ROUTE_DECISION_PRESENTATION_V3", EP001_ID, 1920, 1080, 30, 2160, true)),
            Map.entry("EP001-Shot09-DirectorVoiceV3",
                new CompositionProfile("EP001_SHOT09_DIRECTOR_VOICE_V3", EP001_ID, 1920, 1080, 30, 4090, true)),
            Map.entry("EP001-Studio-DirectorPlan",
                new CompositionProfile("EP001_STUDIO_DIRECTOR_PLAN", EP001_ID, 1920, 1080, 30, 3900, true)),
            Map.entry("EP001-Studio-LivingMapDraft",
                new CompositionProfile("EP001_STUDIO_LIVING_MAP_DRAFT", EP001_ID, 1920, 1080, 30, 600, true)),
            Map.entry("EP001-Voice-CurrentPreview",
                new CompositionProfile("EP001_VOICE_CURRENT_PREVIEW", EP001_ID, 1920, 1080, 30, 1, true))
    );

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final ProductionMemoryService productionMemory;
    private final StorageHealthService storage;
    private final String engineVersion;

    public RemotionRenderController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            ProductionMemoryService productionMemory,
            StorageHealthService storage
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.productionMemory = productionMemory;
        this.storage = storage;
        this.engineVersion = resolveEngineVersion();
    }

    private String resolveEngineVersion() {
        String sha = System.getenv().getOrDefault("RAILWAY_GIT_COMMIT_SHA", "").trim();
        String shortSha = sha.isBlank() ? "LOCAL" : sha.substring(0, Math.min(12, sha.length()));
        String buildStamp = readBuildStamp().replaceAll("[^0-9]", "");
        return ENGINE_VERSION_PREFIX + shortSha + (buildStamp.isBlank() ? "" : "_" + buildStamp);
    }

    private String readBuildStamp() {
        try (InputStream input = getClass().getClassLoader().getResourceAsStream("media-os-build-time.txt")) {
            return input == null ? "" : new String(input.readAllBytes(), StandardCharsets.UTF_8).trim();
        } catch (IOException ignored) {
            return "";
        }
    }

    public record RenderRequest(String profile, Map<String, Object> inputProps) {}

    @PostMapping("/compositions/{compositionId}")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, Object> ensureRender(
            @PathVariable String compositionId,
            @RequestBody(required = false) RenderRequest request
    ) {
        CompositionProfile composition = requireComposition(compositionId);
        productionMemory.preflight(
                "VISUAL",
                "REMOTION_RENDER_" + compositionId.replaceAll("[^A-Za-z0-9]+", "_").toUpperCase(Locale.ROOT)
        );
        String profileName = request == null || request.profile() == null || request.profile().isBlank()
                ? "FAST_PREVIEW"
                : request.profile().trim().toUpperCase();
        OutputProfile output = requireOutputProfile(profileName, composition);
        Map<String, Object> inputProps = request == null || request.inputProps() == null
                ? Map.of()
                : new LinkedHashMap<>(request.inputProps());
        int durationInFrames = resolveDurationInFrames(composition, inputProps);
        inputProps.put("durationInFrames", durationInFrames);
        String renderHash = renderHash(compositionId, profileName, output, inputProps);

        Optional<RenderRow> existing = findByHash(renderHash);
        if (existing.isPresent()) {
            RenderRow row = existing.get();
            if (!"FAILED".equals(row.status())) {
                return response(row);
            }
            storage.requireRenderHeadroom();
            jdbc.sql("""
                    update remotion_render
                    set status='QUEUED', progress=0, worker_id=null, error=null,
                        claimed_at=null, started_at=null, finished_at=null, updated_at=now()
                    where id=:id
                    """)
                    .param("id", row.id())
                    .update();
            return response(findById(row.id()).orElseThrow());
        }

        storage.requireRenderHeadroom();
        UUID renderId = UUID.randomUUID();
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
                    :durationInFrames, 0, null
                )
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .param("episodeId", composition.episodeId())
                .param("compositionId", compositionId)
                .param("renderKey", composition.renderKey())
                .param("engineVersion", engineVersion)
                .param("inputProps", inputPropsJson)
                .param("renderHash", renderHash)
                .param("profile", profileName)
                .param("width", output.width())
                .param("height", output.height())
                .param("fps", composition.fps())
                .param("durationInFrames", durationInFrames)
                .update();
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
                "configured", true,
                "provider", "CPU_QUEUE",
                "engine", "REMOTION_CPU_V1",
                "engineVersion", engineVersion,
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

    private int resolveDurationInFrames(CompositionProfile composition, Map<String, Object> inputProps) {
        if (!composition.dynamicDuration()) return composition.durationInFrames();
        Object raw = inputProps.get("durationInFrames");
        int value;
        if (raw instanceof Number number) {
            value = number.intValue();
        } else {
            try {
                value = Integer.parseInt(String.valueOf(raw));
            } catch (Exception ignored) {
                value = composition.durationInFrames();
            }
        }
        if (value <= 0 || value > 60 * 60 * composition.fps()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dynamic Remotion duration is invalid.");
        }
        return value;
    }

    private String renderHash(
            String compositionId,
            String profile,
            OutputProfile output,
            Map<String, Object> inputProps
    ) {
        try {
            String material = engineVersion + "\n"
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
            int durationInFrames,
            boolean dynamicDuration
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
