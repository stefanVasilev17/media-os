package com.architecturalthinking.mediaos.system;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "CI_POSTGRES_URL", matches = ".+")
class CpuWorkerCredentialLeaseControllerTest {
    @Test
    void bootstrapIsAuditedLimitedAndScopedWithoutExposingOtherWorkerRoutes() {
        String url = System.getenv("CI_POSTGRES_URL");
        Flyway.configure().dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration").load().migrate();
        var db = new DriverManagerDataSource(url, "media_os", "media_os");
        JdbcClient jdbc = JdbcClient.create(db);
        var tx = new TransactionTemplate(new DataSourceTransactionManager(db));
        String worker = "ci-remotion-" + UUID.randomUUID();
        String key = "K".repeat(64);
        var controller = new CpuWorkerCredentialLeaseController(jdbc, key, worker, true);
        var validator = new WorkloadCredentialService(jdbc);

        try {
            assertThrows(IllegalStateException.class,
                    () -> new CpuWorkerCredentialLeaseController(jdbc, key, worker, false));
            assertThrows(IllegalStateException.class,
                    () -> new CpuWorkerCredentialLeaseController(jdbc, "short", worker, true));
            assertThrows(ResponseStatusException.class,
                    () -> tx.execute(status -> controller.issue("wrong", worker, worker)));
            assertThrows(ResponseStatusException.class,
                    () -> tx.execute(status -> controller.issue(key, "other-worker", worker)));
            assertThrows(ResponseStatusException.class,
                    () -> tx.execute(status -> controller.issue(key, worker, "other-worker")));

            var first = tx.execute(status -> controller.issue(key, worker, worker));
            assertNotNull(first);
            assertNotNull(first.getBody());
            String issued = first.getBody().token();
            assertEquals(64, issued.length());
            assertNotNull(validator.verify(issued, worker, "REMOTION_CPU", null));
            assertNull(validator.verify(issued, worker, "RUNNER", null));
            assertNull(validator.verify(issued, "other-worker", "REMOTION_CPU", null));
            assertTrue(first.getHeaders().getCacheControl().contains("no-store"));

            var second = tx.execute(status -> controller.issue(key, worker, worker));
            assertNotEquals(issued, second.getBody().token());
            var third = tx.execute(status -> controller.issue(key, worker, worker));
            assertNotEquals(issued, third.getBody().token());
            assertThrows(ResponseStatusException.class,
                    () -> tx.execute(status -> controller.issue(key, worker, worker)));

            Integer audited = jdbc.sql("""
                    select count(*) from mediaos_worker_credential_audit a
                    join mediaos_worker_credential c on c.id=a.credential_id
                    where c.worker_id=:worker and a.operation='ISSUED'
                      and a.change_ticket='CPU_AUTO_RENEWAL'
                    """).param("worker", worker).query(Integer.class).single();
            assertEquals(3, audited);
        } finally {
            jdbc.sql("""
                    delete from mediaos_worker_credential_audit
                    where credential_id in (
                        select id from mediaos_worker_credential where worker_id=:worker
                    )
                    """).param("worker", worker).update();
            jdbc.sql("delete from mediaos_worker_credential where worker_id=:worker")
                    .param("worker", worker).update();
        }
    }
}
