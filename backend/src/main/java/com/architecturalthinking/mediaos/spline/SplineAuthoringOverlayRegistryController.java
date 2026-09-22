package com.architecturalthinking.mediaos.spline;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/spline/authoring-overlay")
public class SplineAuthoringOverlayRegistryController {

    private final SplineAuthoringOverlayRegistryService service;

    public SplineAuthoringOverlayRegistryController(SplineAuthoringOverlayRegistryService service) {
        this.service = service;
    }

    @GetMapping("/latest")
    public Map<String, Object> latest() {
        return service.latest();
    }

    @GetMapping("/latest/summary")
    public Map<String, Object> latestSummary() {
        return service.latestSummary();
    }

    @GetMapping("/pending")
    public Map<String, Object> pending(@RequestParam(value = "limit", defaultValue = "20") int limit) {
        return service.pending(limit);
    }
}
