package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class Ep002ForcedAlignmentNormalizerTest {
    private static final ObjectMapper JSON=new ObjectMapper();

    private String responseFor(String text,double timePerChar) throws Exception {
        ObjectNode response=JSON.createObjectNode();
        ArrayNode chars=response.putArray("characters");
        for(int i=0;i<text.length();i++) {
            chars.addObject().put("text",String.valueOf(text.charAt(i)))
                .put("start",i*timePerChar).put("end",(i+1)*timePerChar);
        }
        response.putArray("words");
        response.put("loss",0.03);
        return JSON.writeValueAsString(response);
    }

    @Test
    void convertsRealForcedAlignmentShapeIntoFiveRemotionCueAnchors() throws Exception {
        String narration="You tap Login. A loading spinner appears. "
            +"A few seconds pass. Then ten. "
            +"The server responsible for signing you in is still running. "
            +"And yet, your login is still waiting. "
            +"We need to go back to nine o'clock.";
        String canonical=Ep002ForcedAlignmentNormalizer.normalize(JSON,responseFor(narration,0.043));
        var root=JSON.readTree(canonical);
        assertEquals("ELEVENLABS_FORCED_ALIGNMENT",root.path("alignment_source").asText());
        assertEquals(narration.length(),root.path("normalized_alignment").path("characters").size());
        assertEquals(0.03,root.path("forced_alignment").path("loss").asDouble());
        var beats=Ep002VoiceCueTiming.resolveShot01(canonical,new BigDecimal("25.0"),JSON);
        assertEquals(5,beats.size());
        assertTrue(beats.get(4).startFrame()>beats.get(0).startFrame());
    }

    @Test
    void malformedForcedAlignmentCannotBeStoredAsSuccessful() {
        assertThrows(IllegalArgumentException.class,()->
            Ep002ForcedAlignmentNormalizer.normalize(JSON,"{\"characters\":[]}"));
        assertThrows(IllegalArgumentException.class,()->
            Ep002ForcedAlignmentNormalizer.normalize(JSON,
                "{\"characters\":[{\"text\":\"x\",\"start\":3.0,\"end\":2.0}]}"));
        assertThrows(IllegalArgumentException.class,()->
            Ep002ForcedAlignmentNormalizer.normalize(JSON,
                "{\"characters\":[{\"text\":\"x\",\"start\":-1,\"end\":2.0}]}"));
    }
}
