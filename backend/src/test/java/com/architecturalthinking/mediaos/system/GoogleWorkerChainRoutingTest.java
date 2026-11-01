package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@EnabledIfEnvironmentVariable(named = "CI_POSTGRES_URL", matches = ".+")
@SpringBootTest(classes = GoogleWorkerChainRoutingTest.App.class,
        webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=${CI_POSTGRES_URL}",
        "spring.datasource.username=media_os",
        "spring.datasource.password=media_os",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.session.jdbc.initialize-schema=never",
        "mediaos.local-auth.enabled=false",
        "mediaos.director-security.enabled=false",
        "mediaos.google-auth.enabled=true",
        "mediaos.google-auth.client-id=qa-test.apps.googleusercontent.com",
        "mediaos.google-auth.client-secret=nonproduction-test-config",
        "mediaos.google-auth.allowed-email=qa@example.invalid",
        "mediaos.worker-auth.enabled=true"
})
class GoogleWorkerChainRoutingTest {
    @Configuration
    @EnableAutoConfiguration(exclude = {
            HibernateJpaAutoConfiguration.class, JpaRepositoriesAutoConfiguration.class
    })
    @Import({GoogleDirectorSecurityConfiguration.class,
            WorkloadSecurityConfiguration.class,
            WorkloadCredentialService.class, WorkerProbe.class})
    static class App {}

    @RestController
    static class WorkerProbe {
        @GetMapping("/api/v1/remotion/gpu-renders/{id}/work")
        String work() { return "test"; }

        @GetMapping("/api/v1/episodes")
        String episodes() { return "private"; }
    }

    @Autowired MockMvc mvc;

    @Test
    void noGoogleSessionCannotAccessDirectorApi() throws Exception {
        mvc.perform(get("/api/v1/episodes")).andExpect(status().isUnauthorized());
    }
}
