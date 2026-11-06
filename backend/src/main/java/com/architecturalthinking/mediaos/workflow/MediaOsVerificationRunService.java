package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class MediaOsVerificationRunService {
    static final String BRANCH="feat/mediaos-ep002-unified-product-integration";
    private static final List<String> STAGES=List.of("asset-check","backend","frontend","remotion");
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final Ep002SingleShotGitEvidenceService git;
    private final boolean enabled;

    public MediaOsVerificationRunService(JdbcClient jdbc,ObjectMapper mapper,
            Ep002SingleShotGitEvidenceService git,
            @Value("${mediaos.verification.enabled:false}") boolean enabled) {
        this.jdbc=jdbc;
        this.mapper=mapper;
        this.git=git;
        this.enabled=enabled;
    }

    public record QueueRequest(UUID requestId,String sourceCommit,
                               boolean confirmIsolatedVerification) {}
    public record StageResult(String stage,int exitCode,long durationMs) {}
    public record Completion(UUID leaseId,String sourceCommit,
                             List<StageResult> stages,String failureCode) {}
    public record Run(UUID id,String sourceCommit,String sourceBranch,
                      String state,String workerId,List<StageResult> stages,
                      String failureReason,String queuedAt,String finishedAt) {}
    public record Summary(boolean queueEnabled,String repository,String branch,
                          String targetCommit,boolean targetVerified,
                          String targetBlocker,List<Run> recent) {}
    public record Lease(UUID runId,UUID leaseId,String sourceCommit,String sourceBranch,
                        String repository) {}

    @Transactional(readOnly=true)
    public Summary summary() {
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        List<Run> runs=jdbc.sql("""
                select id,source_commit,source_branch,state,worker_id,
                       stage_results::text as stages,failure_reason,
                       queued_at::text as queued_at,finished_at::text as finished_at
                  from mediaos_verification_run
                 where director_issuer=:issuer and director_subject=:subject
                 order by queued_at desc,id desc limit 30
                """).param("issuer",actor.issuer()).param("subject",actor.subject())
                .query((rs,n)->new Run(
                        rs.getObject("id",UUID.class),rs.getString("source_commit"),
                        rs.getString("source_branch"),rs.getString("state"),
                        rs.getString("worker_id"),decodeStages(rs.getString("stages")),
                        rs.getString("failure_reason"),rs.getString("queued_at"),
                        rs.getString("finished_at"))).list();
        var target=enabled?git.verificationTarget():
                new Ep002SingleShotGitEvidenceService.VerificationTarget(
                        false,null,"ISOLATED_WORKER_NOT_ENABLED");
        return new Summary(enabled,"stefanVasilev17/media-os",BRANCH,
                target.sourceCommit(),target.verified(),target.reason(),List.copyOf(runs));
    }

    @Transactional
    public Run queue(QueueRequest input,UUID auditId) {
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        if(!enabled)throw conflict("Isolated MediaOS verification worker is not enabled.");
        if(auditId==null || input==null || input.requestId()==null
                || !validSha(input.sourceCommit()) || !input.confirmIsolatedVerification())
            throw bad("Real Director audit, source commit and explicit test-run permission required.");

        Run existing=byRequest(input.requestId());
        if(existing!=null) {
            String identity=jdbc.sql("""
                    select director_issuer||':'||director_subject
                      from mediaos_verification_run where request_id=:request
                    """).param("request",input.requestId()).query(String.class).single();
            if(!existing.sourceCommit().equals(input.sourceCommit())
                    || !identity.equals(actor.issuer()+":"+actor.subject()))
                throw conflict("Replayed request ID is bound to a different Director or commit.");
            return existing;
        }
        var target=git.verificationTarget();
        if(!target.verified() || !input.sourceCommit().equals(target.sourceCommit()))
            throw conflict("Private GitHub PR source is unavailable or changed; retry after verification.");

        UUID id=UUID.randomUUID();
        int inserted=jdbc.sql("""
                insert into mediaos_verification_run(
                    id,request_id,source_commit,director_issuer,
                    director_subject,preflight_audit_id
                ) values(:id,:request,:commit,:issuer,:subject,:audit)
                on conflict do nothing
                """)
                .param("id",id).param("request",input.requestId())
                .param("commit",input.sourceCommit())
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .param("audit",auditId).update();
        if(inserted!=1)
            throw conflict("An isolated verification is already pending; review it first.");
        return byId(id);
    }

    @Transactional
    public Run cancel(UUID runId,UUID auditId) {
        DirectorIdentity.Actor actor=DirectorIdentity.requireDirector();
        if(runId==null||auditId==null)
            throw bad("Audited Director cancellation is required.");
        int changed=jdbc.sql("""
                update mediaos_verification_run
                   set state='CANCELLED',
                       cancellation_audit_id=:audit,
                       failure_reason='DIRECTOR_CANCELLED_UNCLAIMED_OR_STALE_RUN',
                       finished_at=now(),updated_at=now()
                 where id=:id and state in ('QUEUED','UNKNOWN')
                   and director_issuer=:issuer and director_subject=:subject
                """).param("id",runId).param("audit",auditId)
                .param("issuer",actor.issuer()).param("subject",actor.subject()).update();
        if(changed!=1)
            throw conflict("Only a Director-owned queued or unknown run can be cancelled.");
        return byId(runId);
    }

    @Transactional
    public Lease claim(String workerId) {
        requireEnabledWorker(workerId);
        // A lost worker cannot silently trigger another expensive verification.
        jdbc.sql("""
                update mediaos_verification_run
                   set state='UNKNOWN',
                       failure_reason='WORKER_LEASE_EXPIRED_NO_AUTOMATIC_RETRY',
                       updated_at=now()
                 where state='RUNNING'
                   and claimed_at<now()-interval '90 minutes'
                """).update();

        UUID id=jdbc.sql("""
                select id from mediaos_verification_run
                 where state='QUEUED' order by queued_at,id
                 for update skip locked limit 1
                """).query(UUID.class).optional().orElse(null);
        if(id==null)return null;
        UUID lease=UUID.randomUUID();
        int changed=jdbc.sql("""
                update mediaos_verification_run
                   set state='RUNNING',worker_id=:worker,lease_id=:lease,
                       claimed_at=now(),updated_at=now()
                 where id=:id and state='QUEUED'
                """)
                .param("id",id).param("worker",workerId)
                .param("lease",lease).update();
        if(changed!=1)return null;
        Run row=byId(id);
        return new Lease(id,lease,row.sourceCommit(),BRANCH,"stefanVasilev17/media-os");
    }

    @Transactional
    public Run complete(UUID id,String workerId,Completion input) {
        requireEnabledWorker(workerId);
        if(id==null || input==null || input.leaseId()==null
                || !validSha(input.sourceCommit())
                || !validStages(input.stages()) || !validFailure(input.failureCode()))
            throw bad("Malformed verified worker completion summary.");
        Run current=jdbc.sql("""
                select id,source_commit,source_branch,state,worker_id,
                       stage_results::text as stages,failure_reason,
                       queued_at::text as queued_at,finished_at::text as finished_at
                from mediaos_verification_run where id=:id for update
                """).param("id",id)
                .query((rs,n)->new Run(rs.getObject("id",UUID.class),
                        rs.getString("source_commit"),rs.getString("source_branch"),
                        rs.getString("state"),rs.getString("worker_id"),
                        decodeStages(rs.getString("stages")),
                        rs.getString("failure_reason"),rs.getString("queued_at"),
                        rs.getString("finished_at"))).optional().orElseThrow(
                        ()->conflict("Verification run does not exist."));
        Boolean leaseMatches=jdbc.sql("""
                select exists(select 1 from mediaos_verification_run
                where id=:id and lease_id=:lease and worker_id=:worker
                  and source_commit=:commit)
                """).param("id",id).param("lease",input.leaseId())
                .param("worker",workerId).param("commit",input.sourceCommit())
                .query(Boolean.class).single();
        if(!Boolean.TRUE.equals(leaseMatches))
            throw conflict("Verification worker identity, lease or source commit mismatch.");
        if("PASSED".equals(current.state())||"FAILED".equals(current.state()))return current;
        if(!"RUNNING".equals(current.state()))
            throw conflict("Expired or unknown verification cannot be accepted automatically.");
        boolean pass=input.stages().size()==STAGES.size()
                && input.stages().stream().allMatch(s->s.exitCode()==0)
                && input.failureCode()==null;
        String outcome=pass?"PASSED":"FAILED";
        String report;
        try {report=mapper.writeValueAsString(input.stages());}
        catch(JsonProcessingException e){throw conflict("Cannot save worker proof.");}
        int changed=jdbc.sql("""
                update mediaos_verification_run
                   set state=:state,stage_results=cast(:stages as jsonb),
                       failure_reason=:failure,finished_at=now(),updated_at=now()
                 where id=:id and state='RUNNING' and worker_id=:worker
                   and lease_id=:lease and source_commit=:commit
                """).param("state",outcome).param("stages",report)
                .param("failure",pass?null:input.failureCode()==null
                        ?"TEST_STAGE_EXIT_NONZERO":input.failureCode())
                .param("id",id).param("worker",workerId).param("lease",input.leaseId())
                .param("commit",input.sourceCommit()).update();
        if(changed!=1)throw conflict("Verification result lost its active lease.");
        return byId(id);
    }

    @Scheduled(fixedDelayString="${mediaos.verification.reap-delay-ms:120000}")
    public void expireStale() {
        if(!enabled)return;
        jdbc.sql("""
                update mediaos_verification_run
                   set state='UNKNOWN',
                       failure_reason='WORKER_LEASE_EXPIRED_NO_AUTOMATIC_RETRY',
                       updated_at=now()
                 where state='RUNNING' and claimed_at<now()-interval '90 minutes'
                """).update();
    }

    static boolean validSha(String sha) {
        return sha!=null && sha.matches("[0-9a-f]{40}");
    }

    static boolean validStages(List<StageResult> stages) {
        if(stages==null || stages.size()>STAGES.size())return false;
        for(int i=0;i<stages.size();i++) {
            StageResult stage=stages.get(i);
            if(stage==null || !STAGES.get(i).equals(stage.stage())
                    || stage.exitCode()<0 || stage.exitCode()>255
                    || stage.durationMs()<0 || stage.durationMs()>7200000)return false;
            if(i<stages.size()-1 && stage.exitCode()!=0)return false;
        }
        return true;
    }

    static boolean validFailure(String reason) {
        return reason==null || List.of(
                "WORKER_BOOTSTRAP_FAILED","SOURCE_COMMIT_MISMATCH",
                "GIT_SOURCE_UNAVAILABLE","DOCKER_UNAVAILABLE",
                "TEST_STAGE_FAILURE","TEST_RUN_INTERRUPTED").contains(reason);
    }

    private Run byRequest(UUID request) {
        UUID id=jdbc.sql("select id from mediaos_verification_run where request_id=:id")
                .param("id",request).query(UUID.class).optional().orElse(null);
        return id==null?null:byId(id);
    }

    private Run byId(UUID id) {
        return jdbc.sql("""
                select id,source_commit,source_branch,state,worker_id,
                       stage_results::text as stages,failure_reason,
                       queued_at::text as queued_at,finished_at::text as finished_at
                from mediaos_verification_run where id=:id
                """).param("id",id)
                .query((rs,n)->new Run(rs.getObject("id",UUID.class),
                        rs.getString("source_commit"),rs.getString("source_branch"),
                        rs.getString("state"),rs.getString("worker_id"),
                        decodeStages(rs.getString("stages")),rs.getString("failure_reason"),
                        rs.getString("queued_at"),rs.getString("finished_at")))
                .single();
    }

    private List<StageResult> decodeStages(String json) {
        try {
            var type=mapper.getTypeFactory().constructCollectionType(List.class,StageResult.class);
            return List.copyOf(mapper.readValue(json,type));
        }catch(Exception failure){
            return List.of();
        }
    }

    private void requireEnabledWorker(String worker) {
        if(!enabled)throw conflict("Verification worker is disabled.");
        if(worker==null || !worker.matches("[A-Za-z0-9._:-]{1,180}"))
            throw bad("Registered verification worker ID required.");
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);
    }
    private static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT,message);
    }
}
