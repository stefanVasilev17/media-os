package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/director-shot-draft/shot-10")
public class DirectorShot10NarrationRevisionController {
    private static final UUID EPISODE = ProductionOverviewService.EPISODE_ID;
    private static final String SHOT = "SHOT 10";
    private static final String SCHEMA = "mediaos.director-shot-narration-revision.v1";

    public record Narration(String clipKey, String hear) {}
    public record RevisionRequest(String schemaVersion, String expectedSha,
                                  String directorRevision, List<Narration> clips) {}
    private record Draft(String content, String sha, UUID studioShotId) {}
    private record StudioClip(UUID id, int sequence, String narration,
                              String direction, boolean locked, boolean generated,
                              boolean approved) {}

    private final JdbcClient db;
    private final ObjectMapper mapper;
    private final ProductionOverviewService overview;
    private final ShotStudioController studio;

    public DirectorShot10NarrationRevisionController(JdbcClient db, ObjectMapper mapper,
            ProductionOverviewService overview, ShotStudioController studio) {
        this.db = db;
        this.mapper = mapper;
        this.overview = overview;
        this.studio = studio;
    }

    @PostMapping("/revise-narration")
    @Transactional
    public Map<String, Object> revise(@RequestBody RevisionRequest request) {
        if (request == null || !SCHEMA.equals(request.schemaVersion())
                || !"V8".equals(request.directorRevision())
                || request.expectedSha() == null || request.expectedSha().isBlank()
                || request.clips() == null || request.clips().size() != 3) {
            throw bad("Expected V8 Director narration revision with SHOT 10 C01-C03 and a prior SHA.");
        }
        for (int i = 0; i < 3; i++) {
            Narration voice = request.clips().get(i);
            if (voice == null || !("SHOT 10-C0" + (i + 1)).equals(voice.clipKey())
                    || voice.hear() == null || voice.hear().isBlank()
                    || voice.hear().length() > 5000) {
                throw bad("V8 must provide exactly three non-empty, ordered C01-C03 narrations.");
            }
        }

        Draft draft = db.sql("""
                select payload::text,payload_sha256,studio_shot_id
                from episode_director_shot_draft
                where episode_id=:episode and shot_key=:shot for update
                """)
                .param("episode", EPISODE).param("shot", SHOT)
                .query((rs, row) -> new Draft(rs.getString(1), rs.getString(2),
                    rs.getObject(3, UUID.class)))
                .optional().orElseThrow(() -> conflict("SHOT 10 Director draft is missing."));
        if (draft.studioShotId() == null) {
            throw conflict("SHOT 10 Studio must be prepared before a narration revision.");
        }
        ObjectNode payload;
        try {
            payload = (ObjectNode) mapper.readTree(draft.content());
        } catch (Exception ex) {
            throw conflict("SHOT 10 stored Director draft is invalid.");
        }
        DirectorShot10DraftController.validateDraft(payload, String.valueOf(overview.episode().get("title")));

        if ("V8".equals(payload.path("directorRevision").asText())) {
            boolean identical = true;
            for (int i = 0; i < 3; i++) {
                identical &= request.clips().get(i).hear().trim().equals(
                    payload.path("timeline").get(i).path("hear").asText());
            }
            if (identical) {
                return Map.of("ready", true, "alreadyRevised", true,
                    "revision", "V8", "clips", 3, "durationSeconds", 72,
                    "status", "DIRECTOR_REVIEW");
            }
            throw conflict("SHOT 10 already has V8 text. A new Director revision is required.");
        }

        if (!draft.sha().trim().equals(request.expectedSha().trim())) {
            throw conflict("SHOT 10 changed since the Director reviewed it. Reload before revising.");
        }
        List<StudioClip> originals = db.sql("""
                select id,sequence,narration,voice_direction,
                    locked_at is not null as locked,
                    generated_audio is not null or generated_at is not null as generated,
                    approved_at is not null as approved
                from studio_clip where shot_id=:shot order by sequence for update
                """).param("shot", draft.studioShotId())
                .query((rs, row) -> new StudioClip(
                    rs.getObject("id", UUID.class), rs.getInt("sequence"),
                    rs.getString("narration"), rs.getString("voice_direction"),
                    rs.getBoolean("locked"), rs.getBoolean("generated"),
                    rs.getBoolean("approved"))).list();
        if (originals.size() != 3) {
            throw conflict("Exactly three SHOT 10 Studio clips are required.");
        }
        for (int i = 0; i < originals.size(); i++) {
            StudioClip clip = originals.get(i);
            String priorHear = payload.path("timeline").get(i).path("hear").asText();
            if (clip.sequence() != i + 1 || !clip.narration().equals(priorHear)) {
                throw conflict("SHOT 10 Studio C0" + (i + 1) + " diverged from its imported HEAR/SEE draft.");
            }
            if (clip.locked() || clip.generated() || clip.approved()) {
                throw conflict("SHOT 10 C0" + (i + 1)
                    + " has a locked/generated voice. It must be explicitly revised in Studio; nothing was overwritten.");
            }
        }

        ArrayNode history = payload.withArray("directorRevisionHistory");
        ObjectNode previous = mapper.createObjectNode();
        previous.put("revision", "V7");
        previous.put("sha256", draft.sha().trim());
        previous.put("source", payload.path("source").asText());
        previous.set("timeline", payload.path("timeline").deepCopy());
        history.add(previous);

        for (int i = 0; i < originals.size(); i++) {
            StudioClip clip = originals.get(i);
            String newHear = request.clips().get(i).hear().trim();
            ((ObjectNode) payload.path("timeline").get(i)).put("hear", newHear);
            studio.updateClip(clip.id(), new ShotStudioController.Text(newHear, clip.direction()));
        }
        payload.put("directorRevision", "V8");
        payload.put("source", "DIRECTOR_EP001_SHOT10_V8_72S_2026_10_26");
        final String encoded;
        try {
            encoded = mapper.writeValueAsString(payload);
        } catch (Exception ex) {
            throw bad("Could not serialize Director V8 narration revision.");
        }
        String digest = sha(encoded);
        int updated = db.sql("""
                update episode_director_shot_draft
                set payload=cast(:payload as jsonb),payload_sha256=:sha,updated_at=now()
                where episode_id=:episode and shot_key=:shot and payload_sha256=:expected
                """).param("payload", encoded).param("sha", digest)
                .param("episode", EPISODE).param("shot", SHOT)
                .param("expected", draft.sha()).update();
        if (updated != 1) throw conflict("SHOT 10 changed during the Director revision.");
        return Map.of("ready", true, "alreadyRevised", false, "revision", "V8",
            "clips", 3, "durationSeconds", 72, "status", "DIRECTOR_REVIEW",
            "message", "V8 narration saved atomically with Studio C01-C03. V7 preserved as revision history; SHOT 01-09 unchanged.");
    }

    private static String sha(String payload) {
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("SHA-256 unavailable.", ex);
        }
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
