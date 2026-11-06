package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/verification")
public class MediaOsVerificationDirectorController {
    private final MediaOsVerificationRunService runs;

    public MediaOsVerificationDirectorController(MediaOsVerificationRunService runs) {
        this.runs=runs;
    }

    @GetMapping("/runs")
    public MediaOsVerificationRunService.Summary list() {
        DirectorIdentity.requireDirector();
        return runs.summary();
    }

    @PostMapping("/runs")
    public MediaOsVerificationRunService.Run queue(
            @RequestBody MediaOsVerificationRunService.QueueRequest input,
            HttpServletRequest request) {
        Object value=request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(value instanceof Map<?,?> audit)
                || !(audit.get("auditId") instanceof UUID id))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Audited Director verification authorization is required.");
        return runs.queue(input,id);
    }
}
