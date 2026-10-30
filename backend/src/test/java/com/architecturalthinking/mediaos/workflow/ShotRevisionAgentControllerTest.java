package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ShotRevisionAgentControllerTest {
    @Test
    void paidPreviewIsScopedToEpisodeShotRevisionAndExactMessage() {
        UUID ep2 = UUID.fromString("33333333-3333-4333-8333-333333333332");
        UUID ep3 = UUID.fromString("33333333-3333-4333-8333-333333333333");
        String original = ShotRevisionAgentController.previewPayload(
                ep2, "SHOT 11", 2, 4, "Improve the database ending.");
        assertNotEquals(original, ShotRevisionAgentController.previewPayload(
                ep3, "SHOT 11", 2, 4, "Improve the database ending."));
        assertNotEquals(original, ShotRevisionAgentController.previewPayload(
                ep2, "SHOT 10", 2, 4, "Improve the database ending."));
        assertNotEquals(original, ShotRevisionAgentController.previewPayload(
                ep2, "SHOT 11", 3, 4, "Improve the database ending."));
        assertNotEquals(original, ShotRevisionAgentController.previewPayload(
                ep2, "SHOT 11", 2, 5, "Improve the database ending."));
        assertNotEquals(original, ShotRevisionAgentController.previewPayload(
                ep2, "SHOT 11", 2, 4, "Change the visual camera."));
        assertTrue(original.contains("EPISODE=" + ep2));
        assertTrue(original.contains("SHOT=SHOT 11"));
    }
}
