package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class Ep002CreativeVoiceService {
    private static final Pattern SHOT = Pattern.compile("SHOT(0[1-9]|1[01])");
    private final JdbcClient jdbc;
    private final ElevenLabsTextToSpeechService elevenLabs;
    private final Ep002VoiceIdentityGuard identity;
    private final TransactionTemplate transaction;
    private final boolean voiceEnabled;

    record Script(int revision, String narration, String voiceDirection) {}
    private static final String STANDARD_DELIVERY="STANDARD";

    public Ep002CreativeVoiceService(JdbcClient jdbc, ElevenLabsTextToSpeechService elevenLabs,
                                    Ep002VoiceIdentityGuard identity,
                                    PlatformTransactionManager transactionManager,
                                    @Value("${mediaos.ep002.voice.writes-enabled:false}") boolean voiceEnabled) {
        this.jdbc = jdbc;
        this.elevenLabs = elevenLabs;
        this.identity = identity;
        this.transaction = new TransactionTemplate(transactionManager);
        this.voiceEnabled = voiceEnabled;
    }

    private static void checkShot(String shot) {
        if (shot == null || !SHOT.matcher(shot).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expected EP002 SHOT01 through SHOT11.");
        }
    }

    private void requireWrites() {
        DirectorIdentity.requireDirector();
        if (!voiceEnabled) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "EP002 creative writes are disabled.");
    }

    private Script latest(String shot) {
        return jdbc.sql("""
                select revision,narration,voice_direction
                from ep002_creative_script_revision
                where shot_key=:shot order by revision desc limit 1
                """).param("shot",shot)
                .query((rs,n)->new Script(rs.getInt("revision"),
                        rs.getString("narration"),rs.getString("voice_direction")))
                .optional().orElse(null);
    }

    private void lockShot(String shot) {
        jdbc.sql("select pg_advisory_xact_lock(hashtext('ep002-creative:' || :shot)::bigint)")
                .param("shot",shot).query((rs,n)->true).single();
    }

    public Map<String,Object> state(String shot) {
        checkShot(shot);
        Script current=latest(shot);
        List<Map<String,Object>> takes=jdbc.sql("""
                select id,revision,take_number,content_type,model_id,voice_id,
                       generated_at,approved_at,
                       elevenlabs_alignment->>'mediaos_delivery_mode' as delivery_mode
                from ep002_creative_voice_take
                where shot_key=:shot order by take_number desc
                """).param("shot",shot).query((rs,n)->{
                    Map<String,Object> row=new LinkedHashMap<>();
                    row.put("id",rs.getObject("id",UUID.class).toString());
                    row.put("revision",rs.getInt("revision"));
                    row.put("takeNumber",rs.getInt("take_number"));
                    row.put("contentType",rs.getString("content_type"));
                    row.put("modelId",rs.getString("model_id"));
                    row.put("voiceId",rs.getString("voice_id"));
                    String deliveryMode=rs.getString("delivery_mode");
                    row.put("deliveryMode",deliveryMode==null?STANDARD_DELIVERY:deliveryMode);
                    row.put("generatedAt",rs.getObject("generated_at",OffsetDateTime.class).toString());
                    OffsetDateTime approved=rs.getObject("approved_at",OffsetDateTime.class);
                    row.put("approvedAt",approved==null?null:approved.toString());
                    return row;
                }).list();
        String paidStatus=jdbc.sql("""
                select status from ep002_creative_voice_request
                where shot_key=:shot order by started_at desc limit 1
                """).param("shot",shot).query(String.class).optional().orElse("NONE");
        boolean unresolved=jdbc.sql("""
                select exists(select 1 from ep002_creative_voice_request
                    where shot_key=:shot and status in ('IN_FLIGHT','UNCERTAIN'))
                """).param("shot",shot).query(Boolean.class).single();
        String preferredTakeId=current==null?null:jdbc.sql("""
                select take_id::text from ep002_creative_voice_choice
                where shot_key=:shot and revision=:revision
                order by selected_at desc,id desc limit 1
                """).param("shot",shot).param("revision",current.revision())
                .query(String.class).optional().orElse(null);
        boolean currentApproved=preferredTakeId!=null;
        boolean hasCurrentTake=current!=null && takes.stream().anyMatch(t->
                ((Number)t.get("revision")).intValue()==current.revision());
        Ep002VoiceIdentityGuard.Check continuity=identity.inspect("EP002");
        String blocker=current==null?"Save the editable narration before generating voice."
                :!voiceEnabled?"EP002 voice writes are disabled."
                :!continuity.verified()?continuity.blockedReason()
                :!elevenLabs.configured()?"ElevenLabs is not configured."
                :unresolved?"An earlier paid voice request is IN_FLIGHT or UNCERTAIN. Reconcile it before retrying."
                :null;
        Map<String,Object> result=new LinkedHashMap<>();
        result.put("shotKey",shot);
        result.put("revision",current==null?0:current.revision());
        result.put("narration",current==null?null:current.narration());
        result.put("voiceDirection",current==null?null:current.voiceDirection());
        result.put("takes",takes);
        result.put("hasCurrentTake",hasCurrentTake);
        result.put("voiceApproved",currentApproved);
        result.put("preferredTakeId",preferredTakeId);
        result.put("canGenerate",blocker==null);
        String configuredModel=elevenLabs.modelId();
        boolean lockedShot="SHOT02".equals(shot) && current!=null
                && configuredModel!=null && configuredModel.startsWith("eleven_v4")
                && Ep002Shot02SlowNaturalVoice.matchesLockedNarration(current.narration());
        result.put("canGenerateSlow",lockedShot&&blocker==null);
        result.put("slowVoicePauseCount",lockedShot?Ep002Shot02SlowNaturalVoice.pauseCount():0);
        result.put("slowVoiceLongPauseCount",lockedShot?Ep002Shot02SlowNaturalVoice.longPauseCount():0);
        result.put("slowVoiceDeliveryMode",Ep002Shot02SlowNaturalVoice.DELIVERY_MODE);
        result.put("blockedReason",blocker);
        result.put("generationStatus",paidStatus);
        result.put("voiceModel",elevenLabs.modelId());
        result.put("voiceIdentityVerified",continuity.verified());
        return result;
    }

    @Transactional
    public Map<String,Object> save(String shot,int expectedRevision,String narration,String direction) {
        checkShot(shot);
        requireWrites();
        if (narration==null || narration.isBlank() || narration.length()>5000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Narration must contain 1 to 5000 characters.");
        }
        if (direction!=null && direction.length()>1200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Voice direction exceeds 1200 characters.");
        }
        lockShot(shot);
        Script current=latest(shot);
        int version=current==null?0:current.revision();
        if (expectedRevision!=version) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A newer script revision exists. Reload before saving.");
        }
        String text=narration.trim();
        String voice=direction==null?"":direction.trim();
        if (current!=null && current.narration().equals(text)
                && current.voiceDirection().equals(voice)) return state(shot);
        var actor=DirectorIdentity.requireDirector();
        jdbc.sql("""
                insert into ep002_creative_script_revision
                  (id,shot_key,revision,narration,voice_direction,actor_issuer,actor_subject)
                values (:id,:shot,:revision,:narration,:voice,:issuer,:subject)
                """).param("id",UUID.randomUUID()).param("shot",shot)
                .param("revision",version+1).param("narration",text).param("voice",voice)
                .param("issuer",actor.issuer()).param("subject",actor.subject()).update();
        return state(shot);
    }

    public Map<String,Object> generate(String shot,int expectedRevision,UUID requestId) {
        return generateInternal(shot,expectedRevision,requestId,false);
    }

    public Map<String,Object> generateSlow(String shot,int expectedRevision,
                                           UUID requestId,boolean confirmPaidGeneration) {
        if (!confirmPaidGeneration) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Explicit one-time paid Slow Natural ElevenLabs confirmation is required.");
        }
        return generateInternal(shot,expectedRevision,requestId,true);
    }

    private Map<String,Object> generateInternal(String shot,int expectedRevision,
                                                 UUID requestId,boolean slowNatural) {
        checkShot(shot);
        if (slowNatural && !"SHOT02".equals(shot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Slow Natural delivery is limited to EP002 SHOT02.");
        }
        requireWrites();
        if (requestId==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"requestId is required.");
        identity.requireVerified("EP002");
        if (!elevenLabs.configured()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "ElevenLabs is not configured.");
        Script saved=transaction.execute(status->{
            lockShot(shot);
            Script latest=latest(shot);
            if (latest==null || latest.revision()!=expectedRevision)
                throw new ResponseStatusException(HttpStatus.CONFLICT,"Script changed. Review the saved version before paying.");
            if (slowNatural) Ep002Shot02SlowNaturalVoice.prompt(
                    shot,latest.narration(),elevenLabs.modelId());
            var actor=DirectorIdentity.requireDirector();
            try {
                jdbc.sql("""
                        insert into ep002_creative_voice_request
                          (request_id,shot_key,revision,narration_sha256,status,actor_issuer,actor_subject)
                        values (:id,:shot,:revision,:hash,'IN_FLIGHT',:issuer,:subject)
                        """).param("id",requestId).param("shot",shot)
                        .param("revision",latest.revision())
                        .param("hash",EpisodeLockedScriptVoiceService.narrationHash(latest.narration()))
                        .param("issuer",actor.issuer()).param("subject",actor.subject()).update();
            } catch (DataIntegrityViolationException e) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Duplicate or unresolved paid voice request; no ElevenLabs call was made.",e);
            }
            return latest;
        });
        try {
            String ttsText=slowNatural
                    ?Ep002Shot02SlowNaturalVoice.prompt(shot,saved.narration(),elevenLabs.modelId())
                    :saved.narration();
            ElevenLabsTextToSpeechService.GenerationResult take=elevenLabs.generate(
                    shot,ttsText,"","",Map.of(),
                    ElevenLabsTextToSpeechService.EP001_LOCKED_DELIVERY_TAG);
            String originalTiming;
            try {
                Map<String,Object> provenance=new LinkedHashMap<>(take.alignmentResponse());
                provenance.put("mediaos_delivery_mode",slowNatural
                        ?Ep002Shot02SlowNaturalVoice.DELIVERY_MODE:STANDARD_DELIVERY);
                provenance.put("mediaos_spoken_script_sha256",
                        EpisodeLockedScriptVoiceService.narrationHash(saved.narration()));
                provenance.put("mediaos_tts_request_text_sha256",
                        EpisodeLockedScriptVoiceService.narrationHash(ttsText));
                originalTiming=new ObjectMapper().writeValueAsString(provenance);
            } catch (JsonProcessingException problem) {
                throw new IllegalStateException("ElevenLabs alignment could not be serialized safely.",problem);
            }
            transaction.executeWithoutResult(status->{
                lockShot(shot);
                Integer n=jdbc.sql("""
                        select coalesce(max(take_number),0)+1
                        from ep002_creative_voice_take where shot_key=:shot
                        """).param("shot",shot).query(Integer.class).single();
                jdbc.sql("""
                        insert into ep002_creative_voice_take
                          (id,shot_key,revision,take_number,narration_sha256,audio,
                           content_type,model_id,voice_id,elevenlabs_alignment)
                        values (:id,:shot,:revision,:number,:hash,:audio,:type,:model,:voice,
                                cast(:alignment as jsonb))
                        """).param("id",UUID.randomUUID()).param("shot",shot)
                        .param("revision",saved.revision()).param("number",n)
                        .param("hash",EpisodeLockedScriptVoiceService.narrationHash(saved.narration()))
                        .param("audio",take.audio()).param("type",take.contentType())
                        .param("model",take.modelId()).param("voice",take.voiceId())
                        .param("alignment",originalTiming).update();
                int updated=jdbc.sql("""
                        update ep002_creative_voice_request set status='COMPLETED',completed_at=now()
                        where request_id=:id and status='IN_FLIGHT'
                        """).param("id",requestId).update();
                if (updated!=1) throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Paid request ledger state changed. Take was not committed.");
            });
        } catch (RuntimeException error) {
            transaction.executeWithoutResult(status->jdbc.sql("""
                    update ep002_creative_voice_request set status='UNCERTAIN'
                    where request_id=:id and status='IN_FLIGHT'
                    """).param("id",requestId).update());
            throw error;
        }
        return state(shot);
    }

    @Transactional
    public Map<String,Object> approve(String shot,int revision,UUID takeId) {
        checkShot(shot);
        requireWrites();
        lockShot(shot);
        Script current=latest(shot);
        if (current==null || current.revision()!=revision)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"This recording belongs to an older text version.");
        Boolean exists=jdbc.sql("""
                select exists(select 1 from ep002_creative_voice_take
                    where id=:id and shot_key=:shot and revision=:revision)
                """).param("id",takeId).param("shot",shot).param("revision",revision)
                .query(Boolean.class).single();
        if (!exists) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "The selected take does not belong to the current text version.");
        var actor=DirectorIdentity.requireDirector();
        jdbc.sql("""
                update ep002_creative_voice_take
                set approved_at=coalesce(approved_at,now()),
                    approved_actor_issuer=coalesce(approved_actor_issuer,:issuer),
                    approved_actor_subject=coalesce(approved_actor_subject,:subject)
                where id=:id and shot_key=:shot and revision=:revision
                """).param("id",takeId).param("shot",shot).param("revision",revision)
                .param("issuer",actor.issuer()).param("subject",actor.subject()).update();
        jdbc.sql("""
                insert into ep002_creative_voice_choice
                  (id,shot_key,revision,take_id,actor_issuer,actor_subject)
                values (:id,:shot,:revision,:take,:issuer,:subject)
                """).param("id",UUID.randomUUID()).param("shot",shot)
                .param("revision",revision).param("take",takeId)
                .param("issuer",actor.issuer()).param("subject",actor.subject()).update();
        return state(shot);
    }

    public byte[] audio(String shot,UUID takeId) {
        checkShot(shot);
        return jdbc.sql("""
                select audio from ep002_creative_voice_take where shot_key=:shot and id=:id
                """).param("shot",shot).param("id",takeId)
                .query(byte[].class).optional().orElseThrow(()->
                    new ResponseStatusException(HttpStatus.NOT_FOUND,"Unknown voice take."));
    }

    public String audioContentType(String shot,UUID takeId) {
        checkShot(shot);
        return jdbc.sql("""
                select content_type from ep002_creative_voice_take where shot_key=:shot and id=:id
                """).param("shot",shot).param("id",takeId)
                .query(String.class).optional().orElseThrow(()->
                    new ResponseStatusException(HttpStatus.NOT_FOUND,"Unknown voice take."));
    }
}
