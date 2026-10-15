package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ShotStudioVisualPreviewTest {
    @Test
    void focusAlwaysUsesARecognizedLivingMapNodeWhenPresent() {
        assertEquals("API Gateway", ShotStudioController.previewFocus(
            "Focus the camera on API Gateway as the green packet approaches.", "Traffic gateway"));
        assertEquals("Redis", ShotStudioController.previewFocus(
            "Redis becomes the next architectural checkpoint.", "Session persistence"));
    }

    @Test
    void cameraCuesAreDeterministicAndCannotExecuteCode() {
        assertEquals("FOLLOW", ShotStudioController.previewCamera("Follow the request into Auth Service."));
        assertEquals("WIDE", ShotStudioController.previewCamera("Wide view, pull back from the diagram."));
        assertEquals("FOCUS", ShotStudioController.previewCamera("Illuminate the selected node."));
    }

    @Test
    void unknownObjectsRemainTextAndDoNotMutateTheCanonicalArchitecture() {
        assertEquals("A new architected node",
            ShotStudioController.previewFocus("Illuminate an unfamiliar service.", "A new architected node"));
    }
}
