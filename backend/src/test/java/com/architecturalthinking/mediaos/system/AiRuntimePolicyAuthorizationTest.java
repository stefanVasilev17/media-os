package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AiRuntimePolicyAuthorizationTest {
    private final JdbcClient jdbc = mock(JdbcClient.class);
    private final AiRuntimePolicyService policy = new AiRuntimePolicyService(jdbc);

    @AfterEach
    void clean() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String role) {
        Jwt token = Jwt.withTokenValue("unit-test")
                .header("alg", "RS256")
                .issuer("https://identity.example")
                .subject("owner")
                .audience(List.of("mediaos-api"))
                .issuedAt(Instant.now().minusSeconds(10))
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new JwtAuthenticationToken(token,
                List.of(new SimpleGrantedAuthority(role))));
        SecurityContextHolder.setContext(context);
    }

    @Test
    void anonymousCannotEnablePaidAiOrAutoRepair() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> policy.update(true, true));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verifyNoInteractions(jdbc);
    }

    @Test
    void editorsCannotChangeAiSpendingControls() {
        authenticateAs("ROLE_EDITOR");
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> policy.update(true, false));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verifyNoInteractions(jdbc);
    }
}
