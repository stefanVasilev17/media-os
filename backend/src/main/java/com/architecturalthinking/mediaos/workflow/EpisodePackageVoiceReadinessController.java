package com.architecturalthinking.mediaos.workflow;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/voice-readiness")
public class EpisodePackageVoiceReadinessController {
    private final EpisodePackageVoiceReadinessService readiness;

    public EpisodePackageVoiceReadinessController(EpisodePackageVoiceReadinessService readiness) {
        this.readiness=readiness;
    }

    @GetMapping
    public EpisodePackageVoiceReadinessService.EpisodeReadiness report(
            @PathVariable UUID packageId) {
        return readiness.report(packageId);
    }
}
