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
import org.springframework.transaction.annotation.Transactional;
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
            Integer scriptRevision,
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

    @GetMapping("/template")
    public Map<String, Object> template() {
        Map<String, Object> episode = overview.episode();
        Map<String, Object> script = lockedScript();
        int revision = ((Number) script.get("revision")).intValue();
        @SuppressWarnings("unchecked")
        Map<String, Object> artifact = (Map<String, Object>) script.get("artifact");
        List<Map<String, Object>> scriptTimeline = mapList(artifact.get("timeline"));

        List<Map<String, Object>> timeline = new ArrayList<>();
        Map<String, Integer> clipCounters = new LinkedHashMap<>();
        for (int index = 0; index < scriptTimeline.size(); index++) {
            Map<String, Object> item = scriptTimeline.get(index);
            int start = number(item.get("startSecond"));
            int end = number(item.get("endSecond"));
            String shotKey = shotKeyForSecond(start);
            int clipNo = clipCounters.merge(shotKey, 1, Integer::sum);

            Map<String, Object> visual = new LinkedHashMap<>();
            visual.put("summary", "FILL_IN_CHATGPT");
            visual.put("objects", List.of());
            visual.put("camera", "FILL_IN_CHATGPT");
            visual.put("attentionCue", "");
            visual.put("semanticAnchors", List.of());
            visual.put("effects", List.of());
            visual.put("notes", "");

            Map<String, Object> segment = new LinkedHashMap<>();
            segment.put("segmentId", "SEG-" + String.format(Locale.ROOT, "%03d", index + 1));
            segment.put("shotKey", shotKey);
            segment.put("clipKey", shotKey + "-C" + String.format(Locale.ROOT, "%02d", clipNo));
            segment.put("startSecond", start);
            segment.put("endSecond", end);
            segment.put("hear", String.valueOf(item.getOrDefault("narration", "")));
            segment.put("voiceDirection", String.valueOf(item.getOrDefault("voiceDirection", "")));
            segment.put("visual", visual);
            timeline.add(segment);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("schemaVersion", SCHEMA_VERSION);
        result.put("episodeNumber", episode.get("episodeNumber"));
        result.put("title", episode.get("title"));
        result.put("scriptRevision", revision);
        result.put("source", "CHATGPT_IMPORT");
        result.put("timeline", timeline);
        return result;
    }

    @Transactional
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
        if (request.scriptRevision() != null && request.scriptRevision() > 0 && request.scriptRevision() != currentRevision) {
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

        List<Map<String, Object>> mergedTimeline = mergeWithActiveContract(currentRevision, request.timeline());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("schemaVersion", request.schemaVersion());
        payload.put("episodeNumber", request.episodeNumber().trim());
        payload.put("title", request.title().trim());
        payload.put("scriptRevision", currentRevision);
        payload.put("source", request.source().trim());
        payload.put("timeline", mergedTimeline);

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
        result.put("timelineSegments", mergedTimeline.size());
        result.put("importedSegments", request.timeline().size());
        result.put("nextRoute", "#/agents/voice");
        result.put("message", "Production contract segment(s) validated, merged, and activated.");
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
        Map<String, Map<String, Object>> canonicalByRange = new LinkedHashMap<>();
        for (Map<String, Object> item : script) {
            int start = number(item.get("startSecond"));
            int end = number(item.get("endSecond"));
            canonicalByRange.put(start + ":" + end, item);
        }

        int previousEnd = -1;
        for (TimelineSegment segment : contract) {
            Map<String, Object> canonical = canonicalByRange.get(segment.startSecond() + ":" + segment.endSecond());
            if (canonical == null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        segment.segmentId() + " does not match any exact LOCKED Script time block.");
            }
            String narration = String.valueOf(canonical.getOrDefault("narration", ""));
            if (!normalize(segment.hear()).equals(normalize(narration))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        segment.segmentId() + " changes LOCKED narration. Import rejected.");
            }
            if (previousEnd > segment.startSecond()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Imported timeline blocks must be ordered and may not overlap.");
            }
            if (!segment.shotKey().trim().toUpperCase(Locale.ROOT).matches("SHOT \\d{2}")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        segment.segmentId() + " has invalid shotKey; expected SHOT 01.");
            }
            if (!segment.clipKey().trim().toUpperCase(Locale.ROOT).matches("SHOT \\d{2}-C\\d{2}")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        segment.segmentId() + " has invalid clipKey; expected SHOT 01-C01.");
            }
            String expectedShot = shotKeyForSecond(segment.startSecond());
            if (!expectedShot.equals(segment.shotKey().trim().toUpperCase(Locale.ROOT))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        segment.segmentId() + " belongs to " + expectedShot + ", not " + segment.shotKey() + ".");
            }
            previousEnd = segment.endSecond();
        }
    }

    private List<Map<String, Object>> mergeWithActiveContract(int revision, List<TimelineSegment> imported) {
        Map<String, Map<String, Object>> merged = new LinkedHashMap<>();

        jdbc.sql("""
                select payload::text
                from episode_production_contract
                where episode_id=:episodeId and script_revision=:revision and active=true
                order by created_at desc
                limit 1
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .query(String.class)
                .optional()
                .ifPresent(json -> {
                    Map<String, Object> payload = readMap(json);
                    for (Map<String, Object> row : mapList(payload.get("timeline"))) {
                        merged.put(number(row.get("startSecond")) + ":" + number(row.get("endSecond")), row);
                    }
                });

        for (TimelineSegment segment : imported) {
            Map<String, Object> row = objectMapper.convertValue(segment, new TypeReference<LinkedHashMap<String, Object>>() {});
            merged.put(segment.startSecond() + ":" + segment.endSecond(), row);
        }

        return merged.values().stream()
                .sorted((a, b) -> Integer.compare(number(a.get("startSecond")), number(b.get("startSecond"))))
                .toList();
    }

    private String shotKeyForSecond(int second) {
        int[] starts = {0,70,144,197,264,344,424,509,599,694,809,889,984,1059,1139,1194};
        for (int i = starts.length - 1; i >= 0; i--) {
            if (second >= starts[i]) return "SHOT " + String.format(Locale.ROOT, "%02d", i + 1);
        }
        return "SHOT 01";
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
