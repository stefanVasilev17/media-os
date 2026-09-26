package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/spline/shots")
public class SplineShotController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String TASK_TYPE = "CREATE_RUNTIME_SHOT_V1";
    private static final String SHOT_AGENT_KEY = "SPLINE_SHOT_AGENT";

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    public SplineShotController(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public record ShotCommandRequest(
            @NotBlank String message,
            UUID shotId
    ) {}

    private record PreviousShot(
            UUID productionJobId,
            String shotKey,
            int shotSequence,
            int revision,
            Map<String, Object> spec
    ) {}

    @PostMapping("/command")
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createShotCommand(@Valid @RequestBody ShotCommandRequest request) {
        String message = request.message().trim();
        if (message.length() > 4000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shot direction is too long.");
        }

        PreviousShot previous = request.shotId() == null ? null : loadPreviousShot(request.shotId());
        int shotSequence = previous == null ? nextShotSequence() : previous.shotSequence();
        String shotKey = previous == null ? "SHOT_%02d".formatted(shotSequence) : previous.shotKey();
        int revision = previous == null ? 1 : previous.revision() + 1;

        if (previous != null) {
            jdbc.sql("""
                    insert into spline_director_memory(
                        id, project_id, scope, shot_key, source_production_job_id, feedback
                    )
                    values (:id, :projectId, 'SHOT', :shotKey, :sourceJobId, :feedback)
                    """)
                    .param("id", UUID.randomUUID())
                    .param("projectId", PROJECT_ID)
                    .param("shotKey", shotKey)
                    .param("sourceJobId", previous.productionJobId())
                    .param("feedback", message)
                    .update();
        }

        List<String> directorMemory = loadDirectorMemory();
        UUID orchestrationJobId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID productionJobId = UUID.randomUUID();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("executionProfile", "SHOT_DIRECTOR_V1");
        payload.put("creatorMessage", message);
        payload.put("shotKey", shotKey);
        payload.put("shotSequence", shotSequence);
        payload.put("revision", revision);
        payload.put("previousShotId", previous == null ? null : previous.productionJobId());
        payload.put("previousShotSpec", previous == null ? null : previous.spec());
        payload.put("directorMemory", directorMemory);
        payload.put("productionCamera", "MEDIA_OS_CAMERA");
        payload.put("readOnlySplinePlanning", true);

        String instructions = """
                Create or revise a temporary browser-runtime shot specification from the director command. This is a READ-ONLY Spline planning task: inspect the focused Spline scene through Spline MCP, but do not mutate, move, rename, recolor, delete, create, or reparent any Spline object. Resolve exact existing object names, camera reference names, authored states, and authored events only when needed for the requested shot. Use MEDIA_OS_CAMERA as the production camera and semantic camera/object references rather than hard-coded world coordinates whenever possible. If previousShotSpec exists, preserve the existing shot and apply only the director's requested correction unless the correction requires a broader timing adjustment. Apply the supplied directorMemory as learned collaboration preferences when it is relevant, but the current director command always has priority.

                Return exactly one final status line. On success the line MUST be:
                MEDIA_OS_SPLINE_RESULT: SUCCEEDED {compact-json}

                The compact JSON must follow this schema:
                {"schemaVersion":1,"name":"human readable shot name","durationMs":20000,"beats":[{"type":"CAMERA","atMs":0,"targetName":"CAM_LOGIN","transitionMs":0,"easing":"smooth","zoom":0.42},{"type":"EVENT","atMs":2500,"targetName":"exact object name","eventName":"mouseDown"},{"type":"STATE","atMs":4000,"targetName":"exact object name","stateValue":"ACTIVE"},{"type":"VISIBILITY","atMs":6000,"targetName":"exact object name","visible":true},{"type":"ZOOM","atMs":8000,"value":0.35,"transitionMs":1200,"easing":"smooth"}]}

                Rules for the JSON: durationMs must be between 500 and 120000; beats must be sorted by atMs; allowed beat types are CAMERA, EVENT, STATE, VISIBILITY, ZOOM; CAMERA targetName must be an exact existing Spline camera/reference object name; EVENT/STATE/VISIBILITY targetName must be an exact existing runtime object name; transitionMs is optional and defaults to 0; easing is one of linear, smooth, easeInOut; omit beat fields that do not apply; never invent object names or camera names. A hold is represented by the absence of another camera beat, not by fake movement. If a required reference cannot be verified, return MEDIA_OS_SPLINE_RESULT: FAILED with a concise reason instead of inventing it.
                """;

        jdbc.sql("""
                insert into job(id, project_id, name, job_type, status, progress)
                values (:id, :projectId, :name, 'SPLINE_EXECUTION', 'QUEUED', 20)
                """)
                .param("id", orchestrationJobId)
                .param("projectId", PROJECT_ID)
                .param("name", "Spline shot director · " + shotKey + " r" + revision)
                .update();

        jdbc.sql("""
                insert into task(id, job_id, name, task_type, status, sequence_no)
                values (:id, :jobId, :name, :taskType, 'PENDING', 1)
                """)
                .param("id", taskId)
                .param("jobId", orchestrationJobId)
                .param("name", "Runtime shot · " + shotKey + " r" + revision)
                .param("taskType", TASK_TYPE)
                .update();

        jdbc.sql("""
                insert into production_job(
                    id, project_id, task_id, agent_key, task_type, target, instructions,
                    permissions, protected_objects, payload, status
                )
                values (
                    :id, :projectId, :taskId, :agentKey, :taskType, 'FOCUSED_SPLINE_3D_TAB', :instructions,
                    cast(:permissions as jsonb), cast(:protectedObjects as jsonb), cast(:payload as jsonb), 'QUEUED'
                )
                """)
                .param("id", productionJobId)
                .param("projectId", PROJECT_ID)
                .param("taskId", taskId)
                .param("agentKey", SHOT_AGENT_KEY)
                .param("taskType", TASK_TYPE)
                .param("instructions", instructions)
                .param("permissions", writeJson(List.of(
                        "READ_SCENE_REFERENCES",
                        "READ_EXACT_CREATOR_NAMED_OBJECTS",
                        "READ_CAMERA_REFERENCES",
                        "READ_AUTHORED_STATES_AND_EVENTS",
                        "CREATE_RUNTIME_SHOT_SPEC"
                )))
                .param("protectedObjects", writeJson(List.of("ALL_SPLINE_OBJECTS_READ_ONLY")))
                .param("payload", writeJson(payload))
                .update();

        jdbc.sql("""
                insert into spline_agent_message(id, project_id, production_job_id, role, content)
                values (:id, :projectId, :productionJobId, 'USER', :content)
                """)
                .param("id", UUID.randomUUID())
                .param("projectId", PROJECT_ID)
                .param("productionJobId", productionJobId)
                .param("content", message)
                .update();

        return Map.of(
                "productionJobId", productionJobId,
                "shotKey", shotKey,
                "revision", revision,
                "status", "QUEUED"
        );
    }

    @GetMapping("/latest")
    public Map<String, Object> latestShot() {
        return jdbc.sql("""
                select id, status, payload::text as payload, coalesce(result, '{}'::jsonb)::text as result,
                       created_at, finished_at
                from production_job
                where project_id=:projectId
                  and agent_key=:agentKey
                  and task_type=:taskType
                  and status='SUCCEEDED'
                order by created_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .param("agentKey", SHOT_AGENT_KEY)
                .param("taskType", TASK_TYPE)
                .query((rs, rowNum) -> buildShotResponse(
                        rs.getObject("id", UUID.class),
                        readJsonMap(rs.getString("payload")),
                        readJsonMap(rs.getString("result")),
                        rs.getObject("created_at", OffsetDateTime.class),
                        rs.getObject("finished_at", OffsetDateTime.class)
                ))
                .optional()
                .orElseGet(() -> Map.of("status", "EMPTY"));
    }

    @GetMapping("/{shotId}")
    public Map<String, Object> shot(@PathVariable UUID shotId) {
        return jdbc.sql("""
                select id, status, payload::text as payload, coalesce(result, '{}'::jsonb)::text as result,
                       created_at, finished_at
                from production_job
                where id=:shotId and project_id=:projectId and task_type=:taskType
                """)
                .param("shotId", shotId)
                .param("projectId", PROJECT_ID)
                .param("taskType", TASK_TYPE)
                .query((rs, rowNum) -> {
                    String status = rs.getString("status");
                    if (!"SUCCEEDED".equals(status)) {
                        return Map.<String, Object>of(
                                "status", status,
                                "id", rs.getObject("id", UUID.class)
                        );
                    }
                    return buildShotResponse(
                            rs.getObject("id", UUID.class),
                            readJsonMap(rs.getString("payload")),
                            readJsonMap(rs.getString("result")),
                            rs.getObject("created_at", OffsetDateTime.class),
                            rs.getObject("finished_at", OffsetDateTime.class)
                    );
                })
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shot was not found."));
    }

    @GetMapping("/memory/summary")
    public Map<String, Object> memorySummary() {
        int count = jdbc.sql("""
                select count(*)
                from spline_director_memory
                where project_id=:projectId
                """)
                .param("projectId", PROJECT_ID)
                .query(Integer.class)
                .single();

        List<String> recent = loadDirectorMemory().stream().limit(8).toList();
        return Map.of("count", count, "recent", recent);
    }

    private PreviousShot loadPreviousShot(UUID shotId) {
        return jdbc.sql("""
                select id, status, payload::text as payload, coalesce(result, '{}'::jsonb)::text as result
                from production_job
                where id=:shotId and project_id=:projectId and task_type=:taskType
                """)
                .param("shotId", shotId)
                .param("projectId", PROJECT_ID)
                .param("taskType", TASK_TYPE)
                .query((rs, rowNum) -> {
                    if (!"SUCCEEDED".equals(rs.getString("status"))) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Only a completed shot can be revised.");
                    }
                    Map<String, Object> payload = readJsonMap(rs.getString("payload"));
                    Map<String, Object> result = readJsonMap(rs.getString("result"));
                    Map<String, Object> spec = parseShotSpec(result);
                    return new PreviousShot(
                            rs.getObject("id", UUID.class),
                            String.valueOf(payload.getOrDefault("shotKey", "SHOT_01")),
                            number(payload.get("shotSequence"), 1),
                            number(payload.get("revision"), 1),
                            spec
                    );
                })
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Previous shot was not found."));
    }

    private int nextShotSequence() {
        Integer current = jdbc.sql("""
                select coalesce(max(
                    case
                      when (payload->>'shotSequence') ~ '^[0-9]+$'
                      then (payload->>'shotSequence')::int
                      else 0
                    end
                ), 0)
                from production_job
                where project_id=:projectId and task_type=:taskType
                """)
                .param("projectId", PROJECT_ID)
                .param("taskType", TASK_TYPE)
                .query(Integer.class)
                .single();
        return Math.max(1, (current == null ? 0 : current) + 1);
    }

    private List<String> loadDirectorMemory() {
        return jdbc.sql("""
                select feedback
                from spline_director_memory
                where project_id=:projectId
                order by created_at desc
                limit 30
                """)
                .param("projectId", PROJECT_ID)
                .query(String.class)
                .list();
    }

    private Map<String, Object> buildShotResponse(
            UUID productionJobId,
            Map<String, Object> payload,
            Map<String, Object> result,
            OffsetDateTime createdAt,
            OffsetDateTime finishedAt
    ) {
        Map<String, Object> spec = parseShotSpec(result);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "READY");
        response.put("id", productionJobId);
        response.put("productionJobId", productionJobId);
        response.put("shotKey", String.valueOf(payload.getOrDefault("shotKey", "SHOT_01")));
        response.put("shotSequence", number(payload.get("shotSequence"), 1));
        response.put("revision", number(payload.get("revision"), 1));
        response.put("creatorPrompt", String.valueOf(payload.getOrDefault("creatorMessage", "")));
        response.put("name", String.valueOf(spec.getOrDefault("name", payload.getOrDefault("shotKey", "Shot"))));
        response.put("durationMs", number(spec.get("durationMs"), 8000));
        response.put("spec", spec);
        response.put("createdAt", createdAt);
        response.put("finishedAt", finishedAt);
        return response;
    }

    private Map<String, Object> parseShotSpec(Map<String, Object> result) {
        Object outputValue = result.get("output");
        String output = outputValue == null ? "" : outputValue.toString().trim();
        int start = output.indexOf('{');
        int end = output.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Shot executor completed without a runtime ShotSpec.");
        }
        String json = output.substring(start, end + 1);
        Map<String, Object> spec = readJsonMap(json);
        validateShotSpec(spec);
        return spec;
    }

    private void validateShotSpec(Map<String, Object> spec) {
        int durationMs = number(spec.get("durationMs"), -1);
        if (durationMs < 500 || durationMs > 120000) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "ShotSpec durationMs is invalid.");
        }
        Object beatsValue = spec.get("beats");
        if (!(beatsValue instanceof List<?> beats)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "ShotSpec beats are missing.");
        }

        int previousAt = -1;
        for (Object beatValue : beats) {
            if (!(beatValue instanceof Map<?, ?> rawBeat)) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "ShotSpec contains an invalid beat.");
            }
            Map<String, Object> beat = new LinkedHashMap<>();
            rawBeat.forEach((key, value) -> beat.put(String.valueOf(key), value));
            String type = String.valueOf(beat.getOrDefault("type", ""));
            if (!List.of("CAMERA", "EVENT", "STATE", "VISIBILITY", "ZOOM").contains(type)) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "ShotSpec contains an unsupported beat type.");
            }
            int atMs = number(beat.get("atMs"), -1);
            if (atMs < 0 || atMs > durationMs || atMs < previousAt) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "ShotSpec beats must be sorted and inside the shot duration.");
            }
            previousAt = atMs;
        }
    }

    private int number(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        try {
            return value == null ? fallback : Integer.parseInt(value.toString());
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private Map<String, Object> readJsonMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid JSON payload.", ex);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize Spline shot payload.", ex);
        }
    }
}
