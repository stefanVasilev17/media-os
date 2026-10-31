package com.architecturalthinking.mediaos.system;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "mediaos.local-auth.enabled", havingValue = "true")
public final class LocalDirectorLoginService {
    private static final int MAX_FAILURES = 5;
    private static final int LOCK_SECONDS = 900;
    private final JdbcClient jdbc;
    private final PasswordEncoder passwords;
    private final LocalTotpCrypto crypto;
    private final Clock clock;

    public record Attempt(LocalDirectorPrincipal principal) {
        public boolean success() { return principal != null; }
    }

    private record Account(UUID id, String username, String passwordHash, String totpSecret,
                           boolean active, int failures, OffsetDateTime lockedUntil, long lastTotpStep) {}

    public LocalDirectorLoginService(JdbcClient jdbc, PasswordEncoder passwords, LocalTotpCrypto crypto) {
        this(jdbc, passwords, crypto, Clock.systemUTC());
    }

    LocalDirectorLoginService(JdbcClient jdbc, PasswordEncoder passwords,
                              LocalTotpCrypto crypto, Clock clock) {
        this.jdbc = jdbc;
        this.passwords = passwords;
        this.crypto = crypto;
        this.clock = clock;
    }

    private Account row(ResultSet rs, int row) throws SQLException {
        return new Account((UUID) rs.getObject("id"), rs.getString("username"),
                rs.getString("password_hash"), rs.getString("totp_secret_encrypted"),
                rs.getBoolean("active"), rs.getInt("failed_attempts"),
                rs.getObject("locked_until", OffsetDateTime.class), rs.getLong("last_totp_step"));
    }

    @Transactional
    public Attempt verify(String username, String password, String code) {
        if (username == null || username.length() > 80 || password == null
                || password.isEmpty() || password.length() > 512 || code == null) {
            return new Attempt(null);
        }
        Account account = jdbc.sql("""
                select id, username, password_hash, totp_secret_encrypted, active,
                       failed_attempts, locked_until, last_totp_step
                from mediaos_local_director where username=:username for update
                """)
                .param("username", username)
                .query(this::row).optional().orElse(null);
        if (account == null || !account.active()) return new Attempt(null);

        Instant now = clock.instant();
        if (account.lockedUntil() != null && now.isBefore(account.lockedUntil().toInstant())) {
            return new Attempt(null);
        }

        boolean passwordOk = passwords.matches(password, account.passwordHash());
        long step = -1;
        if (passwordOk) {
            step = LocalTotp.verifyStep(crypto.decrypt(account.totpSecret()),
                    code, now, account.lastTotpStep());
        }
        if (!passwordOk || step < 0) {
            int failures = Math.min(account.failures() + 1, MAX_FAILURES);
            OffsetDateTime lockUntil = failures >= MAX_FAILURES
                    ? now.plusSeconds(LOCK_SECONDS).atOffset(ZoneOffset.UTC) : null;
            jdbc.sql("""
                    update mediaos_local_director
                    set failed_attempts=:failures, locked_until=:until, updated_at=now()
                    where id=:id
                    """)
                    .param("failures", failures).param("until", lockUntil)
                    .param("id", account.id()).update();
            return new Attempt(null);
        }

        jdbc.sql("""
                update mediaos_local_director
                set failed_attempts=0, locked_until=null,
                    last_totp_step=:step, updated_at=now()
                where id=:id
                """)
                .param("step", step).param("id", account.id()).update();
        return new Attempt(new LocalDirectorPrincipal(account.id(), account.username()));
    }

    public boolean isActive(UUID id) {
        return jdbc.sql("select active from mediaos_local_director where id=:id")
                .param("id", id).query(Boolean.class).optional().orElse(false);
    }
}
