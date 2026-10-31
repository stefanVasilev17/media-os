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
    void approvedEp002EditorialTimeWindowsRemainIntact() {
        assertEquals(0, EpisodeDirectorOverviewController.editorialSecond("00:00"));
        assertEquals(40, EpisodeDirectorOverviewController.editorialSecond("00:40"));
        assertEquals(670, EpisodeDirectorOverviewController.editorialSecond("11:10"));
        assertEquals(810, EpisodeDirectorOverviewController.editorialSecond("13:30"));
        assertEquals(-1, EpisodeDirectorOverviewController.editorialSecond("00:60"));
        assertEquals(-1, EpisodeDirectorOverviewController.editorialSecond(null));
        assertEquals(-1, EpisodeDirectorOverviewController.editorialSecond("invalid"));
    }

    @Test
    void directorShotLinksUseCanonicalShotKeys() {
        assertEquals("SHOT 12", EpisodeDirectorOverviewController.shotKey("SHOT 12"));
        assertEquals("SHOT 01", EpisodeDirectorOverviewController.shotKey("SHOT01"));
        assertEquals("SHOT 09", EpisodeDirectorOverviewController.shotKey("shot09"));
        assertEquals("SHOT 11", EpisodeDirectorOverviewController.shotKey("SHOT11"));
        assertEquals("SHOT 02", EpisodeDirectorOverviewController.shotKey("SHOT 02"));
        assertEquals("SHOT 02", EpisodeDirectorOverviewController.shotKey("shot 2"));
        assertEquals("SHOT 11", EpisodeDirectorOverviewController.shotKey("  SHOT 11  "));
        assertNull(EpisodeDirectorOverviewController.shotKey("EP003 SHOT 01"));
        assertNull(EpisodeDirectorOverviewController.shotKey("SHOT 00"));
        assertNull(EpisodeDirectorOverviewController.shotKey("OTHER 12"));
    }
}
