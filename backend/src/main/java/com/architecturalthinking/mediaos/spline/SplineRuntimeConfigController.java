package com.architecturalthinking.mediaos.spline;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/spline")
public class SplineRuntimeConfigController {

    private final String runtimeUrl;

    public SplineRuntimeConfigController(
            @Value("${MEDIA_OS_SPLINE_RUNTIME_URL:}") String runtimeUrl
    ) {
        this.runtimeUrl = runtimeUrl == null ? "" : runtimeUrl.trim();
    }

    @GetMapping("/runtime-config")
    public RuntimeConfig runtimeConfig() {
        return new RuntimeConfig(runtimeUrl, !runtimeUrl.isBlank());
    }

    public record RuntimeConfig(String sceneUrl, boolean configured) {}
}
