package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/spline/blueprint")
public class SplineSceneBlueprintController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final int MAX_OBJECTS = 10_000;
    private static final int MAX_BLUEPRINT_JSON_CHARS = 5_000_000;

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final String configuredSceneUrl;
    private final SplineCapabilityCatalogService capabilityCatalogService;

    public SplineSceneBlueprintController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            @Value("${MEDIA_OS_SPLINE_RUNTIME_URL:}") String configuredSceneUrl,
            SplineCapabilityCatalogService capabilityCatalogService
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.configuredSceneUrl = configuredSceneUrl == null ? "" : configuredSceneUrl.trim();
        this.capabilityCatalogService = capabilityCatalogService;
    }

    public record CaptureRequest(
            int schemaVersion,
            @NotBlank String sceneUrl,
            @NotBlank String sceneFingerprint,
            int objectCount,
            int variableCount,
            int eventDefinitionCount,
            @NotNull Map<String, Object> capabilitySummary,
            @NotNull Map<String, Object> blueprint
    ) {}

    @PostMapping
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> capture(@Valid @RequestBody CaptureRequest request) {
        validate(request);

        String blueprintJson = writeJson(request.blueprint());
        String capabilitySummaryJson = writeJson(request.capabilitySummary());

        UUID id = jdbc.sql("""
                insert into spline_scene_blueprint(
                    id, project_id, schema_version, scene_url, scene_fingerprint,
                    object_count, variable_count, event_definition_count,
                    capability_summary, blueprint, captured_at
                )
                values (
                    :id, :projectId, :schemaVersion, :sceneUrl, :sceneFingerprint,
                    :objectCount, :variableCount, :eventDefinitionCount,
                    cast(:capabilitySummary as jsonb), cast(:blueprint as jsonb), now()
                )
                on conflict(project_id, scene_fingerprint)
                do update set
                    schema_version=excluded.schema_version,
                    scene_url=excluded.scene_url,
                    object_count=excluded.object_count,
                    variable_count=excluded.variable_count,
                    event_definition_count=excluded.event_definition_count,
                    capability_summary=excluded.capability_summary,
                    blueprint=excluded.blueprint,
                    captured_at=now()
                returning id
                """)
                .param("id", UUID.randomUUID())
                .param("projectId", PROJECT_ID)
                .param("schemaVersion", request.schemaVersion())
                .param("sceneUrl", request.sceneUrl().trim())
                .param("sceneFingerprint", request.sceneFingerprint().trim().toLowerCase())
                .param("objectCount", request.objectCount())
                .param("variableCount", request.variableCount())
                .param("eventDefinitionCount", request.eventDefinitionCount())
                .param("capabilitySummary", capabilitySummaryJson)
                .param("blueprint", blueprintJson)
                .query(UUID.class)
                .single();

        Map<String, Object> capabilityCatalog = capabilityCatalogService.rebuild(
                id,
                request.sceneFingerprint().trim().toLowerCase(),
                request.blueprint()
        );

        return Map.of(
                "id", id,
                "status", "READY",
                "sceneFingerprint", request.sceneFingerprint().trim().toLowerCase(),
                "objectCount", request.objectCount(),
                "capabilityCatalogStatus", capabilityCatalog.getOrDefault("status", "UNKNOWN")
        );
    }

    @GetMapping("/latest")
    public Map<String, Object> latest() {
        return jdbc.sql("""
                select id, schema_version, scene_url, scene_fingerprint,
                       object_count, variable_count, event_definition_count,
                       capability_summary::text, blueprint::text, captured_at
                from spline_scene_blueprint
                where project_id=:projectId
                order by captured_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("status", "READY");
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("schemaVersion", rs.getInt("schema_version"));
                    item.put("sceneUrl", rs.getString("scene_url"));
                    item.put("sceneFingerprint", rs.getString("scene_fingerprint"));
                    item.put("objectCount", rs.getInt("object_count"));
                    item.put("variableCount", rs.getInt("variable_count"));
                    item.put("eventDefinitionCount", rs.getInt("event_definition_count"));
                    item.put("capabilitySummary", readJson(rs.getString("capability_summary")));
                    item.put("blueprint", readJson(rs.getString("blueprint")));
                    item.put("capturedAt", rs.getObject("captured_at", OffsetDateTime.class));
                    return item;
                })
                .optional()
                .orElseGet(() -> Map.of("status", "EMPTY"));
    }

    @GetMapping("/latest/summary")
    public Map<String, Object> latestSummary() {
        return jdbc.sql("""
                select id, schema_version, scene_url, scene_fingerprint,
                       object_count, variable_count, event_definition_count,
                       capability_summary::text, captured_at
                from spline_scene_blueprint
                where project_id=:projectId
                order by captured_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("status", "READY");
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("schemaVersion", rs.getInt("schema_version"));
                    item.put("sceneUrl", rs.getString("scene_url"));
                    item.put("sceneFingerprint", rs.getString("scene_fingerprint"));
                    item.put("objectCount", rs.getInt("object_count"));
                    item.put("variableCount", rs.getInt("variable_count"));
                    item.put("eventDefinitionCount", rs.getInt("event_definition_count"));
                    item.put("capabilitySummary", readJson(rs.getString("capability_summary")));
                    item.put("capturedAt", rs.getObject("captured_at", OffsetDateTime.class));
                    return item;
                })
                .optional()
                .orElseGet(() -> Map.of("status", "EMPTY"));
    }

    private void validate(CaptureRequest request) {
        if (request.schemaVersion() != 1) {
            throw new InvalidBlueprintException("Unsupported Spline scene blueprint schema version.");
        }

        String sceneUrl = request.sceneUrl().trim();
        if (!sceneUrl.contains(".splinecode")) {
            throw new InvalidBlueprintException("Spline scene blueprint must reference a .splinecode scene.");
        }

        if (!configuredSceneUrl.isBlank() && !configuredSceneUrl.equals(sceneUrl)) {
            throw new InvalidBlueprintException("Spline scene blueprint URL does not match Media OS runtime configuration.");
        }

        if (!request.sceneFingerprint().matches("(?i)^[a-f0-9]{64}$")) {
            throw new InvalidBlueprintException("Spline scene fingerprint must be a SHA-256 hex digest.");
        }

        if (request.objectCount() <= 0 || request.objectCount() > MAX_OBJECTS) {
            throw new InvalidBlueprintException("Spline scene blueprint object count is outside the accepted range.");
        }

        if (request.variableCount() < 0 || request.eventDefinitionCount() < 0) {
            throw new InvalidBlueprintException("Spline scene blueprint counters cannot be negative.");
        }

        Object objects = request.blueprint().get("objects");
        if (!(objects instanceof java.util.List<?> objectList) || objectList.size() != request.objectCount()) {
            throw new InvalidBlueprintException("Spline scene blueprint object list does not match objectCount.");
        }

        String serialized = writeJson(request.blueprint());
        if (serialized.length() > MAX_BLUEPRINT_JSON_CHARS) {
            throw new InvalidBlueprintException("Spline scene blueprint exceeds the 5 MB JSON budget.");
        }
    }

    private Object readJson(String json) {
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            throw new IllegalStateException("Invalid stored Spline scene blueprint JSON.", e);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialize Spline scene blueprint JSON.", e);
        }
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    static class InvalidBlueprintException extends RuntimeException {
        InvalidBlueprintException(String message) {
            super(message);
        }
    }
}
