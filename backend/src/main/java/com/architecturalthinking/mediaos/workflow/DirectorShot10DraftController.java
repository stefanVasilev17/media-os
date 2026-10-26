package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.architecturalthinking.mediaos.remotion.RemotionRenderController;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/director-shot-draft/shot-10")
public class DirectorShot10DraftController {
    static final String SCHEMA = "mediaos.director-shot-draft.v1";
    private static final String SHOT = "SHOT 10";
    private static final UUID EPISODE = ProductionOverviewService.EPISODE_ID;
    private final JdbcClient db;
    private final ObjectMapper mapper;
    private final ProductionOverviewService overview;
    private final RemotionRenderController renderer;

    public DirectorShot10DraftController(
            JdbcClient db, ObjectMapper mapper, ProductionOverviewService overview,
            RemotionRenderController renderer) {
        this.db = db;
        this.mapper = mapper;
        this.overview = overview;
        this.renderer = renderer;
    }

    @GetMapping
    public Map<String, Object> current() {
        return db.sql("""
            select payload::text, payload_sha256, studio_shot_id
            from episode_director_shot_draft
            where episode_id=:episode and shot_key=:shot
            """)
            .param("episode", EPISODE).param("shot", SHOT)
            .query((rs, row) -> {
                try {
                    return Map.<String, Object>of(
                        "ready", true,
                        "payload", mapper.readTree(rs.getString("payload")),
                        "sha256", rs.getString("payload_sha256"),
                        "studioPrepared", rs.getObject("studio_shot_id", UUID.class) != null,
                        "studioShotId", rs.getObject("studio_shot_id", UUID.class) == null
                            ? "" : rs.getObject("studio_shot_id", UUID.class).toString()
                    );
                } catch (Exception ex) {
                    throw new IllegalStateException("Stored SHOT 10 director draft is unreadable.", ex);
                }
            })
            .optional().orElseGet(() -> Map.of(
                "ready", false, "schemaVersion", SCHEMA, "shotKey", SHOT
            ));
    }

    @PostMapping("/import")
    @Transactional
    public Map<String, Object> importDraft(@RequestBody JsonNode payload) {
        validateDraft(payload, String.valueOf(overview.episode().get("title")));
        db.sql("select id from episode where id=:episode for update")
            .param("episode", EPISODE).query(UUID.class).single();
        ensureLockedScript();

        String encoded = serialize(payload);
        String digest = sha(encoded);
        record Existing(String sha, UUID studioId) {}
        Existing old = db.sql("""
            select payload_sha256, studio_shot_id from episode_director_shot_draft
            where episode_id=:episode and shot_key=:shot
            """).param("episode", EPISODE).param("shot", SHOT)
            .query((rs, row) -> new Existing(rs.getString(1), rs.getObject(2, UUID.class)))
            .optional().orElse(null);
        if (old != null && old.studioId() != null && !old.sha().equals(digest)) {
            throw conflict("SHOT 10 Studio voices already exist. The linked HEAR/SEE draft is immutable; "
                + "create an explicit Director revision instead of replacing the existing clips.");
        }
        if (old == null) {
            db.sql("""
                insert into episode_director_shot_draft
                    (episode_id,shot_key,schema_version,status,payload_sha256,payload)
                values (:episode,:shot,:schema,'DIRECTOR_REVIEW',:sha,cast(:payload as jsonb))
                """).param("episode", EPISODE).param("shot", SHOT).param("schema", SCHEMA)
                .param("sha", digest).param("payload", encoded).update();
        } else if (!old.sha().equals(digest)) {
            db.sql("""
                update episode_director_shot_draft
                set payload=cast(:payload as jsonb),payload_sha256=:sha,updated_at=now()
                where episode_id=:episode and shot_key=:shot and studio_shot_id is null
                """).param("payload", encoded).param("sha", digest)
                .param("episode", EPISODE).param("shot", SHOT).update();
        }
        return Map.of(
            "ready", true, "shotKey", SHOT, "status", "DIRECTOR_REVIEW",
            "durationSeconds", 72, "clips", 3,
            "alreadyImported", old != null && old.sha().equals(digest),
            "studioPrepared", old != null && old.studioId() != null,
            "message", "72-second SHOT 10 draft imported independently. Original Script and SHOT 01-09 are unchanged."
        );
    }

