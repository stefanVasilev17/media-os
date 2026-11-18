package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class EpisodePackageVoiceStudioService {
    private static final int MAX_CHARS=5000;
    private static final int MAX_WORKING_NARRATION=12000;
    private static final int MAX_TAKES_PER_SHOT=4;

    record Shot(UUID id,String shotKey,String episodeKey) {}
    record Revision(int revision,String narration,String voiceDirection) {}
    record Request(UUID shotId,int revision,String narration) {}
    record AudioRecord(byte[] legacyAudio,String objectKey,String sha256,Long bytes,String status) {}
    public record VoiceTake(UUID id,int revision,int takeNumber,String contentType,
                            String modelId,String voiceId,BigDecimal durationSeconds,
                            boolean hasAlignment,String generatedAt,String deliveryMode) {}
    public record VoiceState(UUID packageId,String shotKey,int revision,String narration,
                             String voiceDirection,String narrationSha256,
                             List<VoiceTake> takes,String selectedTakeId,
                             boolean approvedCurrentRevision,String voiceStatus,
                             String generationStatus,boolean configured,boolean paidGateEnabled,
                             boolean canGenerate,String blockedReason,String timingStatus,
                             boolean canGenerateSlow,int slowVoicePauseCount,
                             int slowVoiceLongPauseCount) {}

    private final JdbcClient jdbc;
    private final ElevenLabsTextToSpeechService elevenLabs;
    private final Ep002VoiceIdentityGuard voiceIdentity;
    private final EpisodePackageAudioDurationProbe durationProbe;
    private final MediaObjectStore mediaObjects;
    private final ObjectMapper mapper;
    private final TransactionTemplate transaction;
    private final boolean paidGateEnabled;

    public EpisodePackageVoiceStudioService(
            JdbcClient jdbc,ElevenLabsTextToSpeechService elevenLabs,
            Ep002VoiceIdentityGuard voiceIdentity,EpisodePackageAudioDurationProbe durationProbe,
            MediaObjectStore mediaObjects,ObjectMapper mapper,PlatformTransactionManager transactionManager,
            @Value("${mediaos.episode-packages.voice.writes-enabled:false}") boolean paidGateEnabled) {
        this.jdbc=jdbc;
        this.elevenLabs=elevenLabs;
        this.voiceIdentity=voiceIdentity;
        this.durationProbe=durationProbe;
        this.mediaObjects=mediaObjects;
        this.mapper=mapper;
        this.transaction=new TransactionTemplate(transactionManager);
        this.paidGateEnabled=paidGateEnabled;
    }

    public static String validatedNarration(String narration) {
        if(narration==null || narration.trim().length()<20 || narration.length()>MAX_WORKING_NARRATION)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Narration must contain 20 to 12000 characters; the single-call TTS limit is 5000.");
        return narration.trim();
    }

    public static String validatedVoiceDirection(String direction) {
        if(direction==null || direction.trim().length()<8 || direction.length()>1200)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Voice direction must contain 8 to 1200 characters.");
        return direction.trim();
    }

    static void requireDirectorPaidConfirmation(Boolean confirmed,UUID requestId,
                                                 String expectedHash) {
        if(!Boolean.TRUE.equals(confirmed) || requestId==null
                || expectedHash==null || !expectedHash.matches("[a-f0-9]{64}"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Explicit paid generation consent, request ID and current narration hash are required.");
    }

    private Shot shot(UUID packageId,String key,DirectorIdentity.Actor actor) {
        if(key==null || !key.matches("SHOT(0[1-9]|[1-3][0-9]|40)"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown SHOT key.");
        return jdbc.sql("""
                select s.id,s.shot_key,p.episode_key from episode_package_shot s
                join episode_package_import p on p.id=s.package_id
                where s.package_id=:package and s.shot_key=:shot
                  and p.director_issuer=:issuer and p.director_subject=:subject
                """)
                .param("package",packageId).param("shot",key)
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .query((rs,n)->new Shot(rs.getObject("id",UUID.class),
                        rs.getString("shot_key"),rs.getString("episode_key")))
                .optional().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "SHOT voice workspace not found for this Director."));
    }

    private Revision current(UUID shotId) {
        return jdbc.sql("""
                select revision,narration,voice_direction
                from episode_package_shot_revision
                where shot_id=:id order by revision desc limit 1
                """).param("id",shotId)
                .query((rs,n)->new Revision(rs.getInt("revision"),
                        rs.getString("narration"),rs.getString("voice_direction")))
                .optional().orElseThrow(()->new IllegalStateException(
                        "Imported SHOT has no working script revision."));
    }

    public VoiceState state(UUID packageId,String key) {
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        Shot shot=shot(packageId,key,actor);
        Revision revision=current(shot.id());
        List<VoiceTake> takes=jdbc.sql("""
                select id,revision,take_number,content_type,model_id,voice_id,
                       duration_seconds,generated_alignment::text,generated_at,
                       generated_alignment->>'mediaos_delivery_mode' as delivery_mode
                from episode_package_voice_take where shot_id=:shot
                order by revision desc,take_number desc
                """).param("shot",shot.id()).query((rs,n)->{
                    String alignment=rs.getString("generated_alignment");
                    return new VoiceTake(rs.getObject("id",UUID.class),rs.getInt("revision"),
                            rs.getInt("take_number"),rs.getString("content_type"),
                            rs.getString("model_id"),rs.getString("voice_id"),
                            rs.getBigDecimal("duration_seconds"),
                            hasRealProviderAlignment(alignment),
                            rs.getObject("generated_at",OffsetDateTime.class).toString(),
                             rs.getString("delivery_mode")==null?"STANDARD":rs.getString("delivery_mode"));
                }).list();
        UUID selected=jdbc.sql("""
                select c.take_id from episode_package_voice_choice c
                join episode_package_voice_take t on t.id=c.take_id
                where c.shot_id=:shot and c.revision=:revision
                  and t.shot_id=c.shot_id and t.revision=c.revision
                order by c.selected_at desc,c.id desc limit 1
                """).param("shot",shot.id()).param("revision",revision.revision())
                .query(UUID.class).optional().orElse(null);
        String generationStatus=jdbc.sql("""
                select status from episode_package_voice_request
                where shot_id=:shot order by started_at desc,request_id desc limit 1
                """).param("shot",shot.id()).query(String.class).optional().orElse("NONE");
        boolean unresolved=jdbc.sql("""
                select exists(select 1 from episode_package_voice_request
                  where shot_id=:shot and status in ('IN_FLIGHT','UNCERTAIN'))
                """).param("shot",shot.id()).query(Boolean.class).single();
        boolean ep003SlowOnly="EP003".equals(shot.episodeKey());
        boolean allTakesUsed=takes.size()>=MAX_TAKES_PER_SHOT;
        boolean priorEp003Attempt=ep003SlowOnly&&jdbc.sql("""
                select exists(select 1 from episode_package_voice_request where shot_id=:shot)
                """).param("shot",shot.id()).query(Boolean.class).single();
        boolean firstTakeAlreadyCreated=ep003SlowOnly&&(!takes.isEmpty()||priorEp003Attempt);
        boolean tooLong=revision.narration().length()>MAX_CHARS;
        Ep002VoiceIdentityGuard.Check profile=voiceIdentity.inspect("EP002");
        String blocker=!paidGateEnabled?"New episode ElevenLabs generation is disabled by the server spend gate."
                :!mediaObjects.writable()?"Private verified voice object storage is not ready; paid generation blocked."
                :!elevenLabs.configured()?"ElevenLabs is not configured."
                :!profile.verified()?profile.blockedReason()
                :unresolved?"A prior paid request is IN_FLIGHT or UNCERTAIN. Reconcile it before another attempt."
                :ep003SlowOnly&&!elevenV4()?"EP003 requires a verified Eleven v4 Slow Natural model; STANDARD is blocked."
                :firstTakeAlreadyCreated?"EP003 first Slow Intake Take already exists; listen and approve it. No automatic regeneration."
                :allTakesUsed?"Safety limit: maximum four generated takes per SHOT."
                :tooLong?"Narration exceeds the 5000-character TTS safety limit.":"";
        boolean canGenerate=blocker.isEmpty();
        VoiceTake chosen=selected==null?null:takes.stream().filter(t->t.id().equals(selected))
                .findFirst().orElse(null);
        String timingStatus=chosen==null?"NO_APPROVED_TAKE"
                :chosen.durationSeconds()==null?"MEASURED_DURATION_MISSING"
                :!chosen.hasAlignment()?"REAL_CUE_TIMING_UNVERIFIED"
                :"MEASURED_DURATION_AND_PROVIDER_ALIGNMENT_PRESENT";
        String voiceStatus=chosen==null
                ?takes.stream().anyMatch(t->t.revision()==revision.revision())?"TAKES_NEED_DIRECTOR_APPROVAL"
                :"PENDING_VOICE"
                :"VOICE_APPROVED_TIMING_REVIEW_REQUIRED";
        SlowNaturalVoicePrompt.Plan slowPlan=null;
        if(elevenV4()&&revision.narration().length()<=MAX_CHARS) {
            try {
                slowPlan=SlowNaturalVoicePrompt.plan(revision.narration(),elevenLabs.modelId());
            } catch(IllegalArgumentException invalid) {
                // Standard voice remains available when Slow Natural is not eligible.
            }
        }
        return new VoiceState(packageId,key,revision.revision(),
                revision.narration(),revision.voiceDirection(),
                EpisodePackageValidator.sha256(revision.narration()),
                takes,selected==null?null:selected.toString(),selected!=null,
                voiceStatus,generationStatus,elevenLabs.configured(),paidGateEnabled,
                canGenerate,blocker,timingStatus,
                 canGenerate&&slowPlan!=null,
                 slowPlan==null?0:slowPlan.pauseCount(),
                 slowPlan==null?0:slowPlan.longPauseCount());
    }

    static boolean hasRealProviderAlignment(String json) {
        if(json==null || json.isBlank())return false;
        try {
            JsonNode root=new ObjectMapper().readTree(json);
            for(String field:List.of("alignment","normalized_alignment")) {
                JsonNode alignment=root.path(field);
                JsonNode characters=alignment.path("characters");
                JsonNode starts=alignment.path("character_start_times_seconds");
                JsonNode ends=alignment.path("character_end_times_seconds");
                if(characters.isArray() && characters.size()>0
                        && starts.isArray() && ends.isArray()
                        && starts.size()==characters.size()
                        && ends.size()==characters.size())return true;
            }
        } catch(JsonProcessingException malformed) {
            return false;
        }
        return false;
    }

    @Transactional
    public VoiceState save(UUID packageId,String key,int expectedRevision,
                           String narration,String direction) {
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        Shot shot=shot(packageId,key,actor);
        if("EP003".equals(shot.episodeKey()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "EP003 Script Pass v0.4 is Director-LOCKED. Voice Studio cannot edit it.");
        String checked=validatedNarration(narration);
        String instructions=validatedVoiceDirection(direction);
        lockShot(shot.id());
        Revision old=current(shot.id());
        if(old.revision()!=expectedRevision)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Working narration changed. Reload before saving.");
        if(old.narration().equals(checked) && old.voiceDirection().equals(instructions))
            return state(packageId,key);
        jdbc.sql("""
                insert into episode_package_shot_revision(
                    id,shot_id,revision,narration,voice_direction,actor_issuer,actor_subject
                ) values (:id,:shot,:revision,:narration,:direction,:issuer,:subject)
                """)
                .param("id",UUID.randomUUID()).param("shot",shot.id())
                .param("revision",old.revision()+1).param("narration",checked)
                .param("direction",instructions).param("issuer",actor.issuer())
                .param("subject",actor.subject()).update();
        return state(packageId,key);
    }

    private void lockShot(UUID shotId) {
        jdbc.sql("select id from episode_package_shot where id=:shot for update")
                .param("shot",shotId).query(UUID.class).single();
    }

    private boolean elevenV4() {
        return elevenLabs.modelId()!=null&&elevenLabs.modelId().startsWith("eleven_v4");
    }

    static void requireEp003SlowFirst(String episodeKey,String deliveryMode,
                                     boolean priorPaidRequestOrTake) {
        if(!"EP003".equals(episodeKey))return;
        if(!"SLOW_NATURAL".equals(deliveryMode))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "EP003 requires Slow Natural first Take. STANDARD paid generation is forbidden.");
        if(priorPaidRequestOrTake)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "EP003 already used its first paid request. Do not regenerate or retry without new Director authorization.");
    }

    public VoiceState generate(UUID packageId,String key,int expectedRevision,
                               String expectedHash,UUID requestId,Boolean confirmPaid) {
        return generate(packageId,key,expectedRevision,expectedHash,requestId,confirmPaid,"STANDARD");
    }

    public VoiceState generate(UUID packageId,String key,int expectedRevision,
                               String expectedHash,UUID requestId,Boolean confirmPaid,
                               String deliveryMode) {
        String selectedMode=deliveryMode==null?"STANDARD":deliveryMode;
        if(!"STANDARD".equals(selectedMode)&&!"SLOW_NATURAL".equals(selectedMode))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unsupported voice delivery mode.");
        boolean slow="SLOW_NATURAL".equals(selectedMode);
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        requireDirectorPaidConfirmation(confirmPaid,requestId,expectedHash);
        if(!paidGateEnabled)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "New episode ElevenLabs paid generation is disabled by the server gate.");
        mediaObjects.requireWritable();
        if(!elevenLabs.configured())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "ElevenLabs TTS is not configured.");
        voiceIdentity.requireVerified("EP002");
        Shot shot=shot(packageId,key,actor);
        requireEp003SlowFirst(shot.episodeKey(),selectedMode,false);
        Request reserved=transaction.execute(status->{
            lockShot(shot.id());
            Revision active=current(shot.id());
            if(active.revision()!=expectedRevision
                    || !EpisodePackageValidator.sha256(active.narration()).equals(expectedHash))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Narration or active revision changed. Refresh before any paid request.");
            if(active.narration().length()>MAX_CHARS)
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Narration exceeds TTS limit.");
            if("EP003".equals(shot.episodeKey())) {
                String original=jdbc.sql("select original_narration from episode_package_shot where id=:shot")
                        .param("shot",shot.id()).query(String.class).single();
                if(active.revision()!=1||!original.equals(active.narration()))
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "EP003 immutable Director-LOCKED script revision mismatch. No paid voice request.");
                boolean attempted=jdbc.sql("select exists(select 1 from episode_package_voice_request where shot_id=:shot)")
                        .param("shot",shot.id()).query(Boolean.class).single();
                boolean hasTake=jdbc.sql("select exists(select 1 from episode_package_voice_take where shot_id=:shot)")
                        .param("shot",shot.id()).query(Boolean.class).single();
                requireEp003SlowFirst(shot.episodeKey(),selectedMode,attempted||hasTake);
            }
            if(slow)SlowNaturalVoicePrompt.plan(active.narration(),elevenLabs.modelId());
            Long count=jdbc.sql("""
                    select count(*) from episode_package_voice_take where shot_id=:shot
                    """).param("shot",shot.id()).query(Long.class).single();
            if(count>=MAX_TAKES_PER_SHOT)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "The maximum allowed four takes for this SHOT is reached.");
            Boolean unresolved=jdbc.sql("""
                    select exists (select 1 from episode_package_voice_request
                    where shot_id=:shot and status in ('IN_FLIGHT','UNCERTAIN'))
                    """).param("shot",shot.id()).query(Boolean.class).single();
            if(unresolved)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "A previous ElevenLabs charge may be outstanding. No retry allowed.");
            Boolean used=jdbc.sql("""
                    select exists(select 1 from episode_package_voice_request where request_id=:request)
                    """).param("request",requestId).query(Boolean.class).single();
            if(used)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "The paid request ID was already used. Do not repeat paid calls.");
            jdbc.sql("""
                    insert into episode_package_voice_request(
                        request_id,shot_id,revision,narration_sha256,
                        actor_issuer,actor_subject,status
                    ) values (:request,:shot,:revision,:hash,:issuer,:subject,'IN_FLIGHT')
                    """)
                    .param("request",requestId).param("shot",shot.id())
                    .param("revision",active.revision()).param("hash",expectedHash)
                    .param("issuer",actor.issuer()).param("subject",actor.subject())
                    .update();
            return new Request(shot.id(),active.revision(),active.narration());
        });

        try {
            String ttsText=slow
                    ?SlowNaturalVoicePrompt.plan(reserved.narration(),elevenLabs.modelId()).text()
                    :reserved.narration();
            ElevenLabsTextToSpeechService.GenerationResult audio=elevenLabs.generate(
                    key,ttsText,"","",Map.of(),
                    ElevenLabsTextToSpeechService.EP001_LOCKED_DELIVERY_TAG);
            BigDecimal duration=durationProbe.measure(audio.audio(),audio.contentType());
            String persistedMode=slow?SlowNaturalVoicePrompt.DELIVERY_MODE:"STANDARD";
            UUID takeId=UUID.randomUUID();
            String objectKey=MediaObjectStore.voiceKey(shot.episodeKey(),key,requestId,
                    takeId,audio.contentType());
            MediaObjectStore.Stored stored=mediaObjects.uploadVerified(
                    objectKey,audio.audio(),audio.contentType());
            transaction.executeWithoutResult(status->{
                int changed=jdbc.sql("""
                        update episode_package_voice_request
                        set uploaded_object_key=:key,uploaded_object_sha256=:sha,
                            uploaded_object_bytes=:bytes
                        where request_id=:request and shot_id=:shot
                          and revision=:revision and status='IN_FLIGHT'
                        """).param("key",stored.key()).param("sha",stored.sha256())
                        .param("bytes",stored.byteCount()).param("request",requestId)
                        .param("shot",reserved.shotId()).param("revision",reserved.revision())
                        .update();
                if(changed!=1)throw new IllegalStateException(
                        "Paid request lost ownership before media object manifest update.");
            });
            transaction.executeWithoutResult(status->saveTake(
                    reserved,requestId,takeId,stored,audio,duration,persistedMode));
        } catch(RuntimeException failure) {
            transaction.executeWithoutResult(status->jdbc.sql("""
                    update episode_package_voice_request set status='UNCERTAIN'
                    where request_id=:id and status='IN_FLIGHT'
                    """).param("id",requestId).update());
            throw failure;
        }
        return state(packageId,key);
    }

    private void saveTake(Request request,UUID id,UUID takeId,MediaObjectStore.Stored stored,
                          ElevenLabsTextToSpeechService.GenerationResult audio,
                          BigDecimal duration,String deliveryMode) {
        lockShot(request.shotId());
        String status=jdbc.sql("""
                select status from episode_package_voice_request
                where request_id=:request and shot_id=:shot and revision=:revision
                  and uploaded_object_key=:objectKey and uploaded_object_sha256=:sha
                  and uploaded_object_bytes=:bytes
                for update
                """).param("request",id).param("shot",request.shotId())
                .param("revision",request.revision()).param("objectKey",stored.key())
                .param("sha",stored.sha256()).param("bytes",stored.byteCount())
                .query(String.class).single();
        if(!"IN_FLIGHT".equals(status))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Paid request was already resolved; refusing duplicate stored take.");
        int number=jdbc.sql("""
                select coalesce(max(take_number),0)+1 from episode_package_voice_take
                where shot_id=:shot and revision=:revision
                """).param("shot",request.shotId()).param("revision",request.revision())
                .query(Integer.class).single();
        String name="VOICE_"+request.shotId()+"_rev"+request.revision()+"_take"+number
                +("audio/wav".equals(audio.contentType())?".wav":".mp3");
        String alignment;
        try {
            Map<String,Object> provenance=new LinkedHashMap<>(audio.alignmentResponse()==null
                    ?Map.of():audio.alignmentResponse());
            provenance.put("mediaos_delivery_mode",deliveryMode);
            provenance.put("mediaos_spoken_script_sha256",
                    EpisodePackageValidator.sha256(request.narration()));
            alignment=mapper.writeValueAsString(provenance);
        }
        catch(JsonProcessingException ex) {
            throw new IllegalStateException("ElevenLabs alignment could not be stored.",ex);
        }
        jdbc.sql("""
                insert into episode_package_voice_take(
                    id,shot_id,revision,take_number,content_type,file_name,
                    model_id,voice_id,output_format,provider_request_id,
                    generated_alignment,duration_seconds,
                    audio_object_key,audio_sha256,audio_size_bytes,storage_status
                ) values(
                    :id,:shot,:revision,:number,:content,:filename,
                    :model,:voice,:format,:provider,cast(:alignment as jsonb),:duration,
                    :objectKey,:sha,:bytes,'OBJECT_VERIFIED'
                )
                """)
                .param("id",takeId).param("shot",request.shotId())
                .param("revision",request.revision()).param("number",number)
                .param("content",audio.contentType())
                .param("objectKey",stored.key()).param("sha",stored.sha256())
                .param("bytes",stored.byteCount())
                .param("filename",name).param("model",audio.modelId())
                .param("voice",audio.voiceId()).param("format",audio.outputFormat())
                .param("provider",audio.requestId()).param("alignment",alignment)
                .param("duration",duration).update();
        jdbc.sql("""
                update episode_package_voice_request
                set status='COMPLETED',provider_request_id=:provider,completed_at=now()
                where request_id=:request and status='IN_FLIGHT'
                """).param("request",id).param("provider",audio.requestId()).update();
    }

    @Transactional
    public VoiceState approve(UUID packageId,String key,int expectedRevision,UUID takeId,
                              String decision) {
        if(!"DIRECTOR_APPROVE".equals(decision) || takeId==null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "An explicit Director approval and a selected take are required.");
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        Shot shot=shot(packageId,key,actor);
        lockShot(shot.id());
        Revision latest=current(shot.id());
        if(latest.revision()!=expectedRevision)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Working narration changed. Select audio for the new revision.");
        boolean valid=jdbc.sql("""
                select exists(select 1 from episode_package_voice_take
                  where id=:take and shot_id=:shot and revision=:revision)
                """).param("take",takeId).param("shot",shot.id())
                .param("revision",expectedRevision).query(Boolean.class).single();
        if(!valid)throw new ResponseStatusException(HttpStatus.CONFLICT,
                "The selected audio does not belong to the current narration revision.");
        UUID selected=jdbc.sql("""
                select take_id from episode_package_voice_choice
                where shot_id=:shot and revision=:revision
                order by selected_at desc,id desc limit 1
                """).param("shot",shot.id()).param("revision",expectedRevision)
                .query(UUID.class).optional().orElse(null);
        if(takeId.equals(selected))return state(packageId,key);
        jdbc.sql("""
                insert into episode_package_voice_choice(
                    id,shot_id,revision,take_id,actor_issuer,actor_subject
                ) values(:id,:shot,:revision,:take,:issuer,:subject)
                """)
                .param("id",UUID.randomUUID()).param("shot",shot.id())
                .param("revision",expectedRevision).param("take",takeId)
                .param("issuer",actor.issuer()).param("subject",actor.subject()).update();
        return state(packageId,key);
    }

    public byte[] audio(UUID packageId,String key,UUID takeId) {
        Shot shot=shot(packageId,key,DirectorIdentity.requireDirector());
        return jdbc.sql("""
                select audio from episode_package_voice_take where shot_id=:shot and id=:id
                """).param("shot",shot.id()).param("id",takeId)
                .query(byte[].class).optional().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.NOT_FOUND,"Voice take not found for this Director."));
    }

    public String audioContentType(UUID packageId,String key,UUID takeId) {
        Shot shot=shot(packageId,key,DirectorIdentity.requireDirector());
        return jdbc.sql("""
                select content_type from episode_package_voice_take where shot_id=:shot and id=:id
                """).param("shot",shot.id()).param("id",takeId)
                .query(String.class).optional().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.NOT_FOUND,"Voice take not found for this Director."));
    }
}
