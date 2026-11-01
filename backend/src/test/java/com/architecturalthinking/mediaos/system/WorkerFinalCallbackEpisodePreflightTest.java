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
        Assumptions.assumeTrue("jdbc:postgresql://127.0.0.1:5432/media_os".equals(url),
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
            verify(memory, times(2)).preflight(eq("VISUAL"), anyString(), eq(second));
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
