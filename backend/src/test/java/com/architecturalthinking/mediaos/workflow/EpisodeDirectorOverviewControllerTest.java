package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class EpisodeDirectorOverviewControllerTest {
    @Test
    void approvedVoiceMustBeCompleteBeforeDirectorShowsGreen() {
        assertEquals("PENDING", EpisodeDirectorOverviewController.voiceStatus(0, 0));
        assertEquals("PENDING", EpisodeDirectorOverviewController.voiceStatus(4, 3));
        assertEquals("LOCKED", EpisodeDirectorOverviewController.voiceStatus(4, 4));
        assertEquals("LOCKED", EpisodeDirectorOverviewController.voiceStatus(1, 1));
    }

    @Test
    void oldApprovedAudioMustNotTurnRevisedScriptGreen() {
        assertEquals("PENDING", EpisodeDirectorOverviewController.effectiveVoiceStatus(2, false, 7, 7));
        assertEquals("LOCKED", EpisodeDirectorOverviewController.effectiveVoiceStatus(2, true, 7, 0));
        assertEquals("LOCKED", EpisodeDirectorOverviewController.effectiveVoiceStatus(0, false, 3, 3));
    }

    @Test
    void directorShotLinksUseCanonicalShotKeys() {
        assertEquals("SHOT 12", EpisodeDirectorOverviewController.shotKey("SHOT 12"));
        assertEquals("SHOT 02", EpisodeDirectorOverviewController.shotKey("shot 2"));
        assertEquals("SHOT 11", EpisodeDirectorOverviewController.shotKey("  SHOT 11  "));
        assertNull(EpisodeDirectorOverviewController.shotKey("EP003 SHOT 01"));
        assertNull(EpisodeDirectorOverviewController.shotKey("SHOT 00"));
        assertNull(EpisodeDirectorOverviewController.shotKey("OTHER 12"));
    }
}
