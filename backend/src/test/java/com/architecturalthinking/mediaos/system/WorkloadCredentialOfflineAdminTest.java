package com.architecturalthinking.mediaos.system;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class WorkloadCredentialOfflineAdminTest {
    @Test
    void issueRevokeAndRotateCredentialsAreTransactionalAndAudited() {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(url!=null&&!url.isBlank(),"Requires disposable PostgreSQL");
        Flyway.configure().dataSource(url,"media_os","media_os")
                .locations("classpath:db/migration").load().migrate();

        var datasource=new DriverManagerDataSource(url,"media_os","media_os");
        var jdbc=JdbcClient.create(datasource);
        var admin=new WorkloadCredentialOfflineAdmin(jdbc);
        var credentials=new WorkloadCredentialService(jdbc);
        var tx=new TransactionTemplate(new DataSourceTransactionManager(datasource));

        String first="abcdefghijklmnopABCDEFGHIJKLMNOP0123456789-_X";
        String second="abcdefghijklmnopABCDEFGHIJKLMNOP0123456789-_Y";
        UUID job=UUID.randomUUID();
        UUID original=null;
        UUID rotated=null;
        try {
            assertThrows(IllegalStateException.class, () ->
                    admin.issue("ci-gpu","REMOTION_GPU",job,first,
                            Duration.ofMinutes(30),"CHANGE_CI_3001"));
            assertThrows(IllegalArgumentException.class, () ->
                    tx.execute(status -> admin.issue("ci-gpu","REMOTION_GPU",null,first,
                            Duration.ofMinutes(30),"CHANGE_CI_3001")));
            assertThrows(IllegalArgumentException.class, () ->
                    tx.execute(status -> admin.issue("ci-gpu","REMOTION_GPU",job,first,
                            Duration.ofDays(20),"CHANGE_CI_3001")));

            original=tx.execute(status -> admin.issue("ci-gpu","REMOTION_GPU",job,first,
                    Duration.ofMinutes(30),"CHANGE_CI_3001"));
            assertNotNull(original);
            assertNotNull(credentials.verify(first,"ci-gpu","REMOTION_GPU",job));
            assertNull(credentials.verify(first,"ci-gpu","REMOTION_GPU",UUID.randomUUID()));
            assertEquals(1,auditCount(jdbc,original,"ISSUED"));
            UUID old=original;

            rotated=tx.execute(status -> admin.issue("ci-gpu","REMOTION_GPU",job,second,
                    Duration.ofMinutes(45),"CHANGE_CI_3002"));
            assertNotNull(credentials.verify(second,"ci-gpu","REMOTION_GPU",job));
            UUID latest=rotated;

            assertThrows(IllegalArgumentException.class, () ->
                    tx.executeWithoutResult(status ->
                            admin.revoke(UUID.randomUUID(),"CHANGE_CI_3003")));
            assertEquals(0,auditCount(jdbc,latest,"REVOKED"));
            tx.executeWithoutResult(status -> admin.revoke(old,"CHANGE_CI_3004"));
            assertNull(credentials.verify(first,"ci-gpu","REMOTION_GPU",job));
            assertNotNull(credentials.verify(second,"ci-gpu","REMOTION_GPU",job));
            assertEquals(1,auditCount(jdbc,old,"REVOKED"));

            tx.executeWithoutResult(status -> admin.revoke(latest,"CHANGE_CI_3005"));
            assertNull(credentials.verify(second,"ci-gpu","REMOTION_GPU",job));
            assertEquals(1,auditCount(jdbc,latest,"REVOKED"));
        } finally {
            for (UUID id : new UUID[]{original,rotated}) {
                if(id!=null) {
                    jdbc.sql("delete from mediaos_worker_credential_audit where credential_id=:id")
                            .param("id",id).update();
                    jdbc.sql("delete from mediaos_worker_credential where id=:id")
                            .param("id",id).update();
                }
            }
        }
    }

    private int auditCount(JdbcClient jdbc,UUID id,String operation) {
        return jdbc.sql("""
                select count(*) from mediaos_worker_credential_audit
                where credential_id=:id and operation=:operation
                """).param("id",id).param("operation",operation)
                .query(Integer.class).single();
    }
}
