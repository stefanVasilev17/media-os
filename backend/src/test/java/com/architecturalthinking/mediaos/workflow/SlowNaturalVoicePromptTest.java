package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SlowNaturalVoicePromptTest {
    @Test
    void automaticallyPacesUnseenShotsWithoutEditingOriginalSpokenText() {
        String narration="A request reaches the gateway, but many other requests are waiting. "
            +"The service processes work, and then it waits for a database response.\\n\\n"
            +"The database remains available. The pressure is increasing.";
        narration=narration.replace("\\n","\n");
        var plan=SlowNaturalVoicePrompt.plan(narration,"eleven_v4");
        assertTrue(plan.pauseCount()>=3);
        assertTrue(plan.longPauseCount()>=1);
        assertEquals(narration,plan.text().replace(" [long pause]","").replace(" [pause]",""));
        assertEquals("ELEVEN_V4_AUTO_SLOW_NATURAL_PAUSES_V1",SlowNaturalVoicePrompt.DELIVERY_MODE);
    }

    @Test
    void acceptsAnUnpunctuatedNarrationWithSafeSinglePause() {
        String narration="Every login request travels through the architecture and reaches a shared resource waiting for more work";
        var plan=SlowNaturalVoicePrompt.plan(narration,"eleven_v4");
        assertEquals(1,plan.pauseCount());
        assertEquals(narration,plan.text().replace(" [pause]",""));
    }

    @Test
    void failsClosedForWrongModelsExistingTagsOrUnsafeInputs() {
        String sample="A first request arrives. The second request continues.";
        assertThrows(IllegalArgumentException.class,()->
                SlowNaturalVoicePrompt.plan(sample,"eleven_multilingual_v2"));
        assertThrows(IllegalArgumentException.class,()->
                SlowNaturalVoicePrompt.plan(sample+" [pause]","eleven_v4"));
        assertThrows(IllegalArgumentException.class,()->
                SlowNaturalVoicePrompt.plan(null,"eleven_v4"));
        assertThrows(IllegalArgumentException.class,()->
                SlowNaturalVoicePrompt.plan("Hello","eleven_v4"));
    }
}
