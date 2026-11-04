package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class EpisodeMultiShotDirectorStartServiceTest {
    private static final UUID PACKAGE=UUID.randomUUID();
    private static final UUID JOB=UUID.randomUUID();
    private static final String INPUT="a".repeat(64);
    private static final String COMMIT="b".repeat(40);
    private static final String SHA="c".repeat(64);

    private static EpisodeMultiShotDirectorStartService.StartRequest request() {
        return new EpisodeMultiShotDirectorStartService.StartRequest(
                UUID.randomUUID(),INPUT,COMMIT,true,true);
    }

    private static EpisodeCodeWorkerBatchManifestService.BatchManifest manifest(
            String status,List<String> blockers,List<String> newAssets,String reviewStatus) {
        var asset=new EpisodeCodeWorkerBatchManifestService.AssetDecision(
                "PHONE_LOGIN","REGISTERED", "ATPhone",
                "remotion-engine/src/components/architectural-thinking/ATVisualPrimitives.tsx",
                "d".repeat(40),reviewStatus);
        var shot=new EpisodeCodeWorkerBatchManifestService.ShotPrompt(
                "SHOT01",1,"remotion-engine/src/episodes/ep003/Shot01GeneratedScene.tsx",
                "Shot01GeneratedScene",1,
                "Approved narration","Calm narration",UUID.randomUUID().toString(),
                new BigDecimal("13.200"),396,null,
                List.of(new EpisodeCodeWorkerBatchManifestService.Cue("BEAT01","press Login",10,40)),
                List.of(asset),newAssets);
        return new EpisodeCodeWorkerBatchManifestService.BatchManifest(
                "mediaos.code-worker-batch-manifest.v1",PACKAGE,JOB,"EP003",
                SHA,SHA,SHA,"stefanVasilev17/media-os",
                "remotion-engine/src/episodes/ep003/",COMMIT,SHA,List.of(),
                INPUT,status,blockers,"mediaos.generated-remotion-scene-proposal.v1",
                "Never modify locked sources.",false,false,List.of(shot));
    }

    private static void mustBlock(
            EpisodeCodeWorkerBatchManifestService.BatchManifest manifest,
            EpisodeMultiShotDirectorStartService.StartRequest request) {
        var err=assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotDirectorStartService.requireFreshVerifiedManifest(
                        manifest,request,PACKAGE,JOB));
        assertEquals(HttpStatus.CONFLICT,err.getStatusCode());
    }

    @Test
    void validNoDispatchDirectorReceiptRequiresAllVerifiedImmutableInputs() {
        var input=request();
        EpisodeMultiShotDirectorStartService.validateRequest(input);
        EpisodeMultiShotDirectorStartService.requireFreshVerifiedManifest(
                manifest(EpisodeMultiShotDirectorStartService.VERIFIED,List.of(),
                        List.of(),"IMPORT_ONLY_LOCKED_SOURCE"),input,PACKAGE,JOB);
    }

    @Test
    void missingConsentOrMalformedFingerprintFailsBeforeAnyNetworkOrDbMutation() {
        for(var input:List.of(
                new EpisodeMultiShotDirectorStartService.StartRequest(
                        UUID.randomUUID(),INPUT,COMMIT,false,true),
                new EpisodeMultiShotDirectorStartService.StartRequest(
                        UUID.randomUUID(),INPUT,COMMIT,true,false),
                new EpisodeMultiShotDirectorStartService.StartRequest(
                        UUID.randomUUID(),"bad",COMMIT,true,true),
                new EpisodeMultiShotDirectorStartService.StartRequest(
                        UUID.randomUUID(),INPUT,"bad",true,true))) {
            var err=assertThrows(ResponseStatusException.class,
                    ()->EpisodeMultiShotDirectorStartService.validateRequest(input));
            assertEquals(HttpStatus.BAD_REQUEST,err.getStatusCode());
        }
    }

    @Test
    void blockedGitOrVoiceManifestCannotBeApproved() {
        mustBlock(manifest("SOURCE_MANIFEST_BLOCKED",
                List.of("GITHUB_HEAD_UNAVAILABLE"),List.of(),
                "IMPORT_ONLY_LOCKED_SOURCE"),request());
        mustBlock(manifest(EpisodeMultiShotDirectorStartService.VERIFIED,
                List.of("VOICE_SNAPSHOT_STALE"),List.of(),
                "IMPORT_ONLY_LOCKED_SOURCE"),request());
    }

    @Test
    void gitCommitOrProductionInputDriftRequiresFreshDirectorClick() {
        mustBlock(manifest(EpisodeMultiShotDirectorStartService.VERIFIED,
                List.of(),List.of(),"IMPORT_ONLY_LOCKED_SOURCE"),
                new EpisodeMultiShotDirectorStartService.StartRequest(
                        UUID.randomUUID(),"e".repeat(64),COMMIT,true,true));
        mustBlock(manifest(EpisodeMultiShotDirectorStartService.VERIFIED,
                List.of(),List.of(),"IMPORT_ONLY_LOCKED_SOURCE"),
                new EpisodeMultiShotDirectorStartService.StartRequest(
                        UUID.randomUUID(),INPUT,"f".repeat(40),true,true));
    }

    @Test
    void unknownOrUnreviewedAssetsNeverPassTheDirectorStartGate() {
        mustBlock(manifest(EpisodeMultiShotDirectorStartService.VERIFIED,
                List.of(),List.of("REDIS"),"IMPORT_ONLY_LOCKED_SOURCE"),request());
        mustBlock(manifest(EpisodeMultiShotDirectorStartService.VERIFIED,
                List.of(),List.of(),"REVIEW_EXISTING_FIRST"),request());
    }

    @Test
    void aDifferentPackageOrJobCannotReuseTheSameReviewedManifest() {
        var ready=manifest(EpisodeMultiShotDirectorStartService.VERIFIED,
                List.of(),List.of(),"IMPORT_ONLY_LOCKED_SOURCE");
        assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotDirectorStartService.requireFreshVerifiedManifest(
                        ready,request(),UUID.randomUUID(),JOB));
        assertThrows(ResponseStatusException.class,
                ()->EpisodeMultiShotDirectorStartService.requireFreshVerifiedManifest(
                        ready,request(),PACKAGE,UUID.randomUUID()));
    }
}
