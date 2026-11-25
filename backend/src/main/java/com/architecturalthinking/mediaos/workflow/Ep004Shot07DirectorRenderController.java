package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/shots/SHOT07")
public final class Ep004Shot07DirectorRenderController {
    private final Ep004Shot07DirectorRenderService renderer;
    public Ep004Shot07DirectorRenderController(Ep004Shot07DirectorRenderService renderer){
        this.renderer=renderer;
    }
    @GetMapping("/render-readiness")
    public Ep004Shot07DirectorRenderService.Readiness readiness(
            @PathVariable UUID packageId,
            @RequestParam(defaultValue="") String sourceCommit){
        return renderer.readiness(packageId,sourceCommit);
    }
    @PostMapping("/render")
    public Map<String,Object> queue(@PathVariable UUID packageId,
            @RequestBody Ep004Shot07DirectorRenderService.CpuRequest request,
            HttpServletRequest http){
        Object audit=http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(audit instanceof Map<?,?> receipt)
              ||!(receipt.get("auditId") instanceof UUID auditId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                 "Director authenticated audited SHOT07 CPU approval required.");
        return renderer.queue(packageId,request,auditId);
    }
}
