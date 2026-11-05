package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class Ep002VisualShotAcceptanceService {
    private final JdbcClient jdbc;
    private final Ep002SequentialVisualPreflightService sequence;
    private final Ep002SingleShotGitEvidenceService git;

    public Ep002VisualShotAcceptanceService(JdbcClient jdbc,
            Ep002SequentialVisualPreflightService sequence,
            Ep002SingleShotGitEvidenceService git) {
        this.jdbc=jdbc;
        this.sequence=sequence;
        this.git=git;
    }

    public record Request(UUID requestId,String expectedFingerprint,String shotKey,
                          UUID renderId,int pullRequestNumber,String expectedMainSha,
                          String expectedBlobSha,String expectedPolicyDigest,
                          boolean confirmWatchedAndApproved) {}
    public record Receipt(UUID requestId,String shotKey,String sourceSha,
                          String sourceBlob,String policyDigest,String renderId) {}

    static void requireInput(Request r,Ep002SequentialVisualPreflightService.Preflight state) {
        if(r==null || r.requestId()==null || r.renderId()==null
                || !r.confirmWatchedAndApproved() || r.pullRequestNumber()<1
                || !valid(r.expectedFingerprint(),64) || !valid(r.expectedMainSha(),40)
                || !valid(r.expectedBlobSha(),40) || !valid(r.expectedPolicyDigest(),64)
                || state==null || state.candidate()==null
                || !r.expectedFingerprint().equals(state.inputFingerprint())
                || !r.shotKey().equals(state.nextShotKey())
                || state.candidate().approvedTakeId()==null
                || state.candidate().narrationRevision()<1
                || state.candidate().durationInFrames()==null
                || !state.realCueFramesVerified())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The next SHOT requires current approved voice, measured cue frames and Director review.");
    }

    @Transactional(readOnly=true)
    public List<Receipt> list() {
        var actor=DirectorIdentity.requireDirector();
        return jdbc.sql("""
                select request_id,shot_key,verified_source_commit,
                       verified_source_blob_sha,verified_policy_sha256,
                       remotion_render_id::text as render
                  from ep002_visual_shot_acceptance
                 where director_issuer=:issuer and director_subject=:subject
                 order by created_at desc limit 100
                """)
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .query((rs,n)->new Receipt(rs.getObject("request_id",UUID.class),
                        rs.getString("shot_key"),rs.getString("verified_source_commit"),
                        rs.getString("verified_source_blob_sha"),
                        rs.getString("verified_policy_sha256"),rs.getString("render")))
                .list();
    }

    @Transactional
    public Receipt approve(Request r,UUID auditId) {
        var actor=DirectorIdentity.requireDirector();
        if(auditId==null)throw conflict("Director production preflight audit is required.");
        var state=sequence.preview();
        requireInput(r,state);
        var proof=git.verify(r.shotKey(),r.pullRequestNumber());
        if(!proof.verified() || !r.expectedMainSha().equals(proof.currentMainCommit())
                || !r.expectedBlobSha().equals(proof.sourceBlobSha())
                || !r.expectedPolicyDigest().equals(proof.policyDigest()))
            throw conflict("Current merged Remotion source and visual-policy SHA are unverified.");

        var shot=state.candidate();
        UUID take=UUID.fromString(shot.approvedTakeId());
        String dependency=Ep002ProductionContractService.fingerprint(
                "EP002",shot.shotKey(),shot.narrationRevision(),
                shot.narrationSha256(),take,Ep002ProductionContractService.VISUAL_SHA);

        Boolean verified=jdbc.sql("""
                select exists(
                    select 1 from episode_shot_render_lineage l
                    join remotion_render r on r.id=l.remotion_render_id
                    join episode_factory_worker_capability w
                      on w.worker_id=r.worker_id and w.source_commit=:commit
                     and w.build_checked=true
                     and w.last_heartbeat_at>now()-interval '120 seconds'
                    where l.episode_key='EP002' and l.shot_key=:shot
                      and l.remotion_render_id=:render
                      and l.script_revision=:revision and l.script_sha256=:narration
                      and l.preferred_take_id=:take
                      and l.visual_source_git_blob_sha=:visual
                      and l.dependency_sha256=:dependency
                      and l.remotion_commit_sha=:commit
                      and w.bundled_scenes @> cast(:inventory as jsonb)
                      and r.composition_id='AT-FACTORY-SHOT'
                      and r.status='SUCCEEDED' and r.video_data is not null
                      and r.duration_in_frames=:frames
                      and r.input_props->>'shotKey'=:shot
                      and r.input_props->>'voiceTakeId'=:voice
                      and r.input_props->>'timingMode'='ELEVENLABS_CHARACTER_TIMESTAMPS'
                      and r.input_props->>'expectedSourceCommit'=:commit
                      and r.input_props->>'sourceBlobSha'=:blob
                      and r.input_props->>'policyDigest'=:policy
                )
                """)
                .param("commit",proof.currentMainCommit())
                .param("shot",shot.shotKey()).param("render",r.renderId())
                .param("revision",shot.narrationRevision())
                .param("narration",shot.narrationSha256())
                .param("take",take).param("voice",take.toString())
                .param("visual",Ep002ProductionContractService.VISUAL_SHA)
                .param("dependency",dependency).param("frames",shot.durationInFrames())
                .param("inventory","[\"EP002-"+shot.shotKey()+"\"]")
                .param("blob",proof.sourceBlobSha()).param("policy",proof.policyDigest())
                .query(Boolean.class).single();
        if(!Boolean.TRUE.equals(verified))
            throw conflict("Verified merged source, matching worker and actual synced MP4 are required.");

        int added=jdbc.sql("""
                insert into ep002_visual_shot_acceptance(
                    id,request_id,shot_key,episode_input_fingerprint,
                    narration_revision,narration_sha256,preferred_take_id,
                    remotion_render_id,verified_source_commit,verified_source_blob_sha,
                    verified_policy_sha256,source_pr_number,
                    director_issuer,director_subject,preflight_audit_id
                ) values (:id,:request,:shot,:fp,:revision,:narration,:take,:render,
                          :commit,:blob,:policy,:pr,:issuer,:subject,:audit)
                on conflict do nothing
                """)
                .param("id",UUID.randomUUID()).param("request",r.requestId())
                .param("shot",r.shotKey()).param("fp",r.expectedFingerprint())
                .param("revision",shot.narrationRevision())
                .param("narration",shot.narrationSha256()).param("take",take)
                .param("render",r.renderId()).param("commit",proof.currentMainCommit())
                .param("blob",proof.sourceBlobSha()).param("policy",proof.policyDigest())
                .param("pr",r.pullRequestNumber()).param("issuer",actor.issuer())
                .param("subject",actor.subject()).param("audit",auditId).update();
        if(added!=1)throw conflict("A review receipt already exists for this request or source.");
        return new Receipt(r.requestId(),r.shotKey(),proof.currentMainCommit(),
                proof.sourceBlobSha(),proof.policyDigest(),r.renderId().toString());
    }

    private static boolean valid(String raw,int size) {
        return raw!=null && raw.matches("[a-f0-9]{"+size+"}");
    }
    private static ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT,reason);
    }
}
