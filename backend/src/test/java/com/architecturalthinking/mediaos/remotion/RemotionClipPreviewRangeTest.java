package com.architecturalthinking.mediaos.remotion;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class RemotionClipPreviewRangeTest {

    @Test void acceptsInclusiveZeroBasedRange() {
        var range = RemotionClipPreviewRange.validateRequest(240, 389, 2160, 30);
        assertEquals(150, range.renderedFrames());
        assertEquals(240, range.startFrame());
        assertEquals(389, range.endFrame());
    }

    @Test void acceptsLastCompositionFrame() {
        var range = RemotionClipPreviewRange.validateRequest(2100, 2159, 2160, 30);
        assertEquals(60, range.renderedFrames());
    }

    @Test void rejectsMissingEndpoints() {
        assertThrows(IllegalArgumentException.class,
                () -> RemotionClipPreviewRange.validateRequest(null, 25, 200, 30));
        assertThrows(IllegalArgumentException.class,
                () -> RemotionClipPreviewRange.validateRequest(10, null, 200, 30));
    }

    @Test void rejectsOverflowAndReversedRanges() {
        assertThrows(IllegalArgumentException.class,
                () -> RemotionClipPreviewRange.validateRequest(-1, 5, 100, 30));
        assertThrows(IllegalArgumentException.class,
                () -> RemotionClipPreviewRange.validateRequest(20, 19, 100, 30));
        assertThrows(IllegalArgumentException.class,
                () -> RemotionClipPreviewRange.validateRequest(99, 100, 100, 30));
    }

    @Test void rejectsLongClips() {
        assertThrows(IllegalArgumentException.class,
                () -> RemotionClipPreviewRange.validateRequest(0, 900, 5000, 30));
        assertEquals(900, RemotionClipPreviewRange.validateRequest(0, 899, 5000, 30).renderedFrames());
    }

    @Test void restoresRangeFromExistingJsonMap() {
        var range = RemotionClipPreviewRange.validateRequest(30, 89, 300, 30);
        var props = Map.<String, Object>of(RemotionClipPreviewRange.INPUT_KEY, range.asMetadata());
        assertEquals(range, RemotionClipPreviewRange.fromStoredProps(props).orElseThrow());
        assertTrue(RemotionClipPreviewRange.fromStoredProps(Map.of()).isEmpty());
    }
}
