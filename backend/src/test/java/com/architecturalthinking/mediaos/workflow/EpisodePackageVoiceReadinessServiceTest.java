package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EpisodePackageVoiceReadinessServiceTest {
    @Test
    void episodeIsBlockedUntilEveryShotIsReallyReady() {
        assertEquals("NOT_READY",EpisodePackageVoiceReadinessService.aggregateState(0,11));
        assertEquals("PARTIALLY_READY",EpisodePackageVoiceReadinessService.aggregateState(10,11));
        assertEquals("READY_FOR_DIRECTOR_AI_AUTHORIZATION",
                EpisodePackageVoiceReadinessService.aggregateState(11,11));
        assertThrows(IllegalArgumentException.class,
                ()->EpisodePackageVoiceReadinessService.aggregateState(12,11));
        assertThrows(IllegalArgumentException.class,
                ()->EpisodePackageVoiceReadinessService.aggregateState(0,0));
    }

    @Test
    void selectedTakeWithoutMeasuredDurationIsNotReady() {
        UUID take=UUID.randomUUID();
        var source=input(take,take,null,false);
        var outcome=EpisodePackageVoiceReadinessService.evaluate(
                source,mock(EpisodePackageCueTimingVerifier.class));
        assertFalse(outcome.blockers().isEmpty());
        assertTrue(outcome.blockers().contains("MEASURED_AUDIO_DURATION_MISSING"));
        assertEquals("BLOCKED",outcome.status());
    }

    @Test
    void unresolvedProviderPaymentBlocksEvenAnOtherwiseApprovedTake() {
        UUID take=UUID.randomUUID();
        var verifier=mock(EpisodePackageCueTimingVerifier.class);
        when(verifier.verify(anyString(),anyString(),anyString(),any()))
                .thenReturn(new EpisodePackageCueTimingVerifier.Result(
                        true,"VERIFIED",java.util.List.of(
                                new EpisodePackageCueTimingVerifier.CueTime("B1","Hello",1.0,2.0))));
        var outcome=EpisodePackageVoiceReadinessService.evaluate(
                input(take,take,new BigDecimal("5.000"),true),verifier);
        assertFalse(outcome.blockers().isEmpty());
        assertTrue(outcome.blockers().contains("PAID_VOICE_REQUEST_IN_FLIGHT_OR_UNCERTAIN"));
        assertTrue(outcome.verifiedCues().isEmpty());
    }

    @Test
    void previousRevisionTakeDoesNotPassAsCurrentApproval() {
        UUID previous=UUID.randomUUID();
        var outcome=EpisodePackageVoiceReadinessService.evaluate(
                input(previous,null,new BigDecimal("5.000"),false),
                mock(EpisodePackageCueTimingVerifier.class));
        assertFalse(outcome.approvedCurrentRevision());
        assertTrue(outcome.blockers().contains("DIRECTOR_APPROVED_CURRENT_REVISION_TAKE_MISSING"));
    }

    @Test
    void onlyVerifiedCuesWithMeasuredDurationAndApprovedTakeCanPass() {
        UUID take=UUID.randomUUID();
        var verifier=mock(EpisodePackageCueTimingVerifier.class);
        when(verifier.verify(anyString(),anyString(),anyString(),any()))
                .thenReturn(new EpisodePackageCueTimingVerifier.Result(
                        true,"VERIFIED",java.util.List.of(
                                new EpisodePackageCueTimingVerifier.CueTime("B1","Hello",1.0,2.0))));
        var outcome=EpisodePackageVoiceReadinessService.evaluate(
                input(take,take,new BigDecimal("5.000"),false),verifier);
        assertTrue(outcome.blockers().isEmpty());
        assertEquals("VOICE_READY",outcome.status());
        assertEquals("HEAR_SEE_CUES_VERIFIED",outcome.timingStatus());
        assertEquals(1,outcome.verifiedCues().size());
    }

    private static EpisodePackageVoiceReadinessService.ShotInput input(
            UUID approved, UUID actual,BigDecimal duration,boolean unresolved) {
        return new EpisodePackageVoiceReadinessService.ShotInput(
                "SHOT01","Example",1,1,"Hello world this is a full narration.",
                "{\"visualBeats\":[]}",approved,actual,duration,"{}",unresolved);
    }
}
