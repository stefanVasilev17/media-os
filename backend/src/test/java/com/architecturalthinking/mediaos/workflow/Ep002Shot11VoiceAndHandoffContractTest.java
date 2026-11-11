package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.lang.reflect.Field;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import static org.junit.jupiter.api.Assertions.*;

class Ep002Shot11VoiceAndHandoffContractTest {
    private final ObjectMapper mapper=new ObjectMapper();

    private String approvedNarration() throws Exception {
        try(var stream=new ClassPathResource(
                "episode-production/ep002-locked-script-v5.json").getInputStream()) {
            for(var shot:mapper.readTree(stream).path("shots"))
                if("SHOT11".equals(shot.path("shotKey").asText()))
                    return shot.path("englishNarration").asText();
        }
        throw new IllegalStateException("Locked SHOT11 narration missing");
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
            "Look at the full journey",
            "We did not add servers",
            "We limited duplicate retries",
            "Some users still got a fast failure",
            "Here is the lesson");

    @Test
    void fiveApprovedBeatsAndTwentyOneTermsComeFromCharacterAlignedLockedWords()
            throws Exception {
        String script=approvedNarration(),raw=alignment(script);
        var duration=BigDecimal.valueOf((script.length()+1)*.055);
        var beats=Ep002VoiceBeatResolver.resolve(
                mapper,raw,duration,APPROVED_ANCHORS,5);
        var terms=Ep002Shot11TermResolver.resolve(mapper,raw,duration,beats);
        assertEquals(5,beats.size());
        assertEquals(19,terms.size());
        assertEquals("FULL_JOURNEY",terms.getFirst().id());
        assertEquals("THREE_AUTH",terms.get(2).id());
        assertEquals("ONE_DATABASE",terms.get(3).id());
        assertEquals("LIMIT_RETRIES",terms.get(6).id());
        assertEquals("FAST_FAILURE",terms.get(11).id());
        assertEquals("HEALTHY_NOT_AVAILABLE",terms.get(15).id());
        assertEquals("NEXT_STORY",terms.getLast().id());
        assertEquals((int)Math.ceil(duration.doubleValue()*30d),
                beats.getLast().endFrame());
        for(int i=1;i<terms.size();i++)
            assertTrue(terms.get(i).startFrame()>=terms.get(i-1).endFrame());
        assertTrue(terms.get(3).startFrame()<terms.get(17).startFrame());
    }

    @Test
    void missingRealPhraseAndMissingSevenBeatProofAreRejected() throws Exception {
        String script=approvedNarration();
        var duration=BigDecimal.valueOf((script.length()+1)*.055);
        var valid=alignment(script);
        var beats=Ep002VoiceBeatResolver.resolve(
                mapper,valid,duration,APPROVED_ANCHORS,5);
        assertThrows(IllegalArgumentException.class,
                ()->Ep002Shot11TermResolver.resolve(
                        mapper,valid,duration,beats.subList(0,4)));
        String missing=script.replace("healthy servers do not guarantee a successful Login",
                "servers look healthy");
        assertThrows(IllegalArgumentException.class,
                ()->Ep002Shot11TermResolver.resolve(
                        mapper,alignment(missing),duration,beats));
        assertThrows(IllegalArgumentException.class,
                ()->Ep002VoiceBeatResolver.resolve(
                        mapper,"{}",duration,APPROVED_ANCHORS,5));
    }

    @Test
    void exactDirectorApprovedShot10MediaAnd2360FramesArePinned() throws Exception {
        Field id=Ep002Shot11PreviewController.class.getDeclaredField(
                "LOCKED_SHOT10_RENDER");
        Field source=Ep002Shot11PreviewController.class.getDeclaredField(
                "LOCKED_SHOT10_SOURCE_SHA");
        Field frames=Ep002Shot11PreviewController.class.getDeclaredField(
                "SHOT10_LOCKED_FRAMES");
        id.setAccessible(true);source.setAccessible(true);frames.setAccessible(true);
        assertEquals(UUID.fromString("2034d8c6-99b2-46a5-9469-bf3df325d6c0"),
                id.get(null));
        assertEquals("a4d9fe5d1dcec033f36ce68a190160fd8077faea",
                source.get(null));
        assertEquals(2360,frames.getInt(null));
    }

}