    @PostMapping("/prepare-studio-voice")
    @Transactional
    public Map<String, Object> prepareStudioVoice() {
        db.sql("select id from episode where id=:episode for update")
            .param("episode", EPISODE).query(UUID.class).single();
        ensureLockedScript();
        record Saved(String payload, UUID studioId) {}
        Saved saved = db.sql("""
            select payload::text,studio_shot_id
            from episode_director_shot_draft
            where episode_id=:episode and shot_key=:shot for update
            """).param("episode", EPISODE).param("shot", SHOT)
            .query((rs, row) -> new Saved(rs.getString(1), rs.getObject(2, UUID.class)))
            .optional().orElseThrow(() -> conflict("Import SHOT 10 HEAR/SEE director draft before preparing voices."));
        JsonNode payload;
        try {
            payload = mapper.readTree(saved.payload());
        } catch (Exception ex) {
            throw conflict("Stored SHOT 10 draft is invalid.");
        }
        validateDraft(payload, String.valueOf(overview.episode().get("title")));
        if (saved.studioId() != null) {
            return Map.of("ready", true, "alreadyPrepared", true,
                "studioShotId", saved.studioId().toString(),
                "message", "SHOT 10 Studio working copy already exists; recordings remain unchanged.");
        }
        boolean occupied = db.sql("""
            select exists(select 1 from studio_shot where episode_id=:episode and shot_number=10)
            """).param("episode", EPISODE).query(Boolean.class).single();
        if (occupied) {
            throw conflict("Studio SHOT 10 is already occupied. No original working copy, voice, or "
                + "director lock was changed. Review that slot before preparing a new working copy.");
        }
        UUID id = UUID.randomUUID();
        StringBuilder visual = new StringBuilder("EP001 SHOT 10 V7 / DIRECTOR REVIEW / 72s. ")
            .append("Keep the original Living Architecture Map; authentication proof is created, ")
            .append("server session and signed token are alternatives (OR); TTL is finite; ")
            .append("Phone remains WAITING until next shot. Three HEAR/SEE blocks:\n");
        for (JsonNode segment : payload.path("timeline")) {
            visual.append(text(segment, "clipKey")).append(" [")
                .append(segment.path("startSecond").asInt()).append("-")
                .append(segment.path("endSecond").asInt()).append("s]: ")
                .append(text(segment.path("visual"), "summary")).append("\n")
                .append("Camera: ").append(text(segment.path("visual"), "camera")).append("\n");
        }
        String prompt = visual.toString();
        if (prompt.length() > 16000) throw bad("SHOT 10 visual instructions are too long.");
        db.sql("""
            insert into studio_shot(id,episode_id,shot_number,title,visual_prompt,visual_revision)
            values (:id,:episode,10,:title,:visual,1)
            """).param("id", id).param("episode", EPISODE)
            .param("title", text(payload, "shotTitle"))
            .param("visual", prompt).update();
        int index = 0;
        for (JsonNode segment : payload.path("timeline")) {
            db.sql("""
                insert into studio_clip(id,shot_id,sequence,narration,voice_direction)
                values(:id,:shot,:sequence,:narration,:direction)
                """).param("id", UUID.randomUUID()).param("shot", id)
                .param("sequence", ++index).param("narration", text(segment, "hear"))
                .param("direction", text(segment, "voiceDirection")).update();
        }
        db.sql("""
            update episode_director_shot_draft set studio_shot_id=:studio,updated_at=now()
            where episode_id=:episode and shot_key=:shot and studio_shot_id is null
            """).param("studio", id).param("episode", EPISODE).param("shot", SHOT).update();
        return Map.of("ready", true, "alreadyPrepared", false, "studioShotId", id.toString(),
            "clips", 3, "status", "DIRECTOR_REVIEW",
            "message", "Three unlocked SHOT 10 draft voices created in isolated Studio. "
                + "Review each, lock narration, generate ElevenLabs audio, and approve individually.");
    }

