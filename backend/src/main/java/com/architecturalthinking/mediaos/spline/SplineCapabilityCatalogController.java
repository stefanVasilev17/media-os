package com.architecturalthinking.mediaos.spline;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/spline/capabilities")
public class SplineCapabilityCatalogController {

    private final SplineCapabilityCatalogService service;

    public SplineCapabilityCatalogController(SplineCapabilityCatalogService service) {
        this.service = service;
    }

    @PostMapping("/rebuild")
    public Map<String, Object> rebuild() {
        return service.rebuildLatest();
    }

    @GetMapping("/latest/summary")
    public Map<String, Object> latestSummary() {
        return service.latestSummary();
    }

    @GetMapping("/latest/object")
    public Map<String, Object> latestObject(@RequestParam("name") String name) {
        return service.latestObject(name);
    }
}
