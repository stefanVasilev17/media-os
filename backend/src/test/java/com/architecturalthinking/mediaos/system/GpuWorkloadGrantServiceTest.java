package com.architecturalthinking.mediaos.system;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.time.Duration;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class GpuWorkloadGrantServiceTest {
    @Test
    void createsShortLivedRenderBoundCredentialAndRevokesOnDemand() {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url != null && !url.isBlank(), "Disposable PostgreSQL required");
        Flyway.configure().dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration").load().migrate();
        JdbcClient jdbc = JdbcClient.create(new DriverManagerDataSource(url,"media_os","media_os"));
        GpuWorkloadGrantService grants = new GpuWorkloadGrantService(jdbc);
        WorkloadCredentialService credentials = new WorkloadCredentialService(jdbc);
        UUID renderId = UUID.randomUUID();
        GpuWorkloadGrantService.Grant grant = grants.issue(
                renderId, "REMOTION_GPU", Duration.ofMinutes(40));
        try {
            assertEquals("runpod-gpu:" + renderId, grant.workerId());
            assertEquals(43, grant.token().length());
            assertNotNull(credentials.verify(grant.token(), grant.workerId(),
                    "REMOTION_GPU", renderId));
            assertNull(credentials.verify(grant.token(), grant.workerId(),
                    "REMOTION_GPU", UUID.randomUUID()));
            assertNull(credentials.verify(grant.token(), grant.workerId(),
                    "SPLINE_GPU", renderId));
            assertNotEquals(grant.token(), jdbc.sql("""
                    select token_hash from mediaos_worker_credential where id=:id
                    """).param("id", grant.id()).query(String.class).single());
            assertEquals(1, countAudit(jdbc, grant.id(), "ISSUED"));
            grants.revoke(grant.id());
            assertNull(credentials.verify(grant.token(), grant.workerId(),
                    "REMOTION_GPU", renderId));
            assertEquals(1, countAudit(jdbc, grant.id(), "REVOKED"));
        } finally {
            jdbc.sql("delete from mediaos_worker_credential_audit where credential_id=:id")
                    .param("id", grant.id()).update();
            jdbc.sql("delete from mediaos_worker_credential where id=:id")
                    .param("id", grant.id()).update();
        }
    }

    @Test
    void rejectsNonGpuScopeAndUnboundedLifetimeBeforeWriting() {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url != null && !url.isBlank(), "Disposable PostgreSQL required");
        JdbcClient jdbc = JdbcClient.create(new DriverManagerDataSource(url,"media_os","media_os"));
        GpuWorkloadGrantService service = new GpuWorkloadGrantService(jdbc);
        assertThrows(IllegalArgumentException.class, () ->
                service.issue(UUID.randomUUID(), "RUNNER", Duration.ofMinutes(20)));
        assertThrows(IllegalArgumentException.class, () ->
                service.issue(UUID.randomUUID(), "SPLINE_GPU", Duration.ofHours(3)));
        assertThrows(IllegalArgumentException.class, () ->
                service.issue(null, "REMOTION_GPU", Duration.ofMinutes(20)));
    }

    private int countAudit(JdbcClient jdbc, UUID id, String operation) {
        return jdbc.sql("""
                select count(*) from mediaos_worker_credential_audit
                where credential_id=:id and operation=:operation
                """).param("id", id).param("operation", operation)
                .query(Integer.class).single();
    }
}
