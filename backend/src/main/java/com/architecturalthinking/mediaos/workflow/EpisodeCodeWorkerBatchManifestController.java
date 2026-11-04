package com.architecturalthinking.mediaos.workflow;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/execution-jobs/{jobId}/code-worker-batch-manifest")
public class EpisodeCodeWorkerBatchManifestController {
    private final EpisodeCodeWorkerBatchManifestService manifests;

    public EpisodeCodeWorkerBatchManifestController(
            EpisodeCodeWorkerBatchManifestService manifests) {
        this.manifests=manifests;
    }

    @GetMapping
    public EpisodeCodeWorkerBatchManifestService.BatchManifest read(
            @PathVariable UUID packageId,@PathVariable UUID jobId) {
        return manifests.prepareReadOnly(packageId,jobId);
    }
}
