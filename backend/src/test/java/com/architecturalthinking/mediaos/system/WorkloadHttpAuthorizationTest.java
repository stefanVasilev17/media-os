package com.architecturalthinking.mediaos.system;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@EnabledIfEnvironmentVariable(named="CI_POSTGRES_URL", matches=".+")
@SpringBootTest(classes=WorkloadHttpAuthorizationTest.ProbeApplication.class,
        webEnvironment=SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@TestPropertySource(properties={
        "spring.datasource.url=${CI_POSTGRES_URL}",
        "spring.datasource.username=media_os",
        "spring.datasource.password=media_os",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.session.jdbc.initialize-schema=never",
        "mediaos.local-auth.enabled=true",
        "mediaos.director-security.enabled=false",
        "mediaos.worker-auth.enabled=true",
        "mediaos.local-auth.totp-encryption-key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
})
class WorkloadHttpAuthorizationTest {
    @Configuration
    @EnableAutoConfiguration(exclude={HibernateJpaAutoConfiguration.class, JpaRepositoriesAutoConfiguration.class})
    @Import({LocalDirectorSecurityConfiguration.class, WorkloadSecurityConfiguration.class,
            WorkloadCredentialService.class, ProbeController.class})
    static class ProbeApplication {}

    @RestController
    public static class ProbeController {
        @GetMapping("/api/v1/remotion/gpu-renders/{renderId}/work")
        String gpu() { return "job"; }

        @PostMapping("/api/v1/worker/runner/heartbeat")
        String heartbeat() { return "heartbeat"; }

        @PostMapping("/api/v1/episodes")
        String episode() { return "episode"; }
    }

    @Autowired MockMvc mvc;
    @Autowired JdbcClient jdbc;
    UUID credential;
    UUID allowedJob;
    String token;
    String workerId;

    @BeforeEach
    void setup() {
        credential=UUID.randomUUID();
        allowedJob=UUID.randomUUID();
        token="abcdefghijklmnopABCDEFGHIJKLMNOP0123456789-_W";
        workerId="test-gpu-"+credential.toString().substring(0,12);
        jdbc.sql("""
                insert into mediaos_worker_credential
                    (id,worker_id,token_hash,scope,job_id,active,expires_at)
                values (:id,:worker,:hash,'REMOTION_GPU',:job,true,now()+interval '1 hour')
                """)
                .param("id",credential).param("worker",workerId)
                .param("hash",WorkloadCredentialService.sha256(token))
                .param("job",allowedJob).update();
    }

    @AfterEach
    void cleanup() {
        if(credential!=null)
            jdbc.sql("delete from mediaos_worker_credential where id=:id")
                    .param("id",credential).update();
    }

    @Test
    void workerMustPresentMatchingJobBoundCredential() throws Exception {
        mvc.perform(get("/api/v1/remotion/gpu-renders/"+allowedJob+"/work"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/remotion/gpu-renders/"+allowedJob+"/work")
                        .header("X-Worker-Id",workerId)
                        .header("X-MediaOS-Workload-Token",token))
                .andExpect(status().isOk())
                .andExpect(content().string("job"));

        mvc.perform(get("/api/v1/remotion/gpu-renders/"+UUID.randomUUID()+"/work")
                        .header("X-Worker-Id",workerId)
                        .header("X-MediaOS-Workload-Token",token))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/remotion/gpu-renders/"+allowedJob+"/work")
                        .header("X-Worker-Id","other-worker")
                        .header("X-MediaOS-Workload-Token",token))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/v1/worker/runner/heartbeat")
                        .header("X-Worker-Id",workerId)
                        .header("X-MediaOS-Workload-Token",token))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/v1/episodes")
                        .header("X-Worker-Id",workerId)
                        .header("X-MediaOS-Workload-Token",token))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/security/session")
                        .header("X-Worker-Id",workerId)
                        .header("X-MediaOS-Workload-Token",token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownWorkerPathsNeverUseUserSessionOrToken() throws Exception {
        mvc.perform(get("/api/v1/remotion/gpu-renders/"+allowedJob+"/unknown")
                        .header("X-Worker-Id",workerId)
                        .header("X-MediaOS-Workload-Token",token))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/worker/unreviewed")
                        .header("X-Worker-Id",workerId)
                        .header("X-MediaOS-Workload-Token",token))
                .andExpect(status().isForbidden());
    }
}
