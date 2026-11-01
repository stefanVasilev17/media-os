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
    public record Session(boolean authenticated,
                          List<String> roles, boolean canApprove, boolean canConfigurePaidAi) {}

    @GetMapping
    public Session current(Authentication authentication) {
        boolean local = authentication instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken token
                && token.isAuthenticated() && token.getPrincipal() instanceof LocalDirectorPrincipal;
        boolean jwtValid = authentication instanceof JwtAuthenticationToken jwt
                && jwt.isAuthenticated() && jwt.getToken().getIssuer() != null
                && jwt.getToken().getSubject() != null;
        boolean google = authentication instanceof org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken oauth
                && oauth.isAuthenticated()
                && oauth.getPrincipal() instanceof org.springframework.security.oauth2.core.oidc.user.OidcUser;
        if (!local && !jwtValid && !google) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "An authenticated project session is required.");
        }

        List<String> roles = authentication.getAuthorities().stream()
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

        boolean director = roles.contains("DIRECTOR");
        return new Session(true, roles, director, director);
    }
}
