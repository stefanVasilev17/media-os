package com.architecturalthinking.mediaos.workflow;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/visual-codex-preflight")
public class Ep002SequentialVisualPreflightController {
    private final Ep002SequentialVisualPreflightService preflight;

    public Ep002SequentialVisualPreflightController(Ep002SequentialVisualPreflightService preflight) {
        this.preflight = preflight;
    }

    @GetMapping
    public Ep002SequentialVisualPreflightService.Preflight preview() {
        return preflight.preview();
    }
}
