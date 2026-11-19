package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.remotion.RemotionCpuWorkerController;
import com.architecturalthinking.mediaos.remotion.StorageHealthService;
import com.architecturalthinking.mediaos.workflow.Ep004Shot01DirectorRenderService;
import com.architecturalthinking.mediaos.workflow.Ep002DirectorVoiceCueService;
import com.architecturalthinking.mediaos.workflow.EpisodePackageValidator;
import com.architecturalthinking.mediaos.workflow.MediaObjectStore;
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

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Ep004WorkerVoiceAndCallbackContractTest {
    private static final UUID PROJECT=UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String SOURCE_COMMIT="26e71933a66fa36566b720e149cc1ada56b1c27b";
    private static final String AUDIO_SHA="a".repeat(64);
    private static final String NARRATION="An ordinary workday stops. Outlook sends one request.";
    private static final String WORKER="mediaos-ep004-contract-test";

    @Test
    void approvedTakeAndFinalCallbacksRequireExactEp004Lineage() throws Exception {
        String url=System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue("jdbc:postgresql://127.0.0.1:5432/media_os".equals(url)
                        || "jdbc:postgresql://localhost:5432/media_os".equals(url),
                "Run only on isolated local PostgreSQL.");
        Flyway.configure().dataSource(url,"media_os","media_os")
                .locations("classpath:db/migration").load().migrate();
        JdbcClient jdbc=JdbcClient.create(
                new DriverManagerDataSource(url,"media_os","media_os"));
        ObjectMapper mapper=new ObjectMapper();
        UUID pkg=UUID.randomUUID(),shot=UUID.randomUUID(),take=UUID.randomUUID();
        UUID render=UUID.randomUUID(),choice=UUID.randomUUID(),revision=UUID.randomUUID();
        UUID importRequest=UUID.randomUUID(), audit=UUID.randomUUID();
        String key="mediaos/media/voice/v1/EP004/SHOT01/"+UUID.randomUUID()+"/"
                +UUID.randomUUID()+".mp3";
        Map<String,Integer> cues=new LinkedHashMap<>();
        for(int i=0;i<Ep004Shot01DirectorRenderService.BEAT_IDS.size();i++)
            cues.put(Ep004Shot01DirectorRenderService.BEAT_IDS.get(i),60+i*230);
        Map<String,Object> props=new LinkedHashMap<>();
        props.put("sourceSha256",Ep004Shot01DirectorRenderService.SOURCE_SHA);
        props.put("expectedSourceCommit",SOURCE_COMMIT);
        props.put("packageId",pkg.toString());
        props.put("voiceTakeId",take.toString());
        props.put("scriptRevision",1);
        props.put("narrationSha256",EpisodePackageValidator.sha256(NARRATION));
        props.put("directorCpuApproved",true);
        props.put("previewOnly",false);
        props.put("cueFrames",cues);
        byte[] voice=new byte[1024];
        var media=mock(MediaObjectStore.class);
        when(media.downloadVerified(key,AUDIO_SHA,1024L)).thenReturn(voice);
        var ctrl=new RemotionCpuWorkerController(jdbc,mapper,
                mock(StorageHealthService.class),"test-worker-key",
                mock(Ep002DirectorVoiceCueService.class),media);
        var memory=mock(ProductionMemoryService.class);
        when(memory.hasSingleEpisode()).thenReturn(false);
        var filter=new GlobalCreationPreflightFilter(memory,mapper,jdbc);
        try {
            jdbc.sql("""
                    insert into episode_package_import(
                      id,request_id,episode_key,title,schema_version,
                      source_file_name,source_sha256,original_source_text,source_document,
                      shot_count,beat_count,director_issuer,director_subject,preflight_audit_id
                    ) values(
                      :id,:request,'EP004','EP004 test','mediaos.episode-package.v1',
                      'test.json',:sha,'locked', '{}'::jsonb,
                      1,8,'qa','qa',:audit
                    )
                    """).param("id",pkg).param("request",importRequest)
                    .param("sha",Ep004Shot01DirectorRenderService.SOURCE_SHA)
                    .param("audit",audit).update();
            jdbc.sql("""
                    insert into episode_package_shot(
                      id,package_id,shot_key,shot_index,title,original_narration,
                      original_voice_direction,original_visual_story,editorial_seconds
                    ) values (:id,:pkg,'SHOT01',1,'A Workday Stops',:narration,
                      'Speak clearly', '{}'::jsonb,67)
                    """).param("id",shot).param("pkg",pkg)
                    .param("narration",NARRATION).update();
            jdbc.sql("""
                    insert into episode_package_shot_revision(
                      id,shot_id,revision,narration,voice_direction,actor_issuer,actor_subject
                    ) values (:id,:shot,1,:narration,'Speak clearly','qa','qa')
                    """).param("id",revision).param("shot",shot)
                    .param("narration",NARRATION).update();
            jdbc.sql("""
                    insert into episode_package_voice_take(
                      id,shot_id,revision,take_number,content_type,file_name,
                      model_id,voice_id,output_format,generated_alignment,duration_seconds,
                      audio_object_key,audio_sha256,audio_size_bytes,storage_status
                    ) values (
                      :id,:shot,1,1,'audio/mpeg','approved.mp3',
                      'eleven_v4','qa-voice','mp3_44100_128',
                      '{"mediaos_delivery_mode":"ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1"}'::jsonb,
                      65,:key,:sha,1024,'OBJECT_VERIFIED'
                    )
                    """).param("id",take).param("shot",shot)
                    .param("key",key).param("sha",AUDIO_SHA).update();
            jdbc.sql("""
                    insert into episode_package_voice_choice(
                      id,shot_id,revision,take_id,actor_issuer,actor_subject
                    ) values (:id,:shot,1,:take,'qa','qa')
                    """).param("id",choice).param("shot",shot)
                    .param("take",take).update();
            jdbc.sql("""
                    insert into remotion_render(
                      id,project_id,episode_id,composition_id,render_key,engine_version,
                      input_props,render_hash,profile,status,
                      width,height,fps,duration_in_frames,worker_id
                    ) values(
                      :id,:project,null,:composition,'EP004_QA','QA',cast(:props as jsonb),
                      :hash,'REVIEW','RUNNING',1920,1080,30,2001,:worker
                    )
                    """).param("id",render).param("project",PROJECT)
                    .param("composition",Ep004Shot01DirectorRenderService.COMPOSITION)
                    .param("props",mapper.writeValueAsString(props))
                    .param("hash",render.toString()).param("worker",WORKER).update();

            var response=ctrl.selectedEp004Shot01Voice(render,
                    "test-worker-key",WORKER,SOURCE_COMMIT);
            assertEquals("audio/mpeg",response.getHeaders().getContentType().toString());
            assertArrayEquals(voice,response.getBody());
            verify(media).downloadVerified(key,AUDIO_SHA,1024L);

            assertThrows(org.springframework.web.server.ResponseStatusException.class,
                    ()->ctrl.selectedEp004Shot01Voice(render,
                            "test-worker-key",WORKER,"f".repeat(40)));
            for(String operation:new String[]{"fail","complete"}){
                String method="fail".equals(operation)?"POST":"PUT";
                String path="/api/v1/remotion/renders/worker/"+render+"/"+operation;
                var valid=new MockHttpServletRequest(method,path);
                valid.addHeader("X-Media-OS-Worker",WORKER);
                valid.addHeader("X-Media-OS-Worker-Source-Sha",SOURCE_COMMIT);
                var passed=new MockFilterChain();
                filter.doFilter(valid,new MockHttpServletResponse(),passed);
                assertSame(valid,passed.getRequest());
                assertEquals("EP004_DIRECTOR_APPROVED_SHOT01_RENDER",
                        ((Map<?,?>)valid.getAttribute("MEDIA_OS_CREATION_PREFLIGHT"))
                                .get("continuation"));

                var forged=new MockHttpServletRequest(method,path);
                forged.addHeader("X-Media-OS-Worker",WORKER);
                forged.addHeader("X-Media-OS-Worker-Source-Sha",SOURCE_COMMIT);
                forged.addHeader("X-MediaOS-Episode-Id",UUID.randomUUID().toString());
                var denied=new MockHttpServletResponse();
                var chain=new MockFilterChain();
                filter.doFilter(forged,denied,chain);
                assertNull(chain.getRequest());
                assertEquals(409,denied.getStatus());
            }
            verifyNoInteractions(memory);
        } finally {
            jdbc.sql("delete from remotion_render where id=:id")
                    .param("id",render).update();
            jdbc.sql("delete from episode_package_voice_choice where id=:id")
                    .param("id",choice).update();
            jdbc.sql("delete from episode_package_voice_take where id=:id")
                    .param("id",take).update();
            jdbc.sql("delete from episode_package_shot_revision where id=:id")
                    .param("id",revision).update();
            jdbc.sql("delete from episode_package_shot where id=:id")
                    .param("id",shot).update();
            jdbc.sql("delete from episode_package_import where id=:id")
                    .param("id",pkg).update();
        }
    }
}
