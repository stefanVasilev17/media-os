package com.architecturalthinking.mediaos.workflow;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Exposes deliberate production import validation failures to Script Agent.
 * This does not alter the LOCKED Script, approval gates, or import transactions.
 */
@RestControllerAdvice(assignableTypes = {
        DirectorScriptAmendmentController.class,
        ProductionContractController.class
})
public class ProductionImportConflictAdvice {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handle(ResponseStatusException exception) {
        String reason = exception.getReason();
        if (reason == null || reason.isBlank()) {
            reason = "The import conflicts with the current production state.";
        }
        return ResponseEntity.status(exception.getStatusCode())
                .body(Map.of("detail", reason));
    }
}
