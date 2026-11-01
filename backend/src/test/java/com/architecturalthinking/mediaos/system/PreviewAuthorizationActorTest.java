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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class PreviewAuthorizationActorTest {
    private final JdbcClient jdbc = mock(JdbcClient.class);
    private final JdbcClient.StatementSpec statement = mock(JdbcClient.StatementSpec.class);
    private final PreviewAuthorizationService previews = new PreviewAuthorizationService(jdbc);

    private void director(String subject) {
        Jwt jwt = Jwt.withTokenValue("test-only")
                .header("alg", "RS256")
                .issuer("https://identity.example")
                .subject(subject)
                .audience(List.of("mediaos-api"))
                .issuedAt(Instant.now().minusSeconds(10))
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        var authentication = new JwtAuthenticationToken(jwt,
                List.of(new SimpleGrantedAuthority("ROLE_DIRECTOR")));
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
    }

    private void mockSql(int... updates) {
        when(jdbc.sql(anyString())).thenReturn(statement);
        when(statement.param(anyString(), any())).thenReturn(statement);
        if (updates.length > 0) {
            Integer[] boxed = java.util.Arrays.stream(updates).boxed().toArray(Integer[]::new);
            when(statement.update()).thenReturn(boxed[0],
                    java.util.Arrays.copyOfRange(boxed, 1, boxed.length));
        }
    }

    @AfterEach
    void clearIdentity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void anonymousUsersCannotIssueOrConsumePaidAuthorization() {
        assertEquals(HttpStatus.FORBIDDEN,
                assertThrows(ResponseStatusException.class,
                        () -> previews.issue("SCRIPT_GENERATE", "payload")).getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN,
                assertThrows(ResponseStatusException.class,
                        () -> previews.consume(java.util.UUID.randomUUID().toString(),
                                "SCRIPT_GENERATE", "payload")).getStatusCode());
        verifyNoInteractions(jdbc);
    }

    @Test
    void issuancePersistsVerifiedActorAndNeverClientProvidedName() {
        mockSql(1);
        director("director-A");
        previews.issue("SCRIPT_GENERATE", "payload");
        verify(statement).param("actorIssuer", "https://identity.example");
        verify(statement).param("actorSubject", "director-A");
        var sql = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(jdbc).sql(sql.capture());
        assertTrue(sql.getValue().contains("actor_issuer, actor_subject"));
    }

    @Test
    void sameDirectorCanConsumeAnUnexpiredMatchingTokenOnce() {
        mockSql(1, 1);
        director("director-A");
        var issued = previews.issue("SCRIPT_GENERATE", "payload");
        assertDoesNotThrow(() -> previews.consume(
                issued.token().toString(), "SCRIPT_GENERATE", "payload"));
        verify(statement, times(2)).param("actorSubject", "director-A");
    }

    @Test
    void anotherDirectorCannotConsumeOriginalPreviewAuthorization() {
        mockSql(1, 0, 0);
        director("director-A");
        var issued = previews.issue("SCRIPT_GENERATE", "payload");

        director("director-B");
        var denial = assertThrows(ResponseStatusException.class,
                () -> previews.consume(issued.token().toString(), "SCRIPT_GENERATE", "payload"));
        assertEquals(HttpStatus.CONFLICT, denial.getStatusCode());

        verify(statement, atLeastOnce()).param("actorSubject", "director-B");
        var sql = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(jdbc, times(3)).sql(sql.capture());
        assertTrue(sql.getAllValues().get(1).contains("actor_subject=:actorSubject"));
        assertTrue(sql.getAllValues().get(1).contains("status='READY'"));
    }
}
