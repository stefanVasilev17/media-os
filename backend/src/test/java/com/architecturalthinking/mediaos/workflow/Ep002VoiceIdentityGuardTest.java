package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class Ep002VoiceIdentityGuardTest {
    private static final Ep002VoiceIdentityGuard.Identity EP001 =
            new Ep002VoiceIdentityGuard.Identity("creator-clone-v1", "eleven_v4");

    @Test
    void sameVoiceAndModelPermittedForEp002() {
        var check = Ep002VoiceIdentityGuard.compare(
                List.of(EP001, EP001), "creator-clone-v1", "eleven_v4");
        assertTrue(check.verified());
        assertNull(check.blockedReason());
    }

    @Test
    void differentVoiceFailsBeforePaidGeneration() {
        var check = Ep002VoiceIdentityGuard.compare(
                List.of(EP001), "another-speaker", "eleven_v4");
        assertFalse(check.verified());
        assertTrue(check.blockedReason().contains("differs"));
    }

    @Test
    void differentModelFailsBeforePaidGeneration() {
        var check = Ep002VoiceIdentityGuard.compare(
                List.of(EP001), "creator-clone-v1", "eleven_v3");
        assertFalse(check.verified());
        assertTrue(check.blockedReason().contains("differs"));
    }

    @Test
    void missingOrAmbiguousEp001ReferenceFailsClosed() {
        assertFalse(Ep002VoiceIdentityGuard.compare(
                List.of(), "creator-clone-v1", "eleven_v4").verified());
        var ambiguous = Ep002VoiceIdentityGuard.compare(
                List.of(EP001, new Ep002VoiceIdentityGuard.Identity("old-voice", "eleven_v4")),
                "creator-clone-v1", "eleven_v4");
        assertFalse(ambiguous.verified());
        assertTrue(ambiguous.blockedReason().contains("multiple"));
    }

    @Test
    void productionDeliveryTagRemainsIdenticalToEp001() {
        assertEquals("calm, conversational, confident",
                ElevenLabsTextToSpeechService.EP001_LOCKED_DELIVERY_TAG);
    }
}
