package com.architecturalthinking.mediaos.system;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class PreviewAuthorizationService {

    private static final int TTL_MINUTES = 5;

    private final JdbcClient jdbc;

    public PreviewAuthorizationService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record IssuedAuthorization(UUID token, OffsetDateTime expiresAt) {}

    @Transactional
    public IssuedAuthorization issue(String operation, String payload) {
        UUID token = UUID.randomUUID();
        OffsetDateTime expiresAt = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(TTL_MINUTES);
        jdbc.sql("""
                insert into ai_preview_authorization(id, operation, payload_hash, status, expires_at)
                values (:id, :operation, :payloadHash, 'READY', :expiresAt)
                """)
                .param("id", token)
                .param("operation", normalizeOperation(operation))
                .param("payloadHash", hash(payload))
                .param("expiresAt", expiresAt)
                .update();
        return new IssuedAuthorization(token, expiresAt);
    }

    @Transactional
    public void consume(String rawToken, String operation, String payload) {
        if (rawToken == null || rawToken.isBlank()) {
            throw previewRequired();
        }

        UUID token;
        try {
            token = UUID.fromString(rawToken.trim());
        } catch (IllegalArgumentException ex) {
            throw previewRequired();
        }

        String normalizedOperation = normalizeOperation(operation);
        String payloadHash = hash(payload);
        int updated = jdbc.sql("""
                update ai_preview_authorization
                set status='CONSUMED', consumed_at=now()
                where id=:id
                  and operation=:operation
                  and payload_hash=:payloadHash
                  and status='READY'
                  and expires_at > now()
                """)
                .param("id", token)
                .param("operation", normalizedOperation)
                .param("payloadHash", payloadHash)
                .update();

        if (updated == 1) return;

        jdbc.sql("""
                update ai_preview_authorization
                set status='EXPIRED'
                where id=:id and status='READY' and expires_at <= now()
                """)
                .param("id", token)
                .update();

        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This paid action does not have a valid matching preview authorization. Preview the exact action again; authorizations are single-use and expire after five minutes."
        );
    }

    public String directorPayload(String mode, String message) {
        return normalizeOperation(mode) + "\n" + clean(message);
    }

    public String creativePayload(String stageKey, String action, String message) {
        String base = normalizeOperation(stageKey) + "|" + normalizeOperation(action);
        return "REVISE".equals(normalizeOperation(action)) ? base + "\n" + clean(message) : base;
    }

    public String topicPayload() {
        return "TOPIC_CANDIDATES";
    }

    public String episodeBuildPayload(int budgetMinutes) {
        return "EPISODE_BUILD_START|" + budgetMinutes;
    }

    private ResponseStatusException previewRequired() {
        return new ResponseStatusException(
                HttpStatus.PRECONDITION_REQUIRED,
                "Preview required. MediaOS will not execute a paid AI action without a fresh one-time zero-token preview authorization."
        );
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encoded = digest.digest(clean(value).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encoded);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable.", ex);
        }
    }

    private String normalizeOperation(String value) {
        return clean(value).toUpperCase();
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
