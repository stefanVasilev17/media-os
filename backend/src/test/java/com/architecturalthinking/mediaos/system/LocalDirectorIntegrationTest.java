package com.architecturalthinking.mediaos.system;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class LocalDirectorIntegrationTest {
    private static final String SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

    @Test
    void localDirectorNeedsPasswordAndTotpAndCannotReuseTheSameCode() {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url != null && !url.isBlank(), "Requires disposable PostgreSQL");
        Flyway.configure().dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration").load().migrate();

        var jdbc = JdbcClient.create(new DriverManagerDataSource(url, "media_os", "media_os"));
        var passwordEncoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
        var encryptedKey = Base64.getEncoder().encodeToString(new byte[32]);
        var crypto = new LocalTotpCrypto(encryptedKey);
        var service = new LocalDirectorLoginService(
                jdbc, passwordEncoder, crypto, Clock.fixed(Instant.ofEpochSecond(59), ZoneOffset.UTC));

        UUID id = UUID.randomUUID();
        String username = "ci_" + id.toString().substring(0, 20);
        jdbc.sql("""
                insert into mediaos_local_director
                    (id,username,password_hash,totp_secret_encrypted,active)
                values (:id,:username,:hash,:secret,true)
                """).param("id", id).param("username", username)
                .param("hash", passwordEncoder.encode("test-passphrase-only-used-in-ephemeral-db"))
                .param("secret", crypto.encrypt(SECRET)).update();
        try {
            assertFalse(service.verify(username, "wrong", "287082").success());
            assertFalse(service.verify(username, "test-passphrase-only-used-in-ephemeral-db", "000000").success());
            var result = service.verify(username, "test-passphrase-only-used-in-ephemeral-db", "287082");
            assertTrue(result.success());
            assertEquals(id, result.principal().id());
            assertFalse(service.verify(username, "test-passphrase-only-used-in-ephemeral-db", "287082").success(),
                    "A verified six-digit TOTP must never be replayable.");
            assertTrue(service.isActive(id));
            jdbc.sql("update mediaos_local_director set active=false where id=:id")
                    .param("id", id).update();
            assertFalse(service.isActive(id));
            assertFalse(service.verify(username, "test-passphrase-only-used-in-ephemeral-db", "287082").success());
        } finally {
            jdbc.sql("delete from mediaos_local_director where id=:id")
                    .param("id", id).update();
        }
    }
}
