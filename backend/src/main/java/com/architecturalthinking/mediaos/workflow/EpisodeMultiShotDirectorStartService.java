package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class EpisodeMultiShotDirectorStartService {
    static final String APPROVED = "APPROVED_NO_DISPATCH";
    static final String VERIFIED = "SOURCE_MANIFEST_VERIFIED_WAITING_FOR_SEPARATE_DIRECTOR_START";

    private final JdbcClient jdbc;
    private final EpisodeCodeWorkerBatchManifestService manifests;

    public EpisodeMultiShotDirectorStartService(
            JdbcClient jdbc, EpisodeCodeWorkerBatchManifestService manifests) {
        this.jdbc = jdbc;
        this.manifests = manifests;
    }

    public record StartRequest(UUID requestId,
                               String expectedProductionInputSha256,
                               String expectedPinnedGitCommit,
                               Boolean confirmDirectorStart,
                               Boolean acknowledgeProviderDisabled) {}

    public record StartApproval(UUID approvalId, UUID jobId, UUID packageId,
                                String state, String productionInputSha256,
                                String pinnedGitCommit, String dependencySha256,
                                int expectedShotCount, String approvedAt,
                                boolean canStartAgent, boolean providerDispatchEnabled) {}

    record JobEvidence(UUID authorizationId, String state, String sourceSha,
                       String readinessFingerprint, String repository,
                       String pathPrefix, String directorIssuer, String directorSubject) {}
    record BudgetEvidence(String state, OffsetDateTime expiresAt,
                          String sourceSha, String readinessFingerprint) {}

    static void validateRequest(StartRequest input) {
        if (input == null || input.requestId() == null
                || !Boolean.TRUE.equals(input.confirmDirectorStart())
                || !Boolean.TRUE.equals(input.acknowledgeProviderDisabled())
                || !isSha(input.expectedProductionInputSha256(), 64)
                || !isSha(input.expectedPinnedGitCommit(), 40))
            throw bad("A new UUID, exact manifest/Git fingerprints and explicit Director confirmation are required.");
    }

    static void requireFreshVerifiedManifest(
            EpisodeCodeWorkerBatchManifestService.BatchManifest manifest,
            StartRequest request, UUID packageId, UUID jobId) {
        if (!packageId.equals(manifest.packageId()) || !jobId.equals(manifest.jobId())
                || !VERIFIED.equals(manifest.status())
                || !manifest.blockers().isEmpty()
                || manifest.shots().isEmpty()
                || !manifest.shots().stream().allMatch(s ->
                        s.proposedNewAssetKeys().isEmpty()
                        && s.assets().stream().noneMatch(a ->
                            !"IMPORT_ONLY_LOCKED_SOURCE".equals(a.reviewStatus())))
                || !isSha(manifest.productionInputSha256(), 64)
                || !isSha(manifest.productionDependencySha256(), 64)
                || !isSha(manifest.assetCatalogSha256(), 64)
                || !request.expectedProductionInputSha256().equals(manifest.productionInputSha256())
                || !request.expectedPinnedGitCommit().equals(manifest.pinnedGitCommit()))
            throw conflict("Git, asset or approved source/voice manifest is blocked or changed. Verify all SHOTs again.");
    }

    @Transactional(readOnly = true)
    public StartApproval get(UUID packageId, UUID jobId) {
        var actor = DirectorIdentity.requireDirector();
        return load(packageId, jobId, actor);
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public StartApproval approve(UUID packageId, UUID jobId,
                                 StartRequest request, UUID auditId) {
        var actor = DirectorIdentity.requireDirector();
        validateRequest(request);
        if (auditId == null)
            throw conflict("An audited Director production preflight is required.");

        JobEvidence job = jdbc.sql("""
                select authorization_id,state,source_sha256,readiness_fingerprint,
                       repository_full_name,code_path_prefix,director_issuer,director_subject
                  from episode_multi_shot_execution_job
                 where id=:job and package_id=:package
                   and director_issuer=:issuer and director_subject=:subject
                 for update
                """).param("job", jobId).param("package", packageId)
                .param("issuer", actor.issuer()).param("subject", actor.subject())
                .query((rs,n) -> new JobEvidence(
                        rs.getObject("authorization_id", UUID.class),
                        rs.getString("state"),rs.getString("source_sha256"),
                        rs.getString("readiness_fingerprint"),
                        rs.getString("repository_full_name"),rs.getString("code_path_prefix"),
                        rs.getString("director_issuer"),rs.getString("director_subject")))
                .optional().orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND,"Director execution job not found."));

        StartApproval previous = load(packageId, jobId, actor);
        if (previous != null) {
            if (!request.requestId().equals(idempotencyId(jobId))
                    || !request.expectedProductionInputSha256().equals(previous.productionInputSha256())
                    || !request.expectedPinnedGitCommit().equals(previous.pinnedGitCommit()))
                throw conflict("A different Director Start approval already exists for this job.");
            return previous;
        }
        if (!"PREPARED_NO_DISPATCH".equals(job.state()))
            throw conflict("Only a prepared, un-dispatched job can receive Director Start approval.");

        BudgetEvidence budget = jdbc.sql("""
                select state,expires_at,source_sha256,readiness_fingerprint
                  from episode_ai_production_authorization
                 where id=:id and package_id=:package
                   and director_issuer=:issuer and director_subject=:subject
                 for update
                """).param("id",job.authorizationId()).param("package",packageId)
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .query((rs,n) -> new BudgetEvidence(rs.getString("state"),
                        rs.getObject("expires_at",OffsetDateTime.class),
                        rs.getString("source_sha256"),rs.getString("readiness_fingerprint")))
                .optional().orElseThrow(() -> conflict("Original Director budget grant is missing."));

        if (!"CONSUMED".equals(budget.state())
                || budget.expiresAt() == null
                || !OffsetDateTime.now().isBefore(budget.expiresAt())
                || !job.sourceSha().equals(budget.sourceSha())
                || !job.readinessFingerprint().equals(budget.readinessFingerprint()))
            throw conflict("The original finite Director budget expired or no longer matches this job.");

        boolean hasPaidAttempt = jdbc.sql("""
                select exists(select 1 from episode_multi_shot_openai_usage
                               where job_id=:job)
                """).param("job",jobId).query(Boolean.class).single();
        if (hasPaidAttempt)
            throw conflict("A paid attempt already exists. Director Start cannot be replayed.");

        var current = manifests.prepareReadOnly(packageId,jobId);
        requireFreshVerifiedManifest(current,request,packageId,jobId);
        if (!job.sourceSha().equals(current.sourceSha256())
                || !job.readinessFingerprint().equals(current.readinessFingerprint())
                || !job.repository().equals(current.repository())
                || !job.pathPrefix().equals(current.allowedCodePath())
                || !job.repository().equals(RemotionGitDependencyPinService.REPOSITORY))
            throw conflict("The prepared job no longer matches the verified Git/source scope.");

        jdbc.sql("""
                insert into episode_multi_shot_director_start (
                  id,request_id,job_id,package_id,authorization_id,
                  original_source_sha256,readiness_fingerprint,production_input_sha256,
                  pinned_git_commit,dependency_sha256,asset_catalog_sha256,expected_shot_count,
                  director_issuer,director_subject,preflight_audit_id
                ) values (
                  :id,:request,:job,:package,:authorization,
                  :source,:readiness,:input,:commit,:dependency,:catalog,:shots,
                  :issuer,:subject,:audit
                )
                """).param("id",UUID.randomUUID()).param("request",request.requestId())
                .param("job",jobId).param("package",packageId)
                .param("authorization",job.authorizationId())
                .param("source",job.sourceSha())
                .param("readiness",job.readinessFingerprint())
                .param("input",current.productionInputSha256())
                .param("commit",current.pinnedGitCommit())
                .param("dependency",current.productionDependencySha256())
                .param("catalog",current.assetCatalogSha256())
                .param("shots",current.shots().size())
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .param("audit",auditId).update();

        return load(packageId,jobId,actor);
    }

    private UUID idempotencyId(UUID jobId) {
        return jdbc.sql("""
                select request_id from episode_multi_shot_director_start where job_id=:job
                """).param("job",jobId).query(UUID.class).single();
    }

    private StartApproval load(UUID packageId,UUID jobId,DirectorIdentity.Actor actor) {
        return jdbc.sql("""
                select id,job_id,package_id,state,production_input_sha256,
                       pinned_git_commit,dependency_sha256,expected_shot_count,
                       approved_at::text
                  from episode_multi_shot_director_start
                 where job_id=:job and package_id=:package
                   and director_issuer=:issuer and director_subject=:subject
                """).param("job",jobId).param("package",packageId)
                .param("issuer",actor.issuer()).param("subject",actor.subject())
                .query((rs,n) -> new StartApproval(
                        rs.getObject("id",UUID.class),rs.getObject("job_id",UUID.class),
                        rs.getObject("package_id",UUID.class),rs.getString("state"),
                        rs.getString("production_input_sha256"),rs.getString("pinned_git_commit"),
                        rs.getString("dependency_sha256"),rs.getInt("expected_shot_count"),
                        rs.getString("approved_at"),false,false))
                .optional().orElse(null);
    }

    private static boolean isSha(String s,int len) {
        return s!=null && s.length()==len && s.matches("[a-f0-9]+");
    }
    private static ResponseStatusException bad(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,reason);
    }
    private static ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT,reason);
    }
}
