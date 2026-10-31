package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;

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

    @Test
    void neverMapsArbitraryRolesToPrivilegedAuthorities() {
        var authorities = DirectorMembershipService.trustedAuthorities(
                List.of("ROLE_DIRECTOR", "ADMIN", "DIRECTOR", "VIEWER", "OWNER"));
        assertEquals(List.of("ROLE_DIRECTOR", "ROLE_VIEWER"),
                authorities.stream().map(a -> a.getAuthority()).toList());
    }
}
