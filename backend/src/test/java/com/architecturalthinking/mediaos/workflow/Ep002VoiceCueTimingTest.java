package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class Ep002VoiceCueTimingTest {
    private static final ObjectMapper JSON=new ObjectMapper();

    private String alignment(String spoken) throws Exception {
        ObjectNode root=JSON.createObjectNode();
        ObjectNode normalized=root.putObject("normalized_alignment");
        ArrayNode chars=normalized.putArray("characters");
        ArrayNode starts=normalized.putArray("character_start_times_seconds");
        ArrayNode ends=normalized.putArray("character_end_times_seconds");
        for (int i=0;i<spoken.length();i++) {
            chars.add(String.valueOf(spoken.charAt(i)));
            starts.add(i*0.045);
            ends.add((i+1)*0.045);
        }
        return JSON.writeValueAsString(root);
    }

    @Test
    void resolvesAllFiveSpokenCuesWithRealCharacterFrameBounds() throws Exception {
        String narration="You tap Login. A loading spinner appears and keeps turning. "
                +"A few seconds pass. Then ten. The screen does not move forward. "
                +"Behind that screen, the server responsible for signing you in is still running. "
                +"And yet, your login is still waiting for an answer. "
                +"To understand what is happening, we need to go back to nine o’clock.";
        var cues=Ep002VoiceCueTiming.resolveShot01(alignment(narration),new BigDecimal("18.000"),JSON);
        assertEquals(5,cues.size());
        assertEquals(1,cues.get(0).number());
        assertEquals("tap login",cues.get(0).anchor());
        assertTrue(cues.get(0).startFrame()>=0);
        assertTrue(cues.get(0).endFrame()>cues.get(0).startFrame());
        for (int i=1;i<cues.size();i++) {
            assertTrue(cues.get(i).startFrame()>cues.get(i-1).startFrame());
            assertTrue(cues.get(i).endFrame()>cues.get(i).startFrame());
        }
        assertEquals("go back to nine o clock",cues.get(4).anchor());
    }

    @Test
    void missingPhraseNeverCreatesFakeTimestamp() throws Exception {
        assertTrue(Ep002VoiceCueTiming.resolveShot01(
                alignment("A loading spinner appears."),new BigDecimal("20"),JSON).isEmpty());
    }

    @Test
    void oldTakesWithoutStoredAlignmentStayUnaligned() {
        assertTrue(Ep002VoiceCueTiming.resolveShot01(null,new BigDecimal("40"),JSON).isEmpty());
        assertTrue(Ep002VoiceCueTiming.resolveShot01("{}",new BigDecimal("40"),JSON).isEmpty());
        assertTrue(Ep002VoiceCueTiming.resolveShot01("invalid",new BigDecimal("40"),JSON).isEmpty());
    }

    @Test
    void rejectsTruncatedAudioAndMalformedTimingArrays() throws Exception {
        String narration="tap Login. A few seconds pass. Then ten. "
                +"server responsible for signing you in is still running. "
                +"your login is still waiting. go back to nine o'clock.";
        assertTrue(Ep002VoiceCueTiming.resolveShot01(
                alignment(narration),new BigDecimal("1.0"),JSON).isEmpty());
        assertTrue(Ep002VoiceCueTiming.resolveShot01(
                "{\"normalized_alignment\":{\"characters\":[\"a\"],"
                +"\"character_start_times_seconds\":[],\"character_end_times_seconds\":[1]}}",
                new BigDecimal("20"),JSON).isEmpty());
    }
}
