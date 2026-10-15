package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class ShotStudioControllerTest {
    @Test
    void acceptsAndNormalizesApprovedNarration() {
        assertEquals("The API Gateway is the first stop.",
            ShotStudioController.validate("  The API Gateway is the first stop.  ",5000));
    }

    @Test
    void rejectsBlankNarrationAndOverflowBeforePersisting() {
        var empty=assertThrows(ResponseStatusException.class,
            ()->ShotStudioController.validate(" \n ",5000));
        assertEquals(HttpStatus.BAD_REQUEST,empty.getStatusCode());
        var large=assertThrows(ResponseStatusException.class,
            ()->ShotStudioController.validate("x".repeat(5001),5000));
        assertEquals(HttpStatus.BAD_REQUEST,large.getStatusCode());
    }

    @Test
    void visualInstructionsHaveSeparateSafeLimit() {
        assertEquals("Focus API Gateway",ShotStudioController.validate("Focus API Gateway",16000));
        assertThrows(ResponseStatusException.class,
            ()->ShotStudioController.validate("x".repeat(16001),16000));
    }
}
