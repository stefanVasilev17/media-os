package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.workflow.ProductionMemoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Ep004WorkerCallbackPreflightTest {
    private static final UUID PROJECT=UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String SOURCE="a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365";
    private static final String COMMIT="26e71933a66fa36566b720e149cc1ada56b1c27b";
    private static final String WORKER="ep004-worker-qa";

    @Test
    void onlyTheExactSourcePinnedDirectorApprovedEp004ShotCanCompleteOrFail() throws Exception {
        String url=System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue(
                "jdbc:postgresql://127.0.0.1:5432/media_os".equals(url)
                || "jdbc:postgresql://localhost:5432/media_os".equals(url),
                "Run on isolated test PostgreSQL only.");
        Flyway.configure().dataSource(url,"media_os","media_os")
                .locations("classpath:db/migration").load().migrate();
        JdbcClient jdbc=JdbcClient.create(new DriverManagerDataSource(url,"media_os","media_os"));
        var memory=mock(ProductionMemoryService.class);
        var filter=new GlobalCreationPreflightFilter(memory,new ObjectMapper(),jdbc);
        for(String composition:new String[]{
                "EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL",
                "EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL"}) {
            UUID renderId=UUID.randomUUID();
            String shotKey=composition.contains("SHOT02")?"SHOT02":"SHOT01";
            String props=new ObjectMapper().writeValueAsString(Map.of(
                    "expectedSourceCommit",COMMIT,
                    "sourceSha256",SOURCE,
                    "directorCpuApproved",true,
                    "previewOnly",false,
                    "voiceTakeId",UUID.randomUUID().toString(),
                    "packageId",UUID.randomUUID().toString(),
                    "renderRequestId",UUID.randomUUID().toString(),
                    "shotKey",shotKey,
                    "verifiedCues",java.util.List.of(
                            Map.of("beatId",shotKey+"_P01_B01"),
                            Map.of("beatId",shotKey+"_P01_B02"))));
            try {
                jdbc.sql("""
                        insert into remotion_render(
                          id,project_id,episode_id,composition_id,render_key,engine_version,
                          input_props,render_hash,profile,status,width,height,fps,duration_in_frames,worker_id
                        ) values (
                          :id,:project,null,:composition,:renderKey,'QA',cast(:props as jsonb),
                          :hash,'REVIEW','RUNNING',1920,1080,30,2124,:worker
                        )
                        """)
                        .param("id",renderId).param("project",PROJECT)
                        .param("composition",composition).param("renderKey",shotKey+"_REVIEW")
                        .param("props",props).param("hash",renderId.toString())
                        .param("worker",WORKER).update();
                for(String operation:new String[]{"complete","fail"}) {
                    String method="complete".equals(operation)?"PUT":"POST";
                    MockHttpServletRequest request=new MockHttpServletRequest(method,
                            "/api/v1/remotion/renders/worker/"+renderId+"/"+operation);
                    request.addHeader("X-Media-OS-Worker",WORKER);
                    request.addHeader("X-Media-OS-Worker-Source-Sha",COMMIT);
                    MockHttpServletResponse response=new MockHttpServletResponse();
                    MockFilterChain chain=new MockFilterChain();
                    filter.doFilter(request,response,chain);
                    assertSame(request,chain.getRequest());
                    assertEquals(200,response.getStatus());
                    assertEquals(Map.of("continuation",
                                    "EP004_DIRECTOR_APPROVED_SOURCE_PINNED_SHOT_RENDER"),
                            request.getAttribute("MEDIA_OS_CREATION_PREFLIGHT"));
                }
                for(String incorrect:new String[]{"worker","commit","episode"}) {
                    MockHttpServletRequest request=new MockHttpServletRequest("POST",
                            "/api/v1/remotion/renders/worker/"+renderId+"/fail");
                    request.addHeader("X-Media-OS-Worker",
                            "worker".equals(incorrect)?"another-worker":WORKER);
                    request.addHeader("X-Media-OS-Worker-Source-Sha",
                            "commit".equals(incorrect)?"0".repeat(40):COMMIT);
                    if("episode".equals(incorrect))
                        request.addHeader("X-MediaOS-Episode-Id",UUID.randomUUID().toString());
                    MockHttpServletResponse response=new MockHttpServletResponse();
                    MockFilterChain chain=new MockFilterChain();
                    filter.doFilter(request,response,chain);
                    assertEquals(409,response.getStatus());
                    assertNull(chain.getRequest());
                }
                if("SHOT02".equals(shotKey)) {
                    jdbc.sql("""
                            update remotion_render
                               set input_props=jsonb_set(input_props,'{verifiedCues}','[]'::jsonb)
                             where id=:id
                            """).param("id",renderId).update();
                    MockHttpServletRequest denied=new MockHttpServletRequest("PUT",
                            "/api/v1/remotion/renders/worker/"+renderId+"/complete");
                    denied.addHeader("X-Media-OS-Worker",WORKER);
                    denied.addHeader("X-Media-OS-Worker-Source-Sha",COMMIT);
                    MockHttpServletResponse response=new MockHttpServletResponse();
                    MockFilterChain chain=new MockFilterChain();
                    filter.doFilter(denied,response,chain);
                    assertEquals(409,response.getStatus());
                    assertNull(chain.getRequest());
                }
            }finally{
                jdbc.sql("delete from remotion_render where id=:id")
                        .param("id",renderId).update();
            }
        }
        verifyNoInteractions(memory);
    }
}
