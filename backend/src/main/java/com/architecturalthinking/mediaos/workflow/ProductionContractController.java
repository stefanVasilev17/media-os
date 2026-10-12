package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/production-contract")
public class ProductionContractController {

    public static final String SCHEMA_VERSION = "mediaos.production-contract.v1";

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final ProductionMemoryService memory;
    private final ProductionOverviewService overview;

    public ProductionContractController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            ProductionMemoryService memory,
            ProductionOverviewService overview
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.memory = memory;
        this.overview = overview;
    }

    public record VisualContract(
            @NotBlank String summary,
            List<String> objects,
            String camera,
            String attentionCue,
            List<String> semanticAnchors,
            List<String> effects,
            String notes
    ) {}

    public record TimelineSegment(
            @NotBlank String segmentId,
            @NotBlank String shotKey,
            @NotBlank String clipKey,
            @PositiveOrZero int startSecond,
            @Positive int endSecond,
            @NotBlank String hear,
            @NotBlank String voiceDirection,
            @NotNull @Valid VisualContract visual
    ) {}

    public record ImportRequest(
            @NotBlank String schemaVersion,
            @NotBlank String episodeNumber,
            @NotBlank String title,
            @Positive int scriptRevision,
            @NotBlank String source,
            @NotEmpty List<@Valid TimelineSegment> timeline
    ) {}

    @GetMapping
    public Map<String, Object> current() {
        return jdbc.sql("""
                select id, script_revision, schema_version, source_type, payload::text,
                       payload_sha256, created_at
                from episode_production_contract
                where episode_id=:episodeId and active=true
                order by created_at desc
                limit 1
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("scriptRevision", rs.getInt("script_revision"));
                    row.put("schemaVersion", rs.getString("schema_version"));
                    row.put("source", rs.getString("source_type"));
                    row.put("payload", readMap(rs.getString("payload")));
                    row.put("sha256", rs.getString("payload_sha256"));
                    row.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    row.put("ready", true);
                    return row;
                })
                .optional()
                .orElseGet(() -> Map.of("ready", false, "schemaVersion", SCHEMA_VERSION));
    }

    @PostMapping("/import")
    public Map<String, Object> importContract(@Valid @RequestBody ImportRequest request) {
        Map<String, Object> episode = overview.episode();
        if (!SCHEMA_VERSION.equals(request.schemaVersion())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unsupported contract schema. Expected " + SCHEMA_VERSION + ".");
        }
        if (!String.valueOf(episode.get("episodeNumber")).equalsIgnoreCase(request.episodeNumber().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Import belongs to a different episode number.");
        }
        if (!normalize(String.valueOf(episode.get("title"))).equals(normalize(request.title()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Import title does not match the current episode.");
        }

        Map<String, Object> script = lockedScript();
        int currentRevision = ((Number) script.get("revision")).intValue();
        if (request.scriptRevision() != currentRevision) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Import targets Script revision " + request.scriptRevision()
                            + ", but the current LOCKED revision is " + currentRevision + ".");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> artifact = (Map<String, Object>) script.get("artifact");
        List<Map<String, Object>> scriptTimeline = mapList(artifact.get("timeline"));
        validateContractAgainstLockedScript(request.timeline(), scriptTimeline);

        memory.preflight("SCRIPT", "IMPORT_PRODUCTION_CONTRACT");
        memory.preflight("VOICE", "IMPORT_PRODUCTION_CONTRACT");
        memory.preflight("VISUAL", "IMPORT_PRODUCTION_CONTRACT");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("schemaVersion", request.schemaVersion());
        payload.put("episodeNumber", request.episodeNumber().trim());
        payload.put("title", request.title().trim());
        payload.put("scriptRevision", request.scriptRevision());
        payload.put("source", request.source().trim());
        payload.put("timeline", request.timeline());

        String json = writeJson(payload);
        String sha = sha256(json);

        jdbc.sql("""
                update episode_production_contract
                set active=false
                where episode_id=:episodeId and script_revision=:revision and active=true
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", currentRevision)
                .update();

        UUID id = UUID.randomUUID();
        jdbc.sql("""
                insert into episode_production_contract(
                  id, episode_id, script_revision, schema_version, source_type, payload, payload_sha256, active
                ) values (
                  :id,:episodeId,:revision,:schema,:source,cast(:payload as jsonb),:sha,true
                )
                """)
                .param("id", id)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", currentRevision)
                .param("schema", SCHEMA_VERSION)
                .param("source", request.source().trim().toUpperCase(Locale.ROOT))
                .param("payload", json)
                .param("sha", sha)
                .update();

        jdbc.sql("""
                update production_stage
                set status='ACTIVE',
                    summary='Validated production contract imported for LOCKED Script revision ' || :revision || '.',
                    next_action='Open Voice Agent and generate the first approved voice clip.',
                    updated_at=now()
                where episode_id=:episodeId and stage_key='VOICE'
                """)
                .param("revision", currentRevision)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .update();

        jdbc.sql("""
                update production_stage
                set summary='Visual Agent has a validated HEAR/SEE timeline contract for Script revision ' || :revision || '.',
                    next_action='Consume approved voice timing and the imported visual contract shot by shot.',
                    updated_at=now()
                where episode_id=:episodeId and stage_key='VISUAL'
                """)
                .param("revision", currentRevision)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .update();

        jdbc.sql("update episode set current_stage='VOICE_PRODUCTION' where id=:episodeId")
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .update();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", id);
        result.put("ready", true);
        result.put("schemaVersion", SCHEMA_VERSION);
        result.put("scriptRevision", currentRevision);
        result.put("sha256", sha);
        result.put("timelineSegments", request.timeline().size());
        result.put("nextRoute", "#/agents/voice");
        result.put("message", "Production contract validated against the LOCKED Script and activated.");
        return result;
    }

    private Map<String, Object> lockedScript() {
        return jdbc.sql("""
                select status, current_revision, artifact::text
                from production_stage
                where episode_id=:episodeId and stage_key='SCRIPT'
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, rowNum) -> {
                    if (!"LOCKED".equals(rs.getString("status"))) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Lock Script before importing a production contract.");
                    }
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("revision", rs.getInt("current_revision"));
                    row.put("artifact", readMap(rs.getString("artifact")));
                    return row;
                })
                .single();
    }

    private void validateContractAgainstLockedScript(
            List<TimelineSegment> contract,
            List<Map<String, Object>> script
    ) {
        if (contract.size() != script.size()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Contract must contain exactly " + script.size()
                            + " timeline blocks to match the LOCKED Script; received " + contract.size() + ".");
        }

        int expectedStart = 0;
        for (int i = 0; i < script.size(); i++) {
            TimelineSegment segment = contract.get(i);
            Map<String, Object> canonical = script.get(i);
            int start = number(canonical.get("startSecond"));
            int end = number(canonical.get("endSecond"));
            String narration = String.valueOf(canonical.getOrDefault("narration", ""));

            if (segment.startSecond() != start || segment.endSecond() != end) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        segment.segmentId() + " timing does not match LOCKED Script block "
                                + start + "–" + end + "s.");
            }
            if (!normalize(segment.hear()).equals(normalize(narration))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        segment.segmentId() + " changes LOCKED narration. Import rejected.");
            }
            if (segment.startSecond() != expectedStart || segment.endSecond() <= segment.startSecond()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Timeline must be contiguous, ordered and gap-free from second 0.");
            }
            if (!segment.shotKey().trim().toUpperCase(Locale.ROOT).matches("SHOT \\d{2}")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        segment.segmentId() + " has invalid shotKey; expected SHOT 01.");
            }
            if (!segment.clipKey().trim().toUpperCase(Locale.ROOT).matches("SHOT \\d{2}-C\\d{2}")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        segment.segmentId() + " has invalid clipKey; expected SHOT 01-C01.");
            }
            expectedStart = segment.endSecond();
        }
    }

    private int number(Object value) {
        return value instanceof Number number ? number.intValue() : 0;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> mapList(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                Map<String, Object> row = new LinkedHashMap<>();
                map.forEach((key, val) -> row.put(String.valueOf(key), val));
                rows.add(row);
            }
        }
        return rows;
    }

    private String normalize(String value) {
        return value == null ? "" : value.replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
    }

    private Map<String, Object> readMap(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Stored production JSON is invalid.", ex);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize production contract.", ex);
        }
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not hash production contract.", ex);
        }
    }
}
