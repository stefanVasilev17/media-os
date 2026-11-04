package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class EpisodePackageCueTimingVerifierTest {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final EpisodePackageCueTimingVerifier verifier =
            new EpisodePackageCueTimingVerifier(MAPPER);

    private static final String SCRIPT =
            "The phone sends one request. The server gives no answer.";
    private static final String STORY = """
            {"visualBeats":[
              {"beatId":"B1","cueAnchor":"The phone sends one request",
               "direction":"Show the phone passing a request to the backend."},
              {"beatId":"B2","cueAnchor":"The server gives no answer",
               "direction":"Hold the camera on the unanswered request."}
            ]}
            """;

    private static String alignment(String speech) {
        ObjectNode root = MAPPER.createObjectNode();
        ObjectNode details = root.putObject("alignment");
        ArrayNode characters = details.putArray("characters");
        ArrayNode starts = details.putArray("character_start_times_seconds");
        ArrayNode ends = details.putArray("character_end_times_seconds");
        int index = 0;
        for(int cp:speech.codePoints().toArray()) {
            characters.add(new String(Character.toChars(cp)));
            starts.add(index * 0.03);
            ends.add(index * 0.03 + 0.025);
            index++;
        }
        return root.toString();
    }

    @Test
    void mapsRealProviderCharacterTimingToTwoOrderedVisualBeats() {
        String payload=alignment("[calm, conversational, confident] "+SCRIPT);
        var outcome=verifier.verify(SCRIPT,STORY,payload,new BigDecimal("10.000"));
        assertTrue(outcome.verified(),outcome.failureCode());
        assertEquals(2,outcome.cues().size());
        assertEquals("B1",outcome.cues().get(0).beatId());
        assertEquals("B2",outcome.cues().get(1).beatId());
        assertTrue(outcome.cues().get(0).startSeconds()>0);
        assertTrue(outcome.cues().get(0).endSeconds()<
                outcome.cues().get(1).startSeconds());
    }

    @Test
    void missingRealAlignmentOrMeasuredAudioDurationBlocksProduction() {
        assertEquals("MEASURED_AUDIO_DURATION_MISSING",
                verifier.verify(SCRIPT,STORY,alignment(SCRIPT),null).failureCode());
        assertFalse(verifier.verify(SCRIPT,STORY,"{}",
                new BigDecimal("10.000")).verified());
        assertFalse(verifier.verify(SCRIPT,STORY,
                "{\"alignment\":{\"characters\":[\"A\"]}}",
                new BigDecimal("10.000")).verified());
    }

    @Test
    void currentNarrationMustActuallyBeInApprovedAudio() {
        var outcome=verifier.verify(SCRIPT,STORY,
                alignment("An entirely unrelated spoken message."),
                new BigDecimal("10.000"));
        assertEquals("SPOKEN_AUDIO_DIFFERS_FROM_CURRENT_NARRATION",
                outcome.failureCode());
        assertFalse(outcome.verified());
    }

    @Test
    void modifiedOriginalVisualCueMustNotBeMappedToUnspokenNarration() {
        String story=STORY.replace("The server gives no answer",
                "This phrase was never spoken");
        var outcome=verifier.verify(SCRIPT,story,alignment(SCRIPT),
                new BigDecimal("10.000"));
        assertEquals("VISUAL_CUE_NOT_IN_CURRENT_NARRATION",outcome.failureCode());
        assertTrue(outcome.cues().isEmpty());
    }

    @Test
    void reversedVisualCuesMustNotSilentlyUseWrongTimes() {
        String story=STORY.replace("The phone sends one request","__FIRST__")
                .replace("The server gives no answer","The phone sends one request")
                .replace("__FIRST__","The server gives no answer");
        var outcome=verifier.verify(SCRIPT,story,alignment(SCRIPT),
                new BigDecimal("10.000"));
        assertEquals("VISUAL_CUE_NOT_ALIGNED_IN_AUDIO_ORDER",outcome.failureCode());
    }

    @Test
    void providerTimestampsBeyondMeasuredAudioAreRejected() {
        var outcome=verifier.verify(SCRIPT,STORY,alignment(SCRIPT),
                new BigDecimal("0.500"));
        assertFalse(outcome.verified());
        assertEquals("PROVIDER_ALIGNMENT_MISSING_OR_INVALID",outcome.failureCode());
    }

    @Test
    void alternateNormalizedAlignmentIsUsedOnlyWhenValidated() {
        String payload=alignment(SCRIPT).replace("\"alignment\"", "\"normalized_alignment\"");
        var outcome=verifier.verify(SCRIPT,STORY,payload,new BigDecimal("10.000"));
        assertTrue(outcome.verified(),outcome.failureCode());
    }
}
