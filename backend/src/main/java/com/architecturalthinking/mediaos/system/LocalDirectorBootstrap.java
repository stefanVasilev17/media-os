package com.architecturalthinking.mediaos.system;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@ConditionalOnProperty(name = "mediaos.local-auth.bootstrap.enabled", havingValue = "true")
public class LocalDirectorBootstrap implements ApplicationRunner {
    private final JdbcClient jdbc;
    private final PasswordEncoder passwords;
    private final LocalTotpCrypto crypto;
    private final String username;
    private final String password;
    private final String totpSecret;

    public LocalDirectorBootstrap(JdbcClient jdbc, PasswordEncoder passwords,
                                  LocalTotpCrypto crypto,
                                  @Value("${mediaos.local-auth.bootstrap.username:}") String username,
                                  @Value("${mediaos.local-auth.bootstrap.password:}") String password,
                                  @Value("${mediaos.local-auth.bootstrap.totp-secret:}") String totpSecret) {
        this.jdbc = jdbc;
        this.passwords = passwords;
        this.crypto = crypto;
        this.username = username;
        this.password = password;
        this.totpSecret = totpSecret;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!username.matches("[a-zA-Z0-9._-]{3,80}") || password.length() < 16
                || password.length() > 512) {
            throw new IllegalStateException("Invalid one-time Director bootstrap configuration.");
        }
        LocalTotp.fromBase32(totpSecret);
        long existing = jdbc.sql("select count(*) from mediaos_local_director").query(Long.class).single();
        if (existing != 0) {
            throw new IllegalStateException(
                    "Director account exists. Remove bootstrap credentials and disable one-time bootstrap.");
        }
        jdbc.sql("""
                insert into mediaos_local_director
                    (id,username,password_hash,totp_secret_encrypted,active)
                values (:id,:username,:hash,:secret,true)
                """)
                .param("id", UUID.randomUUID()).param("username", username)
                .param("hash", passwords.encode(password))
                .param("secret", crypto.encrypt(totpSecret))
                .update();
    }
}
