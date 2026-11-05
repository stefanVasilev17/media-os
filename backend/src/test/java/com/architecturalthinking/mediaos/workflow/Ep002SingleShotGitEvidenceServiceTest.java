package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class Ep002SingleShotGitEvidenceServiceTest {
    private static final String SHA="a".repeat(40);
    private static final String BLOB="b".repeat(40);
    private static final String PATH=
            "remotion-engine/src/episodes/ep002/Shot02GeneratedScene.tsx";
    private final ObjectMapper mapper=new ObjectMapper();

    private Ep002SingleShotGitEvidenceService withSource(
            boolean merged,String changedPath,String status) {
        return new Ep002SingleShotGitEvidenceService(path->{
            if(path.endsWith("/pulls/42")) return mapper.readTree("""
                    {"base":{"repo":{"full_name":"stefanVasilev17/media-os"},"ref":"main"},
                     "head":{"repo":{"full_name":"stefanVasilev17/media-os"}},
                     "merged":%s,"changed_files":1}
                    """.formatted(merged));
            if(path.contains("/pulls/42/files"))return mapper.readTree("""
                    [{"filename":"%s","status":"%s","sha":"%s"}]
                    """.formatted(changedPath,status,BLOB));
            if(path.endsWith("/branches/main"))return mapper.readTree(
                    "{\"commit\":{\"sha\":\""+SHA+"\"}}");
            if(path.contains("/contents/"+PATH))return mapper.readTree(
                    "{\"type\":\"file\",\"path\":\""+PATH+"\",\"sha\":\""+BLOB+"\"}");
            for(var rule:Ep002SequentialVisualPreflightService.RULES.subList(0,4)) {
                if(path.contains("/contents/"+rule.path()))return mapper.readTree(
                        "{\"type\":\"file\",\"path\":\""+rule.path()
                                +"\",\"sha\":\""+SHA+"\"}");
            }
            throw new IOException("Unexpected path");
        });
    }

    @Test
    void verifiesRealVisualConstitutionAndCorrectionsAtOnePinnedMainSha() {
        var proof=withSource(true,PATH,"added").verifyCurrentPolicy();
        assertTrue(proof.verified());
        assertEquals(SHA,proof.mainCommit());
        assertEquals(64,proof.policyDigest().length());
        assertTrue(proof.blockers().isEmpty());
    }

    @Test
    void missingOrUnreachablePrivatePolicyFailsClosed() {
        var denied=new Ep002SingleShotGitEvidenceService(path->{
            throw new IOException("Private repository access denied");
        });
        var proof=denied.verifyCurrentPolicy();
        assertFalse(proof.verified());
        assertNull(proof.policyDigest());
        assertEquals("PRIVATE_GITHUB_POLICY_VERIFICATION_UNAVAILABLE",
                proof.blockers().getFirst());
    }

    @Test
    void onlyOneMergedEpisodeLocalShotCanPassWithPinnedRuleFiles() {
        var proof=withSource(true,PATH,"added").verify("SHOT02",42);
        assertTrue(proof.verified());
        assertEquals(SHA,proof.currentMainCommit());
        assertEquals(BLOB,proof.sourceBlobSha());
        assertEquals(64,proof.policyDigest().length());
        assertTrue(proof.blockers().isEmpty());
    }

    @Test
    void rejectsWrongFilesUnmergedPrAndProtectedShot01() {
        assertFalse(withSource(false,PATH,"added").verify("SHOT02",42).verified());
        assertFalse(withSource(true,"remotion-engine/src/episodes/ep001/Shot01.tsx",
                "modified").verify("SHOT02",42).verified());
        assertFalse(withSource(true,PATH,"added").verify("SHOT01",42).verified());
    }

    @Test
    void rejectsUntrustedGithubFailuresWithoutStartingAnyWork() {
        var source=new Ep002SingleShotGitEvidenceService(path->{
            throw new IOException("GitHub is private");
        });
        var proof=source.verify("SHOT02",42);
        assertFalse(proof.verified());
        assertEquals("PRIVATE_GITHUB_AUDIT_UNAVAILABLE",proof.blockers().getFirst());
        assertNull(proof.currentMainCommit());
    }
}
