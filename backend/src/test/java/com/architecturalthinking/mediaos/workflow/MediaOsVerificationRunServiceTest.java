package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class MediaOsVerificationRunServiceTest {
    @Test
    void requiresAnExactGitCommitInsteadOfArbitraryCommandsOrBranchNames() {
        assertTrue(MediaOsVerificationRunService.validSha("a".repeat(40)));
        assertFalse(MediaOsVerificationRunService.validSha(null));
        assertFalse(MediaOsVerificationRunService.validSha("a".repeat(39)));
        assertFalse(MediaOsVerificationRunService.validSha("x".repeat(40)));
        assertFalse(MediaOsVerificationRunService.validSha("main"));
    }

    @Test
    void acceptsOnlyOrderedStageExitEvidence() {
        var completed=List.of(
                new MediaOsVerificationRunService.StageResult("asset-check",0,2000),
                new MediaOsVerificationRunService.StageResult("backend",0,3000),
                new MediaOsVerificationRunService.StageResult("frontend",0,2500),
                new MediaOsVerificationRunService.StageResult("remotion",0,3500));
        assertTrue(MediaOsVerificationRunService.validStages(completed));
        assertTrue(MediaOsVerificationRunService.validStages(List.of()));
        assertTrue(MediaOsVerificationRunService.validStages(
                List.of(new MediaOsVerificationRunService.StageResult(
                        "asset-check",1,5000))));
        assertFalse(MediaOsVerificationRunService.validStages(
                List.of(new MediaOsVerificationRunService.StageResult(
                        "backend",0,5000))));
        assertFalse(MediaOsVerificationRunService.validStages(
                List.of(new MediaOsVerificationRunService.StageResult(
                        "asset-check",1,5000),
                        new MediaOsVerificationRunService.StageResult(
                        "backend",0,1000))));
        assertFalse(MediaOsVerificationRunService.validStages(
                List.of(new MediaOsVerificationRunService.StageResult(
                        "asset-check",0,-1))));
        assertFalse(MediaOsVerificationRunService.validStages(
                List.of(new MediaOsVerificationRunService.StageResult(
                        "asset-check",300,1))));
    }

    @Test
    void failureCodesAreBoundedAndNeverProviderText() {
        assertTrue(MediaOsVerificationRunService.validFailure(null));
        assertTrue(MediaOsVerificationRunService.validFailure("DOCKER_UNAVAILABLE"));
        assertTrue(MediaOsVerificationRunService.validFailure("SOURCE_COMMIT_MISMATCH"));
        assertFalse(MediaOsVerificationRunService.validFailure(
                "Sensitive external logs or command injection"));
    }
}
