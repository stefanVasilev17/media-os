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
    void editedShot01NarrationDerivesNewSemanticAnchorsFromActualSavedWords() throws Exception {
        JsonNode scripts=Ep002RecoverySource.load(JSON,Ep002RecoverySource.SCRIPT_PATH);
        JsonNode approved=Ep002RecoverySource.load(JSON,
                "episode-production/ep002-approved-visual-source.json");
        JsonNode visual=approved.path("shots").path(0);
        String edited=scripts.path("shots").path(0).path("englishNarration").asText()
                .replace("You tap Login.","You press the login button.")
                .replace("A few seconds pass. Then ten.","Time slips by. The spinner remains.")
                .replace("the server responsible for signing you in is still running",
                        "the authentication service responds to routine health checks")
                .replace("your login is still waiting for an answer",
                        "the request remains unanswered")
                .replace("go back to nine o’clock","rewind to the morning");
        List<String> anchors=Ep002AutomaticVoiceCues.anchors("SHOT01",edited,visual);
        assertEquals(5,anchors.size(),anchors.toString());
        assertTrue(anchors.get(0).toLowerCase().contains("press"));
        assertTrue(anchors.get(1).toLowerCase().contains("time"));
        assertTrue(anchors.get(2).toLowerCase().contains("authentication")
                || anchors.get(2).toLowerCase().contains("health"));
        assertTrue(anchors.get(3).toLowerCase().contains("request")
                || anchors.get(3).toLowerCase().contains("unanswered"));
        assertTrue(anchors.get(4).toLowerCase().contains("rewind"));
        BigDecimal measured=BigDecimal.valueOf(edited.length()*0.025+1.0);
        var resolved=Ep002AutomaticVoiceCues.resolve(
                "SHOT01",edited,visual,syntheticAlignment(edited),measured,JSON);
        assertTrue(resolved.ready(),"Source-verifiable changed script: "+resolved.reason());
        assertEquals(5,resolved.frames().size());
        for(int i=1;i<resolved.frames().size();i++){
            assertEquals(resolved.frames().get(i-1).endFrame(),resolved.frames().get(i).startFrame());
            assertTrue(resolved.frames().get(i).startFrame()>resolved.frames().get(i-1).startFrame());
        }
    }

    @Test
    void originalLockedShot01StillUsesDirectorSourceExactAnchors() {
        JsonNode scripts=Ep002RecoverySource.load(JSON,Ep002RecoverySource.SCRIPT_PATH);
        JsonNode approved=Ep002RecoverySource.load(JSON,
                "episode-production/ep002-approved-visual-source.json");
        List<String> source=Ep002AutomaticVoiceCues.anchors(
                "SHOT01",scripts.path("shots").path(0).path("englishNarration").asText(),
                approved.path("shots").path(0));
        assertEquals(5,source.size());
        assertEquals("tap Login",source.getFirst());
        assertEquals("go back to nine o’clock",source.getLast());
    }

    @Test
    void cannotInventMissingSemanticBeatsOrAudioTimestampsForUnrelatedText() throws Exception {
        JsonNode approved=Ep002RecoverySource.load(JSON,
                "episode-production/ep002-approved-visual-source.json");
        JsonNode visual=approved.path("shots").path(0);
        String unrelated="The mountain valley stretches into the distance. A river moves quietly "+
                "across the fields. Birds circle the trees while sunlight warms the grass. "+
                "The distant hills turn blue with mist. A gentle breeze rustles the leaves. "+
                "The quiet landscape slowly fades into the evening.";
        var anchors=Ep002AutomaticVoiceCues.anchors("SHOT01",unrelated,visual);
        assertTrue(anchors.isEmpty(),"Unrelated narration must not be matched to login visuals.");
        var result=Ep002AutomaticVoiceCues.resolve("SHOT01",unrelated,visual,
                syntheticAlignment(unrelated),
                BigDecimal.valueOf(unrelated.length()*0.025+1),JSON);
        assertFalse(result.ready());
        assertEquals("AUTOMATIC_SOURCE_CUES_UNAVAILABLE",result.reason());
    }

    @Test
    void editedScriptWithoutRealAlignmentNeverUnlocksRender() throws Exception {
        JsonNode approved=Ep002RecoverySource.load(JSON,
                "episode-production/ep002-approved-visual-source.json");
        String narration=Ep002RecoverySource.load(JSON,Ep002RecoverySource.SCRIPT_PATH)
                .path("shots").path(0).path("englishNarration").asText()
                .replace("You tap Login.","You press Login.");
        var resolved=Ep002AutomaticVoiceCues.resolve("SHOT01",narration,
                approved.path("shots").path(0),null,BigDecimal.valueOf(40),JSON);
        assertFalse(resolved.ready());
        assertEquals("SELECTED_TAKE_MISSING_REAL_CHARACTER_ALIGNMENT",resolved.reason());
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
