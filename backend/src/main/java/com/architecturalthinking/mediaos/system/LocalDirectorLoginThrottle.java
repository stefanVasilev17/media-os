package com.architecturalthinking.mediaos.system;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

@Service
@ConditionalOnProperty(name = "mediaos.local-auth.enabled", havingValue = "true")
public class LocalDirectorLoginThrottle {
    static final int USERNAME_LIMIT = 12;
    static final int GLOBAL_LIMIT = 100;
    static final String GLOBAL_BUCKET = "global:login";

    private final JdbcClient jdbc;

    public LocalDirectorLoginThrottle(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void check(String username) {
        if (increment(GLOBAL_BUCKET) > GLOBAL_LIMIT) deny();
        String normalized = username == null ? "" : username.strip().toLowerCase(Locale.ROOT);
        if (increment("account:" + normalized) > USERNAME_LIMIT) deny();
    }

    private int increment(String key) {
        return jdbc.sql("""
                insert into mediaos_local_login_throttle
                    (bucket_hash,attempts,window_started_at,updated_at)
                values (:hash,1,now(),now())
                on conflict (bucket_hash) do update
                set attempts = case
                        when mediaos_local_login_throttle.window_started_at < now() - interval '15 minutes'
                            then 1
                        else mediaos_local_login_throttle.attempts + 1
                    end,
                    window_started_at = case
                        when mediaos_local_login_throttle.window_started_at < now() - interval '15 minutes'
                            then now()
                        else mediaos_local_login_throttle.window_started_at
                    end,
                    updated_at = now()
                returning attempts
                """)
                .param("hash", sha256(key))
                .query(Integer.class)
                .single();
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 unavailable.", exception);
        }
    }

    private static void deny() {
        throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Too many sign-in attempts. Retry later.");
    }
}
