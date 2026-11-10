package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.lang.reflect.Field;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import static org.junit.jupiter.api.Assertions.*;

class Ep002Shot09VoiceAndHandoffContractTest {
    private final ObjectMapper mapper=new ObjectMapper();

    private String approvedNarration() throws Exception {
        try(var stream=new ClassPathResource(
                "episode-production/ep002-locked-script-v5.json").getInputStream()) {
            for(var shot:mapper.readTree(stream).path("shots"))
                if("SHOT09".equals(shot.path("shotKey").asText()))
                    return shot.path("englishNarration").asText();
        }
        throw new IllegalStateException("Locked SHOT09 narration missing");
    }

    private String alignment(String speech) throws Exception {
        var root=mapper.createObjectNode();
        var a=root.putObject("normalized_alignment");
        var chars=a.putArray("characters");
        var starts=a.putArray("character_start_times_seconds");
        var ends=a.putArray("character_end_times_seconds");
        for(int i=0;i<speech.length();i++) {
            chars.add(String.valueOf(speech.charAt(i)));
            starts.add(i*.055);
            ends.add((i+1)*.055);
        }
        return mapper.writeValueAsString(root);
    }

    private static final List<String> APPROVED_ANCHORS=List.of(
            "Stopping retries helps",
            "So we add admission control",
            "Because we have three Auth instances",
            "When demand exceeds that budget",
            "We also limit concurrent lookups",
            "If database calls keep timing out",
            "Here is the trade-off");

    @Test
    void sevenApprovedBeatsAndTwentyOneTermsComeFromCharacterAlignedLockedWords()
            throws Exception {
        String script=approvedNarration(),raw=alignment(script);
        var duration=BigDecimal.valueOf((script.length()+1)*.055);
        var beats=Ep002VoiceBeatResolver.resolve(
                mapper,raw,duration,APPROVED_ANCHORS,7);
        var terms=Ep002Shot09TermResolver.resolve(mapper,raw,duration,beats);
        assertEquals(7,beats.size());
        assertEquals(21,terms.size());
        assertEquals("STOP_RETRIES",terms.getFirst().id());
        assertEquals("ADMISSION_CONTROL",terms.get(4).id());
        assertEquals("FOUR_FIFTY",terms.get(8).id());
        assertEquals("SHEDDING",terms.get(10).id());
        assertEquals("BULKHEAD",terms.get(15).id());
        assertEquals("BREAKER_OPEN",terms.get(16).id());
        assertEquals("ADMITTED_WORK",terms.getLast().id());
        assertEquals((int)Math.ceil(duration.doubleValue()*30d),
                beats.getLast().endFrame());
        for(int i=1;i<terms.size();i++)
            assertTrue(terms.get(i).startFrame()>=terms.get(i-1).endFrame());
        assertTrue(terms.get(8).startFrame()<terms.get(16).startFrame());
    }

    @Test
    void missingRealPhraseAndMissingSevenBeatProofAreRejected() throws Exception {
        String script=approvedNarration();
        var duration=BigDecimal.valueOf((script.length()+1)*.055);
        var valid=alignment(script);
        var beats=Ep002VoiceBeatResolver.resolve(
                mapper,valid,duration,APPROVED_ANCHORS,7);
        assertThrows(IllegalArgumentException.class,
                ()->Ep002Shot09TermResolver.resolve(
                        mapper,valid,duration,beats.subList(0,6)));
        String missing=script.replace("A bulkhead keeps retries",
                "A boundary protects requests");
        assertThrows(IllegalArgumentException.class,
                ()->Ep002Shot09TermResolver.resolve(
                        mapper,alignment(missing),duration,beats));
        assertThrows(IllegalArgumentException.class,
                ()->Ep002VoiceBeatResolver.resolve(
                        mapper,"{}",duration,APPROVED_ANCHORS,7));
    }

    @Test
    void historicDirectorLockedShot08FrameAndSourceAreFixed() throws Exception {
        Field id=Ep002Shot09PreviewController.class.getDeclaredField(
                "LOCKED_SHOT08_RENDER");
        Field source=Ep002Shot09PreviewController.class.getDeclaredField(
                "LOCKED_SHOT08_SOURCE_SHA");
        Field frames=Ep002Shot09PreviewController.class.getDeclaredField(
                "SHOT08_LOCKED_FRAMES");
        id.setAccessible(true);source.setAccessible(true);frames.setAccessible(true);
        assertEquals(UUID.fromString("3415073a-5906-489d-bb69-6af7446c2c9b"),id.get(null));
        assertEquals("a0dbdc8927cb2d47d5a1a3e691c6405bf0c28390",source.get(null));
        assertEquals(2314,frames.getInt(null));
    }
}
