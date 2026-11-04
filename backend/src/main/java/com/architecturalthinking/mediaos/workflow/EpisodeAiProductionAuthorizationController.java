package com.architecturalthinking.mediaos.workflow;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/episode-packages/{packageId}/ai-authorization")
public class EpisodeAiProductionAuthorizationController {
    private final EpisodeAiProductionAuthorizationService authorizations;

    public EpisodeAiProductionAuthorizationController(
            EpisodeAiProductionAuthorizationService authorizations) {
        this.authorizations = authorizations;
    }

    public record RevokeRequest(Boolean confirmRevoke) {}

    @GetMapping
    public EpisodeAiProductionAuthorizationService.Overview overview(
            @PathVariable UUID packageId) {
        return authorizations.overview(packageId);
    }

    @PostMapping("/authorize")
    public EpisodeAiProductionAuthorizationService.Authorization authorize(
            @PathVariable UUID packageId,
            @RequestBody EpisodeAiProductionAuthorizationService.AuthorizeRequest request,
            HttpServletRequest http) {
        return authorizations.authorize(packageId,request,requireAuditedDirector(http));
    }

    @PostMapping("/{authorizationId}/revoke")
    public EpisodeAiProductionAuthorizationService.Authorization revoke(
            @PathVariable UUID packageId,@PathVariable UUID authorizationId,
            @RequestBody RevokeRequest request,HttpServletRequest http) {
        return authorizations.revoke(packageId,authorizationId,requireAuditedDirector(http),
                request==null?null:request.confirmRevoke());
    }

    private static UUID requireAuditedDirector(HttpServletRequest request) {
        if (!(request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT") instanceof Map<?,?> data)
                || !(data.get("auditId") instanceof UUID id))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "AI budget authorization requires audited Director preflight.");
        return id;
    }
}
