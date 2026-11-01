package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EpisodeWriteActivationGuardTest {

    @Test
    void keepsReadOnlyQaAvailableWithoutDirectorIdentity() {
        assertDoesNotThrow(() -> new EpisodeWriteActivationGuard(false, false, false, false, false, false));
    }

    @Test
    void rejectsEpisodeCreationWithoutDirectorIdentity() {
        assertThrows(IllegalStateException.class,
                () -> new EpisodeWriteActivationGuard(true, false, false, false, false, false));
    }

    @Test
    void rejectsEpisodeWritesWithoutDirectorIdentity() {
        assertThrows(IllegalStateException.class,
                () -> new EpisodeWriteActivationGuard(false, true, false, false, false, false));
    }

    @Test
    void rejectsPaidResearchActivationWithoutDirectorIdentity() {
        assertThrows(IllegalStateException.class,
                () -> new EpisodeWriteActivationGuard(false, false, true, false, false, false));
    }

    @Test
    void rejectsLearningPromotionWithoutDirectorIdentity() {
        assertThrows(IllegalStateException.class,
                () -> new EpisodeWriteActivationGuard(false, false, false, true, false, false));
    }

    @Test
    void localAuthenticationAlsoPermitsFeatureActivation() {
        assertDoesNotThrow(() -> new EpisodeWriteActivationGuard(true, true, true, true, false, true));
    }

    @Test
    void allowsEpisodeVoiceOnlyWithGoogleDirectorSecurity() {
        assertDoesNotThrow(() -> new EpisodeWriteActivationGuard(
                false, true, false, false, false, false, true));
    }

    @Test
    void rejectsWritesWithoutAnyAuthenticatedDirectorMode() {
        assertThrows(IllegalStateException.class, () -> new EpisodeWriteActivationGuard(
                false, true, false, false, false, false, false));
    }

    @Test
    void ep002VoiceOnlyRequiresVerifiedIdentityAtStartup() {
        assertThrows(IllegalStateException.class,
                () -> new EpisodeWriteActivationGuard(
                        false, false, false, false, false, false, false, true));
        assertDoesNotThrow(() -> new EpisodeWriteActivationGuard(
                false, false, false, false, false, false, true, true));
        assertDoesNotThrow(() -> new EpisodeWriteActivationGuard(
                false, false, false, false, false, true, false, true));
    }

    @Test
    void allowsActivationOnlyWhenIdentitySecurityIsConfigured() {
        assertDoesNotThrow(() -> new EpisodeWriteActivationGuard(true, true, true, true, true, false));
    }
}
