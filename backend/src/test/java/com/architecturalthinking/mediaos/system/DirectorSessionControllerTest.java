package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class DirectorSessionControllerTest {
    private final DirectorSessionController controller = new DirectorSessionController();

    private JwtAuthenticationToken authentication(String subject, String role) {
        Jwt jwt = Jwt.withTokenValue("unit-test")
                .header("alg", "RS256")
                .issuer("https://id.example")
                .subject(subject)
                .audience(List.of("mediaos-api"))
                .issuedAt(Instant.now().minusSeconds(10))
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        return new JwtAuthenticationToken(jwt,
                List.of(new SimpleGrantedAuthority(role)));
    }

    @Test
    void anonymousSessionHasNoAccess() {
        ResponseStatusException denied = assertThrows(ResponseStatusException.class,
                () -> controller.current(null));
        assertEquals(HttpStatus.UNAUTHORIZED, denied.getStatusCode());
    }

    @Test
    void tokenWithoutProjectMembershipCannotReadSession() {
        ResponseStatusException denied = assertThrows(ResponseStatusException.class,
                () -> controller.current(authentication("unregistered", "ROLE_RANDOM")));
        assertEquals(HttpStatus.FORBIDDEN, denied.getStatusCode());
    }

    @Test
    void editorSessionNeverAdvertisesApprovalOrSpendingPermission() {
        var session = controller.current(authentication("editor", "ROLE_EDITOR"));
        assertTrue(session.authenticated());
        assertEquals(List.of("EDITOR"), session.roles());
        assertFalse(session.canApprove());
        assertFalse(session.canSpend());
        assertTrue(session.actorKey().startsWith("director:"));
        assertFalse(session.actorKey().contains("editor"));
    }

    @Test
    void directorSessionMayReviewAndApproveButDoesNotExposeRawIdentity() {
        var session = controller.current(authentication("director-user", "ROLE_DIRECTOR"));
        assertTrue(session.canApprove());
        assertTrue(session.canSpend());
        assertEquals(List.of("DIRECTOR"), session.roles());
        assertFalse(session.actorKey().contains("director-user"));
    }
}
