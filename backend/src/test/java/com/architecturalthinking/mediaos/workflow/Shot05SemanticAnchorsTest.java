package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class Shot05SemanticAnchorsTest {
    @Test
    void matchesExactlyTheOrdinaryEnglishNowSpokenByShot05() {
        LinkedHashMap<String, String> anchors = Ep001SemanticAnchorCatalog.anchorsFor("SHOT 05");
        assertEquals("login address", anchors.get("PATH"));
        assertEquals("rate limiting", anchors.get("RATE_LIMIT"));
        assertEquals("look unsafe", anchors.get("REQUEST_FILTER"));
        assertEquals(10, anchors.size());
    }

    @Test
    void leavesPreviousDirectorLockedShotsVocabularyUnchanged() {
        Map<String, String> fourth = Ep001SemanticAnchorCatalog.anchorsFor("SHOT 04");
        assertEquals("DNS", fourth.get("DNS_RESOLUTION"));
        assertFalse(fourth.containsKey("RATE_LIMIT"));
        assertFalse(fourth.containsKey("REQUEST_FILTER"));
    }
}
