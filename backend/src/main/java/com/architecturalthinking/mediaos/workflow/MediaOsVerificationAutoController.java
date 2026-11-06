package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/verification/automation")
public class MediaOsVerificationAutoController {
    private final MediaOsVerificationAutoService policy;

    public MediaOsVerificationAutoController(MediaOsVerificationAutoService policy) {
        this.policy=policy;
    }

    @GetMapping
    public MediaOsVerificationAutoService.Status status() {
        DirectorIdentity.requireDirector();
        return policy.status();
    }

    @PostMapping("/arm")
    public MediaOsVerificationAutoService.Status arm(
            @RequestBody MediaOsVerificationAutoService.ArmRequest input,
            HttpServletRequest request) {
        return policy.arm(input,audit(request));
    }

    @PostMapping("/pause")
    public MediaOsVerificationAutoService.Status pause(
            @RequestBody MediaOsVerificationAutoService.PauseRequest input,
            HttpServletRequest request) {
        return policy.pause(input,audit(request));
    }

    private UUID audit(HttpServletRequest request) {
        Object value=request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(value instanceof Map<?,?> map)
                || !(map.get("auditId") instanceof UUID id))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Director verification automation must have a real preflight audit.");
        return id;
    }
}
