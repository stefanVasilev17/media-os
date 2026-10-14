package com.architecturalthinking.mediaos.remotion;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class StorageHealthServiceTest {
    @Test
    void classifiesThresholdsCorrectly() {
        assertEquals("ESTIMATED_OK", StorageHealthService.classification(69));
        assertEquals("WARNING", StorageHealthService.classification(70));
        assertEquals("WARNING", StorageHealthService.classification(84));
        assertEquals("CRITICAL", StorageHealthService.classification(85));
        assertEquals("CRITICAL", StorageHealthService.classification(100));
    }
}
