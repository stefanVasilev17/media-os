package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

class Ep002Shot02SlowNaturalVoiceTest {
    private String lockedText() throws Exception {
        try (var stream=new ClassPathResource(
                "episode-production/ep002-locked-script-v4.json").getInputStream()) {
            var shots=new ObjectMapper().readTree(stream).path("shots");
            for (var entry:shots) {
                if ("SHOT02".equals(entry.path("shotKey").asText()))
                    return entry.path("englishNarration").asText();
            }
            throw new AssertionError("LOCKED SHOT02 missing");
        }
    }

    @Test
    void tagsAddRealV4PacingInstructionsWithoutAlteringASingleSpokenCharacter()
            throws Exception {
        String original=lockedText();
        String prompt=Ep002Shot02SlowNaturalVoice.prompt(
                "SHOT02",original,"eleven_v4");
        String originalAgain=prompt.replace(" [long pause]","")
                .replace(" [pause]","");
        assertEquals(original,originalAgain);
        assertTrue(Ep002Shot02SlowNaturalVoice.matchesLockedNarration(original));
        assertEquals(15,Ep002Shot02SlowNaturalVoice.pauseCount());
        assertEquals(7,Ep002Shot02SlowNaturalVoice.longPauseCount());
        assertEquals(15,Pattern.compile("\\[(?:long )?pause\\]").matcher(prompt)
                .results().count());
        assertTrue(prompt.contains("API Gateway [pause]"));
        assertTrue(prompt.contains("Load Balancer [pause]"));
        assertTrue(prompt.contains("User Database. [long pause]"));
        assertTrue(prompt.contains("arrival rate: [pause]"));
    }

    @Test
    void refusesForeignShotsUnsupportedModelsAndEditedNarrationsWithoutCredits()
            throws Exception {
        String text=lockedText();
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot02SlowNaturalVoice.prompt("SHOT03",text,"eleven_v4"));
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot02SlowNaturalVoice.prompt("SHOT02",text,"eleven_multilingual_v2"));
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot02SlowNaturalVoice.prompt("SHOT02",
                        text.replace("At nine o’clock","At ten o’clock"),"eleven_v4"));
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot02SlowNaturalVoice.prompt("SHOT02",null,"eleven_v4"));
    }

    @Test
    void preservesProductionScriptAndExistingTakeWithoutEditorialSilenceTagging()
            throws Exception {
        String source=lockedText();
        String prompt=Ep002Shot02SlowNaturalVoice.prompt("SHOT02",source,"eleven_v4");
        assertNotEquals(source,prompt);
        assertTrue(prompt.contains("[long pause]"));
        assertFalse(prompt.contains("<break"));
        assertEquals(source,source.strip());
        assertEquals("ELEVEN_V4_SLOW_NATURAL_PAUSES_V1",
                Ep002Shot02SlowNaturalVoice.DELIVERY_MODE);
    }
}
