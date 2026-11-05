package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.workflow.ProductionMemoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@EnabledIfEnvironmentVariable(
        named = "CI_POSTGRES_URL",
        matches = "jdbc:postgresql://(localhost|127\\.0\\.0\\.1):5432/media_os")
class GlobalCreationFactoryCallbackIntegrationTest {
    private static final UUID PROJECT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String SOURCE = "a".repeat(40);
    private static final String DIGEST = "b".repeat(64);
    private static final String WORKER = "factory-qa-worker";

    @Test
    void factoryFinalCallbackRequiresPersistedDirectorRunAndExactWorkerOwnership() throws Exception {
        String url = System.getenv("CI_POSTGRES_URL");
        Flyway.configure().dataSource(url, "media_os", "media_os")
                .locations("classpath:db/migration").load().migrate();
        JdbcClient jdbc = JdbcClient.create(
                new DriverManagerDataSource(url, "media_os", "media_os"));
        ProductionMemoryService memory = mock(ProductionMemoryService.class);
        when(memory.hasSingleEpisode()).thenReturn(false);
        GlobalCreationPreflightFilter filter =
                new GlobalCreationPreflightFilter(memory, new ObjectMapper(), jdbc);

        UUID pkg = UUID.randomUUID();
        UUID handoff = UUID.randomUUID();
        UUID run = UUID.randomUUID();
        UUID render = UUID.randomUUID();
        UUID output = UUID.randomUUID();
        String episodeKey = "EP" + Math.abs(pkg.hashCode() % 1000000 + 1000000);
        String callback = "/api/v1/remotion/renders/worker/" + render + "/complete";
        try {
            jdbc.sql("""
                    insert into episode_package_import(
                        id,request_id,episode_key,title,schema_version,
                        source_file_name,source_sha256,original_source_text,source_document,
                        shot_count,beat_count,director_issuer,director_subject,preflight_audit_id)
                    values(:id,:request,:episode,'CI-only factory callback',
                           'mediaos.episode-package.v1','ci-only.json',:hash,'{}',
                           '{}'::jsonb,1,1,'urn:mediaos:local','ci-director',:audit)
                    """)
                    .param("id",pkg).param("request",UUID.randomUUID())
                    .param("episode",episodeKey).param("hash","a".repeat(64))
                    .param("audit",UUID.randomUUID()).update();
            jdbc.sql("""
                    insert into episode_codex_cloud_handoff(
                        id,request_id,package_id,episode_key,source_sha256,
                        readiness_fingerprint,asset_catalog_sha256,manifest_sha256,
                        manifest_json,prompt_text,shot_count,director_issuer,
                        director_subject,preflight_audit_id)
                    values(:id,:request,:package,:episode,:source,:readiness,
                           :asset,:manifest,'{}'::jsonb,'CI-only',1,
                           'urn:mediaos:local','ci-director',:audit)
                    """)
                    .param("id",handoff).param("request",UUID.randomUUID())
                    .param("package",pkg).param("episode",episodeKey)
                    .param("source","a".repeat(64)).param("readiness","b".repeat(64))
                    .param("asset","c".repeat(64)).param("manifest","d".repeat(64))
                    .param("audit",UUID.randomUUID()).update();
            jdbc.sql("""
                    insert into episode_factory_production_run(
                        id,request_id,package_id,handoff_id,episode_key,
                        original_manifest_sha256,original_readiness_fingerprint,
                        asset_catalog_sha256,verified_pr_number,verified_pr_commit,
                        verified_source_digest,code_verified_at,
                        director_issuer,director_subject,preflight_audit_id)
                    values(:id,:request,:package,:handoff,:episode,
                           :manifest,:readiness,:asset,101,:sha,:digest,now(),
                           'urn:mediaos:local','ci-director',:audit)
                    """)
                    .param("id",run).param("request",UUID.randomUUID())
                    .param("package",pkg).param("handoff",handoff)
                    .param("episode",episodeKey).param("manifest","d".repeat(64))
                    .param("readiness","b".repeat(64)).param("asset","c".repeat(64))
                    .param("sha",SOURCE).param("digest",DIGEST)
                    .param("audit",UUID.randomUUID()).update();

            String input = new ObjectMapper().writeValueAsString(Map.of(
                    "runId",run.toString(),
                    "expectedSourceCommit",SOURCE,
                    "sourceDigest",DIGEST));
            jdbc.sql("""
                    insert into remotion_render(
                        id,project_id,episode_id,composition_id,render_key,
                        engine_version,input_props,render_hash,profile,status,
                        width,height,fps,duration_in_frames,progress,worker_id)
                    values(:id,:project,null,'AT-FACTORY-MASTER','AT-FACTORY-MASTER',
                           'AT_FACTORY_TEST',cast(:input as jsonb),:hash,
                           'MASTER','RUNNING',1920,1080,30,300,5,:worker)
                    """)
                    .param("id",render).param("project",PROJECT)
                    .param("input",input).param("hash",UUID.randomUUID().toString())
                    .param("worker",WORKER).update();
            jdbc.sql("""
                    insert into episode_factory_output_plan(
                        id,run_id,kind,ordinal,start_frame,end_frame,
                        source_plan_sha256,render_id,review_state)
                    values(:id,:run,'MASTER',0,0,300,:digest,:render,'QUEUED')
                    """)
                    .param("id",output).param("run",run)
                    .param("digest",DIGEST).param("render",render).update();

            MockHttpServletRequest approved = new MockHttpServletRequest("PUT", callback);
            approved.addHeader("X-Media-OS-Worker",WORKER);
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();
            filter.doFilter(approved,response,chain);
            assertThat(response.getStatus()).isEqualTo(200);
            assertThat(chain.getRequest()).isSameAs(approved);
            assertThat(approved.getAttribute("MEDIA_OS_CREATION_PREFLIGHT")).isNotNull();
            verify(memory,never()).preflight(any(),any(),any());

            MockHttpServletRequest impostor = new MockHttpServletRequest("PUT", callback);
            impostor.addHeader("X-Media-OS-Worker","unauthorized-identity");
            MockHttpServletResponse rejected = new MockHttpServletResponse();
            filter.doFilter(impostor,rejected,new MockFilterChain());
            assertThat(rejected.getStatus()).isEqualTo(409);

            MockHttpServletRequest forgedEpisode = new MockHttpServletRequest("PUT", callback);
            forgedEpisode.addHeader("X-Media-OS-Worker",WORKER);
            forgedEpisode.addHeader("X-MediaOS-Episode-Id",PROJECT.toString());
            MockHttpServletResponse rejectedHeader = new MockHttpServletResponse();
            filter.doFilter(forgedEpisode,rejectedHeader,new MockFilterChain());
            assertThat(rejectedHeader.getStatus()).isEqualTo(409);

            jdbc.sql("update remotion_render set status='FAILED' where id=:id")
                    .param("id",render).update();
            MockHttpServletResponse completed = new MockHttpServletResponse();
            filter.doFilter(approved,completed,new MockFilterChain());
            assertThat(completed.getStatus()).isEqualTo(409);
        } finally {
            jdbc.sql("delete from episode_factory_output_plan where id=:id")
                    .param("id",output).update();
            jdbc.sql("delete from remotion_render where id=:id")
                    .param("id",render).update();
            jdbc.sql("delete from episode_factory_production_run where id=:id")
                    .param("id",run).update();
            jdbc.sql("delete from episode_codex_cloud_handoff where id=:id")
                    .param("id",handoff).update();
            jdbc.sql("delete from episode_package_import where id=:id")
                    .param("id",pkg).update();
        }
    }
}
