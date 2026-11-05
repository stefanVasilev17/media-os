package com.architecturalthinking.mediaos;

import com.architecturalthinking.mediaos.workflow.EpisodeFactoryGitCodeAuditService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@EnabledIfEnvironmentVariable(
        named = "CI_POSTGRES_URL",
        matches = "jdbc:postgresql://(localhost|127\\.0\\.0\\.1):5432/media_os")
@SpringBootTest(classes = MediaOsApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@TestPropertySource(properties = {
        "spring.datasource.url=${CI_POSTGRES_URL}",
        "spring.datasource.username=media_os",
        "spring.datasource.password=media_os",
        "spring.session.jdbc.initialize-schema=never",
        "mediaos.local-auth.enabled=true",
        "mediaos.google-auth.enabled=false",
        "mediaos.director-security.enabled=false",
        "mediaos.worker-auth.enabled=true",
        "mediaos.local-auth.totp-encryption-key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "spring.task.scheduling.enabled=false"
})
class MediaOsFullApplicationStartupV120Test {
    @Autowired ApplicationContext context;

    @Test
    void fullFactoryApplicationStartsWithRealIsolatedPostgresAndScopedSecurity() {
        assertNotNull(context.getBean(EpisodeFactoryGitCodeAuditService.class));
    }
}
