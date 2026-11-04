package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class EpisodeMultiShotExecutionService {
    private static final String PREPARED = "PREPARED_NO_DISPATCH";
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final EpisodePackageVoiceReadinessService readiness;

    public EpisodeMultiShotExecutionService(JdbcClient jdbc,ObjectMapper mapper,
                                            EpisodePackageVoiceReadinessService readiness) {
        this.jdbc=jdbc;
        this.mapper=mapper;
        this.readiness=readiness;
    }

    public record PrepareRequest(UUID requestId,UUID authorizationId,
                                 String expectedReadinessFingerprint,
                                 Boolean confirmNoProviderExecution) {}
    public record CancelRequest(Boolean confirmCancel) {}
    public record Task(String shotKey,int shotIndex,int narrationRevision,
                       String approvedTakeId,BigDecimal measuredAudioSeconds,
                       String state,int verifiedCues) {}
    public record Job(UUID jobId,UUID requestId,UUID authorizationId,
                      String episodeKey,String state,String effectiveStatus,
                      String readinessFingerprint,String sourceSha256,
                      String repository,String codePathPrefix,
                      BigDecimal maxBudgetUsd,int maxTotalTokens,int maxAttempts,
                      int totalTasks,int readyForAgentTasks,
                      BigDecimal measuredSpentUsd,int measuredUsedTokens,
                      int reservedAttempts,boolean providerDispatchEnabled,
                      boolean canStartAgent,String createdAt,List<Task> tasks) {}

    record Grant(UUID id,UUID packageId,String state,String sourceSha,
                 String readinessSha,String repo,String prefix,String purpose,
                 String shotKeys,BigDecimal usd,int tokens,int attempts,
                 OffsetDateTime expires,String issuer,String subject) {}
    record Source(String shotKey,String visualJson) {}
    record Snapshot(String shotKey,int shotIndex,int narrationRevision,
                    UUID preferredTakeId,BigDecimal audioDuration,JsonNode originalVisual,
                    List<EpisodePackageCueTimingVerifier.CueTime> verifiedCues) {}

    static void validatePrepare(PrepareRequest request) {
        if(request==null || request.requestId()==null || request.authorizationId()==null
                || !Boolean.TRUE.equals(request.confirmNoProviderExecution())
                || request.expectedReadinessFingerprint()==null
                || !request.expectedReadinessFingerprint().matches("[a-f0-9]{64}"))
            throw bad("Director must explicitly confirm one no-provider batch preparation using a current fingerprint.");
    }

    static void requireCurrentGrant(String state,OffsetDateTime expires,
                                    OffsetDateTime now,boolean matches,
                                    List<String> scope,List<String> currentShots) {
        if(!"AUTHORIZED_PENDING_EXECUTOR".equals(state)
                || expires==null || !now.isBefore(expires))
            throw conflict("Director AI authorization has already been used, revoked or expired.");
        if(!matches)
            throw conflict("Authorized source or voice fingerprint is stale. Re-approve current inputs.");
        if(scope.isEmpty() || !scope.equals(currentShots))
            throw conflict("Authorized SHOT scope is not the current whole-episode scope.");
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public Job prepare(UUID packageId,PrepareRequest input,UUID auditId) {
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        validatePrepare(input);
        if(auditId==null)throw conflict("Audited Director preflight is required.");

        lockShotRows(packageId);
        Job replay=findByRequest(input.requestId(),packageId,actor);
        if(replay!=null) {
            if(!replay.authorizationId().equals(input.authorizationId())
                    || !replay.readinessFingerprint().equals(input.expectedReadinessFingerprint()))
                throw conflict("This request ID belongs to another execution input.");
            return replay;
        }

        EpisodePackageVoiceReadinessService.EpisodeReadiness current=readiness.report(packageId);
        EpisodeAiProductionAuthorizationService.requireReady(current,input.expectedReadinessFingerprint());

        Grant grant=jdbc.sql("""
                select * from episode_ai_production_authorization
                 where id=:id and package_id=:package
                   and director_issuer=:issuer and director_subject=:subject
                 for update
                """).param("id",input.authorizationId())
                .param("package",packageId).param("issuer",actor.issuer())
                .param("subject",actor.subject())
                .query((rs,n)->new Grant(
                        rs.getObject("id",UUID.class),rs.getObject("package_id",UUID.class),
                        rs.getString("state"),rs.getString("source_sha256"),
                        rs.getString("readiness_fingerprint"),rs.getString("repository_full_name"),
                        rs.getString("code_path_prefix"),rs.getString("purpose"),
                        rs.getString("shot_keys"),rs.getBigDecimal("max_budget_usd"),
                        rs.getInt("max_total_tokens"),rs.getInt("max_attempts"),
                        rs.getObject("expires_at",OffsetDateTime.class),
                        rs.getString("director_issuer"),rs.getString("director_subject")))
                .optional().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Director authorization for this episode was not found."));

        List<String> currentShotKeys=current.shots().stream()
                .map(EpisodePackageVoiceReadinessService.ShotReadiness::shotKey).toList();
        String requiredPrefix="remotion-engine/src/episodes/"
                +current.episodeKey().toLowerCase(Locale.ROOT)+"/";
        if(!EpisodeAiProductionAuthorizationService.REPOSITORY.equals(grant.repo())
                || !EpisodeAiProductionAuthorizationService.PURPOSE.equals(grant.purpose())
                || !requiredPrefix.equals(grant.prefix())
                || !current.episodeKey().matches("EP[0-9]{3,}")
                || current.episodeKey().equals("EP001") || current.episodeKey().equals("EP002"))
            throw conflict("Budget grant cannot write outside the new episode's approved Remotion path.");

        requireCurrentGrant(grant.state(),grant.expires(),OffsetDateTime.now(),
                grant.sourceSha().equals(current.sourceSha256())
                && grant.readinessSha().equals(current.readinessFingerprint()),
                parseShotKeys(grant.shotKeys()),currentShotKeys);

        boolean alreadyPrepared=jdbc.sql("""
                select exists(select 1 from episode_multi_shot_execution_job
                 where package_id=:package and state='PREPARED_NO_DISPATCH')
                """).param("package",packageId).query(Boolean.class).single();
        if(alreadyPrepared)throw conflict("A prepared execution job already exists. Review or cancel it.");

        List<Source> visualSources=jdbc.sql("""
                select shot_key,original_visual_story::text from episode_package_shot
                 where package_id=:package order by shot_index
                """).param("package",packageId)
                .query((rs,n)->new Source(rs.getString(1),rs.getString(2))).list();
        if(visualSources.size()!=current.totalShots())
            throw conflict("Whole-episode original visual source is incomplete.");

        List<Snapshot> snapshots=new ArrayList<>();
        for(int i=0;i<current.shots().size();i++){
            var ready=current.shots().get(i);
            if(!"VOICE_READY".equals(ready.status()) || ready.selectedTakeId()==null
                    || ready.measuredDurationSeconds()==null || ready.verifiedCues().isEmpty())
                throw conflict("Missing approved audio or verified HEAR → SEE evidence for "+ready.shotKey()+".");
            Source source=visualSources.get(i);
            if(!ready.shotKey().equals(source.shotKey()))
                throw conflict("Original visual source ordering is inconsistent.");
            try{
                snapshots.add(new Snapshot(
                        ready.shotKey(),i+1,ready.revision(),
                        UUID.fromString(ready.selectedTakeId()),
                        ready.measuredDurationSeconds(),mapper.readTree(source.visualJson()),
                        ready.verifiedCues()));
            }catch(Exception ex){
                throw conflict("Invalid stored visual source or voice Take for "+ready.shotKey()+".");
            }
        }

        UUID jobId=UUID.randomUUID();
        String manifest=json(new BatchManifest("EPISODE_MULTI_SHOT_BATCH_V1",
                current.episodeKey(),current.sourceSha256(),
                current.readinessFingerprint(),grant.repo(),grant.prefix(),
                "AWAITING_REUSABLE_ASSET_DEPENDENCY_INVENTORY",
                "NO_OPENAI_OR_GITHUB_EXECUTION",snapshots));
        jdbc.sql("""
                insert into episode_multi_shot_execution_job(
                    id,request_id,authorization_id,package_id,episode_key,
                    source_sha256,readiness_fingerprint,input_manifest,
                    repository_full_name,code_path_prefix,state,max_budget_usd,
                    max_total_tokens,max_attempts,director_issuer,director_subject,
                    preflight_audit_id
                ) values (
                    :id,:request,:auth,:package,:episode,
                    :source,:fingerprint,cast(:manifest as jsonb),
                    :repo,:prefix,'PREPARED_NO_DISPATCH',:usd,
                    :tokens,:attempts,:issuer,:subject,:audit
                )
                """).param("id",jobId).param("request",input.requestId())
                .param("auth",grant.id()).param("package",packageId)
                .param("episode",current.episodeKey())
                .param("source",current.sourceSha256())
                .param("fingerprint",current.readinessFingerprint())
                .param("manifest",manifest).param("repo",grant.repo())
                .param("prefix",grant.prefix()).param("usd",grant.usd())
                .param("tokens",grant.tokens()).param("attempts",grant.attempts())
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .param("audit",auditId).update();

        for(Snapshot snapshot:snapshots) {
            jdbc.sql("""
                    insert into episode_multi_shot_execution_task(
                        id,job_id,shot_key,shot_index,narration_revision,
                        approved_take_id,measured_audio_seconds,verified_cues,
                        original_visual_story,task_state
                    ) values(
                        :id,:job,:shot,:idx,:revision,:take,:seconds,
                        cast(:cues as jsonb),cast(:visual as jsonb),
                        'AWAITING_AGENT_IMPLEMENTATION'
                    )
                    """).param("id",UUID.randomUUID()).param("job",jobId)
                    .param("shot",snapshot.shotKey()).param("idx",snapshot.shotIndex())
                    .param("revision",snapshot.narrationRevision())
                    .param("take",snapshot.preferredTakeId())
                    .param("seconds",snapshot.audioDuration())
                    .param("cues",json(snapshot.verifiedCues()))
                    .param("visual",json(snapshot.originalVisual()))
                    .update();
        }

        int updated=jdbc.sql("""
                update episode_ai_production_authorization
                   set state='CONSUMED',consumed_at=now()
                 where id=:id and state='AUTHORIZED_PENDING_EXECUTOR'
                   and expires_at>now()
                """).param("id",grant.id()).update();
        if(updated!=1)throw conflict("Authorization was consumed or expired during job creation.");

        return load(jobId,packageId,actor);
    }

    record BatchManifest(String schemaVersion,String episodeKey,String sourceSha256,
                         String readinessFingerprint,String repository,String codePathPrefix,
                         String assetDependencyStatus,String executorStatus,
                         List<Snapshot> shots) {}

    @Transactional(readOnly=true)
    public List<Job> list(UUID packageId) {
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        return jdbc.sql("""
                select id from episode_multi_shot_execution_job
                 where package_id=:package and director_issuer=:issuer
                   and director_subject=:subject order by created_at desc,id desc limit 20
                """).param("package",packageId).param("issuer",actor.issuer())
                .param("subject",actor.subject())
                .query((rs,n)->load(rs.getObject(1,UUID.class),packageId,actor)).list();
    }

    @Transactional(readOnly=true)
    public Job get(UUID packageId,UUID jobId) {
        return load(jobId,packageId,DirectorIdentity.requireDirector());
    }

    @Transactional(isolation=Isolation.REPEATABLE_READ)
    public Job cancel(UUID packageId,UUID jobId,Boolean confirm,UUID auditId) {
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        if(!Boolean.TRUE.equals(confirm) || auditId==null)
            throw bad("Explicit audited Director confirmation is required to cancel.");
        jdbc.sql("""
                select id from episode_multi_shot_execution_job
                 where id=:id and package_id=:package
                   and director_issuer=:issuer and director_subject=:subject for update
                """).param("id",jobId).param("package",packageId)
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .query(UUID.class).optional().orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND,"Execution job not found."));
        Job job=load(jobId,packageId,actor);
        if(!PREPARED.equals(job.state()) && !"CANCELLED".equals(job.state()))
            throw conflict("Only a not-dispatched job can be cancelled safely.");
        if(PREPARED.equals(job.state())) {
            jdbc.sql("""
                    update episode_multi_shot_execution_job
                       set state='CANCELLED',cancelled_at=now()
                     where id=:id and state='PREPARED_NO_DISPATCH'
                    """).param("id",jobId).update();
            jdbc.sql("""
                    update episode_multi_shot_execution_task set task_state='CANCELLED'
                     where job_id=:job and task_state='AWAITING_AGENT_IMPLEMENTATION'
                    """).param("job",jobId).update();
        }
        return load(jobId,packageId,actor);
    }

    private Job findByRequest(UUID requestId,UUID packageId,DirectorIdentity.Actor actor) {
        UUID prior=jdbc.sql("""
                select id from episode_multi_shot_execution_job
                 where request_id=:request
                """).param("request",requestId).query(UUID.class).optional().orElse(null);
        if(prior==null)return null;
        return load(prior,packageId,actor);
    }

    private Job load(UUID id,UUID packageId,DirectorIdentity.Actor actor) {
        record Header(UUID jobId,UUID requestId,UUID auth,String episode,String state,
                      String readinessFingerprint,String sourceSha,String repo,String path,
                      BigDecimal usd,int tokens,int attempts,String created) {}
        Header header=jdbc.sql("""
                select id,request_id,authorization_id,episode_key,state,
                       readiness_fingerprint,source_sha256,repository_full_name,
                       code_path_prefix,max_budget_usd,max_total_tokens,max_attempts,
                       created_at::text
                  from episode_multi_shot_execution_job
                 where id=:id and package_id=:package
                   and director_issuer=:issuer and director_subject=:subject
                """).param("id",id).param("package",packageId)
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .query((rs,n)->new Header(rs.getObject("id",UUID.class),
                        rs.getObject("request_id",UUID.class),
                        rs.getObject("authorization_id",UUID.class),
                        rs.getString("episode_key"),rs.getString("state"),
                        rs.getString("readiness_fingerprint"),rs.getString("source_sha256"),
                        rs.getString("repository_full_name"),rs.getString("code_path_prefix"),
                        rs.getBigDecimal("max_budget_usd"),rs.getInt("max_total_tokens"),
                        rs.getInt("max_attempts"),rs.getString("created_at")))
                .optional().orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Execution job is not available for this Director."));

        List<Task> tasks=jdbc.sql("""
                select shot_key,shot_index,narration_revision,approved_take_id,
                       measured_audio_seconds,task_state,jsonb_array_length(verified_cues) as cue_count
                  from episode_multi_shot_execution_task
                 where job_id=:job order by shot_index
                """).param("job",id).query((rs,n)->new Task(
                        rs.getString("shot_key"),rs.getInt("shot_index"),
                        rs.getInt("narration_revision"),
                        rs.getObject("approved_take_id",UUID.class).toString(),
                        rs.getBigDecimal("measured_audio_seconds"),
                        rs.getString("task_state"),rs.getInt("cue_count"))).list();
        record Usage(BigDecimal cost,long tokens,long attempts) {}
        Usage usage=jdbc.sql("""
                select coalesce(sum(coalesce(measured_usd,reserved_usd)),0) as at_risk_usd,
                       coalesce(sum(coalesce(measured_tokens,reserved_tokens)),0) as at_risk_tokens,
                       count(*) as attempts
                  from episode_multi_shot_openai_usage
                 where job_id=:job and status <> 'NO_CHARGE'
                """).param("job",id).query((rs,n)->new Usage(
                        rs.getBigDecimal("at_risk_usd"),rs.getLong("at_risk_tokens"),
                        rs.getLong("attempts"))).single();
        if(tasks.isEmpty())throw new IllegalStateException("Execution job has no SHOT tasks.");
        return new Job(header.jobId(),header.requestId(),header.auth(),header.episode(),
                header.state(),header.state(),header.readinessFingerprint(),
                header.sourceSha(),header.repo(),header.path(),header.usd(),
                header.tokens(),header.attempts(),tasks.size(),
                (int)tasks.stream().filter(t->"PENDING".equals(t.state())).count(),
                usage.cost(),Math.toIntExact(usage.tokens()),Math.toIntExact(usage.attempts()),
                false,false,header.created(),List.copyOf(tasks));
    }

    private void lockShotRows(UUID packageId) {
        jdbc.sql("""
                select id from episode_package_shot
                 where package_id=:package order by shot_index for update
                """).param("package",packageId).query(UUID.class).list();
    }

    private List<String> parseShotKeys(String raw) {
        try{
            return mapper.readValue(raw,mapper.getTypeFactory()
                    .constructCollectionType(List.class,String.class));
        }catch(JsonProcessingException ex){
            throw conflict("Stored Director SHOT scope is invalid.");
        }
    }

    private String json(Object content) {
        try{return mapper.writeValueAsString(content);}
        catch(JsonProcessingException ex){throw new IllegalStateException("Cannot serialize snapshot.",ex);}
    }

    private static ResponseStatusException bad(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,reason);
    }
    private static ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT,reason);
    }
}
