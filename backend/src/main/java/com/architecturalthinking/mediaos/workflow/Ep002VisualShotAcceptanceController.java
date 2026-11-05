package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/visual-approvals")
public class Ep002VisualShotAcceptanceController {
    private final Ep002VisualShotAcceptanceService service;
    public Ep002VisualShotAcceptanceController(Ep002VisualShotAcceptanceService service) {
        this.service=service;
    }

    @GetMapping
    public List<Ep002VisualShotAcceptanceService.Receipt> list() {
        return service.list();
    }

    @PostMapping
    public Ep002VisualShotAcceptanceService.Receipt approve(
            @RequestBody Ep002VisualShotAcceptanceService.Request request,
            HttpServletRequest http) {
        Object value=http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(value instanceof Map<?,?> data)
                || !(data.get("auditId") instanceof UUID auditId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Verified Director production audit is required.");
        }
        return service.approve(request,auditId);
    }
}
