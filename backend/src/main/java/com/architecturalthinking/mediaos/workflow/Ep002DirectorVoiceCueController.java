package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/voice-cue-review")
public class Ep002DirectorVoiceCueController {
    private final Ep002DirectorVoiceCueService service;

    public Ep002DirectorVoiceCueController(Ep002DirectorVoiceCueService service) {
        this.service=service;
    }

    @GetMapping("/SHOT02/render-readiness")
    public Ep002DirectorVoiceCueService.Shot02RenderReadiness shot02RenderReadiness() {
        DirectorIdentity.requireDirector();
        return service.shot02RenderReadiness();
    }

    @GetMapping("/{shotKey}")
    public Ep002DirectorVoiceCueService.CueReview get(@PathVariable String shotKey) {
        DirectorIdentity.requireDirector();
        return service.preview(shotKey);
    }

    @PostMapping("/{shotKey}")
    public Ep002DirectorVoiceCueService.CueReview approve(
            @PathVariable String shotKey,
            @RequestBody Ep002DirectorVoiceCueService.ReviewRequest review,
            HttpServletRequest request) {
        Object value=request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(value instanceof Map<?,?> fields) || !(fields.get("auditId") instanceof UUID audit)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A real audited Director cue-review request is required.");
        }
        return service.approve(shotKey,review,audit);
    }
}
