package com.architecturalthinking.mediaos.spline;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class SplineCapabilityCatalogBootstrap {

    private static final Logger log = LoggerFactory.getLogger(SplineCapabilityCatalogBootstrap.class);

    private final SplineCapabilityCatalogService service;

    public SplineCapabilityCatalogBootstrap(SplineCapabilityCatalogService service) {
        this.service = service;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void rebuildFromLatestBlueprint() {
        try {
            var result = service.rebuildLatest();
            if ("EMPTY".equals(result.get("status"))) {
                log.info("Spline capability catalog bootstrap skipped: no scene blueprint is stored yet.");
            }
        } catch (Exception e) {
            log.warn("Spline capability catalog bootstrap failed without blocking Media OS startup: {}", e.getMessage());
        }
    }
}