    @PostMapping("/render-v7")
    public Map<String, Object> renderVoiceSyncedV7() {
        return renderVoiceSynced("EP001-Shot10-SessionCreationShortV7", false);
    }

    @PostMapping("/render-presentation-v8")
    public Map<String, Object> renderPresentationV8() {
        return renderVoiceSynced("EP001-Shot10-SessionCreationPresentationV8", true);
    }

    private Map<String, Object> renderVoiceSynced(String compositionId, boolean requireDirectorV8) {
        record Draft(String payload, UUID studioId) {}
        Draft draft = db.sql("""
            select payload::text, studio_shot_id from episode_director_shot_draft
            where episode_id=:episode and shot_key=:shot
            """).param("episode", EPISODE).param("shot", SHOT)
            .query((rs, row) -> new Draft(rs.getString(1), rs.getObject(2, UUID.class)))
            .optional().orElseThrow(() -> conflict("Import SHOT 10 draft before rendering."));
        if (draft.studioId() == null) throw conflict("Prepare three SHOT 10 Studio voices before rendering.");
        JsonNode payload;
        try {
            payload = mapper.readTree(draft.payload());
        } catch (Exception ex) {
            throw conflict("Stored SHOT 10 HEAR/SEE draft is invalid.");
        }
        validateDraft(payload, String.valueOf(overview.episode().get("title")));
        if (requireDirectorV8 && !"V8".equals(payload.path("directorRevision").asText())) {
            throw conflict("SHOT 10 presentation preview requires the approved V8 Director narration revision.");
        }
        record Voice(int seq, UUID id, String narration, boolean approved, boolean generated, String alignment) {}
        List<Voice> voices = db.sql("""
            select sequence,id,narration,
                   (approved_at is not null) as approved,
                   (generated_audio is not null and octet_length(generated_audio)>0) as generated,
                   generated_alignment::text
            from studio_clip where shot_id=:shot order by sequence
            """).param("shot", draft.studioId())
            .query((rs, row) -> new Voice(
                rs.getInt(1), rs.getObject(2, UUID.class), rs.getString(3),
                rs.getBoolean(4), rs.getBoolean(5), rs.getString(6)))
            .list();
        if (voices.size() != 3) {
            throw conflict("SHOT 10 V7 needs precisely three Studio voice clips.");
        }
        String base = System.getenv().getOrDefault(
            "MEDIA_OS_PUBLIC_URL", "https://media-os-backend-production.up.railway.app").replaceAll("/+$", "");
        if (!base.matches("https://[A-Za-z0-9.:-]+")) {
            throw conflict("MEDIA_OS_PUBLIC_URL must be a public HTTPS backend for voice previews.");
        }
        int[] boundaries = {0, 22, 46, 72};
        List<Map<String, Object>> audio = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            Voice voice = voices.get(i);
            JsonNode segment = payload.path("timeline").get(i);
            if (voice.seq() != i + 1 || !voice.narration().equals(text(segment, "hear"))) {
                throw conflict("SHOT 10 C0" + (i + 1) +
                    " Studio narration differs from HEAR/SEE. No render was queued.");
            }
            if (!voice.approved() || !voice.generated()) {
                throw conflict("Generate and Director-approve SHOT 10 C0" + (i + 1) +
                    " in Studio before rendering V7.");
            }
            double duration = alignmentEndSeconds(voice.alignment());
            int slotFrames = (boundaries[i + 1] - boundaries[i]) * 30;
            if (!(duration > 0d) || !Double.isFinite(duration) || duration * 30d > slotFrames - 6) {
                throw conflict("SHOT 10 C0" + (i + 1) +
                    " does not fit its " + (boundaries[i + 1] - boundaries[i]) +
                    "-second voice slot. Re-align the 72-second storyboard in Director review; do not truncate approved audio.");
            }
            audio.add(Map.of(
                "src", base + "/api/v1/studio/clips/" + voice.id() + "/audio",
                "fromFrame", boundaries[i] * 30,
                "durationInFrames", slotFrames
            ));
        }
        Map<String, Object> props = Map.of("durationInFrames", 2160, "audioClips", audio);
        return renderer.ensureRender(compositionId,
            new RemotionRenderController.RenderRequest("FAST_PREVIEW", props));
    }

    static double alignmentEndSeconds(String encoded) {
        if (encoded == null || encoded.isBlank()) return 0d;
        try {
            JsonNode root = new ObjectMapper().readTree(encoded);
            for (String section : List.of("normalized_alignment", "alignment")) {
                JsonNode node = root.path(section);
                for (String key : List.of("character_end_times_seconds", "character_end_times")) {
                    JsonNode times = node.path(key);
                    if (!times.isArray() || times.isEmpty()) continue;
                    double max = 0;
                    for (JsonNode time : times) {
                        if (time.isNumber()) max = Math.max(max, time.asDouble());
                    }
                    if (max > 0) return max;
                }
            }
            return 0d;
        } catch (Exception ex) {
            return 0d;
        }
    }

    static void validateDraft(JsonNode payload, String expectedTitle) {
        if (payload == null || !payload.isObject() ||
            !SCHEMA.equals(text(payload, "schemaVersion")) ||
            !"EP001".equals(text(payload, "episodeNumber")) ||
            !expectedTitle.equals(text(payload, "title")) ||
            !"SHOT 10".equals(text(payload, "shotKey")) ||
            text(payload, "shotTitle").isBlank() ||
            text(payload, "shotTitle").length() > 240 ||
            text(payload, "source").isBlank() ||
            !"DIRECTOR_REVIEW".equals(text(payload, "status")) ||
            payload.path("durationSeconds").asInt(-1) != 72 ||
            payload.path("fps").asInt(-1) != 30) {
            throw bad("Expected EP001 SHOT 10 V7 director-review draft, exactly 72 seconds at 30 fps.");
        }
        JsonNode timeline = payload.path("timeline");
        if (!timeline.isArray() || timeline.size() != 3) {
            throw bad("SHOT 10 must contain exactly C01-C03, not the legacy long-shot narration.");
        }
        int[] boundaries = {0, 22, 46, 72};
        List<String> seen = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            JsonNode segment = timeline.get(i);
            String key = "SHOT 10-C" + String.format(Locale.ROOT, "%02d", i + 1);
            JsonNode visual = segment.path("visual");
            if (!"SHOT 10".equals(text(segment, "shotKey")) ||
                !key.equals(text(segment, "clipKey")) ||
                text(segment, "segmentId").isBlank() ||
                segment.path("startSecond").asInt(-1) != boundaries[i] ||
                segment.path("endSecond").asInt(-1) != boundaries[i+1] ||
                text(segment, "hear").isBlank() ||
                text(segment, "hear").length() > 5000 ||
                text(segment, "voiceDirection").isBlank() ||
                text(visual, "summary").isBlank() ||
                !visual.path("objects").isArray() ||
                text(visual, "camera").isBlank() ||
                !visual.path("semanticAnchors").isArray() ||
                !visual.path("effects").isArray()) {
                throw bad(key + " is missing valid ordered HEAR/SEE, narration or 72-second timing.");
            }
            seen.add(text(segment, "segmentId"));
        }
        if (seen.stream().distinct().count() != 3) {
            throw bad("SHOT 10 segment IDs must be unique.");
        }
    }

    private void ensureLockedScript() {
        boolean locked = db.sql("""
            select exists(select 1 from production_stage
                where episode_id=:episode and stage_key='SCRIPT' and status='LOCKED')
            """).param("episode", EPISODE).query(Boolean.class).single();
        if (!locked) throw conflict("The canonical EP001 Script must remain locked before importing drafts.");
    }

    private String serialize(JsonNode node) {
        try {
            return mapper.writeValueAsString(node);
        } catch (Exception ex) {
            throw bad("Could not serialize SHOT 10 HEAR/SEE JSON.");
        }
    }

    private static String text(JsonNode node, String key) {
        JsonNode field = node.path(key);
        return field.isTextual() ? field.asText().trim() : "";
    }

    private static String sha(String value) {
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
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
