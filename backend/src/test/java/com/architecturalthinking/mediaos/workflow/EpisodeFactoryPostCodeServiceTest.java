package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class EpisodeFactoryPostCodeServiceTest {
    private static final String REPO="stefanVasilev17/media-os";
    private final ObjectMapper mapper=new ObjectMapper();

    private static List<EpisodeFactoryPostCodeService.ShotState> fakeShots(){
        return List.of(new EpisodeFactoryPostCodeService.ShotState(
                "SHOT01",1,1200,UUID.randomUUID().toString(),
                "remotion-engine/src/episodes/ep003/Shot01GeneratedScene.tsx",
                false,false,null));
    }

    @Test
    void allowsOnlyCompleteConsentedUnchangedProductionIntake() {
        EpisodeFactoryPostCodeService.requireCreate(new EpisodeFactoryPostCodeService.CreateRequest(
                UUID.randomUUID(),UUID.randomUUID(),"a".repeat(64),true));
        for(var invalid:List.of(
                new EpisodeFactoryPostCodeService.CreateRequest(null,UUID.randomUUID(),"a".repeat(64),true),
                new EpisodeFactoryPostCodeService.CreateRequest(UUID.randomUUID(),null,"a".repeat(64),true),
                new EpisodeFactoryPostCodeService.CreateRequest(UUID.randomUUID(),UUID.randomUUID(),"x",true),
                new EpisodeFactoryPostCodeService.CreateRequest(UUID.randomUUID(),UUID.randomUUID(),"a".repeat(64),false))) {
            assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                    ()->EpisodeFactoryPostCodeService.requireCreate(invalid)).getStatusCode());
        }
    }

    @Test
    void directorFeedbackValidatesExactScopeAndRejectsUntrustedArea() {
        var good=new EpisodeFactoryPostCodeService.FeedbackRequest(
                UUID.randomUUID(),"SHOT01","CAMERA",
                "Reduce zoom by thirty percent, preserve audio.",true);
        EpisodeFactoryPostCodeService.validateFeedback(good,fakeShots());
        assertThrows(ResponseStatusException.class,()->
                EpisodeFactoryPostCodeService.validateFeedback(
                        new EpisodeFactoryPostCodeService.FeedbackRequest(
                            UUID.randomUUID(),"SHOT02","CAMERA",
                            "Reduce zoom by thirty percent.",true),fakeShots()));
        assertThrows(ResponseStatusException.class,()->
                EpisodeFactoryPostCodeService.validateFeedback(
                        new EpisodeFactoryPostCodeService.FeedbackRequest(
                            UUID.randomUUID(),"SHOT01","EXECUTE_SHELL",
                            "run malicious commands",true),fakeShots()));
        assertThrows(ResponseStatusException.class,()->
                EpisodeFactoryPostCodeService.validateFeedback(
                        new EpisodeFactoryPostCodeService.FeedbackRequest(
                            UUID.randomUUID(),"SHOT01","CAMERA",
                            "short",true),fakeShots()));
    }

    @Test
    void shortsAreThreeDistinctNonoverlappingRealFrameWindows() {
        var windows=EpisodeFactoryPostCodeService.planThreeShortWindows(30*15*60);
        assertEquals(3,windows.size());
        for(var w:windows){
            assertTrue(w[0]>=0);
            assertTrue(w[1]<=30*15*60);
            assertTrue(w[1]-w[0]>=20*30);
            assertTrue(w[1]-w[0]<=45*30);
        }
        assertTrue(windows.get(0)[1]<=windows.get(1)[0]);
        assertTrue(windows.get(1)[1]<=windows.get(2)[0]);
        assertEquals(0,EpisodeFactoryPostCodeService.planThreeShortWindows(45*30).size());
    }

    @Test
    void strictGithubPathValidatorProtectsLockedEpisodesAndDependencies() {
        assertTrue(EpisodeFactoryGitCodeAuditService.safeNewEpisodePath("EP003",
                "remotion-engine/src/episodes/ep003/Shot01GeneratedScene.tsx"));
        for(String path:List.of(
                "remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx",
                "remotion-engine/src/Root.tsx",
                "remotion-engine/src/design-system/tokens.ts",
                "remotion-engine/src/episodes/ep003/../../ep001/injected.tsx",
                "remotion-engine/src/episodes/ep003/foo/bar.ts",
                "remotion-engine/src/episodes/ep003/package.json",
                "remotion-engine/src/episodes/ep003/Shot01GeneratedScene.tsx?evil=true")) {
            assertFalse(EpisodeFactoryGitCodeAuditService.safeNewEpisodePath("EP003",path),path);
        }
        assertFalse(EpisodeFactoryGitCodeAuditService.safeNewEpisodePath("EP001",
                "remotion-engine/src/episodes/ep001/Shot01GeneratedScene.tsx"));
    }

    private JsonNode json(String text){
        try{return mapper.readTree(text);}
        catch(Exception ex){throw new IllegalArgumentException(ex);}
    }

    private EpisodeCodexCloudHandoffService.Shot expectedShot(){
        return new EpisodeCodexCloudHandoffService.Shot(
                "SHOT01",1,"A", "One shot narration","narrate clearly",1,
                UUID.randomUUID().toString(),new BigDecimal("10.000"),300,
                json("{\"visualBeats\":[]}"),List.of(),List.of(),
                "remotion-engine/src/episodes/ep003/Shot01GeneratedScene.tsx");
    }

    @Test
    void fakeReadOnlyGithubEvidenceProvesOnlyScopedMergedSourceNeverClaimsBuild() {
        var service=new EpisodeFactoryGitCodeAuditService(path->{
            if(path.endsWith("/pulls/200"))return json("""
                    {"merged":true,"merge_commit_sha":"%s",
                     "changed_files":1,
                     "base":{"ref":"main","repo":{"full_name":"%s"}},
                     "head":{"repo":{"full_name":"%s"}}}
                    """.formatted("c".repeat(40),REPO,REPO));
            if(path.contains("/files?"))return json("""
                    [{"filename":"remotion-engine/src/episodes/ep003/Shot01GeneratedScene.tsx",
                      "status":"added","sha":"%s"}]
                    """.formatted("d".repeat(40)));
            if(path.endsWith("/branches/main"))return json(
                    "{\"commit\":{\"sha\":\""+ "c".repeat(40)+"\"}}");
            if(path.contains("/contents/"))return json("""
                    {"type":"file","path":"remotion-engine/src/episodes/ep003/Shot01GeneratedScene.tsx",
                     "sha":"%s"}
                    """.formatted("d".repeat(40)));
            throw new IllegalArgumentException(path);
        });
        var evidence=service.verify("EP003",200,List.of(expectedShot()));
        assertTrue(evidence.sourceScopeVerified());
        assertFalse(evidence.buildVerified());
        assertFalse(evidence.canQueueCpuRendering());
        assertTrue(evidence.digest().matches("[a-f0-9]{64}"));
        assertEquals("GITHUB_MERGED_SOURCE_SCOPED_NEEDS_WORKER_BUILD",evidence.status());
    }

    @Test
    void githubMissingPrFileOrCrossScopeEditAlwaysBlocks() {
        var source=new EpisodeFactoryGitCodeAuditService(path->{
            if(path.endsWith("/pulls/201"))return json("""
                    {"merged":true,"merge_commit_sha":"%s",
                     "changed_files":1,
                     "base":{"ref":"main","repo":{"full_name":"%s"}},
                     "head":{"repo":{"full_name":"%s"}}}
                    """.formatted("a".repeat(40),REPO,REPO));
            if(path.contains("/files?"))return json("""
                    [{"filename":"remotion-engine/src/episodes/ep002/Shot01LoginWaiting.tsx",
                      "status":"modified","sha":"%s"}]
                    """.formatted("b".repeat(40)));
            return json("{\"commit\":{\"sha\":\""+ "a".repeat(40)+"\"}}");
        });
        var evidence=source.verify("EP003",201,List.of(expectedShot()));
        assertFalse(evidence.sourceScopeVerified());
        assertTrue(evidence.blockers().contains("OUT_OF_SCOPE_OR_UNTRUSTED_PR_CHANGE"));
        assertTrue(evidence.blockers().stream().anyMatch(s->s.startsWith("MISSING_REQUIRED")));
        assertNull(evidence.digest());
    }

    @Test
    void privateGithubOrMissingTokenFailsClosedWithoutClaimingAnyCodeReview() {
        var source=new EpisodeFactoryGitCodeAuditService(path->{
            throw new java.io.IOException("PRIVATE_REPO_CREDENTIAL_MISSING");
        });
        var evidence=source.verify("EP003",174,List.of(expectedShot()));
        assertFalse(evidence.sourceScopeVerified());
        assertEquals("GITHUB_SOURCE_BLOCKED",evidence.status());
        assertEquals(List.of("GITHUB_READ_UNAVAILABLE"),evidence.blockers());
    }
}
