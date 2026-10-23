package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/director-visual-contract")
public class DirectorVisualContractController {
    private static final UUID EPISODE = ProductionOverviewService.EPISODE_ID;
    private static final String SCHEMA = "mediaos.director-visual-contract.v1";
    private static final String SHOT = "SHOT 07";
    private static final int REVISION = 3;
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;

    public DirectorVisualContractController(JdbcClient jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    @GetMapping("/shot-07")
    public Map<String, Object> current() {
        return jdbc.sql("""
                select payload::text, payload_sha256, voice_pack_sha256
                from episode_director_visual_contract
                where episode_id=:episode and script_revision=3 and shot_key=:shot
                """)
                .param("episode", EPISODE).param("shot", SHOT)
                .query((rs, row) -> {
                    try {
                        return Map.<String, Object>of(
                                "ready", true,
                                "payload", mapper.readTree(rs.getString(1)),
                                "sha256", rs.getString(2),
                                "voicePackSha256", rs.getString(3));
                    } catch (Exception ex) {
                        throw new IllegalStateException("Could not read SHOT 07 visual draft.", ex);
                    }
                }).optional().orElseGet(() -> Map.of("ready", false, "schemaVersion", SCHEMA));
    }

    @Transactional
    @PostMapping("/shot-07/draft")
    public Map<String, Object> importDraft(@RequestBody JsonNode draft) {
        if (!SCHEMA.equals(text(draft, "schemaVersion")) ||
                !"EP001".equals(text(draft, "episodeNumber")) ||
                REVISION != draft.path("scriptRevision").asInt(-1) ||
                !SHOT.equals(text(draft, "shotKey")) ||
                !"VISUAL_DRAFT".equals(text(draft, "status"))) {
            throw bad("Expected an EP001 SHOT 07 visual DRAFT for locked Script revision 3.");
        }
        JsonNode review = draft.path("review");
        if (review.path("fps").asInt() != 30 ||
                review.path("width").asInt() != 1920 ||
                review.path("height").asInt() != 1080 ||
                !review.path("videoLockRequiresDirectorApproval").asBoolean(false)) {
            throw bad("SHOT 07 draft must preserve the 30fps Director-review profile.");
        }
        String stage = jdbc.sql("""
                select status from production_stage
                where episode_id=:episode and stage_key='SCRIPT'
                  and current_revision=3 for update
                """).param("episode", EPISODE).query(String.class).optional()
                .orElseThrow(() -> conflict("Locked Script revision 3 is missing."));
        if (!"LOCKED".equals(stage)) throw conflict("Script revision 3 is not locked.");
        boolean visualLocked = jdbc.sql("""
                select exists(select 1 from visual_shot_lock
                  where episode_id=:episode and script_revision=3 and shot_key=:shot)
                """).param("episode", EPISODE).param("shot", SHOT)
                .query(Boolean.class).single();
        if (visualLocked) throw conflict("SHOT 07 already has a Director video LOCK.");

        record VoiceSource(String sha, String payload) {}
        VoiceSource voice = jdbc.sql("""
                select payload_sha256, payload::text from episode_director_voice_pack
                where episode_id=:episode and script_revision=3
                """).param("episode", EPISODE)
                .query((rs, row) -> new VoiceSource(rs.getString(1), rs.getString(2)))
                .optional().orElseThrow(() -> conflict("Director-LOCKED voice pack is missing."));
        JsonNode voiceRoot;
        try {
            voiceRoot = mapper.readTree(voice.payload());
        } catch (Exception ex) {
            throw conflict("Cannot read existing Director voice pack.");
        }
        if (!text(draft, "directorVoicePackVersion").equals(text(voiceRoot, "version"))) {
            throw conflict("Visual draft does not target the active Director voice pack version.");
        }
        JsonNode approvedShots = voiceRoot.path("shots");
        if (!approvedShots.isArray() || approvedShots.size() < 1 ||
                !SHOT.equals(text(approvedShots.get(0), "shotKey"))) {
            throw conflict("The exact SHOT 07 Director voice pack is unavailable.");
        }
        JsonNode approvedClips = approvedShots.get(0).path("clips");
        JsonNode segments = draft.path("timeline");
        if (!segments.isArray() || !approvedClips.isArray() ||
                segments.size() != 5 || approvedClips.size() != 5) {
            throw bad("SHOT 07 requires five ordered HEAR/SEE segments.");
        }
        for (int i = 0; i < 5; i++) {
            JsonNode segment = segments.get(i);
            JsonNode voiceClip = approvedClips.get(i);
            if (!SHOT.equals(text(segment, "shotKey")) ||
                    !text(segment, "clipKey").equals(text(voiceClip, "clipKey")) ||
                    !text(segment, "hear").strip().equals(text(voiceClip, "narration").strip()) ||
                    !text(segment, "voiceDirection").strip().equals(text(voiceClip, "voiceDirection").strip()) ||
                    segment.path("startSecond").asInt(-1) != voiceClip.path("startSecond").asInt(-2) ||
                    segment.path("endSecond").asInt(-1) != voiceClip.path("endSecond").asInt(-2) ||
                    text(segment.path("visual"), "summary").isBlank() ||
                    !segment.path("visual").path("semanticAnchors").isArray()) {
                throw conflict("Segment " + (i + 1) + " differs from the immutable voice pack or lacks visual direction.");
            }
        }
        long approvedCount = jdbc.sql("""
                select count(*) from voice_clip_workflow
                where episode_id=:episode and script_revision=3 and shot_key=:shot
                  and voice_approved_at is not null and generated_audio is not null
                """).param("episode", EPISODE).param("shot", SHOT).query(Long.class).single();
        if (approvedCount != 5) throw conflict("Five generated, approved SHOT 07 clips are required.");

        String json;
        try {
            json = mapper.writeValueAsString(draft);
        } catch (Exception ex) {
            throw bad("Could not serialize the visual contract.");
        }
        String digest = sha(json);
        jdbc.sql("""
                insert into episode_director_visual_contract
                  (episode_id,script_revision,shot_key,voice_pack_sha256,payload_sha256,payload)
                values (:episode,3,:shot,:voiceSha,:digest,cast(:payload as jsonb))
                on conflict (episode_id,script_revision,shot_key) do update
                  set voice_pack_sha256=excluded.voice_pack_sha256,
                      payload_sha256=excluded.payload_sha256,
                      payload=excluded.payload,updated_at=now()
                """).param("episode", EPISODE).param("shot", SHOT)
                .param("voiceSha", voice.sha()).param("digest", digest)
                .param("payload", json).update();
        return Map.of("ready", true, "shotKey", SHOT, "status", "VISUAL_DRAFT",
                "sha256", digest, "voicePackSha256", voice.sha(),
                "message", "SHOT 07 visual DRAFT stored separately. No voice, script or video LOCK was changed.");
    }

    private static String text(JsonNode node, String name) {
        JsonNode value = node.path(name);
        return value.isTextual() ? value.asText() : "";
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    private static String sha(String source) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(source.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("SHA-256 unavailable.", ex);
        }
    }
}
