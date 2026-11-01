package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GoogleDirectorIdentityPolicyTest {
    private static final String CLIENT = "mediaos-test-client.apps.googleusercontent.com";
    private static final String EMAIL = "approved-director@example.invalid";
    private static final String SUBJECT = "google-stable-director-subject";

    private OidcIdToken token(String issuer, String subject, String email,
                              boolean verified, String audience) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("iss", issuer);
        claims.put("sub", subject);
        claims.put("email", email);
        claims.put("email_verified", verified);
        claims.put("aud", List.of(audience));
        return new OidcIdToken("test-only-id-token",
                Instant.parse("2026-11-01T08:00:00Z"),
                Instant.parse("2026-11-01T09:00:00Z"), claims);
    }

    @Test
    void exactVerifiedGoogleIdentityMayBeDirector() {
        var policy = new GoogleDirectorIdentityPolicy(EMAIL, SUBJECT, CLIENT);
        assertTrue(policy.allowed(token("https://accounts.google.com",
                SUBJECT, EMAIL, true, CLIENT)));
        assertTrue(policy.allowed(token("accounts.google.com",
                SUBJECT, EMAIL.toUpperCase(), true, CLIENT)));
    }

    @Test
    void rejectsUnknownEmailOrSubjectEvenWithValidGoogleIssuer() {
        var policy = new GoogleDirectorIdentityPolicy(EMAIL, SUBJECT, CLIENT);
        assertFalse(policy.allowed(token("https://accounts.google.com",
                SUBJECT, "other@example.invalid", true, CLIENT)));
        assertFalse(policy.allowed(token("https://accounts.google.com",
                "other-account", EMAIL, true, CLIENT)));
    }

    @Test
    void rejectsUnverifiedEmailWrongIssuerAndWrongAudience() {
        var policy = new GoogleDirectorIdentityPolicy(EMAIL, SUBJECT, CLIENT);
        assertFalse(policy.allowed(token("https://accounts.google.com",
                SUBJECT, EMAIL, false, CLIENT)));
        assertFalse(policy.allowed(token("https://untrusted.example",
                SUBJECT, EMAIL, true, CLIENT)));
        assertFalse(policy.allowed(token("https://accounts.google.com",
                SUBJECT, EMAIL, true, "another-client")));
        assertFalse(policy.allowed(null));
    }

    @Test
    void verifiedEmailCanBeUsedForFirstEnrollmentWhenSubjectNotYetKnown() {
        var policy = new GoogleDirectorIdentityPolicy(EMAIL, "", CLIENT);
        assertTrue(policy.allowed(token("https://accounts.google.com",
                SUBJECT, EMAIL, true, CLIENT)));
        assertFalse(policy.allowed(token("https://accounts.google.com",
                SUBJECT, "unknown@example.invalid", true, CLIENT)));
    }

    @Test
    void incompletePolicyFailsClosed() {
        assertThrows(IllegalStateException.class,
                () -> new GoogleDirectorIdentityPolicy("", "", CLIENT));
        assertThrows(IllegalStateException.class,
                () -> new GoogleDirectorIdentityPolicy(EMAIL, SUBJECT, ""));
    }
}
