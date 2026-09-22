package com.architecturalthinking.mediaos.spline;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/spline/slots")
public class SplineSceneSlotRegistryController {

    private final SplineSceneSlotRegistryService service;

    public SplineSceneSlotRegistryController(SplineSceneSlotRegistryService service) {
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
}
