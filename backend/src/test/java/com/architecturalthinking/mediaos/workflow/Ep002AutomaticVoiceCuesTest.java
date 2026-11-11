package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class Ep002AutomaticVoiceCuesTest {
    private static final ObjectMapper JSON=new ObjectMapper();

    @Test
    void allFiftyNineProtectedAndRecoveryBeatsHaveInOrderUniqueNarrationAnchors() throws Exception {
        JsonNode scripts=Ep002RecoverySource.load(JSON,Ep002RecoverySource.SCRIPT_PATH);
        JsonNode approved=Ep002RecoverySource.load(JSON,
                "episode-production/ep002-approved-visual-source.json");
        JsonNode recovery=Ep002RecoverySource.load(JSON,Ep002RecoverySource.VISUAL_PATH);
        int count=0;
        for(int i=0;i<11;i++){
            JsonNode shot=scripts.path("shots").path(i);
            JsonNode visual=Ep002RecoverySource.visual(approved,recovery,i);
            String key=shot.path("shotKey").asText();
            List<String> anchors=Ep002AutomaticVoiceCues.anchors(
                    key,shot.path("englishNarration").asText(),visual);
            assertEquals(visual.path("beats").size(),anchors.size(),
                    key+" must have source-true, ordered, nonrepeated anchors");
            count+=anchors.size();
        }
        assertEquals(59,count);
    }

    @Test
    void syntheticAlignmentProvesAlgorithmButNeverSubstitutesForAnActualSelectedTake() throws Exception {
        JsonNode scripts=Ep002RecoverySource.load(JSON,Ep002RecoverySource.SCRIPT_PATH);
        JsonNode approved=Ep002RecoverySource.load(JSON,
                "episode-production/ep002-approved-visual-source.json");
        JsonNode recovery=Ep002RecoverySource.load(JSON,Ep002RecoverySource.VISUAL_PATH);
        for(int i=0;i<11;i++){
            JsonNode shot=scripts.path("shots").path(i);
            String key=shot.path("shotKey").asText();
            JsonNode visual=Ep002RecoverySource.visual(approved,recovery,i);
            String narration=shot.path("englishNarration").asText();
            BigDecimal measured=BigDecimal.valueOf(narration.length()*0.025+1.0);
            var unavailable=Ep002AutomaticVoiceCues.resolve(
                    key,narration,visual,null,measured,JSON);
            assertFalse(unavailable.ready(),"No real character timestamps: "+key);
            var resolved=Ep002AutomaticVoiceCues.resolve(
                    key,narration,visual,syntheticAlignment(narration),measured,JSON);
            assertTrue(resolved.ready(),key+" failed on a complete ordered test alignment: "+resolved.reason());
            assertEquals(visual.path("beats").size(),resolved.frames().size());
            assertEquals(0,resolved.frames().get(0).startFrame() >= 0?0:1);
            assertEquals((int)Math.ceil(measured.doubleValue()*30),
                    resolved.frames().getLast().endFrame());
            for(int n=1;n<resolved.frames().size();n++){
                assertEquals(resolved.frames().get(n-1).endFrame(),
                        resolved.frames().get(n).startFrame());
            }
        }
    }

    @Test
    void removedNarrationAnchorMustBlockAutomaticReadiness() throws Exception {
        JsonNode scripts=Ep002RecoverySource.load(JSON,Ep002RecoverySource.SCRIPT_PATH);
        JsonNode approved=Ep002RecoverySource.load(JSON,
                "episode-production/ep002-approved-visual-source.json");
        JsonNode visual=approved.path("shots").path(0);
        String broken=scripts.path("shots").path(0).path("englishNarration").asText()
                .replace("A few seconds pass. Then ten","Time passes");
        var invalid=Ep002AutomaticVoiceCues.resolve(
                "SHOT01",broken,visual,syntheticAlignment(broken),
                BigDecimal.valueOf(broken.length()*0.025+1),JSON);
        assertFalse(invalid.ready());
        assertEquals("AUTOMATIC_SOURCE_CUES_UNAVAILABLE",invalid.reason());
    }

    private static String syntheticAlignment(String narration) throws Exception {
        ObjectNode root=JSON.createObjectNode();
        ObjectNode alignment=root.putObject("alignment");
        ArrayNode chars=alignment.putArray("characters");
        ArrayNode starts=alignment.putArray("character_start_times_seconds");
        ArrayNode ends=alignment.putArray("character_end_times_seconds");
        for(int i=0;i<narration.length();i++){
            chars.add(String.valueOf(narration.charAt(i)));
            starts.add(i*0.025);
            ends.add(i*0.025+0.01);
        }
        return JSON.writeValueAsString(root);
    }
}
