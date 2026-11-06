package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/codex-automation")
public class Ep002CodexAutomationController {
    private final Ep002CodexAutomationService automation;

    public Ep002CodexAutomationController(Ep002CodexAutomationService automation) {
        this.automation=automation;
    }

    @GetMapping
    public Ep002CodexAutomationService.Status status() {
        return automation.status();
    }

    @GetMapping("/connector-preflight")
    public Ep002CodexAutomationService.ConnectorPreflight connectorPreflight() {
        com.architecturalthinking.mediaos.system.DirectorIdentity.requireDirector();
        return automation.connectorPreflight();
    }

    @PostMapping("/arm")
    public Ep002CodexAutomationService.Status arm(
            @RequestBody Ep002CodexAutomationService.ArmRequest input,
            HttpServletRequest request) {
        return automation.arm(input,auditId(request));
    }

    @PostMapping("/pause")
    public Ep002CodexAutomationService.Status pause(
            @RequestBody Ep002CodexAutomationService.PauseRequest input,
            HttpServletRequest request) {
        return automation.pause(input,auditId(request));
    }

    @PostMapping("/resume")
    public Ep002CodexAutomationService.Status resume(
            @RequestBody Ep002CodexAutomationService.ResumeRequest input,
            HttpServletRequest request) {
        return automation.resume(input,auditId(request));
    }

    private UUID auditId(HttpServletRequest http) {
        Object stored=http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(stored instanceof Map<?,?> fields)
                || !(fields.get("auditId") instanceof UUID id))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Audited Director production preflight is required.");
        return id;
    }
}
