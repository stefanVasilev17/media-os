package com.architecturalthinking.mediaos.remotion;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/storage")
public class StorageHealthController {
    private final StorageHealthService storage;

    public StorageHealthController(StorageHealthService storage) {
        this.storage = storage;
    }

    @GetMapping("/health")
    public ResponseEntity<StorageHealthService.Snapshot> health() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(storage.snapshot());
    }
}
