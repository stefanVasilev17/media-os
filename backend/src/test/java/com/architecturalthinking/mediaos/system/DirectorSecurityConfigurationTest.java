package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class DirectorSecurityConfigurationTest {
    private final DirectorSecurityConfiguration configuration =
            new DirectorSecurityConfiguration(mock(DirectorMembershipService.class));

    @Test
    void requiresHttpsIssuerAndJwkSet() {
        assertThrows(IllegalStateException.class,
                () -> configuration.verifiedDirectorDecoder("", "", "mediaos-api"));
        assertThrows(IllegalStateException.class,
                () -> configuration.verifiedDirectorDecoder(
                        "http://untrusted.example", "https://id.example/jwks.json", "mediaos-api"));
        assertThrows(IllegalStateException.class,
                () -> configuration.verifiedDirectorDecoder(
                        "https://id.example", "http://untrusted.example/jwks", "mediaos-api"));
    }

    @Test
    void requiresAnExplicitApiAudience() {
        assertThrows(IllegalStateException.class,
                () -> configuration.verifiedDirectorDecoder(
                        "https://id.example", "https://id.example/jwks.json", ""));
    }

    private Jwt token(String issuer, String audience, String subject) {
        return Jwt.withTokenValue("test-token")
                .header("alg", "RS256")
                .issuer(issuer)
                .subject(subject)
                .audience(List.of(audience))
                .issuedAt(Instant.now().minusSeconds(10))
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
    }

    @Test
    void validatesIssuerAudienceAndSubjectIndependentlyOfSignatureDecoder() {
        var validator = DirectorSecurityConfiguration.requiredJwtClaims(
                "https://identity.example", "mediaos-api");
        assertEquals(false, validator.validate(
                token("https://identity.example", "mediaos-api", "director-42")).hasErrors());
        assertEquals(true, validator.validate(
                token("https://other-issuer.example", "mediaos-api", "director-42")).hasErrors());
        assertEquals(true, validator.validate(
                token("https://identity.example", "different-app", "director-42")).hasErrors());
    }

    @Test
    void neverMapsArbitraryRolesToPrivilegedAuthorities() {
        var authorities = DirectorMembershipService.trustedAuthorities(
                List.of("ROLE_DIRECTOR", "ADMIN", "DIRECTOR", "VIEWER", "OWNER"));
        assertEquals(List.of("ROLE_DIRECTOR", "ROLE_VIEWER"),
                authorities.stream().map(a -> a.getAuthority()).toList());
    }
}
