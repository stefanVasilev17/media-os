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
import org.springframework.jdbc.core.simple.JdbcClient;
import java.util.UUID;
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
    @Autowired JdbcClient jdbc;


    @Test
    void scopedWorkerCanAccessOnlyItsOwnGpuJobWithoutGoogleSession() throws Exception {
        UUID job = UUID.randomUUID();
        UUID credential = UUID.randomUUID();
        String workerId = "qa-gpu-" + credential;
        String token = "qa-only-" + "A".repeat(50);
        jdbc.sql("""
                insert into mediaos_worker_credential
                    (id,worker_id,token_hash,scope,job_id,active,expires_at)
                values (:id,:worker,:hash,'REMOTION_GPU',:job,true,now()+interval '10 minutes')
                """)
                .param("id", credential).param("worker", workerId)
                .param("hash", WorkloadCredentialService.sha256(token))
                .param("job", job).update();
        try {
            mvc.perform(get("/api/v1/remotion/gpu-renders/" + job + "/work")
                            .header("X-Worker-Id", workerId)
                            .header("X-MediaOS-Workload-Token", token))
                    .andExpect(status().isOk());
            mvc.perform(get("/api/v1/remotion/gpu-renders/" + UUID.randomUUID() + "/work")
                            .header("X-Worker-Id", workerId)
                            .header("X-MediaOS-Workload-Token", token))
                    .andExpect(status().isUnauthorized());
            mvc.perform(get("/api/v1/episodes")
                            .header("X-Worker-Id", workerId)
                            .header("X-MediaOS-Workload-Token", token))
                    .andExpect(status().isUnauthorized());
        } finally {
            jdbc.sql("delete from mediaos_worker_credential where id=:id")
                    .param("id", credential).update();
        }
    }

    @Test
    void noGoogleSessionCannotAccessDirectorApi() throws Exception {
        mvc.perform(get("/api/v1/episodes")).andExpect(status().isUnauthorized());
    }
}
