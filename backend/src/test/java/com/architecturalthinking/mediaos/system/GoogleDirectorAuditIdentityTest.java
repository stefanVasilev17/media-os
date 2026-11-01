package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GoogleDirectorAuditIdentityTest {
    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private void login(String registration, String issuer, boolean verified, String role) {
        OidcIdToken id = new OidcIdToken("test-only-token",
                Instant.parse("2026-11-01T09:00:00Z"),
                Instant.parse("2026-11-01T10:00:00Z"),
                Map.of("iss", issuer, "sub", "approved-google-subject", "aud", List.of("qa-client"),
                        "email_verified", verified, "email", "director@example.invalid"));
        var user = new DefaultOidcUser(List.of(new SimpleGrantedAuthority(role)), id, "sub");
        SecurityContextHolder.getContext().setAuthentication(
                new OAuth2AuthenticationToken(user, user.getAuthorities(), registration));
    }

    @Test
    void approvedGoogleSessionHasStableDirectorAuditIdentity() {
        login("google", "https://accounts.google.com", true, "ROLE_DIRECTOR");
        DirectorIdentity.Actor actor = DirectorIdentity.requireDirector();
        assertEquals("https://accounts.google.com", actor.issuer());
        assertEquals("approved-google-subject", actor.subject());
        assertTrue(actor.auditName().startsWith("director:"));
        assertEquals(actor.auditName(), DirectorIdentity.requireDirector().auditName());
    }

    @Test
    void rejectsUntrustedRegistrationRoleIssuerOrEmail() {
        login("other", "https://accounts.google.com", true, "ROLE_DIRECTOR");
        assertForbidden();
        login("google", "https://accounts.google.com", true, "ROLE_VIEWER");
        assertForbidden();
        login("google", "https://attacker.example", true, "ROLE_DIRECTOR");
        assertForbidden();
        login("google", "https://accounts.google.com", false, "ROLE_DIRECTOR");
        assertForbidden();
    }

    private void assertForbidden() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, DirectorIdentity::requireDirector);
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
