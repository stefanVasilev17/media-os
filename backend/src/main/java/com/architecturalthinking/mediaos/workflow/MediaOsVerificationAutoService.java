package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class MediaOsVerificationAutoService {
    private static final Logger LOGGER=LoggerFactory.getLogger(MediaOsVerificationAutoService.class);
    private final JdbcClient jdbc;
    private final Ep002SingleShotGitEvidenceService git;
    private final boolean enabled;

    public MediaOsVerificationAutoService(JdbcClient jdbc,Ep002SingleShotGitEvidenceService git,
            @Value("${mediaos.verification.enabled:false}") boolean enabled) {
        this.jdbc=jdbc;
        this.git=git;
        this.enabled=enabled;
    }

    public record ArmRequest(UUID requestId,int maximumCommits,
                             boolean confirmAutomaticIsolatedDockerTests) {}
    public record PauseRequest(UUID policyId,boolean confirmPause) {}
    public record Status(UUID policyId,String state,int maximumCommits,
                         int submittedCount,String lastQueuedCommit,
                         String currentVerifiedCommit,boolean sourceVerified,
                         String sourceReason) {}
    private record Policy(UUID id,UUID requestId,String issuer,String subject,
                          int max,int submitted,String lastCommit,String state,
                          UUID preflightAuditId) {}

    static void validate(ArmRequest input) {
        if(input==null || input.requestId()==null || input.maximumCommits()<1
                || input.maximumCommits()>20
                || !input.confirmAutomaticIsolatedDockerTests())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "One-time Director consent for 1–20 isolated Git commits required.");
    }

    @Transactional(readOnly=true)
    public Status status() {
        var actor=DirectorIdentity.requireDirector();
        Policy p=latest(actor);
        var source=enabled?git.verificationTarget():
                new Ep002SingleShotGitEvidenceService.VerificationTarget(
                        false,null,"AUTOMATIC_VERIFICATION_WORKER_DISABLED");
        if(p==null)return new Status(null,"NOT_ARMED",0,0,null,
                source.sourceCommit(),source.verified(),source.reason());
        return new Status(p.id(),p.state(),p.max(),p.submitted(),p.lastCommit(),
                source.sourceCommit(),source.verified(),source.reason());
    }

    @Transactional
    public Status arm(ArmRequest input,UUID auditId) {
        var actor=DirectorIdentity.requireDirector();
        validate(input);
        if(auditId==null || !enabled)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Audited Director consent and configured isolated verification required.");
        Policy prior=jdbc.sql("""
                select id,request_id,director_issuer,director_subject,
                       max_runs,submitted_count,last_queued_commit,
                       state,preflight_audit_id
                  from mediaos_verification_auto_policy where request_id=:request
                """).param("request",input.requestId())
                .query((rs,n)->new Policy(rs.getObject("id",UUID.class),
                        rs.getObject("request_id",UUID.class),
                        rs.getString("director_issuer"),rs.getString("director_subject"),
                        rs.getInt("max_runs"),rs.getInt("submitted_count"),
                        rs.getString("last_queued_commit"),rs.getString("state"),
                        rs.getObject("preflight_audit_id",UUID.class)))
                .optional().orElse(null);
        if(prior!=null){
            if(!prior.issuer().equals(actor.issuer())
                    || !prior.subject().equals(actor.subject())
                    || prior.max()!=input.maximumCommits())
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Autopilot request UUID already belongs to another consent.");
            return status();
        }
        int added=jdbc.sql("""
                insert into mediaos_verification_auto_policy(
                    id,request_id,director_issuer,director_subject,
                    preflight_audit_id,max_runs
                ) values(:id,:request,:issuer,:subject,:audit,:max)
                on conflict do nothing
                """)
                .param("id",UUID.randomUUID()).param("request",input.requestId())
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .param("audit",auditId).param("max",input.maximumCommits()).update();
        if(added!=1)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Another bounded automatic verification policy is already active.");
        return status();
    }

    @Transactional
    public Status pause(PauseRequest input,UUID auditId) {
        var actor=DirectorIdentity.requireDirector();
        if(!enabled || auditId==null || input==null || input.policyId()==null
                || !input.confirmPause())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Audited Director pause and exact policy ID required.");
        int changed=jdbc.sql("""
                update mediaos_verification_auto_policy
                   set state='PAUSED',updated_at=now()
                 where id=:id and state='ARMED'
                   and director_issuer=:issuer and director_subject=:subject
                """).param("id",input.policyId())
                .param("issuer",actor.issuer()).param("subject",actor.subject()).update();
        if(changed!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Active Director automatic verification policy was not found.");
        jdbc.sql("""
                update mediaos_verification_run
                   set state='CANCELLED',cancellation_audit_id=:audit,
                       failure_reason='AUTO_VERIFICATION_PAUSED_BEFORE_CLAIM',
                       finished_at=now(),updated_at=now()
                 where auto_policy_id=:policy and state='QUEUED'
                """).param("policy",input.policyId()).param("audit",auditId).update();
        return status();
    }

    @Scheduled(fixedDelayString="${mediaos.verification.auto.poll-delay-ms:120000}")
    @Transactional
    public void poll() {
        if(!enabled)return;
        try {
            var source=git.verificationTarget();
            if(!source.verified() || !MediaOsVerificationRunService.validSha(
                    source.sourceCommit()))return;
            jdbc.sql("select pg_advisory_xact_lock(hashtext('mediaos-verify-auto')::bigint)")
                    .query((rs,n)->true).single();
            Policy policy=jdbc.sql("""
                    select id,request_id,director_issuer,director_subject,
                           max_runs,submitted_count,last_queued_commit,
                           state,preflight_audit_id
                      from mediaos_verification_auto_policy where state='ARMED'
                     order by created_at,id limit 1 for update
                    """)
                    .query((rs,n)->new Policy(rs.getObject("id",UUID.class),
                            rs.getObject("request_id",UUID.class),
                            rs.getString("director_issuer"),rs.getString("director_subject"),
                            rs.getInt("max_runs"),rs.getInt("submitted_count"),
                            rs.getString("last_queued_commit"),rs.getString("state"),
                            rs.getObject("preflight_audit_id",UUID.class)))
                    .optional().orElse(null);
            if(policy==null || policy.submitted()>=policy.max()
                    || source.sourceCommit().equals(policy.lastCommit()))return;
            Boolean busy=jdbc.sql("""
                    select exists(select 1 from mediaos_verification_run
                        where state in ('QUEUED','RUNNING','UNKNOWN'))
                    """).query(Boolean.class).single();
            if(Boolean.TRUE.equals(busy))return;
            int inserted=jdbc.sql("""
                    insert into mediaos_verification_run(
                        id,request_id,source_commit,director_issuer,
                        director_subject,preflight_audit_id,auto_policy_id
                    ) values(:id,:request,:commit,:issuer,:subject,:audit,:policy)
                    on conflict do nothing
                    """)
                    .param("id",UUID.randomUUID()).param("request",UUID.randomUUID())
                    .param("commit",source.sourceCommit())
                    .param("issuer",policy.issuer()).param("subject",policy.subject())
                    .param("audit",policy.preflightAuditId()).param("policy",policy.id())
                    .update();
            if(inserted!=1)return;
            jdbc.sql("""
                    update mediaos_verification_auto_policy
                       set submitted_count=submitted_count+1,
                           last_queued_commit=:commit,updated_at=now()
                     where id=:id and state='ARMED'
                       and submitted_count<max_runs
                    """).param("commit",source.sourceCommit())
                    .param("id",policy.id()).update();
        }catch(Exception unavailable) {
            LOGGER.warn("Verification autopilot paused this poll; category={}",
                    unavailable.getClass().getSimpleName());
        }
    }

    private Policy latest(DirectorIdentity.Actor actor) {
        return jdbc.sql("""
                select id,request_id,director_issuer,director_subject,
                       max_runs,submitted_count,last_queued_commit,
                       state,preflight_audit_id
                  from mediaos_verification_auto_policy
                 where director_issuer=:issuer and director_subject=:subject
                 order by created_at desc,id desc limit 1
                """).param("issuer",actor.issuer()).param("subject",actor.subject())
                .query((rs,n)->new Policy(rs.getObject("id",UUID.class),
                        rs.getObject("request_id",UUID.class),
                        rs.getString("director_issuer"),rs.getString("director_subject"),
                        rs.getInt("max_runs"),rs.getInt("submitted_count"),
                        rs.getString("last_queued_commit"),rs.getString("state"),
                        rs.getObject("preflight_audit_id",UUID.class)))
                .optional().orElse(null);
    }
}
