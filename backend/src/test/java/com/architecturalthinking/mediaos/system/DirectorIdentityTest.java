package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DirectorIdentityTest {
    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(String role) {
        Jwt jwt = Jwt.withTokenValue("test-only-token")
                .header("alg", "RS256")
                .issuer("https://identity.example")
                .subject("director-42")
                .audience(List.of("mediaos-api"))
                .issuedAt(Instant.now().minusSeconds(10))
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        var auth = new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority(role)));
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    @Test
    void anonymousRequestCannotClaimDirectorApproval() {
        var error = assertThrows(ResponseStatusException.class, DirectorIdentity::requireDirector);
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
    }

    @Test
    void nonDirectorMembershipCannotApprove() {
        authenticate("ROLE_EDITOR");
        var error = assertThrows(ResponseStatusException.class, DirectorIdentity::requireDirector);
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
    }

    @Test
    void verifiedMembershipProducesImmutableStableAuditIdentity() {
        authenticate("ROLE_DIRECTOR");
        var actor = DirectorIdentity.requireDirector();
        assertEquals("https://identity.example", actor.issuer());
        assertEquals("director-42", actor.subject());
        assertEquals(73, actor.auditName().length());
        assertEquals(actor.auditName(),
                DirectorIdentity.stableAuditName("https://identity.example", "director-42"));
        assertNotEquals(actor.auditName(),
                DirectorIdentity.stableAuditName("https://identity.example", "different-user"));
        assertNotEquals(actor.auditName(),
                DirectorIdentity.stableAuditName("https://different-issuer.example", "director-42"));
    }
}
