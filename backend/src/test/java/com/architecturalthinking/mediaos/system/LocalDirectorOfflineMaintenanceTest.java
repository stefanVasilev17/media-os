package com.architecturalthinking.mediaos.system;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Base64;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class LocalDirectorOfflineMaintenanceTest {
    private static final String OLD_SEED = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    private static final String NEW_SEED = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";

    private String key(byte value) {
        byte[] bytes = new byte[32];
        java.util.Arrays.fill(bytes, value);
        return Base64.getEncoder().encodeToString(bytes);
    }

    @Test
    void rotateAndRecoverAreAtomicAuditedAndRevokeSessions() {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url != null && !url.isBlank(), "Disposable PostgreSQL required");
        Flyway.configure().dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration").load().migrate();

        var datasource = new DriverManagerDataSource(url, "media_os", "media_os");
        var jdbc = JdbcClient.create(datasource);
        var encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
        var maintenance = new LocalDirectorOfflineMaintenance(jdbc, encoder);
        var transactions = new TransactionTemplate(new DataSourceTransactionManager(datasource));
        UUID id = UUID.randomUUID();
        String username = "offline_ci_" + id.toString().substring(0, 14);
        String previous = key((byte) 1);
        String next = key((byte) 2);

        jdbc.sql("""
                insert into mediaos_local_director
                    (id,username,password_hash,totp_secret_encrypted,active,last_totp_step)
                values (:id,:username,:password,:secret,true,99)
                """).param("id", id).param("username", username)
                .param("password", encoder.encode("old-password-exclusively-for-ci"))
                .param("secret", new LocalTotpCrypto(previous).encrypt(OLD_SEED))
                .update();

        try {
            assertThrows(IllegalStateException.class,
                    () -> maintenance.rotateTotpEncryptionKey(
                            id, previous, next, "CHANGE_CI_1001"));

            addSession(jdbc, id);
            String before = storedSecret(jdbc, id);

            assertThrows(IllegalStateException.class,
                    () -> transactions.executeWithoutResult(status ->
                            maintenance.rotateTotpEncryptionKey(
                                    id, key((byte) 3), next, "CHANGE_CI_1001")));
            assertEquals(before, storedSecret(jdbc, id), "Bad previous key must roll back.");
            assertEquals(0, auditCount(jdbc, id), "Failed rotation cannot create an audit row.");
            assertEquals(1, sessionCount(jdbc, id), "Failed rotation cannot revoke sessions.");

            transactions.executeWithoutResult(status ->
                    maintenance.rotateTotpEncryptionKey(id, previous, next, "CHANGE_CI_1001"));

            assertEquals(OLD_SEED, new LocalTotpCrypto(next).decrypt(storedSecret(jdbc, id)));
            assertThrows(IllegalStateException.class,
                    () -> new LocalTotpCrypto(previous).decrypt(storedSecret(jdbc, id)));
            assertEquals(99, jdbc.sql("select last_totp_step from mediaos_local_director where id=:id")
                    .param("id", id).query(Integer.class).single());
            assertEquals(0, sessionCount(jdbc, id));
            assertEquals(1, auditCount(jdbc, id));

            addSession(jdbc, id);
            transactions.executeWithoutResult(status -> maintenance.recover(
                    id, "brand-new-offline-ci-password", NEW_SEED, next, "CHANGE_CI_1002"));

            assertEquals(NEW_SEED, new LocalTotpCrypto(next).decrypt(storedSecret(jdbc, id)));
            String hashed = jdbc.sql("select password_hash from mediaos_local_director where id=:id")
                    .param("id", id).query(String.class).single();
            assertTrue(encoder.matches("brand-new-offline-ci-password", hashed));
            assertFalse(encoder.matches("old-password-exclusively-for-ci", hashed));
            assertEquals(-1, jdbc.sql("select last_totp_step from mediaos_local_director where id=:id")
                    .param("id", id).query(Integer.class).single());
            assertEquals(0, sessionCount(jdbc, id));
            assertEquals(2, auditCount(jdbc, id));
            assertEquals(1, jdbc.sql("""
                    select count(*) from mediaos_local_director_maintenance_audit
                    where account_id=:id and operation='CREDENTIALS_RECOVERED'
                    """).param("id", id).query(Integer.class).single());
        } finally {
            jdbc.sql("delete from SPRING_SESSION where PRINCIPAL_NAME=:principal")
                    .param("principal", id.toString()).update();
            jdbc.sql("delete from mediaos_local_director_maintenance_audit where account_id=:id")
                    .param("id", id).update();
            jdbc.sql("delete from mediaos_local_director where id=:id")
                    .param("id", id).update();
        }
    }

    private String storedSecret(JdbcClient jdbc, UUID id) {
        return jdbc.sql("select totp_secret_encrypted from mediaos_local_director where id=:id")
                .param("id", id).query(String.class).single();
    }

    private int auditCount(JdbcClient jdbc, UUID id) {
        return jdbc.sql("select count(*) from mediaos_local_director_maintenance_audit where account_id=:id")
                .param("id", id).query(Integer.class).single();
    }

    private int sessionCount(JdbcClient jdbc, UUID id) {
        return jdbc.sql("select count(*) from SPRING_SESSION where PRINCIPAL_NAME=:principal")
                .param("principal", id.toString()).query(Integer.class).single();
    }

    private void addSession(JdbcClient jdbc, UUID id) {
        jdbc.sql("""
                insert into SPRING_SESSION
                    (PRIMARY_ID, SESSION_ID, CREATION_TIME, LAST_ACCESS_TIME,
                     MAX_INACTIVE_INTERVAL, EXPIRY_TIME, PRINCIPAL_NAME)
                values (:id, :session, 1, 1, 1800, 1800001, :principal)
                """)
                .param("id", UUID.randomUUID().toString())
                .param("session", UUID.randomUUID().toString())
                .param("principal", id.toString()).update();
    }
}
