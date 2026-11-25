package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/shots/SHOT09")
public final class Ep004Shot09DirectorRenderController {
    private final Ep004Shot09DirectorRenderService renderer;
    public Ep004Shot09DirectorRenderController(Ep004Shot09DirectorRenderService renderer){
        this.renderer=renderer;
    }
    @GetMapping("/render-readiness")
    public Ep004Shot09DirectorRenderService.Readiness readiness(
            @PathVariable UUID packageId,
            @RequestParam(defaultValue="") String sourceCommit){
        return renderer.readiness(packageId,sourceCommit);
    }
    @PostMapping("/render")
    public Map<String,Object> queue(@PathVariable UUID packageId,
            @RequestBody Ep004Shot09DirectorRenderService.CpuRequest request,
            HttpServletRequest http){
        Object audit=http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(audit instanceof Map<?,?> receipt)
              ||!(receipt.get("auditId") instanceof UUID auditId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                 "Director authenticated audited SHOT09 CPU approval required.");
        return renderer.queue(packageId,request,auditId);
    }
}
