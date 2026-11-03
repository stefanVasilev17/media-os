package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ElevenLabsForcedAlignmentMultipartTest {

    @Test
    void sendsSavedAudioAsBlockingMultipartWithoutReactiveStreamsDependency() {
        RestClient.Builder builder=RestClient.builder();
        MockRestServiceServer mock=MockRestServiceServer.bindTo(builder).build();
        mock.expect(requestTo("https://api.elevenlabs.io/v1/forced-alignment"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("xi-api-key","test-api-key-never-billed"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.MULTIPART_FORM_DATA))
                .andExpect(request->{
                    String payload=new String(request.getBody().readAllBytes(),
                            StandardCharsets.ISO_8859_1);
                    assertTrue(payload.contains("name=\"file\""),"saved MP3 part must be present");
                    assertTrue(payload.contains("filename=\"SHOT01-take.mp3\""));
                    assertTrue(payload.contains("name=\"text\""),"saved narration part must be present");
                    assertTrue(payload.contains("You tap Login."));
                })
                .andRespond(withSuccess(
                        "{\"characters\":[{\"text\":\"Y\",\"start\":0.0,\"end\":0.1}]}",
                        MediaType.APPLICATION_JSON));
        var service=new ElevenLabsForcedAlignmentService(new ObjectMapper(),
                builder.build(),"test-api-key-never-billed");
        var result=service.alignSavedAudio(
                "FAKE_MP3_FOR_OFFLINE_TEST".getBytes(StandardCharsets.UTF_8),
                "audio/mpeg","SHOT01-take.mp3","You tap Login.");
        assertNotNull(result.get("characters"));
        mock.verify();
    }

    @Test
    void refusesInvalidInputsBeforeAnyExternalRequest() {
        RestClient.Builder builder=RestClient.builder();
        MockRestServiceServer mock=MockRestServiceServer.bindTo(builder).build();
        var service=new ElevenLabsForcedAlignmentService(new ObjectMapper(),
                builder.build(),"test-api-key-never-billed");
        assertThrows(IllegalArgumentException.class,()->
                service.alignSavedAudio(new byte[0],"audio/mpeg","x.mp3","Saved script"));
        assertThrows(IllegalArgumentException.class,()->
                service.alignSavedAudio(new byte[]{1,2,3},"audio/mpeg","x.mp3"," "));
        mock.verify();
    }
}
