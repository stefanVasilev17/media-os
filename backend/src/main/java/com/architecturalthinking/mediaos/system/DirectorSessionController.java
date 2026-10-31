package com.architecturalthinking.mediaos.system;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/security/session")
public final class DirectorSessionController {
    public record Session(boolean authenticated, String actorKey,
                          List<String> roles, boolean canApprove, boolean canSpend) {}

    @GetMapping
    public Session current(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwt)
                || !jwt.isAuthenticated()
                || jwt.getToken().getIssuer() == null
                || jwt.getToken().getSubject() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "An authenticated project session is required.");
        }

        List<String> roles = jwt.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .filter(value -> value.equals("ROLE_VIEWER")
                        || value.equals("ROLE_EDITOR")
                        || value.equals("ROLE_DIRECTOR"))
                .map(value -> value.substring("ROLE_".length()))
                .distinct()
                .sorted()
                .toList();
        if (roles.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Active project membership required.");
        }

        String actorKey = DirectorIdentity.stableAuditName(
                jwt.getToken().getIssuer().toString(), jwt.getToken().getSubject());
        boolean director = roles.contains("DIRECTOR");
        return new Session(true, actorKey, roles, director, director);
    }
}
