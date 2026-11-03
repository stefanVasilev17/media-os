package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.workflow.ProductionMemoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class WorkerFinalCallbackEpisodePreflightTest {
    private static final UUID PROJECT = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Test
    void finalCallbacksResolveTheirOwnEpisodeWithMultipleEpisodeWorkspaces() throws Exception {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue("jdbc:postgresql://127.0.0.1:5432/media_os".equals(url)
                        || "jdbc:postgresql://localhost:5432/media_os".equals(url),
                "Run only on isolated local PostgreSQL.");
        Flyway.configure().dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration").load().migrate();
        JdbcClient jdbc = JdbcClient.create(
                new DriverManagerDataSource(url, "media_os", "media_os"));
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();
        UUID render = UUID.randomUUID();
        UUID audit = UUID.randomUUID();
        var memory = mock(ProductionMemoryService.class);
        when(memory.hasSingleEpisode()).thenReturn(false);
        when(memory.preflight(eq("VISUAL"), anyString(), eq(second)))
                .thenReturn(Map.of("auditId", audit));
        var filter = new GlobalCreationPreflightFilter(memory, new ObjectMapper(), jdbc);

        try {
            createEpisode(jdbc, first);
            createEpisode(jdbc, second);
            jdbc.sql("""
                    insert into remotion_render (
                        id,project_id,episode_id,composition_id,render_key,
                        engine_version,input_props,render_hash,profile,status,
                        width,height,fps,duration_in_frames
                    ) values (
                        :id,:project,:episode,'CI-WORKER-PREFLIGHT','CI-WORKER',
                        'CI','{}'::jsonb,:hash,'REVIEW','RUNNING',1920,1080,30,150
                    )
                    """)
                    .param("id", render).param("project", PROJECT)
                    .param("episode", second).param("hash", render.toString())
                    .update();

            for (String operation : new String[]{"complete", "fail"}) {
                String method = "complete".equals(operation) ? "PUT" : "POST";
                var request = new MockHttpServletRequest(method,
                        "/api/v1/remotion/renders/worker/" + render + "/" + operation);
                var response = new MockHttpServletResponse();
                var chain = new MockFilterChain();
                filter.doFilter(request, response, chain);
                assertSame(request, chain.getRequest());
                assertEquals(audit.toString(), response.getHeader("X-MediaOS-Preflight"));
                assertEquals(200, response.getStatus());
            }
            for (String operation : new String[]{"start", "complete", "fail"}) {
                String method = "complete".equals(operation) ? "PUT" : "POST";
                var request = new MockHttpServletRequest(method,
                        "/api/v1/remotion/gpu-renders/" + render + "/" + operation);
                var response = new MockHttpServletResponse();
                var chain = new MockFilterChain();
                filter.doFilter(request, response, chain);
                assertSame(request, chain.getRequest());
                assertEquals(audit.toString(), response.getHeader("X-MediaOS-Preflight"));
                assertEquals(200, response.getStatus());
            }
            verify(memory, times(5)).preflight(eq("VISUAL"), anyString(), eq(second));
            verify(memory, never()).preflight(eq("VISUAL"), anyString(), eq(first));

            var forged = new MockHttpServletRequest("PUT",
                    "/api/v1/remotion/renders/worker/" + render + "/complete");
            forged.addHeader("X-MediaOS-Episode-Id", first.toString());
            var rejected = new MockHttpServletResponse();
            filter.doFilter(forged, rejected, new MockFilterChain());
            assertEquals(HttpStatus.CONFLICT.value(), rejected.getStatus());

            var nonexistent = new MockHttpServletRequest("PUT",
                    "/api/v1/remotion/renders/worker/" + UUID.randomUUID() + "/complete");
            var missing = new MockHttpServletResponse();
            filter.doFilter(nonexistent, missing, new MockFilterChain());
            assertEquals(HttpStatus.CONFLICT.value(), missing.getStatus());
        } finally {
            jdbc.sql("delete from remotion_render where id=:id").param("id", render).update();
            jdbc.sql("delete from episode where id in (:a,:b)")
                    .param("a", first).param("b", second).update();
        }
    }

    @Test
    void ep002CallbackUsesVerifiedDirectorRenderLineageWithoutInventingAnEpisode() throws Exception {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue("jdbc:postgresql://127.0.0.1:5432/media_os".equals(url)
                        || "jdbc:postgresql://localhost:5432/media_os".equals(url),
                "Run only on isolated local PostgreSQL.");
        Flyway.configure().dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration").load().migrate();
        JdbcClient jdbc = JdbcClient.create(
                new DriverManagerDataSource(url, "media_os", "media_os"));
        UUID script = UUID.randomUUID();
        UUID take = UUID.randomUUID();
        UUID render = UUID.randomUUID();
        UUID lineage = UUID.randomUUID();
        int revision = 900000 + java.util.concurrent.ThreadLocalRandom.current().nextInt(10000);
        String voiceHash = "a".repeat(64);
        String dependency = "b".repeat(64);
        String visual = "c".repeat(40);
        String worker = "ep002-verified-worker";
        var memory = mock(ProductionMemoryService.class);
        var filter = new GlobalCreationPreflightFilter(memory, new ObjectMapper(), jdbc);

        try {
            jdbc.sql("""
                    insert into ep002_creative_script_revision
                    (id,shot_key,revision,narration,voice_direction,actor_issuer,actor_subject)
                    values (:id,'SHOT01',:revision,'QA scene narration','','qa','qa')
                    """).param("id", script).param("revision", revision).update();
            jdbc.sql("""
                    insert into ep002_creative_voice_take
                    (id,shot_key,revision,take_number,narration_sha256,audio,content_type,model_id,voice_id)
                    values (:id,'SHOT01',:revision,900000,:hash,:audio,'audio/mpeg','qa-model','qa-voice')
                    """).param("id", take).param("revision", revision)
                    .param("hash", voiceHash).param("audio", new byte[1024]).update();
            String props = new ObjectMapper().writeValueAsString(Map.of(
                    "shotKey", "EP002_SHOT01",
                    "voiceTakeId", take.toString(),
                    "scriptRevision", revision,
                    "dependencySha256", dependency,
                    "visualSourceSha", visual,
                    "contractId", "qa-contract"));
            jdbc.sql("""
                    insert into remotion_render
                    (id,project_id,episode_id,composition_id,render_key,engine_version,
                     input_props,render_hash,profile,status,width,height,fps,duration_in_frames,worker_id)
                    values (:id,:project,null,'EP002-SHOT01-DRAFT','EP002_SHOT01_DRAFT','QA',
                            cast(:props as jsonb),:hash,'FAST_PREVIEW','RUNNING',
                            1280,720,30,900,:worker)
                    """).param("id", render).param("project", PROJECT)
                    .param("props", props).param("hash", render.toString())
                    .param("worker", worker).update();
            jdbc.sql("""
                    insert into episode_shot_render_lineage
                    (id,episode_key,shot_key,script_revision,script_sha256,preferred_take_id,
                     visual_source_git_blob_sha,dependency_sha256,remotion_render_id,
                     remotion_commit_sha,render_status)
                    values (:id,'EP002','SHOT01',:revision,:hash,:take,:visual,:dependency,
                            :render,'QA','QUEUED')
                    """).param("id", lineage).param("revision", revision).param("hash", voiceHash)
                    .param("take", take).param("visual", visual)
                    .param("dependency", dependency).param("render", render).update();

            for (String action : new String[]{"fail", "complete"}) {
                var request = new MockHttpServletRequest(
                        "fail".equals(action) ? "POST" : "PUT",
                        "/api/v1/remotion/renders/worker/" + render + "/" + action);
                request.addHeader("X-Media-OS-Worker", worker);
                var response = new MockHttpServletResponse();
                var chain = new MockFilterChain();
                filter.doFilter(request, response, chain);
                assertSame(request, chain.getRequest());
                assertEquals(200, response.getStatus());
            }
            verifyNoInteractions(memory);

            var wrongWorker = new MockHttpServletRequest("POST",
                    "/api/v1/remotion/renders/worker/" + render + "/fail");
            wrongWorker.addHeader("X-Media-OS-Worker", "some-other-worker");
            var rejected = new MockHttpServletResponse();
            filter.doFilter(wrongWorker, rejected, new MockFilterChain());
            assertEquals(409, rejected.getStatus());

            var forgedEpisode = new MockHttpServletRequest("POST",
                    "/api/v1/remotion/renders/worker/" + render + "/fail");
            forgedEpisode.addHeader("X-Media-OS-Worker", worker);
            forgedEpisode.addHeader("X-MediaOS-Episode-Id", UUID.randomUUID().toString());
            var forged = new MockHttpServletResponse();
            filter.doFilter(forgedEpisode, forged, new MockFilterChain());
            assertEquals(409, forged.getStatus());

            jdbc.sql("delete from episode_shot_render_lineage where id=:id")
                    .param("id", lineage).update();
            var unlinked = new MockHttpServletRequest("POST",
                    "/api/v1/remotion/renders/worker/" + render + "/fail");
            unlinked.addHeader("X-Media-OS-Worker", worker);
            var unlinkedResponse = new MockHttpServletResponse();
            filter.doFilter(unlinked, unlinkedResponse, new MockFilterChain());
            assertEquals(409, unlinkedResponse.getStatus());
        } finally {
            jdbc.sql("delete from episode_shot_render_lineage where id=:id")
                    .param("id", lineage).update();
            jdbc.sql("delete from remotion_render where id=:id").param("id", render).update();
            jdbc.sql("delete from ep002_creative_voice_take where id=:id").param("id", take).update();
            jdbc.sql("delete from ep002_creative_script_revision where id=:id").param("id", script).update();
        }
    }

    private static void createEpisode(JdbcClient jdbc, UUID id) {
        jdbc.sql("""
                insert into episode(id,project_id,episode_number,title,current_stage,status)
                values (:id,:project,:number,'Worker callback QA','QA','DRAFT')
                """)
                .param("id", id).param("project", PROJECT)
                .param("number", "CI-" + id.toString().substring(0, 18))
                .update();
    }
}
