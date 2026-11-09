package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class Ep002RecoverySourceTest {
    private static final ObjectMapper MAPPER=new ObjectMapper();

    @Test
    void protectsOriginalSevenShotsAndRetainsFiftyNineVisualBeats(){
        JsonNode original=Ep002RecoverySource.load(MAPPER,
                "episode-production/ep002-locked-script-v4.json");
        JsonNode updated=Ep002RecoverySource.load(MAPPER,Ep002RecoverySource.SCRIPT_PATH);
        JsonNode visual=Ep002RecoverySource.load(MAPPER,
                "episode-production/ep002-approved-visual-source.json");
        JsonNode recovery=Ep002RecoverySource.load(MAPPER,Ep002RecoverySource.VISUAL_PATH);
        assertDoesNotThrow(()->Ep002RecoverySource.verify(updated,visual,recovery));
        for(int i=0;i<7;i++){
            assertEquals(original.path("shots").path(i).path("englishNarration"),
                    updated.path("shots").path(i).path("englishNarration"));
            assertEquals(original.path("shots").path(i).path("directorScriptRevision"),
                    updated.path("shots").path(i).path("directorScriptRevision"));
            assertEquals(visual.path("shots").path(i),
                    Ep002RecoverySource.visual(visual,recovery,i));
        }
        assertEquals("v5.0",updated.path("scriptVersion").asText());
        assertEquals(59,visual.path("beatCount").asInt());
        assertEquals(24,recovery.path("beatCount").asInt());
    }

    @Test
    void fourRecoveryShotsHaveCorrectOrderedAutomaticSpeechCuesAndOneDatabase(){
        JsonNode scripts=Ep002RecoverySource.load(MAPPER,Ep002RecoverySource.SCRIPT_PATH);
        JsonNode visual=Ep002RecoverySource.load(MAPPER,
                "episode-production/ep002-approved-visual-source.json");
        JsonNode recovery=Ep002RecoverySource.load(MAPPER,Ep002RecoverySource.VISUAL_PATH);
        int[] counts={6,7,6,5};
        for(int index=7;index<11;index++){
            String key="SHOT"+String.format(java.util.Locale.ROOT,"%02d",index+1);
            JsonNode source=scripts.path("shots").path(index);
            assertEquals(counts[index-7],
                    Ep002RecoverySource.suggestedAnchors(visual,recovery,key).size());
            assertEquals("v2.0",source.path("directorScriptRevision").asText());
            assertEquals("DIRECTOR_LOCKED",source.path("scriptStatus").asText());
            assertTrue(source.path("voiceDirection").asText().contains("Slow Natural"));
            assertTrue(source.path("englishNarration").asText().length()>200);
            assertFalse(source.path("englishNarration").asText().contains("Three Auth servers become six"));
            assertFalse(source.path("englishNarration").asText().contains("primary replica"));
        }
        assertTrue(recovery.path("shots").path(0).path("startingFrame").asText().contains("ONE User Database"));
    }

    @Test
    void oldSlowVoiceTakeAndAudioCannotBeMarkedCurrentAfterNewSourceRevision(){
        JsonNode v5=Ep002RecoverySource.load(MAPPER,Ep002RecoverySource.SCRIPT_PATH);
        JsonNode v4=Ep002RecoverySource.load(MAPPER,
                "episode-production/ep002-locked-script-v4.json");
        assertNotEquals(v4.path("shots").path(7).path("englishNarration"),
                v5.path("shots").path(7).path("englishNarration"));
        for(int i=7;i<11;i++)assertEquals("NOT_GENERATED_FOR_CURRENT_REVISION",
                v5.path("shots").path(i).path("audioStatus").asText());
    }
}
