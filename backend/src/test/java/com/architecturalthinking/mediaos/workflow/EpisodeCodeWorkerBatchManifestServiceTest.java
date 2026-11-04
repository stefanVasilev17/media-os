package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class EpisodeCodeWorkerBatchManifestServiceTest {
    private static final String TAKE=UUID.randomUUID().toString();

    private static EpisodeCodeWorkerPreflightService.ShotPlan plan() {
        return new EpisodeCodeWorkerPreflightService.ShotPlan(
                "SHOT01",1,"remotion-engine/src/episodes/ep003/Shot01GeneratedScene.tsx",
                2,TAKE,new BigDecimal("12.400"),372,
                "Show actual backend request","Slow camera push",
                List.of(),List.of(),0,false);
    }

    private static EpisodeMultiShotExecutionService.Task task(String take,int revision,
                                                               BigDecimal seconds) {
        return new EpisodeMultiShotExecutionService.Task(
                "SHOT01",1,revision,take,seconds,
                "AWAITING_AGENT_IMPLEMENTATION",3);
    }

    private static EpisodeCodeWorkerBatchManifestService.WorkingSource working(int revision) {
        return new EpisodeCodeWorkerBatchManifestService.WorkingSource(
                "SHOT01",revision,"The login goes through authentication.",
                "Calm documentary delivery.","{\"visualBeats\":[]}");
    }

    @Test
    void currentLockedJobShotAndExactWorkingNarrationCanBeUsedAsReadOnlyPromptData() {
        EpisodeCodeWorkerBatchManifestService.requireSameApprovedInputs(
                plan(),working(2),task(TAKE,2,new BigDecimal("12.400")));
    }

    @Test
    void changedVoiceTakeIsRejectedBeforeAnyPromptManifestBecomesReady() {
        var error=assertThrows(ResponseStatusException.class,
                ()->EpisodeCodeWorkerBatchManifestService.requireSameApprovedInputs(
                        plan(),working(2),task(UUID.randomUUID().toString(),
                                2,new BigDecimal("12.400"))));
        assertEquals(HttpStatus.CONFLICT,error.getStatusCode());
    }

    @Test
    void editedScriptRevisionRequiresNewApprovalAndNewBatchSnapshot() {
        var error=assertThrows(ResponseStatusException.class,
                ()->EpisodeCodeWorkerBatchManifestService.requireSameApprovedInputs(
                        plan(),working(3),task(TAKE,2,new BigDecimal("12.400"))));
        assertEquals(HttpStatus.CONFLICT,error.getStatusCode());
    }

    @Test
    void changedMeasuredDurationCannotReuseOldVoiceFramePlan() {
        var error=assertThrows(ResponseStatusException.class,
                ()->EpisodeCodeWorkerBatchManifestService.requireSameApprovedInputs(
                        plan(),working(2),task(TAKE,2,new BigDecimal("13.400"))));
        assertEquals(HttpStatus.CONFLICT,error.getStatusCode());
    }
}
