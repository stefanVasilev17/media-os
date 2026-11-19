package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.workflow.MediaObjectStore;
import com.architecturalthinking.mediaos.workflow.ProductionMemoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.OutputStream;
import java.lang.reflect.ParameterizedType;
import java.util.Arrays;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RemotionPrivateVideoStreamingTest {
    private static final UUID PROJECT=UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String SHA="b".repeat(64);

    @Test
    void theControllerMustDeclareStreamingResponseBodyForMvc() throws Exception {
        var method=RemotionRenderController.class.getMethod(
                "video",UUID.class,String.class);
        assertTrue(method.getGenericReturnType() instanceof ParameterizedType);
        ParameterizedType result=(ParameterizedType)method.getGenericReturnType();
        assertEquals(org.springframework.http.ResponseEntity.class,result.getRawType());
        assertEquals(StreamingResponseBody.class,result.getActualTypeArguments()[0],
                "Wildcard ResponseEntity<?> bypasses the Spring streaming return-value handler.");
    }

    @Test
    void verifiedPrivateS3Mp4SupportsFullAndRangeStreamingWithoutBytea() throws Exception {
        String url=System.getenv("CI_POSTGRES_URL");
        Assumptions.assumeTrue("jdbc:postgresql://127.0.0.1:5432/media_os".equals(url)
                || "jdbc:postgresql://localhost:5432/media_os".equals(url),
                "Run only on isolated local PostgreSQL.");
        Flyway.configure().dataSource(url,"media_os","media_os")
                .locations("classpath:db/migration").load().migrate();
        JdbcClient jdbc=JdbcClient.create(
                new DriverManagerDataSource(url,"media_os","media_os"));
        UUID id=UUID.randomUUID();
        String key="mediaos/media/video/v1/"+id+".mp4";
        byte[] sample=new byte[2048];
        sample[4]='f';sample[5]='t';sample[6]='y';sample[7]='p';
        for(int i=9;i<sample.length;i++)sample[i]=(byte)(i%253);
        MediaObjectStore objects=mock(MediaObjectStore.class);
        doAnswer(invocation->{
            long start=invocation.getArgument(3),end=invocation.getArgument(4);
            OutputStream stream=invocation.getArgument(5);
            stream.write(sample,(int)start,(int)(end-start+1));
            return null;
        }).when(objects).streamVideoRange(eq(key),eq(SHA),
                eq(2048L),anyLong(),anyLong(),any(OutputStream.class));
        var controller=new RemotionRenderController(jdbc,new ObjectMapper(),
                mock(ProductionMemoryService.class),
                mock(StorageHealthService.class),objects);
        MockMvc mvc=MockMvcBuilders.standaloneSetup(controller).build();
        try {
            jdbc.sql("""
                insert into remotion_render(
                  id,project_id,episode_id,composition_id,render_key,engine_version,
                  input_props,render_hash,profile,status,width,height,fps,duration_in_frames,
                  video_object_key,video_sha256,video_object_bytes,
                  video_storage_verified_at,video_retention_class,video_data,size_bytes
                ) values (
                  :id,:project,null,'EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL',
                  'EP004_STREAM_QA','QA','{}'::jsonb,:hash,'REVIEW','SUCCEEDED',
                  1920,1080,30,2001,:key,:sha,2048,now(),
                  'DIRECTOR_REVIEW_PROTECTED',null,2048
                )
                """)
                .param("id",id).param("project",PROJECT)
                .param("hash",id.toString()).param("key",key).param("sha",SHA)
                .update();

            String path="/api/v1/remotion/renders/"+id+"/video";
            MvcResult full=mvc.perform(get(path))
                    .andExpect(request().asyncStarted()).andReturn();
            mvc.perform(asyncDispatch(full))
                    .andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.ACCEPT_RANGES,"bytes"))
                    .andExpect(header().string(HttpHeaders.CONTENT_LENGTH,"2048"))
                    .andExpect(content().bytes(sample));
            verify(objects,atLeastOnce()).verifyVideoManifest(key,SHA,2048L);

            MvcResult ranged=mvc.perform(get(path).header(HttpHeaders.RANGE,"bytes=50-149"))
                    .andExpect(request().asyncStarted()).andReturn();
            mvc.perform(asyncDispatch(ranged))
                    .andExpect(status().isPartialContent())
                    .andExpect(header().string(HttpHeaders.CONTENT_RANGE,"bytes 50-149/2048"))
                    .andExpect(header().string(HttpHeaders.CONTENT_LENGTH,"100"))
                    .andExpect(content().bytes(Arrays.copyOfRange(sample,50,150)));
            verify(objects).streamVideoRange(key,SHA,2048L,0,2047,
                    any(OutputStream.class));
            verify(objects).streamVideoRange(key,SHA,2048L,50,149,
                    any(OutputStream.class));
        } finally {
            jdbc.sql("delete from remotion_render where id=:id")
                .param("id",id).update();
        }
    }
}
