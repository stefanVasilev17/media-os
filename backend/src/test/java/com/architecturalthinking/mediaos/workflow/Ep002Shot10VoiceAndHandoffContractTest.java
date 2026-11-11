package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.lang.reflect.Field;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import static org.junit.jupiter.api.Assertions.*;

class Ep002Shot10VoiceAndHandoffContractTest {
    private final ObjectMapper mapper=new ObjectMapper();

    private String approvedNarration() throws Exception {
        try(var stream=new ClassPathResource(
                "episode-production/ep002-locked-script-v5.json").getInputStream()) {
            for(var shot:mapper.readTree(stream).path("shots"))
                if("SHOT10".equals(shot.path("shotKey").asText()))
                    return shot.path("englishNarration").asText();
        }
        throw new IllegalStateException("Locked SHOT10 narration missing");
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
            "Look at the User Database again",
            "The database can now finish lookups",
            "Connections are returned",
            "Watch the phone carefully",
            "We still need evidence",
            "Count rejected requests too");

    @Test
    void sixApprovedBeatsAndTwentyOneTermsComeFromCharacterAlignedLockedWords()
            throws Exception {
        String script=approvedNarration(),raw=alignment(script);
        var duration=BigDecimal.valueOf((script.length()+1)*.055);
        var beats=Ep002VoiceBeatResolver.resolve(
                mapper,raw,duration,APPROVED_ANCHORS,6);
        var terms=Ep002Shot10TermResolver.resolve(mapper,raw,duration,beats);
        assertEquals(6,beats.size());
        assertEquals(21,terms.size());
        assertEquals("LOOK_DATABASE",terms.getFirst().id());
        assertEquals("QUEUE_SHRINK",terms.get(2).id());
        assertEquals("DB_COMPLETIONS",terms.get(3).id());
        assertEquals("OLD_TIMEOUT",terms.get(10).id());
        assertEquals("NEW_LOGIN",terms.get(12).id());
        assertEquals("P95_P99",terms.get(17).id());
        assertEquals("RECOVERY",terms.getLast().id());
        assertEquals((int)Math.ceil(duration.doubleValue()*30d),
                beats.getLast().endFrame());
        for(int i=1;i<terms.size();i++)
            assertTrue(terms.get(i).startFrame()>=terms.get(i-1).endFrame());
        assertTrue(terms.get(3).startFrame()<terms.get(10).startFrame());
    }

    @Test
    void missingRealPhraseAndMissingSevenBeatProofAreRejected() throws Exception {
        String script=approvedNarration();
        var duration=BigDecimal.valueOf((script.length()+1)*.055);
        var valid=alignment(script);
        var beats=Ep002VoiceBeatResolver.resolve(
                mapper,valid,duration,APPROVED_ANCHORS,6);
        assertThrows(IllegalArgumentException.class,
                ()->Ep002Shot10TermResolver.resolve(
                        mapper,valid,duration,beats.subList(0,5)));
        String missing=script.replace("P95 and P99 reveal",
                "Averages may hide delays");
        assertThrows(IllegalArgumentException.class,
                ()->Ep002Shot10TermResolver.resolve(
                        mapper,alignment(missing),duration,beats));
        assertThrows(IllegalArgumentException.class,
                ()->Ep002VoiceBeatResolver.resolve(
                        mapper,"{}",duration,APPROVED_ANCHORS,6));
    }

    @Test
    void directorLockedShot09LastFrameAndSourceAreImmutable() throws Exception {
        Field id=Ep002Shot10PreviewController.class.getDeclaredField(
                "LOCKED_SHOT09_RENDER");
        Field source=Ep002Shot10PreviewController.class.getDeclaredField(
                "LOCKED_SHOT09_SOURCE_SHA");
        Field frames=Ep002Shot10PreviewController.class.getDeclaredField(
                "SHOT09_LOCKED_FRAMES");
        id.setAccessible(true);source.setAccessible(true);frames.setAccessible(true);
        assertEquals(UUID.fromString("d4b6c8ff-10c5-4181-aa59-fcd16a4470ba"),
                id.get(null));
        assertEquals("b33f00ee81f89301115a4fd79874802c712f2724",
                source.get(null));
        assertEquals(3063,frames.getInt(null));
    }

}
