package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.architecturalthinking.mediaos.workflow.ProductionOverviewService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episodes/{episodeId}/shot-revisions/{shotKey}/render-qa")
public class EpisodeShotQaRenderController {
    static final String COMPOSITION = "AT-EpisodeShot-QA";
    private static final String ENGINE = "AT_EPISODE_SHOT_QA_V1";
    private static final UUID PROJECT = ProductionOverviewService.PROJECT_ID;
    private static final UUID EP001 = ProductionOverviewService.EPISODE_ID;

    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final StorageHealthService storage;
    private final boolean enabled;
    private final boolean episodeWrites;
    private final boolean localAuth;

    public EpisodeShotQaRenderController(JdbcClient jdbc, ObjectMapper mapper,
                                         StorageHealthService storage,
                                         @Value("${mediaos.remotion.qa-intake-enabled:false}") boolean enabled,
                                         @Value("${mediaos.episodes.writes-enabled:false}") boolean episodeWrites,
                                         @Value("${mediaos.local-auth.enabled:false}") boolean localAuth) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.storage = storage;
        this.enabled = enabled;
        this.episodeWrites = episodeWrites;
        this.localAuth = localAuth;
    }

    public record PreviewRequest(@NotNull @Min(1) Integer shotRevision,
                                 @NotBlank String decision,
                                 @NotBlank @Size(min = 10, max = 1200) String directorNote,
                                 @Min(150) @Max(900) int durationInFrames) {}

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    @Transactional
    public Map<String, Object> queue(@PathVariable UUID episodeId,
                                     @PathVariable String shotKey,
                                     @Valid @RequestBody PreviewRequest request) {
        if (!enabled || !episodeWrites || !localAuth)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Episode QA render intake requires explicit local Director and episode-write activation.");
        DirectorIdentity.Actor actor = DirectorIdentity.requireDirector();
        if (EP001.equals(episodeId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "EP001 is immutable and cannot use the episode QA preview endpoint.");
        if (shotKey == null || !shotKey.matches("SHOT (0[1-9]|[1-9][0-9]{1,2})"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid shot key.");
        if (!"DIRECTOR_APPROVE_QA_PREVIEW".equals(request.decision()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Explicit Director QA preview approval required.");

        String number = jdbc.sql("""
                select episode_number from episode
                where id=:episode and project_id=:project for update
                """).param("episode", episodeId).param("project", PROJECT)
                .query(String.class).optional().orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown episode."));
        if (!number.matches("EP\\d{3}") || "EP001".equals(number))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only new episode workspaces are supported.");

        int scriptRevision = jdbc.sql("""
                select current_revision from production_stage
                where episode_id=:episode and stage_key='SCRIPT'
                  and status='LOCKED' and current_revision > 0
                """).param("episode", episodeId).query(Integer.class)
                .optional().orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "Director-LOCKED Script stage is required."));

        boolean sceneLocked = jdbc.sql("""
                select exists(select 1 from production_stage
                where episode_id=:episode and stage_key='SCENE' and status='LOCKED')
                """).param("episode", episodeId).query(Boolean.class).single();
        if (!sceneLocked)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Director-LOCKED Scene stage is required.");

        Map<String, Object> approved = jdbc.sql("""
                select revision, based_on_script_revision, visual_direction, narration
                from episode_shot_revision
                where episode_id=:episode and shot_key=:shot and revision=:revision
                  and is_current=true and status='LOCKED' and locked_at is not null
                """).param("episode", episodeId).param("shot", shotKey)
                .param("revision", request.shotRevision())
                .query((rs, n) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("scriptRevision", rs.getInt("based_on_script_revision"));
                    row.put("visualDirection", rs.getString("visual_direction"));
                    row.put("narration", rs.getString("narration"));
                    return row;
                }).optional().orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "Only the current Director-LOCKED shot revision may render."));
        if (((Number) approved.get("scriptRevision")).intValue() != scriptRevision)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Shot revision is based on an outdated Script LOCK.");

        UUID voiceTake = jdbc.sql("""
                select id from episode_revision_voice_take
                where episode_id=:episode and shot_key=:shot and shot_revision=:revision
                  and approved_at is not null
                limit 1
                """).param("episode", episodeId).param("shot", shotKey)
                .param("revision", request.shotRevision()).query(UUID.class)
                .optional().orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "An approved Voice Take for this shot revision is required."));

        Map<String, Object> props = new LinkedHashMap<>();
        props.put("episodeId", episodeId.toString());
        props.put("shotKey", shotKey);
        props.put("shotTitle", shotKey + " · QA Storyboard");
        props.put("shotRevision", request.shotRevision());
        props.put("scriptRevision", scriptRevision);
        props.put("visualDirection", approved.get("visualDirection"));
        props.put("durationInFrames", request.durationInFrames());
        props.put("approvedVoiceTakeId", voiceTake.toString());
        props.put("qaOnly", true);
        String serialized = toJson(props);
        String hash = hash(ENGINE + "\n" + episodeId + "\n" + shotKey + "\n"
                + request.shotRevision() + "\n" + serialized);

        Map<String, Object> existing = jdbc.sql("""
                select id,status from remotion_render
                where project_id=:project and render_hash=:hash
                """).param("project", PROJECT).param("hash", hash)
                .query((rs, n) -> Map.<String, Object>of(
                        "renderId", rs.getObject("id", UUID.class),
                        "status", rs.getString("status"),
                        "compositionId", COMPOSITION,
                        "qaOnly", true))
                .optional().orElse(null);
        if (existing != null) {
            if ("FAILED".equals(existing.get("status")))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "The earlier QA render failed. Review the error before a new approved revision.");
            return existing;
        }

        storage.requireRenderHeadroom();
        UUID renderId = UUID.randomUUID();
        jdbc.sql("""
                insert into remotion_render(
                    id,project_id,episode_id,composition_id,render_key,engine_version,
                    input_props,render_hash,profile,status,width,height,fps,duration_in_frames,
                    progress)
                values (:id,:project,:episode,:composition,:renderKey,:engine,
                    cast(:props as jsonb),:hash,'FAST_PREVIEW','QUEUED',1280,720,30,:frames,0)
                """)
                .param("id", renderId).param("project", PROJECT).param("episode", episodeId)
                .param("composition", COMPOSITION)
                .param("renderKey", "QA_" + shotKey.replace(' ', '_'))
                .param("engine", ENGINE).param("props", serialized)
                .param("hash", hash).param("frames", request.durationInFrames()).update();

        jdbc.sql("""
                insert into episode_workspace_event(
                    id,episode_id,stage_key,event_type,revision,note,actor_issuer,actor_subject)
                values (:id,:episode,'VISUAL','REMOTION_QA_RENDER_QUEUED',
                    :revision,:note,:issuer,:subject)
                """)
                .param("id", UUID.randomUUID()).param("episode", episodeId)
                .param("revision", request.shotRevision()).param("note", request.directorNote().trim())
                .param("issuer", actor.issuer()).param("subject", actor.subject()).update();

        return Map.of("renderId", renderId, "status", "QUEUED",
                "compositionId", COMPOSITION, "qaOnly", true);
    }

    private String toJson(Object value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not create QA render manifest.", ex);
        }
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 unavailable.", ex);
        }
    }
}
