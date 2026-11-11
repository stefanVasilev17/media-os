package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestClientResponseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class Ep002SavedTakeAlignmentService {
    private static final Pattern SHOT=Pattern.compile("SHOT(0[1-9]|1[01])");
    private static final Logger LOGGER=LoggerFactory.getLogger(Ep002SavedTakeAlignmentService.class);
    private final JdbcClient jdbc;
    private final ElevenLabsForcedAlignmentService provider;
    private final TransactionTemplate transaction;
    private final ObjectMapper mapper;
    private final boolean writesEnabled;

    record Selected(UUID id,int revision,String narration,String hash,String contentType,
                    byte[] audio,Ep002SavedAlignmentInspection.State alignmentState,
                    BigDecimal duration,String originalAlignmentJson) {}

    public Ep002SavedTakeAlignmentService(JdbcClient jdbc,ElevenLabsForcedAlignmentService provider,
                                         PlatformTransactionManager manager,ObjectMapper mapper,
                                         @Value("${mediaos.ep002.voice.writes-enabled:false}") boolean writesEnabled) {
        this.jdbc=jdbc;
        this.provider=provider;
        this.transaction=new TransactionTemplate(manager);
        this.mapper=mapper;
        this.writesEnabled=writesEnabled;
    }

    private void validateShot(String shot) {
        if(shot==null || !SHOT.matcher(shot).matches())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unknown EP002 SHOT.");
    }

    private void lock(String shot) {
        jdbc.sql("select pg_advisory_xact_lock(hashtext('ep002-creative:' || :shot)::bigint)")
                .param("shot",shot).query((rs,n)->true).single();
    }

    private Selected selected(String shot,boolean includeAudio) {
        String fields=includeAudio?"t.audio,":"";
        return jdbc.sql("""
            select t.id,t.revision,s.narration,t.narration_sha256,t.content_type,
                   t.elevenlabs_alignment::text as alignment_json,t.duration_seconds,
                   """+fields+"""
                   t.shot_key as actual_shot
            from ep002_creative_voice_choice choice
            join ep002_creative_voice_take t on t.id=choice.take_id
              and t.revision=choice.revision and t.shot_key=choice.shot_key
            join ep002_creative_script_revision s
              on s.shot_key=t.shot_key and s.revision=t.revision
            where choice.shot_key=:shot and choice.revision=(
                  select max(latest.revision) from ep002_creative_script_revision latest
                  where latest.shot_key=:shot)
            order by choice.selected_at desc,choice.id desc limit 1
            """).param("shot",shot).query((rs,n)->{
                   String existingJson=rs.getString("alignment_json");
                   return new Selected(
                       rs.getObject("id",UUID.class),rs.getInt("revision"),
                       rs.getString("narration"),rs.getString("narration_sha256"),
                       rs.getString("content_type"),includeAudio?rs.getBytes("audio"):null,
                       Ep002SavedAlignmentInspection.inspect(mapper,existingJson),
                       rs.getBigDecimal("duration_seconds"),existingJson);
               }).optional().orElse(null);
    }

    record LastRequest(String status,String failureCategory,OffsetDateTime startedAt) {}

    private LastRequest latestRequest(UUID takeId) {
        return jdbc.sql("""
            select status,failure_reason,started_at
            from ep002_creative_alignment_request
            where take_id=:take order by started_at desc,request_id desc limit 1
            """).param("take",takeId).query((rs,n)->new LastRequest(
                rs.getString("status"),rs.getString("failure_reason"),
                rs.getObject("started_at",OffsetDateTime.class)))
                .optional().orElse(new LastRequest("NONE",null,null));
    }

    static String safeFailureCategory(Exception failure) {
        for (Throwable cause=failure;cause!=null;cause=cause.getCause()) {
            if(cause instanceof RestClientResponseException providerResponse) {
                return "PROVIDER_HTTP_"+providerResponse.getStatusCode().value();
            }
        }
        return "PROVIDER_OR_COMMIT_UNCERTAIN";
    }

    public Map<String,Object> status(String shot) {
        validateShot(shot);
        Selected take=selected(shot,false);
        LastRequest latest=take==null?new LastRequest("NONE",null,null):latestRequest(take.id());
        String requestStatus=latest.status();
        boolean available=take!=null
                && take.alignmentState()==Ep002SavedAlignmentInspection.State.MISSING
                && writesEnabled && provider.configured()
                && !"IN_FLIGHT".equals(requestStatus)
                && !"UNCERTAIN".equals(requestStatus)
                && !"COMPLETED".equals(requestStatus);
        Map<String,Object> result=new LinkedHashMap<>();
        result.put("shotKey",shot);
        result.put("preferredTakeId",take==null?null:take.id().toString());
        result.put("revision",take==null?null:take.revision());
        result.put("alignmentPresent",take!=null
                && take.alignmentState()==Ep002SavedAlignmentInspection.State.PRESENT);
        result.put("alignmentDataState",take==null?"NO_TAKE":take.alignmentState().name());
        result.put("paidRequestStatus",requestStatus);
        result.put("lastAttemptAt",latest.startedAt()==null?null:latest.startedAt().toString());
        result.put("lastFailureCategory",latest.failureCategory());
        result.put("canAlign",available);
        result.put("reason",take==null?"Choose a preferred take for current saved narration."
                :take.alignmentState()==Ep002SavedAlignmentInspection.State.PRESENT
                  ?"This recording has real character timestamps; do not purchase alignment again."
                :take.alignmentState()==Ep002SavedAlignmentInspection.State.MALFORMED
                  ?"Stored timestamp arrays are malformed. Do not purchase alignment again before resolving this."
                :!writesEnabled?"Paid voice operations are disabled."
                :"COMPLETED".equals(requestStatus)
                  ?"A previous paid alignment is marked completed but no valid timestamps remain. Reconcile before any new paid operation."
                :"NOT_SENT".equals(requestStatus)
                  ?"Previous attempt failed before the paid provider request was sent. A new request still needs explicit paid confirmation."
                :!provider.configured()?"ElevenLabs API is not configured."
                :"IN_FLIGHT".equals(requestStatus)||"UNCERTAIN".equals(requestStatus)
                  ?"An earlier paid alignment request is unresolved. Do not retry. Check the ElevenLabs Developers Request Log and credit usage before reconciliation."
                :take.originalAlignmentJson()!=null
                  ?"The selected recording has ElevenLabs metadata, but NO real character timestamps. One separately paid Forced Alignment of this SAME MP3 can provide them after your explicit confirmation."
                :null);
        return result;
    }

    public Map<String,Object> align(String shot,UUID expectedTake,int expectedRevision,
                                    UUID requestId,boolean confirmedPaid) {
        validateShot(shot);
        DirectorIdentity.requireDirector();
        if(!writesEnabled) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "EP002 paid operations are disabled.");
        if(!confirmedPaid) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Explicit paid Forced Alignment confirmation is required.");
        if(expectedTake==null || requestId==null || expectedRevision<1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expected take, revision and unique request ID.");
        if(!provider.configured())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"ElevenLabs API is not configured.");

        Selected original=transaction.execute(tx->{
            lock(shot);
            Selected take=selected(shot,true);
            if(take==null || !take.id().equals(expectedTake) || take.revision()!=expectedRevision)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Preferred take or script changed. Reload before any paid request.");
            if(take.alignmentState()!=Ep002SavedAlignmentInspection.State.MISSING)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Real alignment already exists or stored timestamps are unsafe. No paid API call was made.");
            LastRequest previous=latestRequest(take.id());
            if("IN_FLIGHT".equals(previous.status())||"UNCERTAIN".equals(previous.status())
                    ||"COMPLETED".equals(previous.status()))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An earlier paid alignment request requires reconciliation. No new provider call was made.");
            if(take.audio()==null || take.audio().length<512 || take.audio().length>24*1024*1024)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Selected recording has invalid audio.");
            if(!EpisodeLockedScriptVoiceService.narrationHash(take.narration()).equals(take.hash()))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Saved transcript does not match selected take. No paid API call was made.");
            var actor=DirectorIdentity.requireDirector();
            try {
                jdbc.sql("""
                  insert into ep002_creative_alignment_request
                  (request_id,shot_key,revision,take_id,narration_sha256,
                   actor_issuer,actor_subject,status)
                  values (:id,:shot,:revision,:take,:hash,:issuer,:subject,'IN_FLIGHT')
                """).param("id",requestId).param("shot",shot).param("revision",expectedRevision)
                  .param("take",take.id()).param("hash",take.hash())
                  .param("issuer",actor.issuer()).param("subject",actor.subject()).update();
            } catch (DataIntegrityViolationException problem) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Duplicate or unresolved paid alignment request; no new API call was made.",problem);
            }
            return take;
        });

        try {
            Map<String,Object> providerData=provider.alignSavedAudio(original.audio(),
                    original.contentType(),shot+"-"+original.id()+".mp3",original.narration());
            String canonical=Ep002ForcedAlignmentNormalizer.normalize(mapper,
                    mapper.writeValueAsString(providerData));
            transaction.executeWithoutResult(tx->{
                lock(shot);
                Selected current=selected(shot,false);
                if(current==null || !current.id().equals(original.id())
                    || current.revision()!=original.revision()
                    || current.alignmentState()!=Ep002SavedAlignmentInspection.State.MISSING
                    || !EpisodeLockedScriptVoiceService.narrationHash(current.narration()).equals(original.hash()))
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Preferred take changed during paid alignment. Reconcile before retrying.");
                int changed=jdbc.sql("""
                    update ep002_creative_voice_take
                    set elevenlabs_alignment=coalesce(elevenlabs_alignment,'{}'::jsonb)
                            || cast(:alignment as jsonb),
                        alignment_source='ELEVENLABS_FORCED_ALIGNMENT'
                    where id=:take
                      and elevenlabs_alignment is not distinct from cast(:original as jsonb)
                    """).param("alignment",canonical)
                       .param("original",original.originalAlignmentJson())
                       .param("take",original.id()).update();
                if(changed!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Recording was aligned concurrently. Reconcile paid request.");
                int completed=jdbc.sql("""
                    update ep002_creative_alignment_request
                    set status='COMPLETED',completed_at=now()
                    where request_id=:id and status='IN_FLIGHT'
                    """).param("id",requestId).update();
                if(completed!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Paid request ledger changed. Reconcile before retrying.");
            });
            return status(shot);
        } catch(Exception failure) {
            String category=safeFailureCategory(failure);
            LOGGER.warn("EP002 saved-take alignment unresolved; shot={} category={} (no provider retry)",
                    shot,category);
            transaction.executeWithoutResult(tx->jdbc.sql("""
                update ep002_creative_alignment_request
                set status='UNCERTAIN',failure_reason=:category
                where request_id=:id and status='IN_FLIGHT'
                """).param("id",requestId).param("category",category).update());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "Paid alignment result is unresolved. Check the ElevenLabs Request Log. Do not retry.",failure);
        }
    }
}
