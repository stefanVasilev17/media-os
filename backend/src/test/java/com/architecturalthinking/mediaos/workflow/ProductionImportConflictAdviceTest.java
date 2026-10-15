package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ProductionImportConflictAdviceTest {
    private final ProductionImportConflictAdvice advice = new ProductionImportConflictAdvice();

    @Test
    void returnsTheSpecificConflictReasonForExistingScriptValidationFailures() {
        var response = advice.handle(new ResponseStatusException(
                HttpStatus.CONFLICT, "SHOT 06 must keep its original narration and only the approved clock shift."));
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("SHOT 06 must keep its original narration and only the approved clock shift.",
                response.getBody().get("detail"));
    }

    @Test
    void doesNotExposeFrameworkInternalsForAnAbsentReason() {
        var response = advice.handle(new ResponseStatusException(HttpStatus.CONFLICT));
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("The import conflicts with the current production state.",
                response.getBody().get("detail"));
    }
}
