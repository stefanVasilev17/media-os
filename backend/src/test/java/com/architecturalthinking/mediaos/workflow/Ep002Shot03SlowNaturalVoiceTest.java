package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

class Ep002Shot03SlowNaturalVoiceTest {
    private String lockedText() throws Exception {
        try(var stream=new ClassPathResource(
                "episode-production/ep002-locked-script-v4.json").getInputStream()) {
            for(var shot:new ObjectMapper().readTree(stream).path("shots")) {
                if("SHOT03".equals(shot.path("shotKey").asText()))
                    return shot.path("englishNarration").asText();
            }
        }
        throw new AssertionError("Canonical EP002 SHOT03 not found");
    }

    @Test
    void createsSlowerPhrasingWithoutEditingAnySpokenWord() throws Exception {
        String source=lockedText();
        String prompt=Ep002Shot03SlowNaturalVoice.prompt("SHOT03",source,"eleven_v4");
        assertEquals(source,prompt.replace(" [long pause]","").replace(" [pause]",""));
        assertEquals(19,Ep002Shot03SlowNaturalVoice.pauseCount());
        assertEquals(9,Ep002Shot03SlowNaturalVoice.longPauseCount());
        assertEquals(19,Pattern.compile("\\[(?:long )?pause\\]").matcher(prompt).results().count());
        assertTrue(prompt.contains("five hundred of these lookups every second. [long pause]"));
        assertTrue(prompt.contains("Engineers call this throughput [pause]"));
        assertTrue(prompt.contains("Then nine hundred. [long pause]"));
        assertTrue(prompt.contains("Engineers call this saturation. [long pause]"));
        assertTrue(prompt.contains("latency [pause]"));
        assertTrue(Ep002Shot03SlowNaturalVoice.matchesNarration(source));
    }

    @Test
    void refusesWrongShotModelOrChangedMeaningBeforeAnyPaidCall() throws Exception {
        String source=lockedText();
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot03SlowNaturalVoice.prompt("SHOT02",source,"eleven_v4"));
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot03SlowNaturalVoice.prompt("SHOT03",source,"eleven_multilingual_v2"));
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot03SlowNaturalVoice.prompt("SHOT03",
                        source.replace("five hundred","four hundred"),"eleven_v4"));
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot03SlowNaturalVoice.prompt("SHOT03",null,"eleven_v4"));
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot03SlowNaturalVoice.prompt("SHOT03",
                        source+" [pause]","eleven_v4"));
        assertFalse(Ep002Shot03SlowNaturalVoice.matchesNarration(
                source.replace("That’s the arrival rate","The arrival rate")));
        assertFalse(Ep002Shot03SlowNaturalVoice.matchesNarration(
                source+" The database can finish about five hundred of these lookups every second."));
    }
}
