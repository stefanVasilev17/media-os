package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class EpisodeWorkspaceControllerTest {
    private Map<String, Object> shot(String voice, String video) {
        return Map.of("voiceStatus", voice, "videoStatus", video);
    }

    @Test
    void fullyLockedRequiresAtLeastOneShotAndEveryVoiceAndVideoLocked() {
        assertFalse(EpisodeWorkspaceController.fullyLocked(true, Map.of("shots", List.of())));
        assertTrue(EpisodeWorkspaceController.fullyLocked(true, Map.of(
                "shots", List.of(shot("LOCKED", "LOCKED"), shot("LOCKED", "LOCKED")))));
        assertFalse(EpisodeWorkspaceController.fullyLocked(false, Map.of(
                "shots", List.of(shot("LOCKED", "LOCKED"), shot("LOCKED", "LOCKED")))));
        assertFalse(EpisodeWorkspaceController.fullyLocked(true, Map.of(
                "shots", List.of(shot("LOCKED", "LOCKED"), shot("LOCKED", "PENDING")))));
        assertFalse(EpisodeWorkspaceController.fullyLocked(true, Map.of(
                "shots", List.of(shot("LOCKED", "LOCKED"), shot("PENDING", "LOCKED")))));
        assertFalse(EpisodeWorkspaceController.fullyLocked(true, Map.of(
                "shots", List.of(shot("LOCKED", "LOCKED"), Map.of("voiceStatus", "LOCKED")))));
    }
}
