package com.architecturalthinking.mediaos.system;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class WorkloadCredentialIntegrationTest {
    @Test
    void tokenIsScopedToWorkerPurposeRenderAndExpiry() {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url != null && !url.isBlank(), "Requires temporary PostgreSQL");
        Flyway.configure().dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration").load().migrate();
        JdbcClient jdbc = JdbcClient.create(new DriverManagerDataSource(url,"media_os","media_os"));
        WorkloadCredentialService service = new WorkloadCredentialService(jdbc);
        String token = "abcdefghijklmnopABCDEFGHIJKLMNOP0123456789-_X";
        String otherToken = "abcdefghijklmnopABCDEFGHIJKLMNOP0123456789-_Y";
        UUID id = UUID.randomUUID();
        UUID render = UUID.randomUUID();
        UUID wrong = UUID.randomUUID();
        jdbc.sql("""
                insert into mediaos_worker_credential
                (id, worker_id, token_hash, scope, job_id, active, expires_at)
                values (:id, 'gpu-runner-qa', :hash, 'REMOTION_GPU', :job, true,
                        now() + interval '30 minutes')
                """).param("id", id)
                .param("hash", WorkloadCredentialService.sha256(token))
                .param("job", render).update();
        try {
            assertNotNull(service.verify(token,"gpu-runner-qa","REMOTION_GPU",render));
            assertNull(service.verify(otherToken,"gpu-runner-qa","REMOTION_GPU",render));
            assertNull(service.verify(token,"another-runner","REMOTION_GPU",render));
            assertNull(service.verify(token,"gpu-runner-qa","SPLINE_GPU",render));
            assertNull(service.verify(token,"gpu-runner-qa","REMOTION_GPU",wrong));
            assertNull(service.verify(token,"gpu-runner-qa","REMOTION_GPU",null));
            assertNull(service.verify("short","gpu-runner-qa","REMOTION_GPU",render));
            jdbc.sql("update mediaos_worker_credential set active=false where id=:id")
                    .param("id", id).update();
            assertNull(service.verify(token,"gpu-runner-qa","REMOTION_GPU",render));
            jdbc.sql("""
                    update mediaos_worker_credential
                    set active=true, expires_at=now() - interval '1 minute'
                    where id=:id
                    """).param("id", id).update();
            assertNull(service.verify(token,"gpu-runner-qa","REMOTION_GPU",render));
        } finally {
            jdbc.sql("delete from mediaos_worker_credential where id=:id")
                    .param("id", id).update();
        }
    }

    @Test
    void gpuTokensRequireJobBindingAtDatabaseLayer() {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url != null && !url.isBlank(), "Requires temporary PostgreSQL");
        var jdbc=JdbcClient.create(new DriverManagerDataSource(url,"media_os","media_os"));
        UUID id=UUID.randomUUID();
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () ->
                jdbc.sql("""
                        insert into mediaos_worker_credential
                        (id, worker_id, token_hash, scope, job_id, active, expires_at)
                        values (:id, 'gpu-test', :hash, 'SPLINE_GPU', null, true, now() + interval '1 hour')
                        """).param("id",id).param("hash",WorkloadCredentialService.sha256(
                        "abcdefghijklmnopABCDEFGHIJKLMNOP0123456789-_Z")).update());
    }

    @Test
    void routeClassificationIsSpecificAndRejectsUnknownPaths() {
        UUID job=UUID.randomUUID();
        assertEquals("SPLINE_SNAPSHOT", WorkloadRoute.resolve(
                "/api/v1/worker/spline/snapshot/"+job).scope());
        assertEquals("SPLINE_SHOT", WorkloadRoute.resolve(
                "/api/v1/worker/spline-shot/jobs/next").scope());
        assertEquals("SPLINE", WorkloadRoute.resolve(
                "/api/v1/worker/spline/jobs/next").scope());
        assertEquals("RUNNER", WorkloadRoute.resolve(
                "/api/v1/worker/runner/heartbeat").scope());
        assertEquals("REMOTION_CPU", WorkloadRoute.resolve(
                "/api/v1/remotion/renders/worker/claim").scope());
        assertEquals(job,WorkloadRoute.resolve(
                "/api/v1/remotion/gpu-renders/"+job+"/work").jobId());
        assertEquals(job,WorkloadRoute.resolve(
                "/api/v1/spline/gpu-renders/"+job+"/complete").jobId());
        assertNull(WorkloadRoute.resolve("/api/v1/remotion/gpu-renders/bad/work"));
        assertNull(WorkloadRoute.resolve("/api/v1/remotion/gpu-renders/"+job+"/unknown"));
        assertNull(WorkloadRoute.resolve("/api/v1/worker/unreviewed"));
    }
}
