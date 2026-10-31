package com.architecturalthinking.mediaos.system;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.jdbc.core.simple.JdbcClient;

@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "mediaos.local-auth.enabled", havingValue = "true")
public class LocalLoginThrottleMaintenance {
    private final JdbcClient jdbc;

    public LocalLoginThrottleMaintenance(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Scheduled(fixedDelayString = "${mediaos.local-auth.login-throttle-cleanup-ms:21600000}")
    public void cleanupExpiredBuckets() {
        jdbc.sql("""
                delete from mediaos_local_login_throttle
                where updated_at < now() - interval '48 hours'
                """).update();
    }
}
