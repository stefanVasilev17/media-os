package com.architecturalthinking.mediaos.system;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Objects;
import java.util.UUID;

public final class LocalDirectorOfflineMaintenance {
    private final JdbcClient jdbc;
    private final PasswordEncoder encoder;

    public LocalDirectorOfflineMaintenance(JdbcClient jdbc, PasswordEncoder encoder) {
        this.jdbc = Objects.requireNonNull(jdbc);
        this.encoder = Objects.requireNonNull(encoder);
    }

    public void recover(UUID accountId, String newPassword, String newTotpSecret,
                        String encryptionKeyBase64, String ticket) {
        requireOfflineTransaction(ticket);
        if (newPassword == null || newPassword.length() < 16 || newPassword.length() > 512) {
            throw new IllegalArgumentException("Recovery password must have 16-512 characters.");
        }
        LocalTotp.fromBase32(newTotpSecret);
        LocalTotpCrypto crypto = new LocalTotpCrypto(encryptionKeyBase64);
        requireSingleLockedAccount(accountId);
        String updatedSecret = crypto.encrypt(newTotpSecret);
        int updated = jdbc.sql("""
                update mediaos_local_director
                set password_hash=:password, totp_secret_encrypted=:secret,
                    failed_attempts=0, locked_until=null, last_totp_step=-1,
                    updated_at=now()
                where id=:id
                """)
                .param("password", encoder.encode(newPassword))
                .param("secret", updatedSecret)
                .param("id", accountId).update();
        if (updated != 1) throw new IllegalStateException("Recovery target was not updated.");
        revokeSessions(accountId);
        audit(accountId, "CREDENTIALS_RECOVERED", ticket);
    }

    public void rotateTotpEncryptionKey(UUID accountId,
                                        String oldKeyBase64, String newKeyBase64, String ticket) {
        requireOfflineTransaction(ticket);
        if (Objects.equals(oldKeyBase64, newKeyBase64)) {
            throw new IllegalArgumentException("New encryption key must differ from old key.");
        }
        LocalTotpCrypto oldCrypto = new LocalTotpCrypto(oldKeyBase64);
        LocalTotpCrypto newCrypto = new LocalTotpCrypto(newKeyBase64);
        String encrypted = requireSingleLockedAccount(accountId);
        String secret = oldCrypto.decrypt(encrypted);
        LocalTotp.fromBase32(secret);
        String rotated = newCrypto.encrypt(secret);
        int updated = jdbc.sql("""
                update mediaos_local_director
                set totp_secret_encrypted=:secret, updated_at=now()
                where id=:id
                """)
                .param("secret", rotated).param("id", accountId).update();
        if (updated != 1) throw new IllegalStateException("Key rotation target was not updated.");
        revokeSessions(accountId);
        audit(accountId, "TOTP_KEY_ROTATED", ticket);
    }

    private String requireSingleLockedAccount(UUID accountId) {
        if (accountId == null) throw new IllegalArgumentException("Account id is required.");
        long count = jdbc.sql("select count(*) from mediaos_local_director")
                .query(Long.class).single();
        if (count != 1) throw new IllegalStateException("Offline operation requires exactly one local Director.");
        return jdbc.sql("""
                select totp_secret_encrypted from mediaos_local_director
                where id=:id for update
                """).param("id", accountId).query(String.class).optional()
                .orElseThrow(() -> new IllegalArgumentException("Unknown local Director account."));
    }

    private void revokeSessions(UUID accountId) {
        jdbc.sql("delete from SPRING_SESSION where PRINCIPAL_NAME=:name")
                .param("name", accountId.toString()).update();
    }

    private void audit(UUID accountId, String operation, String ticket) {
        jdbc.sql("""
                insert into mediaos_local_director_maintenance_audit
                    (id,account_id,operation,ticket)
                values (:id,:account,:operation,:ticket)
                """)
                .param("id", UUID.randomUUID())
                .param("account", accountId)
                .param("operation", operation)
                .param("ticket", ticket)
                .update();
    }

    private void requireOfflineTransaction(String ticket) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            throw new IllegalStateException("Offline maintenance requires an explicit database transaction.");
        }
        if (ticket == null || !ticket.matches("[A-Za-z0-9_-]{8,96}")) {
            throw new IllegalArgumentException("A non-secret approved change ticket is required.");
        }
    }
}
