package com.architecturalthinking.mediaos.workflow;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/factory-bridge")
public class Ep002FactoryReadinessBridgeController {
    private final Ep002FactoryReadinessBridgeService bridge;

    public Ep002FactoryReadinessBridgeController(Ep002FactoryReadinessBridgeService bridge) {
        this.bridge = bridge;
    }

    @GetMapping
    public Ep002FactoryReadinessBridgeService.Snapshot preview() {
        return bridge.preview();
    }
}
