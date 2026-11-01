package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.workflow.ProductionMemoryService;
import com.architecturalthinking.mediaos.workflow.ProductionOverviewService;
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

class LegacySplineGpuEpisodePreflightTest {
    @Test
    void legacySplineGpuCallbackRemainsEp001ScopedAfterEp002Creation() throws Exception {
        String url = System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue("jdbc:postgresql://127.0.0.1:5432/media_os".equals(url),
                "Disposable PostgreSQL 18 only.");
        Flyway.configure().dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration").load().migrate();
        var jdbc = JdbcClient.create(new DriverManagerDataSource(url, "media_os", "media_os"));
        var source = mock(ProductionMemoryService.class);
        when(source.hasSingleEpisode()).thenReturn(false);
        UUID audit = UUID.randomUUID();
        UUID legacyJob = UUID.randomUUID();
        UUID render = UUID.randomUUID();
        UUID episode2 = UUID.randomUUID();
        UUID ep001 = ProductionOverviewService.EPISODE_ID;
        UUID project = ProductionOverviewService.PROJECT_ID;
        when(source.preflight(eq("VISUAL"), anyString(), eq(ep001)))
                .thenReturn(Map.of("auditId", audit));
        var filter = new GlobalCreationPreflightFilter(source, new ObjectMapper(), jdbc);

        try {
            jdbc.sql("""
                    insert into episode (id,project_id,episode_number,title,current_stage,status)
                    values (:id,:project,:number,'Disposable EP002 regression','QA','DRAFT')
                    """).param("id", episode2).param("project", project)
                    .param("number", "CI-" + episode2.toString().substring(0, 18)).update();
            jdbc.sql("""
                    insert into production_job
                      (id,project_id,agent_key,task_type,target,instructions,status)
                    values (:id,:project,'SPLINE_SHOT_AGENT','CREATE_RUNTIME_SHOT_V1',
                            'CI','CI legacy renderer','SUCCEEDED')
                    """).param("id", legacyJob).param("project", project).update();
            jdbc.sql("""
                    insert into spline_shot_render
                      (id,project_id,shot_id,shot_key,revision,render_hash,status,duration_ms)
                    values (:id,:project,:shot,'SHOT_CI',1,:hash,'RUNNING',1000)
                    """).param("id", render).param("project", project)
                    .param("shot", legacyJob).param("hash", render.toString()).update();

            for (String operation : new String[]{"start", "complete", "fail"}) {
                String method = "complete".equals(operation) ? "PUT" : "POST";
                var request = new MockHttpServletRequest(method,
                        "/api/v1/spline/gpu-renders/" + render + "/" + operation);
                var response = new MockHttpServletResponse();
                var chain = new MockFilterChain();
                filter.doFilter(request, response, chain);
                assertSame(request, chain.getRequest());
                assertEquals(audit.toString(), response.getHeader("X-MediaOS-Preflight"));
                assertEquals(HttpStatus.OK.value(), response.getStatus());
            }
            verify(source, times(3)).preflight(eq("VISUAL"), anyString(), eq(ep001));
            verify(source, never()).preflight(eq("VISUAL"), anyString(), eq(episode2));

            var forged = new MockHttpServletRequest("PUT",
                    "/api/v1/spline/gpu-renders/" + render + "/complete");
            forged.addHeader("X-MediaOS-Episode-Id", episode2.toString());
            var blocked = new MockHttpServletResponse();
            filter.doFilter(forged, blocked, new MockFilterChain());
            assertEquals(HttpStatus.CONFLICT.value(), blocked.getStatus());

            var missing = new MockHttpServletRequest("PUT",
                    "/api/v1/spline/gpu-renders/" + UUID.randomUUID() + "/complete");
            var denied = new MockHttpServletResponse();
            filter.doFilter(missing, denied, new MockFilterChain());
            assertEquals(HttpStatus.CONFLICT.value(), denied.getStatus());
        } finally {
            jdbc.sql("delete from spline_shot_render where id=:id")
                    .param("id", render).update();
            jdbc.sql("delete from production_job where id=:id")
                    .param("id", legacyJob).update();
            jdbc.sql("delete from episode where id=:id")
                    .param("id", episode2).update();
        }
    }
}
