package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class EpisodePackageVoiceReadinessService {
    public static final String VERSION = "EPISODE_VOICE_READINESS_V1";
    private final JdbcClient jdbc;
    private final EpisodePackageCueTimingVerifier timing;

    public EpisodePackageVoiceReadinessService(JdbcClient jdbc,
                                                EpisodePackageCueTimingVerifier timing) {
        this.jdbc = jdbc;
        this.timing = timing;
    }

    public record ShotReadiness(String shotKey, String title, int revision,
                                String selectedTakeId, BigDecimal measuredDurationSeconds,
                                boolean approvedCurrentRevision, boolean unresolvedPaidRequest,
                                String status, String timingStatus, List<String> blockers,
                                List<EpisodePackageCueTimingVerifier.CueTime> verifiedCues) {}

    public record EpisodeReadiness(UUID packageId, String episodeKey, String sourceSha256,
                                   String readinessFingerprint, String state,
                                   int totalShots, int approvedShots, int readyShots,
                                   int blockedShots, int unresolvedPaidAttempts,
                                   boolean eligibleForAiBudgetReview,
                                   boolean agentExecutionAuthorized, boolean canStartAgent,
                                   String nextAction, List<ShotReadiness> shots) {}

    record ShotInput(String shotKey, String title, int shotIndex, int revision,
                     String narration, String visualSourceJson, UUID approvedTakeId,
                     UUID actualTakeId, BigDecimal durationSeconds,
                     String alignmentJson, boolean unresolvedPaidRequest) {}

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public EpisodeReadiness report(UUID packageId) {
        DirectorIdentity.Actor actor = DirectorIdentity.requireDirector();

        record PackageInfo(String episodeKey,String sourceSha,int shotCount) {}
        PackageInfo source = jdbc.sql("""
                select episode_key,source_sha256,shot_count
                  from episode_package_import
                 where id=:id and director_issuer=:issuer and director_subject=:subject
                """)
                .param("id", packageId)
                .param("issuer", actor.issuer()).param("subject", actor.subject())
                .query((rs,n) -> new PackageInfo(rs.getString("episode_key"),
                        rs.getString("source_sha256"),rs.getInt("shot_count")))
                .optional().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "This Director does not have an imported episode package with that ID."));

        List<ShotInput> inputs = jdbc.sql("""
                select s.shot_key,s.title,s.shot_index,s.original_visual_story::text as visual_json,
                       r.revision,r.narration,
                       chosen.take_id as approved_take_id,
                       t.id as actual_take_id,t.duration_seconds,
                       t.generated_alignment::text as alignment_json,
                       exists(
                         select 1 from episode_package_voice_request req
                          where req.shot_id=s.id
                            and req.status in ('IN_FLIGHT','UNCERTAIN')
                       ) as unresolved_paid
                  from episode_package_shot s
                  left join lateral (
                    select revision,narration
                      from episode_package_shot_revision
                     where shot_id=s.id order by revision desc limit 1
                  ) r on true
                  left join lateral (
                    select c.take_id from episode_package_voice_choice c
                    join episode_package_voice_take verified on verified.id=c.take_id
                     and verified.shot_id=s.id and verified.revision=r.revision
                    where c.shot_id=s.id and c.revision=r.revision
                    order by c.selected_at desc,c.id desc limit 1
                  ) chosen on true
                  left join episode_package_voice_take t on t.id=chosen.take_id
                    and t.shot_id=s.id and t.revision=r.revision
                 where s.package_id=:package
                 order by s.shot_index
                """)
                .param("package", packageId)
                .query((rs,n) -> new ShotInput(
                        rs.getString("shot_key"),rs.getString("title"),
                        rs.getInt("shot_index"),rs.getInt("revision"),
                        rs.getString("narration"),rs.getString("visual_json"),
                        rs.getObject("approved_take_id",UUID.class),
                        rs.getObject("actual_take_id",UUID.class),
                        rs.getBigDecimal("duration_seconds"),
                        rs.getString("alignment_json"),
                        rs.getBoolean("unresolved_paid")
                )).list();

        if (inputs.size() != source.shotCount())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Episode source SHOT records are incomplete; production remains blocked.");

        List<ShotReadiness> shots = new ArrayList<>();
        StringBuilder fingerprint = new StringBuilder(VERSION).append('|')
                .append(packageId).append('|').append(source.sourceSha());
        for (int i=0;i<inputs.size();i++) {
            ShotInput input = inputs.get(i);
            String expectedKey = String.format(java.util.Locale.ROOT,"SHOT%02d",i+1);
            if (!input.shotKey().equals(expectedKey) || input.shotIndex()!=i+1)
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Episode SHOT order is invalid; production remains blocked.");

            ShotReadiness checked = evaluate(input,timing);
            shots.add(checked);
            fingerprint.append('|').append(input.shotKey())
                    .append(':').append(input.revision())
                    .append(':').append(EpisodePackageValidator.sha256(
                            input.narration()==null?"":input.narration()))
                    .append(':').append(input.approvedTakeId())
                    .append(':').append(input.actualTakeId())
                    .append(':').append(input.durationSeconds())
                    .append(':').append(input.unresolvedPaidRequest())
                    .append(':').append(EpisodePackageValidator.sha256(
                            input.visualSourceJson()==null?"":input.visualSourceJson()))
                    .append(':').append(EpisodePackageValidator.sha256(
                            input.alignmentJson()==null?"":input.alignmentJson()))
                    .append(':').append(checked.status())
                    .append(':').append(checked.timingStatus());
        }

        int ready=(int)shots.stream().filter(x -> x.blockers().isEmpty()).count();
        int approved=(int)shots.stream().filter(ShotReadiness::approvedCurrentRevision).count();
        int unresolved=(int)shots.stream().filter(ShotReadiness::unresolvedPaidRequest).count();
        boolean eligible=ready>0 && ready==source.shotCount();
        String state=aggregateState(ready,source.shotCount());
        String next=eligible
                ? "All current SHOT voices and narration cues are verified. Await separate Director OpenAI budget authorization; agents remain DISABLED."
                : "Review blocked SHOTs, approve current Takes and resolve real audio/cue timing before any AI budget authorization.";
        return new EpisodeReadiness(
                packageId,source.episodeKey(),source.sourceSha(),
                EpisodePackageValidator.sha256(fingerprint.toString()),
                state,source.shotCount(),approved,ready,source.shotCount()-ready,
                unresolved,eligible,false,false,next,List.copyOf(shots)
        );
    }

    static String aggregateState(int ready,int total) {
        if(total<1 || ready<0 || ready>total)
            throw new IllegalArgumentException("Impossible episode voice readiness counts.");
        if(ready==total)return "READY_FOR_DIRECTOR_AI_AUTHORIZATION";
        return ready==0?"NOT_READY":"PARTIALLY_READY";
    }

    static ShotReadiness evaluate(ShotInput input,EpisodePackageCueTimingVerifier verifier) {
        List<String> blockers = new ArrayList<>();
        if(input.revision()<1 || input.narration()==null || input.narration().isBlank())
            blockers.add("WORKING_SCRIPT_REVISION_MISSING");

        boolean approved=input.approvedTakeId()!=null
                && input.actualTakeId()!=null
                && input.approvedTakeId().equals(input.actualTakeId());
        if(!approved)blockers.add("DIRECTOR_APPROVED_CURRENT_REVISION_TAKE_MISSING");
        if(input.unresolvedPaidRequest())blockers.add("PAID_VOICE_REQUEST_IN_FLIGHT_OR_UNCERTAIN");
        if(approved && (input.durationSeconds()==null || input.durationSeconds().signum()<=0))
            blockers.add("MEASURED_AUDIO_DURATION_MISSING");

        EpisodePackageCueTimingVerifier.Result cue =
                new EpisodePackageCueTimingVerifier.Result(false,"NOT_CHECKED",List.of());
        if(approved && input.revision()>0 && input.narration()!=null
                && input.durationSeconds()!=null && input.durationSeconds().signum()>0) {
            cue=verifier.verify(input.narration(),input.visualSourceJson(),
                    input.alignmentJson(),input.durationSeconds());
            if(!cue.verified())blockers.add(cue.failureCode());
        }
        boolean ready=blockers.isEmpty();
        return new ShotReadiness(input.shotKey(),input.title(),input.revision(),
                input.approvedTakeId()==null?null:input.approvedTakeId().toString(),
                input.durationSeconds(),approved,input.unresolvedPaidRequest(),
                ready?"VOICE_READY":"BLOCKED",
                ready?"HEAR_SEE_CUES_VERIFIED":cue.failureCode(),
                List.copyOf(blockers),ready?cue.cues():List.of());
    }
}
