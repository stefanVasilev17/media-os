package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class Ep002VoiceBeatResolverTest {
    private final ObjectMapper json=new ObjectMapper();

    private String actualCharacterTiming(String speech) throws Exception {
        ObjectNode root=json.createObjectNode();
        ObjectNode block=root.putObject("normalized_alignment");
        ArrayNode letters=block.putArray("characters");
        ArrayNode begins=block.putArray("character_start_times_seconds");
        ArrayNode ends=block.putArray("character_end_times_seconds");
        for(int i=0;i<speech.length();i++) {
            letters.add(String.valueOf(speech.charAt(i)));
            begins.add(i*0.06);
            ends.add(i*0.06+0.04);
        }
        return json.writeValueAsString(root);
    }

    @Test
    void resolvesRealOrderedSpeechFramesWithoutEditorialTimeGuesses() throws Exception {
        String actual=actualCharacterTiming(
                "At nine o'clock, the ticket sale starts. API Gateway then Load Balancer.");
        var frames=Ep002VoiceBeatResolver.resolve(json,actual,
                new BigDecimal("8.000"),
                List.of("nine o'clock","API Gateway","Load Balancer"),3);
        assertEquals(3,frames.size());
        assertEquals(0<frames.get(0).startFrame(),true);
        assertEquals(frames.get(1).startFrame(),frames.get(0).endFrame());
        assertEquals(frames.get(2).startFrame(),frames.get(1).endFrame());
        assertEquals(240,frames.get(2).endFrame());
        assertEquals("nine o'clock",frames.get(0).spokenAnchor());
    }

    @Test
    void doesNotGuessMissingOrRepeatedWords() throws Exception {
        String actual=actualCharacterTiming("Load Balancer and Load Balancer agree.");
        assertThrows(IllegalArgumentException.class,()->
                Ep002VoiceBeatResolver.resolve(json,actual,new BigDecimal("5.000"),
                        List.of("Load Balancer"),1));
        assertThrows(IllegalArgumentException.class,()->
                Ep002VoiceBeatResolver.resolve(json,actual,new BigDecimal("5.000"),
                        List.of("Redis"),1));
    }

    @Test
    void rejectsBackwardOrderAndOutOfBoundsTiming() throws Exception {
        String actual=actualCharacterTiming("Before the API Gateway comes the Load Balancer.");
        assertThrows(IllegalArgumentException.class,()->
                Ep002VoiceBeatResolver.resolve(json,actual,new BigDecimal("8.000"),
                        List.of("Load Balancer","API Gateway"),2));
        assertThrows(IllegalArgumentException.class,()->
                Ep002VoiceBeatResolver.resolve(json,actual,new BigDecimal("0.500"),
                        List.of("Before the"),1));
    }

    @Test
    void rejectsUnalignedAudioAndWrongBeatCount() {
        assertThrows(IllegalArgumentException.class,()->
                Ep002VoiceBeatResolver.resolve(json,"{}",new BigDecimal("10"),
                        List.of("nine o'clock"),1));
        assertThrows(IllegalArgumentException.class,()->
                Ep002VoiceBeatResolver.resolve(json,null,new BigDecimal("10"),
                        List.of("nine o'clock"),1));
        assertThrows(IllegalArgumentException.class,()->
                Ep002VoiceBeatResolver.resolve(json,"{}",new BigDecimal("10"),
                        List.of(),1));
    }
}
