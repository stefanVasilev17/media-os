package com.architecturalthinking.mediaos.remotion;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice(assignableTypes = {RemotionRenderController.class, RemotionCpuWorkerController.class})
public class StorageGuardExceptionHandler {
    @ExceptionHandler(StorageHealthService.StorageLimitException.class)
    public ResponseEntity<Map<String, Object>> storageGuard(StorageHealthService.StorageLimitException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of(
                "error", "Storage capacity guard",
                "detail", error.getReason() == null ? "Insufficient storage capacity" : error.getReason(),
                "status", error.getStatusCode().value()
        ));
    }
}
