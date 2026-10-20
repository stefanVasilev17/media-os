package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class Shot06DirectorVoiceImportController {
    private static final UUID EPISODE = ProductionOverviewService.EPISODE_ID;
    private static final String VERSION = "mediaos.shot06-director-voice.v1";
    private static final String APPROVED_HASH =
            "b5d1d4882ddb9a1784f521c0b323d7b1602ec6241f079fd60562652a269dd82b";
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final ProductionOverviewService overview;

    public Shot06DirectorVoiceImportController(JdbcClient jdbc, ObjectMapper mapper,
                                                ProductionOverviewService overview) {
        this.jdbc=jdbc;
        this.mapper=mapper;
        this.overview=overview;
    }

    public record Clip(
        @NotBlank String clipKey,
        @Positive int sequence,
        @NotBlank String title,
        @NotBlank String narration,
        @NotBlank String voiceDirection,
        int estimatedStartSecond,
        int estimatedEndSecond
    ) {}

    public record Payload(
        @NotBlank String schemaVersion,
        @NotBlank String episodeNumber,
        @NotBlank String shotKey,
        @Positive int scriptRevision,
        @NotBlank String status,
        boolean directorConfirmed,
        @NotBlank String version,
        @NotBlank String voicePerformance,
        @NotEmpty List<@Valid Clip> clips
    ) {}

    @PostMapping("/api/v1/voice-clips/shot06/director-voice-import")
    @Transactional
    public Map<String,Object> importDirectorVoice(@Valid @RequestBody Payload request) {
        if(!VERSION.equals(request.schemaVersion()) ||
           !"SHOT 06".equals(request.shotKey()) ||
           !"DIRECTOR_LOCKED".equals(request.status()) ||
           !request.directorConfirmed() ||
           request.scriptRevision()!=3 ||
           !request.version().startsWith("v3")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Expected exact Director-approved SHOT 06 v3 voice-only import.");
        }
        String episode=String.valueOf(overview.episode().get("episodeNumber"));
        if(!episode.equalsIgnoreCase(request.episodeNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Import file belongs to a different episode.");
        }
        if(request.clips().size()!=7) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Exactly seven Director-locked voice segments C01–C07 are required.");
        }

        List<String> spoken=new ArrayList<>();
        for(int i=0;i<7;i++) {
            Clip clip=request.clips().get(i);
            if(clip.sequence()!=i+1 || !clip.clipKey().equals("SHOT 06-C0"+(i+1)) ||
                clip.narration().isBlank() || clip.voiceDirection().isBlank() ||
                clip.estimatedEndSecond()<=clip.estimatedStartSecond() ||
                (i>0&&clip.estimatedStartSecond()!=request.clips().get(i-1).estimatedEndSecond())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Incorrect SHOT 06 clip order, keys, voice direction, or advisory timing.");
            }
            spoken.add(clip.narration().strip());
        }
        String hash=sha(String.join("\n<SHOT06_NEXT_CLIP>\n",spoken));
        if(!APPROVED_HASH.equals(hash)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Narration differs from the exact Director-LOCKED SHOT 06 v3 script.");
        }

        Map<String,Object> stage=jdbc.sql("""
            select status,current_revision from production_stage
            where episode_id=:episode and stage_key='SCRIPT' for update
            """).param("episode",EPISODE)
            .query((rs,n)->Map.<String,Object>of(
                "status",rs.getString(1),"revision",rs.getInt(2))).single();
        if(!"LOCKED".equals(stage.get("status")) ||
           ((Number)stage.get("revision")).intValue()!=3) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "The original EP001 Script revision must stay locked at revision 3.");
        }
        long earlierLocks=jdbc.sql("""
            select count(*) from visual_shot_lock
            where episode_id=:episode and script_revision=3 and shot_key='SHOT 05'
            """).param("episode",EPISODE).query(Long.class).single();
        if(earlierLocks!=1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "SHOT 05 must remain Director LOCKED before importing SHOT 06.");
        }
        String previous=jdbc.sql("""
            select narration_sha256 from shot06_director_voice_lock
            where episode_id=:episode and script_revision=3 and shot_key='SHOT 06'
            """).param("episode",EPISODE).query(String.class).optional().orElse(null);
        if(previous!=null) {
            if(!hash.equals(previous)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Another SHOT 06 script is already Director LOCKED.");
            }
            return Map.of("shotKey","SHOT 06","scriptRevision",3,"voiceClips",7,
                "locked",true,"alreadyImported",true,"message","Identical SHOT 06 v3 Director voice import already active.");
        }

        long newShotLocks=jdbc.sql("""
            select count(*) from visual_shot_lock
            where episode_id=:episode and script_revision=3 and shot_key='SHOT 06'
            """).param("episode",EPISODE).query(Long.class).single();
        if(newShotLocks!=0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "SHOT 06 already has a visual Director LOCK; a script edit is unsafe.");
        }
        long activeAudio=jdbc.sql("""
            select count(*) from voice_clip_workflow
            where episode_id=:episode and script_revision=3 and shot_key='SHOT 06'
              and (generated_audio is not null or voice_approved_at is not null)
            """).param("episode",EPISODE).query(Long.class).single();
        if(activeAudio!=0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "SHOT 06 already has recorded/generated audio. Refusing to replace it.");
        }
        List<String> existing=jdbc.sql("""
            select clip_key from voice_clip_workflow
            where episode_id=:episode and script_revision=3 and shot_key='SHOT 06'
            order by sequence_no for update
            """).param("episode",EPISODE).query(String.class).list();
        if(existing.size()!=7) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Expected exactly seven existing SHOT 06 voice slots; use Voice Agent sync first.");
        }
        for(int i=0;i<7;i++) {
            Clip clip=request.clips().get(i);
            if(!existing.get(i).equals(clip.clipKey())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Voice slot identity differs; refusing cross-shot edits.");
            }
            int changed=jdbc.sql("""
                update voice_clip_workflow
                set director_narration_override=:narration,
                    voice_direction=:direction,updated_at=now()
                where episode_id=:episode and script_revision=3
                  and shot_key='SHOT 06' and clip_key=:clipKey
                  and generated_audio is null and voice_approved_at is null
                """)
                .param("narration",clip.narration().strip())
                .param("direction",clip.voiceDirection().strip())
                .param("episode",EPISODE)
                .param("clipKey",clip.clipKey()).update();
            if(changed!=1) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Another process changed a SHOT 06 voice clip while importing.");
        }
        int shotChanged=jdbc.sql("""
            update voice_shot_workflow
            set narration=:narration,voice_direction=:direction,updated_at=now()
            where episode_id=:episode and script_revision=3 and shot_key='SHOT 06'
              and voice_approved_at is null
            """).param("narration",String.join("\n\n",spoken))
              .param("direction",request.voicePerformance())
              .param("episode",EPISODE).update();
        if(shotChanged!=1) throw new ResponseStatusException(HttpStatus.CONFLICT,
            "SHOT 06 aggregate voice slot is unavailable or approved.");

        try {
            String snapshot=mapper.writeValueAsString(request);
            jdbc.sql("""
                insert into shot06_director_voice_lock(
                    episode_id,script_revision,shot_key,version,narration_sha256,payload
                ) values (:episode,3,'SHOT 06',:version,:hash,cast(:payload as jsonb))
                """).param("episode",EPISODE)
                  .param("version",request.version())
                  .param("hash",hash)
                  .param("payload",snapshot).update();
        } catch(Exception ex) {
            throw new IllegalStateException("Could not persist immutable Director SHOT 06 voice lock.",ex);
        }
        return Map.of(
            "shotKey","SHOT 06","scriptRevision",3,
            "voiceClips",7,"locked",true,"alreadyImported",false,
            "message","Director-LOCKED SHOT 06 v3 is imported to seven Voice Agent clips. Earlier SHOTs and LOCKED Script revision are unchanged."
        );
    }

    private static String sha(String input) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch(Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
}
