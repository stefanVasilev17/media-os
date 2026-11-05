package com.architecturalthinking.mediaos.remotion;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RemotionCpuWorkerRecoveryTest {
    private static final UUID PROJECT =
            UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Test
    void expiredEp002PreviewBecomesTerminalInsteadOfBeingQueuedForever() {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue("jdbc:postgresql://localhost:5432/media_os".equals(url)
                        || "jdbc:postgresql://127.0.0.1:5432/media_os".equals(url),
                "Run only on isolated local PostgreSQL.");
        Flyway.configure().dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration").load().migrate();
        JdbcClient jdbc = JdbcClient.create(
                new DriverManagerDataSource(url, "media_os", "media_os"));
        UUID expired = UUID.randomUUID();
        UUID succeeded = UUID.randomUUID();
        String originalWorker = "qa-worker-original";

        try {
            jdbc.sql("""
                    insert into remotion_render
                      (id,project_id,episode_id,composition_id,render_key,engine_version,
                       input_props,render_hash,profile,status,width,height,fps,duration_in_frames,
                       worker_id,updated_at)
                    values (:id,:project,null,'EP002-SHOT01-DRAFT','EP002_SHOT01_DRAFT','QA',
                            '{}'::jsonb,:hash,'FAST_PREVIEW','RUNNING',1280,720,30,600,
                            :worker,now()-interval '5 minutes')
                    """)
                    .param("id", expired).param("project", PROJECT)
                    .param("hash", expired.toString()).param("worker", originalWorker).update();
            jdbc.sql("""
                    insert into remotion_render
                      (id,project_id,episode_id,composition_id,render_key,engine_version,
                       input_props,render_hash,profile,status,width,height,fps,duration_in_frames,
                       worker_id,updated_at)
                    values (:id,:project,null,'EP002-SHOT01-DRAFT','EP002_SHOT01_DRAFT','QA',
                            '{}'::jsonb,:hash,'FAST_PREVIEW','SUCCEEDED',1280,720,30,600,
                            :worker,now()-interval '5 minutes')
                    """)
                    .param("id", succeeded).param("project", PROJECT)
                    .param("hash", succeeded.toString()).param("worker", originalWorker).update();

            var controller = new RemotionCpuWorkerController(
                    jdbc, new ObjectMapper(), mock(StorageHealthService.class), "qa-worker-key");
            controller.claim("qa-worker-key", "qa-worker-new", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

            String status = jdbc.sql("select status from remotion_render where id=:id")
                    .param("id", expired).query(String.class).single();
            String error = jdbc.sql("select error from remotion_render where id=:id")
                    .param("id", expired).query(String.class).single();
            assertEquals("FAILED", status);
            assertTrue(error.contains("No automatic retry"));

            assertThrows(ResponseStatusException.class, () -> controller.fail(
                    expired, "qa-worker-key", originalWorker,
                    new RemotionCpuWorkerController.FailureRequest("late callback")));
            assertThrows(ResponseStatusException.class, () -> controller.fail(
                    succeeded, "qa-worker-key", originalWorker,
                    new RemotionCpuWorkerController.FailureRequest("do not corrupt succeeded")));
            assertEquals("SUCCEEDED", jdbc.sql("select status from remotion_render where id=:id")
                    .param("id", succeeded).query(String.class).single());
        } finally {
            jdbc.sql("delete from remotion_render where id=:id")
                    .param("id", expired).update();
            jdbc.sql("delete from remotion_render where id=:id")
                    .param("id", succeeded).update();
        }
    }
}
