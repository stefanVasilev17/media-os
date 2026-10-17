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
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.util.StringUtils;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/voice-clips")
public class VoiceClipController {

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final ElevenLabsTextToSpeechService tts;
    private final ProductionMemoryService memory;

    public VoiceClipController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            ElevenLabsTextToSpeechService tts,
            ProductionMemoryService memory
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.tts = tts;
        this.memory = memory;
    }

    public record ClipDefinition(
            @NotBlank String clipKey,
            @Positive int sequence,
            @PositiveOrZero int startSecond,
            @Positive int endSecond,
            @NotBlank String narration,
            String voiceDirection
    ) {}

    public record ShotBundle(
            @NotBlank String shotKey,
            @NotBlank String title,
            @PositiveOrZero int startSecond,
            @Positive int endSecond,
            @NotBlank String narration,
            String voiceDirection,
            @NotEmpty List<@Valid ClipDefinition> clips
    ) {}

    public record SyncRequest(@Positive int scriptRevision, @NotEmpty List<@Valid ShotBundle> shots) {}

    public record GenerateRequest(
            @Positive int scriptRevision,
            String previousText,
            String nextText,
            Map<String, Object> voiceSettings,
            String performanceDirection,
            String correction
    ) {}

    public record ApproveRequest(@Positive int scriptRevision) {}
    public record UpdateNarrationRequest(@Positive int scriptRevision, @NotBlank String narration) {}

    public record StudioDirectorHandoffRequest(@Positive int scriptRevision, boolean directorConfirmed) {}

    @Transactional
    @PostMapping("/shots/{shotKey}/activate-approved-studio-voice")
    public Map<String,Object> activateApprovedStudioVoice(
            @PathVariable String shotKey, @Valid @RequestBody StudioDirectorHandoffRequest request) {
        assertLockedScriptRevision(request.scriptRevision());
        String key=normalizeShotKey(shotKey);
        if(!"SHOT 05".equals(key) || !request.directorConfirmed())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Only Director-approved SHOT 05 Studio voice may enter the legacy Visual Agent.");

        long visualLocks=jdbc.sql("""
            select count(*) from visual_shot_lock
            where episode_id=:episode and script_revision=:revision and shot_key='SHOT 05'
            """).param("episode",ProductionOverviewService.EPISODE_ID)
              .param("revision",request.scriptRevision()).query(Long.class).single();
        if(visualLocks!=0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "SHOT 05 has an existing Director video LOCK; legacy voice promotion is prohibited.");

        UUID sourceId=jdbc.sql("""
            select id from studio_shot where episode_id=:episode
              and legacy_source_shot_key='SHOT 05'
              and legacy_source_script_revision=:revision for update
            """).param("episode",ProductionOverviewService.EPISODE_ID)
              .param("revision",request.scriptRevision()).query(UUID.class).optional()
              .orElseThrow(()->new ResponseStatusException(HttpStatus.CONFLICT,
                  "No matching approved SHOT 05 Studio working copy."));

        record StageVoice(int sequence,String narration,String direction,byte[] audio,
                          String contentType,String alignment,OffsetDateTime approvedAt) {}
        List<StageVoice> studio=jdbc.sql("""
            select sequence,narration,voice_direction,generated_audio,
                   generated_audio_content_type,generated_alignment::text,approved_at
            from studio_clip where shot_id=:shot order by sequence for update
            """).param("shot",sourceId).query((rs,n)->new StageVoice(
                rs.getInt("sequence"),rs.getString("narration"),rs.getString("voice_direction"),
                rs.getBytes("generated_audio"),rs.getString("generated_audio_content_type"),
                rs.getString("generated_alignment"),
                rs.getObject("approved_at",OffsetDateTime.class))).list();
        if(studio.size()!=7)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Exactly seven Studio voices are required.");
        for(int i=0;i<7;i++){
            StageVoice c=studio.get(i);
            if(c.sequence()!=i+1||c.approvedAt()==null||c.audio()==null||c.audio().length==0
                    ||c.alignment()==null||c.alignment().isBlank())
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "All seven Studio recordings must be generated and Director approved.");
        }

        record OriginalVoice(int sequence,String narration,String direction,byte[] audio) {}
        List<OriginalVoice> original=jdbc.sql("""
            select sequence_no,coalesce(director_narration_override,narration) as effective,
                   voice_direction,generated_audio
            from voice_clip_workflow
            where episode_id=:episode and script_revision=:revision and shot_key='SHOT 05'
            order by sequence_no for update
            """).param("episode",ProductionOverviewService.EPISODE_ID)
              .param("revision",request.scriptRevision())
              .query((rs,n)->new OriginalVoice(rs.getInt("sequence_no"),
                  rs.getString("effective"),rs.getString("voice_direction"),
                  rs.getBytes("generated_audio"))).list();
        if(original.size()!=7)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Legacy SHOT 05 clip count changed. Nothing was modified.");
        for(int i=1;i<=6;i++){
            OriginalVoice old=original.get(i);
            StageVoice approved=studio.get(i);
            if(old.sequence()!=i+1||!old.narration().equals(approved.narration())
                    ||!java.util.Objects.equals(old.direction(),approved.direction())
                    ||!java.util.Arrays.equals(old.audio(),approved.audio()))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Legacy C02–C07 differs from the Director-approved Studio source at C0"+(i+1)
                        +". Nothing was modified.");
        }

        OriginalVoice legacyC01=original.get(0);
        StageVoice approvedC01=studio.get(0);
        if(legacyC01.sequence()!=1 ||
                !java.util.Objects.equals(legacyC01.direction(),approvedC01.direction()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Legacy C01 voice direction does not match the Director-approved Studio copy.");

        boolean replaceC01=!legacyC01.narration().equals(approvedC01.narration())
                ||!java.util.Arrays.equals(legacyC01.audio(),approvedC01.audio());
        if(replaceC01){
            int archived=jdbc.sql("""
                insert into episode_shot05_voice_revision_archive(
                    id,episode_id,script_revision,source_version,record_type,record_key,snapshot,audio
                )
                select gen_random_uuid(),v.episode_id,v.script_revision,'STUDIO_PRE',
                    'CLIP',v.clip_key,
                    to_jsonb(v)-'generated_audio',v.generated_audio
                from voice_clip_workflow v
                where v.episode_id=:episode and v.script_revision=:revision
                  and v.clip_key='SHOT 05-C01'
                on conflict(episode_id,script_revision,source_version,record_type,record_key)
                do nothing
                """).param("episode",ProductionOverviewService.EPISODE_ID)
                  .param("revision",request.scriptRevision()).update();
            if(archived!=1)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Previous C01 archive already exists. Refusing to replace another Director audio version.");
            jdbc.sql("""
                update voice_clip_workflow set
                    director_narration_override=:narration,
                    generated_audio=:audio,
                    generated_audio_content_type=:contentType,
                    generated_audio_file_name='SHOT05_C01_STUDIO_DIRECTOR_APPROVED.mp3',
                    generated_alignment=cast(:alignment as jsonb),
                    generated_voice_id=null,generated_model_id=null,
                    generation_revision=generation_revision+1,
                    voice_generated_at=now(),voice_approved_at=:approved,
                    updated_at=now()
                where episode_id=:episode and script_revision=:revision and clip_key='SHOT 05-C01'
                """).param("narration",approvedC01.narration())
                  .param("audio",approvedC01.audio())
                  .param("contentType",approvedC01.contentType()==null?"audio/mpeg":approvedC01.contentType())
                  .param("alignment",approvedC01.alignment())
                  .param("approved",approvedC01.approvedAt())
                  .param("episode",ProductionOverviewService.EPISODE_ID)
                  .param("revision",request.scriptRevision()).update();
        }
        int c07=jdbc.sql("""
            update voice_clip_workflow set voice_approved_at=:approved,updated_at=now()
            where episode_id=:episode and script_revision=:revision
              and clip_key='SHOT 05-C07' and voice_approved_at is null
            """).param("approved",studio.get(6).approvedAt())
              .param("episode",ProductionOverviewService.EPISODE_ID)
              .param("revision",request.scriptRevision()).update();

        boolean aggregateReady=jdbc.sql("""
            select voice_approved_at is not null and visual_sync_ready_at is not null
            from voice_shot_workflow where episode_id=:episode
              and script_revision=:revision and shot_key='SHOT 05'
            """).param("episode",ProductionOverviewService.EPISODE_ID)
              .param("revision",request.scriptRevision()).query(Boolean.class).single();
        if(replaceC01||c07>0||!aggregateReady){
            refreshShotNarration(request.scriptRevision(),key);
            rebuildShotAggregateIfReady(request.scriptRevision(),key);
        }
        Map<String,Object> result=new LinkedHashMap<>();
        result.put("ready",true);
        result.put("shotKey",key);
        result.put("legacyApprovedClips",7);
        result.put("studioC01Activated",replaceC01);
        result.put("studioC07ApprovalActivated",c07==1);
        result.put("previousC01Archived",replaceC01);
        result.put("legacyVisualSyncReady",true);
        result.put("directorLocksPreserved",true);
        return result;
    }

    @Transactional
    @PostMapping("/shots/{shotKey}/refresh-anchors")
    public Map<String, Object> refreshApprovedShotAnchors(
            @PathVariable String shotKey, @Valid @RequestBody ApproveRequest request
    ) {
        assertLockedScriptRevision(request.scriptRevision());
        String key = normalizeShotKey(shotKey);
        if (!"SHOT 05".equals(key)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Anchor recalculation is limited to the approved SHOT 05 vocabulary migration.");
        }
        long locks = jdbc.sql("""
                select count(*) from visual_shot_lock
                where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision()).param("shotKey", key)
                .query(Long.class).single();
        if (locks > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A Director LOCKED video cannot be changed.");
        }
        Map<String, Object> current = jdbc.sql("""
                select alignment::text, remotion_render_id
                from voice_shot_workflow
                where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                for update
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision()).param("shotKey", key)
                .query((rs, n) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("alignment", readMap(rs.getString("alignment")));
                    row.put("renderId", rs.getObject("remotion_render_id"));
                    return row;
                }).single();
        Map<String, Object> alignment = asMap(current.get("alignment"));
        if (asMap(alignment.get("unresolvedAnchors")).isEmpty()) {
            return Map.of("ready", true, "changed", false, "message", "All approved semantic anchors were already resolved.");
        }
        if (current.get("renderId") != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT 05 has an existing rendered video. Review it before rebuilding voice alignment metadata.");
        }
        List<Map<String, Object>> approved = clips(request.scriptRevision()).stream()
                .filter(c -> key.equals(c.get("shotKey"))).toList();
        if (approved.size() != 7 || approved.stream().anyMatch(c -> !Boolean.TRUE.equals(c.get("approved")))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "All seven SHOT 05 voice clips must be approved before resolving semantic anchors.");
        }
        rebuildShotAggregateIfReady(request.scriptRevision(), key);
        Map<String, Object> updated = jdbc.sql("""
                select alignment::text from voice_shot_workflow
                where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision()).param("shotKey", key)
                .query((rs, n) -> readMap(rs.getString("alignment"))).single();
        Map<String, Object> missing = asMap(updated.get("unresolvedAnchors"));
        if (!missing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Approved audio still does not contain phrases for semantic anchors: "
                            + String.join(", ", missing.keySet()));
        }
        return Map.of("ready", true, "changed", true,
                "message", "SHOT 05 semantic anchors were updated using existing approved TTS timestamps; audio unchanged.");
    }

    @PostMapping("/sync")
    public List<Map<String, Object>> sync(@Valid @RequestBody SyncRequest request) {
        assertLockedScriptRevision(request.scriptRevision());
        memory.preflight("VOICE", "SYNC_CLIPS");

        for (ShotBundle shot : request.shots()) {
            String shotKey = normalizeShotKey(shot.shotKey());
            if (shot.endSecond() <= shot.startSecond()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, shotKey + " has an invalid time range.");
            }

            jdbc.sql("""
                    insert into voice_shot_workflow(
                      id, episode_id, script_revision, shot_key, shot_title, start_second, end_second,
                      narration, voice_direction, updated_at
                    ) values (
                      :id,:episodeId,:revision,:shotKey,:title,:start,:end,:narration,:voiceDirection,now()
                    )
                    on conflict (episode_id, script_revision, shot_key) do update
                    set shot_title=excluded.shot_title,
                        start_second=excluded.start_second,
                        end_second=excluded.end_second,
                        narration=excluded.narration,
                        voice_direction=excluded.voice_direction,
                        updated_at=now()
                    """)
                    .param("id", UUID.randomUUID())
                    .param("episodeId", ProductionOverviewService.EPISODE_ID)
                    .param("revision", request.scriptRevision())
                    .param("shotKey", shotKey)
                    .param("title", shot.title().trim())
                    .param("start", shot.startSecond())
                    .param("end", shot.endSecond())
                    .param("narration", shot.narration().trim())
                    .param("voiceDirection", safe(shot.voiceDirection()))
                    .update();

            for (ClipDefinition clip : shot.clips()) {
                if (clip.endSecond() <= clip.startSecond()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, clip.clipKey() + " has an invalid time range.");
                }
                String clipKey = normalizeClipKey(clip.clipKey());
                jdbc.sql("""
                        insert into voice_clip_workflow(
                          id, episode_id, script_revision, shot_key, clip_key, sequence_no,
                          start_second, end_second, narration, voice_direction, updated_at
                        ) values (
                          :id,:episodeId,:revision,:shotKey,:clipKey,:sequence,
                          :start,:end,:narration,:voiceDirection,now()
                        )
                        on conflict (episode_id, script_revision, clip_key) do update
                        set shot_key=excluded.shot_key,
                            sequence_no=excluded.sequence_no,
                            start_second=excluded.start_second,
                            end_second=excluded.end_second,
                            generated_audio=case when coalesce(voice_clip_workflow.director_narration_override,voice_clip_workflow.narration)=coalesce(voice_clip_workflow.director_narration_override,excluded.narration) then voice_clip_workflow.generated_audio else null end,
                            generated_audio_content_type=case when coalesce(voice_clip_workflow.director_narration_override,voice_clip_workflow.narration)=coalesce(voice_clip_workflow.director_narration_override,excluded.narration) then voice_clip_workflow.generated_audio_content_type else null end,
                            generated_audio_file_name=case when coalesce(voice_clip_workflow.director_narration_override,voice_clip_workflow.narration)=coalesce(voice_clip_workflow.director_narration_override,excluded.narration) then voice_clip_workflow.generated_audio_file_name else null end,
                            generated_alignment=case when coalesce(voice_clip_workflow.director_narration_override,voice_clip_workflow.narration)=coalesce(voice_clip_workflow.director_narration_override,excluded.narration) then voice_clip_workflow.generated_alignment else null end,
                            voice_generated_at=case when coalesce(voice_clip_workflow.director_narration_override,voice_clip_workflow.narration)=coalesce(voice_clip_workflow.director_narration_override,excluded.narration) then voice_clip_workflow.voice_generated_at else null end,
                            voice_approved_at=case when coalesce(voice_clip_workflow.director_narration_override,voice_clip_workflow.narration)=coalesce(voice_clip_workflow.director_narration_override,excluded.narration) then voice_clip_workflow.voice_approved_at else null end,
                            narration=excluded.narration,
                            voice_direction=excluded.voice_direction,
                            updated_at=now()
                        """)
                        .param("id", UUID.randomUUID())
                        .param("episodeId", ProductionOverviewService.EPISODE_ID)
                        .param("revision", request.scriptRevision())
                        .param("shotKey", shotKey)
                        .param("clipKey", clipKey)
                        .param("sequence", clip.sequence())
                        .param("start", clip.startSecond())
                        .param("end", clip.endSecond())
                        .param("narration", clip.narration().trim())
                        .param("voiceDirection", safe(clip.voiceDirection()))
                        .update();
            }

            List<String> expectedClipKeys = shot.clips().stream()
                    .map(clip -> normalizeClipKey(clip.clipKey()))
                    .toList();
            List<String> existingClipKeys = jdbc.sql("""
                    select clip_key
                    from voice_clip_workflow
                    where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                    """)
                    .param("episodeId", ProductionOverviewService.EPISODE_ID)
                    .param("revision", request.scriptRevision())
                    .param("shotKey", shotKey)
                    .query(String.class)
                    .list();
            boolean removedObsoleteClip = false;
            for (String existingClipKey : existingClipKeys) {
                if (expectedClipKeys.contains(existingClipKey)) continue;
                jdbc.sql("""
                        delete from voice_clip_workflow
                        where episode_id=:episodeId and script_revision=:revision and clip_key=:clipKey
                        """)
                        .param("episodeId", ProductionOverviewService.EPISODE_ID)
                        .param("revision", request.scriptRevision())
                        .param("clipKey", existingClipKey)
                        .update();
                removedObsoleteClip = true;
            }

            refreshShotNarration(request.scriptRevision(), shotKey);

            Map<String, Long> clipProgress = jdbc.sql("""
                    select count(*) total,
                           count(*) filter (where voice_approved_at is not null) approved
                    from voice_clip_workflow
                    where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                    """)
                    .param("episodeId", ProductionOverviewService.EPISODE_ID)
                    .param("revision", request.scriptRevision())
                    .param("shotKey", shotKey)
                    .query((rs, rowNum) -> Map.of(
                            "total", rs.getLong("total"),
                            "approved", rs.getLong("approved")
                    ))
                    .single();

            boolean aggregateReady = jdbc.sql("""
                    select voice_approved_at is not null and visual_sync_ready_at is not null
                    from voice_shot_workflow
                    where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                    """)
                    .param("episodeId", ProductionOverviewService.EPISODE_ID)
                    .param("revision", request.scriptRevision())
                    .param("shotKey", shotKey)
                    .query(Boolean.class)
                    .single();

            if (clipProgress.get("total") > clipProgress.get("approved")) {
                invalidateShotAggregate(request.scriptRevision(), shotKey);
            } else if (clipProgress.get("total") > 0 && (removedObsoleteClip || !aggregateReady)) {
                rebuildShotAggregateIfReady(request.scriptRevision(), shotKey);
            }
        }
        return clips(request.scriptRevision());
    }

    @GetMapping
    public List<Map<String, Object>> clips(@RequestParam int scriptRevision) {
        assertLockedScriptRevision(scriptRevision);
        return jdbc.sql("""
                select clip_key, shot_key, sequence_no, start_second, end_second,
                       coalesce(director_narration_override,narration) as narration,
                       director_narration_override is not null as narration_overridden,
                       voice_direction,
                       generated_audio is not null as generated,
                       generated_audio_content_type, generated_audio_file_name,
                       generated_alignment::text, generated_voice_id, generated_model_id,
                       generation_revision, voice_generated_at, voice_approved_at, updated_at
                from voice_clip_workflow
                where episode_id=:episodeId and script_revision=:revision
                order by start_second, shot_key, sequence_no
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", scriptRevision)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("clipKey", rs.getString("clip_key"));
                    row.put("shotKey", rs.getString("shot_key"));
                    row.put("sequence", rs.getInt("sequence_no"));
                    row.put("startSecond", rs.getInt("start_second"));
                    row.put("endSecond", rs.getInt("end_second"));
                    row.put("narration", rs.getString("narration"));
                    row.put("voiceDirection", rs.getString("voice_direction"));
                    row.put("narrationOverridden", rs.getBoolean("narration_overridden"));
                    row.put("generated", rs.getBoolean("generated"));
                    row.put("generatedAudioContentType", rs.getString("generated_audio_content_type"));
                    row.put("generatedAudioFileName", rs.getString("generated_audio_file_name"));
                    Map<String, Object> alignment = readMap(rs.getString("generated_alignment"));
                    row.put("generatedAlignment", alignment);
                    double leadingTrimSeconds = leadingTrimSeconds(alignment);
                    row.put("leadingTrimSeconds", leadingTrimSeconds);
                    row.put("playbackEndSeconds", playbackEndSeconds(alignment));
                    row.put("durationSeconds", alignmentDuration(alignment));
                    row.put("generatedVoiceId", rs.getString("generated_voice_id"));
                    row.put("generatedModelId", rs.getString("generated_model_id"));
                    row.put("generationRevision", rs.getInt("generation_revision"));
                    row.put("generatedAt", rs.getObject("voice_generated_at", OffsetDateTime.class));
                    OffsetDateTime approved = rs.getObject("voice_approved_at", OffsetDateTime.class);
                    row.put("approved", approved != null);
                    row.put("approvedAt", approved);
                    row.put("updatedAt", rs.getObject("updated_at", OffsetDateTime.class));
                    return row;
                })
                .list();
    }

    @PutMapping("/{clipKey}/narration")
    public Map<String, Object> updateNarration(@PathVariable String clipKey, @Valid @RequestBody UpdateNarrationRequest request) {
        assertLockedScriptRevision(request.scriptRevision());
        String key = normalizeClipKey(clipKey);
        Map<String, Object> clip = clipState(request.scriptRevision(), key);
        if (Boolean.TRUE.equals(clip.get("approved"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This voice clip is LOCKED. Approved narration cannot be edited.");
        }
        String narration = request.narration().trim();
        if (narration.length() > 5000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Narration is too long for one voice clip.");
        }

        jdbc.sql("""
                update voice_clip_workflow
                set director_narration_override=:narration,
                    generated_audio=null,
                    generated_audio_content_type=null,
                    generated_audio_file_name=null,
                    generated_alignment=null,
                    voice_generated_at=null,
                    voice_approved_at=null,
                    updated_at=now()
                where episode_id=:episodeId and script_revision=:revision and clip_key=:clipKey
                """)
                .param("narration", narration)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision())
                .param("clipKey", key)
                .update();

        String shotKey = String.valueOf(clip.get("shotKey"));
        invalidateShotAggregate(request.scriptRevision(), shotKey);
        refreshShotNarration(request.scriptRevision(), shotKey);
        return clipState(request.scriptRevision(), key);
    }

    @PostMapping("/{clipKey}/generate")
    public Map<String, Object> generate(@PathVariable String clipKey, @Valid @RequestBody GenerateRequest request) {
        assertLockedScriptRevision(request.scriptRevision());
        String key = normalizeClipKey(clipKey);
        Map<String, Object> clip = clipState(request.scriptRevision(), key);
        if (Boolean.TRUE.equals(clip.get("approved"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This voice clip is LOCKED. Approved audio cannot be regenerated.");
        }
        memory.preflight("VOICE", "GENERATE_CLIP");
        if (request.correction() != null && !request.correction().isBlank()) {
            memory.rememberCorrection("VOICE", request.correction().trim(), "Voice Agent · " + key);
        }
        if (!tts.configured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ElevenLabs TTS is not configured.");
        }

        ElevenLabsTextToSpeechService.GenerationResult generated;
        try {
            generated = tts.generate(
                    key,
                    String.valueOf(clip.get("narration")),
                    request.previousText(),
                    request.nextText(),
                    request.voiceSettings() == null ? Map.of() : request.voiceSettings(),
                    StringUtils.hasText(request.performanceDirection())
                            ? request.performanceDirection().trim()
                            : String.valueOf(clip.getOrDefault("voiceDirection", ""))
            );
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, ex.getMessage(), ex);
        }

        Map<String, Object> alignment = new LinkedHashMap<>(generated.alignmentResponse());
        alignment.put("provider", "ELEVENLABS_TTS_WITH_TIMESTAMPS");
        alignment.put("requestId", generated.requestId());
        alignment.put("outputFormat", generated.outputFormat());
        alignment.put("voiceSettings", request.voiceSettings() == null || request.voiceSettings().isEmpty()
                ? tts.voiceSettings()
                : request.voiceSettings());
        alignment.put("performanceDirection", StringUtils.hasText(request.performanceDirection())
                ? request.performanceDirection().trim()
                : String.valueOf(clip.getOrDefault("voiceDirection", "")));
        alignment.put("audioTagPrompting", tts.supportsAudioTags());

        jdbc.sql("""
                update voice_clip_workflow
                set generated_audio=:audio,
                    generated_audio_content_type=:contentType,
                    generated_audio_file_name=:fileName,
                    generated_alignment=cast(:alignment as jsonb),
                    generated_voice_id=:voiceId,
                    generated_model_id=:modelId,
                    generation_revision=generation_revision+1,
                    voice_generated_at=now(),
                    voice_approved_at=null,
                    updated_at=now()
                where episode_id=:episodeId and script_revision=:revision and clip_key=:clipKey
                """)
                .param("audio", generated.audio())
                .param("contentType", generated.contentType())
                .param("fileName", generated.fileName())
                .param("alignment", writeJson(alignment))
                .param("voiceId", generated.voiceId())
                .param("modelId", generated.modelId())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision())
                .param("clipKey", key)
                .update();

        invalidateShotAggregate(request.scriptRevision(), String.valueOf(clip.get("shotKey")));
        return clipState(request.scriptRevision(), key);
    }

    @PostMapping("/{clipKey}/approve")
    public Map<String, Object> approve(@PathVariable String clipKey, @Valid @RequestBody ApproveRequest request) {
        assertLockedScriptRevision(request.scriptRevision());
        String key = normalizeClipKey(clipKey);
        Map<String, Object> clip = clipState(request.scriptRevision(), key);
        if (!Boolean.TRUE.equals(clip.get("generated"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Generate this voice clip before approving it.");
        }
        Map<String, Object> alignment = asMap(clip.get("generatedAlignment"));
        if (wordRowsFromTtsAlignment(alignment).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "This voice clip has no usable ElevenLabs timing data.");
        }

        memory.preflight("VOICE", "APPROVE_CLIP");
        jdbc.sql("""
                update voice_clip_workflow
                set voice_approved_at=now(), updated_at=now()
                where episode_id=:episodeId and script_revision=:revision and clip_key=:clipKey
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", request.scriptRevision())
                .param("clipKey", key)
                .update();

        rebuildShotAggregateIfReady(request.scriptRevision(), String.valueOf(clip.get("shotKey")));
        return clipState(request.scriptRevision(), key);
    }

    @GetMapping("/{clipKey}/audio")
    public ResponseEntity<byte[]> audio(
            @PathVariable String clipKey,
            @RequestParam int scriptRevision,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String range
    ) {
        assertLockedScriptRevision(scriptRevision);
        String key = normalizeClipKey(clipKey);
        return jdbc.sql("""
                select generated_audio, generated_audio_content_type, generated_audio_file_name
                from voice_clip_workflow
                where episode_id=:episodeId and script_revision=:revision and clip_key=:clipKey
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", scriptRevision)
                .param("clipKey", key)
                .query((rs, rowNum) -> rangeResponse(
                        rs.getBytes("generated_audio"),
                        rs.getString("generated_audio_content_type"),
                        rs.getString("generated_audio_file_name"),
                        range
                ))
                .single();
    }

    private void refreshShotNarration(int revision, String shotKey) {
        String narration = jdbc.sql("""
                select string_agg(coalesce(director_narration_override,narration), E'\n\n' order by sequence_no)
                from voice_clip_workflow
                where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("shotKey", shotKey)
                .query(String.class)
                .optional()
                .orElse("");

        jdbc.sql("""
                update voice_shot_workflow
                set narration=:narration, updated_at=now()
                where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                """)
                .param("narration", narration)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("shotKey", shotKey)
                .update();
    }

    private void invalidateShotAggregate(int revision, String shotKey) {
        jdbc.sql("""
                update voice_shot_workflow
                set voice_approved_at=null, recorded_at=null, alignment=null, aligned_at=null,
                    visual_sync_spec=null, visual_sync_markdown=null, visual_sync_ready_at=null,
                    remotion_synced_at=null, remotion_render_id=null, rendered_generation_revision=null,
                    rendered_at=null, updated_at=now()
                where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("shotKey", shotKey)
                .update();
    }

    static double shot05OpeningSilenceSeconds(String shotKey, List<Map<String, Object>> orderedClips) {
        if (!"SHOT 05".equals(shotKey) || orderedClips.isEmpty()) return 0.0d;
        Object narration = orderedClips.get(0).get("narration");
        return narration instanceof String text
                && (text.startsWith("Now we know where the request is going.")
                    || text.startsWith("The API Gateway is the first stop for our login request"))
                ? 1.25d : 0.0d;
    }

    private void rebuildShotAggregateIfReady(int revision, String shotKey) {
        List<Map<String, Object>> shotClips = clips(revision).stream()
                .filter(clip -> shotKey.equals(clip.get("shotKey")))
                .sorted(Comparator.comparingInt(clip -> ((Number) clip.get("sequence")).intValue()))
                .toList();
        if (shotClips.isEmpty() || shotClips.stream().anyMatch(clip -> !Boolean.TRUE.equals(clip.get("approved")))) {
            invalidateShotAggregate(revision, shotKey);
            return;
        }

        List<Map<String, Object>> combinedWords = new ArrayList<>();
        List<Map<String, Object>> audioClips = new ArrayList<>();
        double offset = shot05OpeningSilenceSeconds(shotKey, shotClips);

        for (Map<String, Object> clip : shotClips) {
            Map<String, Object> alignment = asMap(clip.get("generatedAlignment"));
            List<Map<String, Object>> localWords = wordRowsFromTtsAlignment(alignment);
            double trimStart = leadingTrimSeconds(alignment);
            double playbackEnd = playbackEndSeconds(alignment);
            double duration = Math.max(0.0d, playbackEnd - trimStart);
            for (Map<String, Object> word : localWords) {
                Map<String, Object> shifted = new LinkedHashMap<>();
                shifted.put("text", word.get("text"));
                shifted.put("start", round3(Math.max(0.0d, numberValue(word.get("start")) - trimStart) + offset));
                shifted.put("end", round3(Math.max(0.0d, numberValue(word.get("end")) - trimStart) + offset));
                combinedWords.add(shifted);
            }
            Map<String, Object> audio = new LinkedHashMap<>();
            audio.put("clipKey", clip.get("clipKey"));
            audio.put("generationRevision", clip.get("generationRevision"));
            audio.put("startSeconds", round3(offset));
            audio.put("sourceStartSeconds", round3(trimStart));
            audio.put("sourceEndSeconds", round3(playbackEnd));
            audio.put("durationSeconds", round3(duration));
            audioClips.add(audio);
            offset += duration;
        }

        LinkedHashMap<String, String> phrases = Ep001SemanticAnchorCatalog.anchorsFor(shotKey);
        LinkedHashMap<String, Double> anchors = resolveSemanticAnchors(combinedWords, phrases);
        LinkedHashMap<String, String> unresolved = new LinkedHashMap<>();
        phrases.forEach((anchor, phrase) -> {
            if (!anchors.containsKey(anchor)) unresolved.put(anchor, phrase);
        });
        if (anchors.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Approved clips are ready, but no semantic anchors could be resolved for " + shotKey + ".");
        }

        Map<String, Object> shot = shotRow(revision, shotKey);
        Map<String, Object> alignmentPayload = new LinkedHashMap<>();
        alignmentPayload.put("provider", "ELEVENLABS_TTS_CLIPS_WITH_TIMESTAMPS");
        alignmentPayload.put("durationSeconds", round3(offset));
        alignmentPayload.put("words", combinedWords);
        alignmentPayload.put("anchors", anchors);
        alignmentPayload.put("anchorPhrases", phrases);
        alignmentPayload.put("unresolvedAnchors", unresolved);
        alignmentPayload.put("audioClips", audioClips);

        List<Map<String, Object>> events = anchors.entrySet().stream().map(entry -> {
            double time = entry.getValue();
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("anchor", entry.getKey());
            event.put("timeSeconds", round3(time));
            event.put("frame30fps", Math.round(time * 30.0d));
            event.put("prepareAtSeconds", round3(Math.max(0, time - 0.6d)));
            event.put("rule", "Prepare before spoken anchor; activate on anchor; voice timing wins.");
            return event;
        }).toList();

        Map<String, Object> sync = new LinkedHashMap<>();
        sync.put("schemaVersion", "2.0");
        sync.put("episodeId", ProductionOverviewService.EPISODE_ID.toString());
        sync.put("scriptRevision", revision);
        sync.put("shotKey", shotKey);
        sync.put("shotTitle", shot.get("title"));
        sync.put("audioClips", audioClips);
        sync.put("narration", shot.get("narration"));
        sync.put("voiceDirection", shot.get("voiceDirection"));
        sync.put("semanticEvents", events);
        sync.put("unresolvedAnchors", unresolved);
        sync.put("syncRule", "Voice timing wins. Remotion consumes approved clips and semantic anchors.");
        sync.put("generatedAt", OffsetDateTime.now().toString());

        jdbc.sql("""
                update voice_shot_workflow
                set voice_approved_at=now(), recorded_at=now(), audio_file_name='APPROVED_VOICE_CLIPS',
                    alignment=cast(:alignment as jsonb), aligned_at=now(),
                    visual_sync_spec=cast(:sync as jsonb),
                    visual_sync_markdown=:markdown, visual_sync_ready_at=now(),
                    generation_revision=generation_revision+1,
                    remotion_synced_at=null, remotion_render_id=null,
                    rendered_generation_revision=null, rendered_at=null, updated_at=now()
                where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                """)
                .param("alignment", writeJson(alignmentPayload))
                .param("sync", writeJson(sync))
                .param("markdown", buildMarkdown(shotKey, shot, offset, anchors, unresolved))
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("shotKey", shotKey)
                .update();
    }

    private String buildMarkdown(String shotKey, Map<String, Object> shot, double duration, LinkedHashMap<String, Double> anchors, Map<String, String> unresolved) {
        StringBuilder md = new StringBuilder();
        md.append("# ").append(shotKey).append(" — Approved Voice Clips / Visual Sync\n\n");
        md.append("- Duration: ").append(String.format(Locale.ROOT, "%.3fs", duration)).append("\n");
        md.append("- Voice timing wins.\n\n");
        md.append("| Time | Anchor |\n| ---: | --- |\n");
        anchors.forEach((anchor, time) -> md.append("| ").append(String.format(Locale.ROOT, "%.3fs", time)).append(" | ").append(anchor).append(" |\n"));
        if (!unresolved.isEmpty()) {
            md.append("\n## QA warnings\n");
            unresolved.forEach((anchor, phrase) -> md.append("- ").append(anchor).append(" → ").append(phrase).append("\n"));
        }
        md.append("\n## LOCKED narration\n\n").append(shot.get("narration")).append("\n");
        return md.toString();
    }

    private Map<String, Object> clipState(int revision, String clipKey) {
        return clips(revision).stream()
                .filter(row -> clipKey.equals(row.get("clipKey")))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Voice clip not found."));
    }

    private Map<String, Object> shotRow(int revision, String shotKey) {
        return jdbc.sql("""
                select shot_title, narration, voice_direction, start_second, end_second
                from voice_shot_workflow
                where episode_id=:episodeId and script_revision=:revision and shot_key=:shotKey
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("revision", revision)
                .param("shotKey", shotKey)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("title", rs.getString("shot_title"));
                    row.put("narration", rs.getString("narration"));
                    row.put("voiceDirection", rs.getString("voice_direction"));
                    row.put("startSecond", rs.getInt("start_second"));
                    row.put("endSecond", rs.getInt("end_second"));
                    return row;
                })
                .single();
    }

    private ResponseEntity<byte[]> rangeResponse(byte[] audio, String contentType, String fileName, String range) {
        if (audio == null || audio.length == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Generated clip audio not found.");
        MediaType mediaType;
        try { mediaType = MediaType.parseMediaType(contentType == null ? "audio/mpeg" : contentType); }
        catch (Exception ignored) { mediaType = MediaType.APPLICATION_OCTET_STREAM; }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + (fileName == null ? "voice-clip.mp3" : fileName) + "\"");
        headers.setCacheControl("private, max-age=31536000, immutable");

        if (range == null || !range.startsWith("bytes=")) {
            headers.setContentLength(audio.length);
            return new ResponseEntity<>(audio, headers, HttpStatus.OK);
        }
        long[] parsed = parseByteRange(range, audio.length);
        int start = (int) parsed[0], end = (int) parsed[1];
        byte[] slice = java.util.Arrays.copyOfRange(audio, start, end + 1);
        headers.setContentLength(slice.length);
        headers.set(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + audio.length);
        return new ResponseEntity<>(slice, headers, HttpStatus.PARTIAL_CONTENT);
    }

    private List<Map<String, Object>> wordRowsFromTtsAlignment(Map<String, Object> generatedAlignment) {
        Map<String, Object> normalized = asMap(generatedAlignment.get("normalized_alignment"));
        Map<String, Object> alignment = normalized.isEmpty() ? asMap(generatedAlignment.get("alignment")) : normalized;
        List<?> chars = alignment.get("characters") instanceof List<?> list ? list : List.of();
        List<?> starts = alignment.get("character_start_times_seconds") instanceof List<?> list ? list : List.of();
        List<?> ends = alignment.get("character_end_times_seconds") instanceof List<?> list ? list : List.of();
        int count = Math.min(chars.size(), Math.min(starts.size(), ends.size()));
        List<Map<String, Object>> words = new ArrayList<>();
        StringBuilder token = new StringBuilder();
        double tokenStart = -1, tokenEnd = -1;
        boolean insideAudioTag = false;
        for (int i = 0; i < count; i++) {
            String character = String.valueOf(chars.get(i));
            double start = numberValue(starts.get(i));
            double end = numberValue(ends.get(i));
            if ("[".equals(character)) {
                if (token.length() > 0) {
                    words.add(Map.of("text", token.toString(), "start", tokenStart, "end", tokenEnd));
                    token.setLength(0);
                }
                insideAudioTag = true;
                continue;
            }
            if ("]".equals(character) && insideAudioTag) {
                insideAudioTag = false;
                continue;
            }
            if (insideAudioTag) continue;
            if (character.matches("[A-Za-z0-9']")) {
                if (token.length() == 0) tokenStart = start;
                token.append(character);
                tokenEnd = end;
            } else if (token.length() > 0) {
                words.add(Map.of("text", token.toString(), "start", tokenStart, "end", tokenEnd));
                token.setLength(0);
            }
        }
        if (token.length() > 0) words.add(Map.of("text", token.toString(), "start", tokenStart, "end", tokenEnd));
        return words;
    }

    private LinkedHashMap<String, Double> resolveSemanticAnchors(List<Map<String, Object>> words, LinkedHashMap<String, String> phrases) {
        record Token(String value, double start) {}
        List<Token> tokens = new ArrayList<>();
        for (Map<String, Object> word : words) {
            for (String part : normalizedTokens(String.valueOf(word.getOrDefault("text", "")))) {
                tokens.add(new Token(part, numberValue(word.get("start"))));
            }
        }
        LinkedHashMap<String, Double> resolved = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : phrases.entrySet()) {
            List<String> phrase = normalizedTokens(entry.getValue());
            for (int i = 0; i <= tokens.size() - phrase.size(); i++) {
                boolean match = true;
                for (int j = 0; j < phrase.size(); j++) {
                    if (!tokens.get(i + j).value().equals(phrase.get(j))) { match = false; break; }
                }
                if (match) { resolved.put(entry.getKey(), round3(tokens.get(i).start())); break; }
            }
        }
        return resolved;
    }

    private List<String> normalizedTokens(String value) {
        String normalized = value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
        return normalized.isBlank() ? List.of() : List.of(normalized.split("\\s+"));
    }

    private double leadingTrimSeconds(Map<String, Object> alignment) {
        double firstWordStart = wordRowsFromTtsAlignment(alignment).stream()
                .map(word -> numberValue(word.get("start")))
                .filter(value -> value >= 0)
                .min(Double::compareTo)
                .orElse(0.0d);
        if (firstWordStart <= 0.45d) return 0.0d;
        return round3(Math.max(0.0d, firstWordStart - 0.12d));
    }

    private double playbackEndSeconds(Map<String, Object> alignment) {
        double lastWordEnd = wordRowsFromTtsAlignment(alignment).stream()
                .map(word -> numberValue(word.get("end")))
                .filter(value -> value >= 0)
                .max(Double::compareTo)
                .orElse(0.0d);
        if (lastWordEnd <= 0.0d) return 0.0d;
        return round3(lastWordEnd + 0.18d);
    }

    private double alignmentDuration(Map<String, Object> alignment) {
        double trimStart = leadingTrimSeconds(alignment);
        return round3(Math.max(0.0d, playbackEndSeconds(alignment) - trimStart));
    }

    private void assertLockedScriptRevision(int requested) {
        Map<String, Object> script = jdbc.sql("""
                select status, current_revision from production_stage
                where episode_id=:episodeId and stage_key='SCRIPT'
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "status", rs.getString("status"), "revision", rs.getInt("current_revision")
                ))
                .single();
        if (!"LOCKED".equals(script.get("status"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Script must be LOCKED before voice production.");
        }
        if (((Number) script.get("revision")).intValue() != requested) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Voice clips must use the current LOCKED Script revision.");
        }
    }

    private String normalizeShotKey(String raw) {
        String value = raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT).replace('_', ' ');
        if (!value.matches("SHOT \\d{2}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shot key must look like SHOT 01.");
        return value;
    }

    private String normalizeClipKey(String raw) {
        String value = raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9 _-]+", "");
        if (!value.matches("SHOT \\d{2}-C\\d{2}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Clip key must look like SHOT 01-C01.");
        }
        return value;
    }

    private long[] parseByteRange(String range, int length) {
        try {
            String[] parts = range.substring("bytes=".length()).split(",", 2)[0].trim().split("-", 2);
            long start = parts[0].isBlank() ? 0 : Long.parseLong(parts[0]);
            long end = parts.length < 2 || parts[1].isBlank() ? length - 1L : Long.parseLong(parts[1]);
            start = Math.max(0, Math.min(start, length - 1L));
            end = Math.max(start, Math.min(end, length - 1L));
            return new long[]{start, end};
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE, "Invalid audio range.");
        }
    }

    private double numberValue(Object value) {
        if (value instanceof Number n) return n.doubleValue();
        try { return value == null ? -1 : Double.parseDouble(String.valueOf(value)); }
        catch (NumberFormatException ex) { return -1; }
    }

    private double round3(double value) { return Math.round(value * 1000.0d) / 1000.0d; }
    private String safe(String value) { return value == null ? "" : value.trim(); }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> result = new LinkedHashMap<>();
            map.forEach((key, val) -> result.put(String.valueOf(key), val));
            return result;
        }
        return new LinkedHashMap<>();
    }

    private Map<String, Object> readMap(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try { return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {}); }
        catch (Exception ex) { return new LinkedHashMap<>(); }
    }

    private String writeJson(Object value) {
        try { return objectMapper.writeValueAsString(value); }
        catch (JsonProcessingException ex) { throw new IllegalStateException("Could not serialize voice clip data.", ex); }
    }
}
