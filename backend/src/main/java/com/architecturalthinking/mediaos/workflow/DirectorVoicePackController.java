package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
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
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/director-voice-pack")
public class DirectorVoicePackController {
    private static final UUID EPISODE = ProductionOverviewService.EPISODE_ID;
    private static final String SCHEMA = "mediaos.director-voice-pack.v1";
    private static final String VERSION = "v3-explained-2026-10-21";
    private static final String APPROVED_NARRATION_SHA256 =
            "704fdd5dcddfee3af4b918d15565402973b7c1ccf8194002e98a9735b0298db3";

    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final ProductionOverviewService overview;

    public DirectorVoicePackController(JdbcClient jdbc, ObjectMapper mapper, ProductionOverviewService overview) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.overview = overview;
    }

    public record Clip(
            @NotBlank String clipKey,
            @Positive int sequence,
            @NotBlank String title,
            @PositiveOrZero int startSecond,
            @Positive int endSecond,
            @NotBlank String narration,
            @NotBlank String voiceDirection
    ) {}

    public record Shot(
            @NotBlank String shotKey,
            @NotBlank String title,
            @PositiveOrZero int startSecond,
            @Positive int endSecond,
            @NotEmpty List<@Valid Clip> clips
    ) {}

    public record Payload(
            @NotBlank String schemaVersion,
            @NotBlank String episodeNumber,
            @Positive int scriptRevision,
            @NotBlank String status,
            boolean directorConfirmed,
            @NotBlank String version,
            @NotBlank String source,
            @NotBlank String timecodes,
            @NotEmpty List<@Valid Shot> shots
    ) {}

    @GetMapping
    public Map<String, Object> current() {
        return jdbc.sql("""
                select payload::text, payload_sha256 from episode_director_voice_pack
                where episode_id=:episode and script_revision=3
                """)
                .param("episode", EPISODE)
                .query((rs, row) -> {
                    try {
                        return Map.<String, Object>of(
                                "ready", true,
                                "payload", mapper.readTree(rs.getString(1)),
                                "sha256", rs.getString(2)
                        );
                    } catch (JsonProcessingException ex) {
                        throw new IllegalStateException("Could not read Director voice pack.", ex);
                    }
                })
                .optional().orElseGet(() -> Map.of("ready", false, "schemaVersion", SCHEMA));
    }

    @Transactional
    @PostMapping("/import")
    public Map<String, Object> importLocked(@Valid @RequestBody Payload request) {
        if (!SCHEMA.equals(request.schemaVersion()) || request.scriptRevision()!=3 ||
                !"DIRECTOR_LOCKED".equals(request.status()) || !request.directorConfirmed() ||
                !VERSION.equals(request.version()) ||
                !"EDITORIAL_ESTIMATES_VOICE_ALIGNMENT_TO_FOLLOW".equals(request.timecodes())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Expected the exact Director-LOCKED EP001 SHOT 07–09 explained voice pack.");
        }
        if (!Objects.equals(overview.episode().get("episodeNumber"), request.episodeNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The voice pack targets a different episode.");
        }
        if (request.shots().size()!=3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Exactly SHOT 07–09 are required.");
        }

        int previousEnd=-1;
        List<String> approvedNarration=new ArrayList<>();
        for (int si=0;si<3;si++) {
            Shot shot=request.shots().get(si);
            String expectedShot="SHOT 0"+(si+7);
            int expectedClips=si==0?5:4;
            if (!expectedShot.equals(shot.shotKey()) || shot.clips().size()!=expectedClips ||
                    shot.endSecond()<=shot.startSecond() || (si>0&&shot.startSecond()!=previousEnd) ||
                    shot.startSecond()<515) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Shot order, time ranges or expected clip count does not match approved SHOT 07–09.");
            }
            int clipEnd=shot.startSecond();
            for (int ci=0;ci<shot.clips().size();ci++) {
                Clip clip=shot.clips().get(ci);
                String expectedKey=expectedShot+"-C0"+(ci+1);
                if (!expectedKey.equals(clip.clipKey()) || clip.sequence()!=ci+1 ||
                        clip.startSecond()!=clipEnd || clip.endSecond()<=clip.startSecond() ||
                        clip.narration().length()>5000) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Invalid Director clip key, sequence, timing or narration size.");
                }
                approvedNarration.add(clip.narration().strip());
                clipEnd=clip.endSecond();
            }
            if (clipEnd!=shot.endSecond()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Clip/shot boundaries do not match.");
            }
            previousEnd=shot.endSecond();
        }
        if (!APPROVED_NARRATION_SHA256.equals(
                sha(String.join("\n<VOICE_PACK_NEXT_CLIP>\n", approvedNarration)))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Voice text differs from the exact Director-approved explained script v3.");
        }

        Map<String,Object> stage=jdbc.sql("""
                select status,current_revision from production_stage
                where episode_id=:episode and stage_key='SCRIPT' for update
                """)
                .param("episode",EPISODE)
                .query((rs,n)->Map.<String,Object>of(
                        "status",rs.getString(1),"revision",rs.getInt(2))).single();
        if (!"LOCKED".equals(stage.get("status")) || ((Number)stage.get("revision")).intValue()!=3) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Original EP001 Script revision 3 must remain locked and intact.");
        }

        String payload;
        try {
            payload=mapper.writeValueAsString(request);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid voice pack JSON.",ex);
        }
        String payloadSha=sha(payload);
        String already=jdbc.sql("""
                select payload_sha256 from episode_director_voice_pack
                where episode_id=:episode and script_revision=3
                """).param("episode",EPISODE).query(String.class).optional().orElse(null);
        if (already!=null) {
            if (!already.equals(payloadSha)) throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A different Director voice pack is already locked. No replacement allowed.");
            return Map.of("ready",true,"alreadyImported",true,"shots",3,"clips",13,
                    "message","Identical Director voice pack already imported. Open Voice Agent.");
        }

        long existingRecorded=jdbc.sql("""
                select count(*) from voice_clip_workflow
                where episode_id=:episode and script_revision=3
                  and shot_key in ('SHOT 07','SHOT 08','SHOT 09')
                  and (generated_audio is not null or voice_approved_at is not null)
                """).param("episode",EPISODE).query(Long.class).single();
        if (existingRecorded>0) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "SHOT 07–09 already contain generated or approved voice. Import is blocked to protect it.");

        jdbc.sql("""
                insert into episode_director_voice_pack(
                    episode_id,script_revision,schema_version,source_version,
                    narration_sha256,payload_sha256,payload)
                values(:episode,3,:schema,:version,:narration,:sha,cast(:payload as jsonb))
                """)
                .param("episode",EPISODE).param("schema",SCHEMA).param("version",VERSION)
                .param("narration",APPROVED_NARRATION_SHA256)
                .param("sha",payloadSha).param("payload",payload).update();
        return Map.of("ready",true,"alreadyImported",false,"shots",3,"clips",13,
                "message","Director-LOCKED SHOT 07–09 voice pack saved. Open Voice Agent to initialize 13 clips. SHOT 01–06 and original Script revision 3 are unchanged.");
    }

    private static String sha(String data) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("SHA-256 unavailable.",ex);
        }
    }
}
