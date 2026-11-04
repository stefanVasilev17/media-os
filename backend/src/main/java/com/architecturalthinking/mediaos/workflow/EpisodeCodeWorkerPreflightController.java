package com.architecturalthinking.mediaos.workflow;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/execution-jobs/{jobId}/code-worker-preflight")
public class EpisodeCodeWorkerPreflightController {
    private final EpisodeCodeWorkerPreflightService preflight;

    public EpisodeCodeWorkerPreflightController(EpisodeCodeWorkerPreflightService preflight) {
        this.preflight=preflight;
    }

    @GetMapping
    public EpisodeCodeWorkerPreflightService.Preflight review(
            @PathVariable UUID packageId,@PathVariable UUID jobId) {
        return preflight.plan(packageId,jobId);
    }
}
