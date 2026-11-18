package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/shots/SHOT01")
public final class Ep004Shot01DirectorRenderController {
    private final Ep004Shot01DirectorRenderService renderer;

    public Ep004Shot01DirectorRenderController(Ep004Shot01DirectorRenderService renderer) {
        this.renderer=renderer;
    }

    @GetMapping("/render-readiness")
    public Ep004Shot01DirectorRenderService.Readiness readiness(
            @PathVariable UUID packageId,
            @RequestParam(defaultValue="") String sourceCommit) {
        return renderer.readiness(packageId,sourceCommit);
    }

    @PostMapping("/render")
    public Map<String,Object> queue(
            @PathVariable UUID packageId,
            @RequestBody Ep004Shot01DirectorRenderService.CpuRequest request,
            HttpServletRequest http) {
        Object attr=http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(attr instanceof Map<?,?> audit)
                ||!(audit.get("auditId") instanceof UUID auditId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Director authenticated audited CPU render approval is required.");
        return renderer.queue(packageId,request,auditId);
    }
}
