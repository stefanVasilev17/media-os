package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class Ep002Shot07CriticalPulseAlignmentTest {
    private final ObjectMapper mapper=new ObjectMapper();

    private String shot07Narration() throws Exception {
        try(var stream=new ClassPathResource("episode-production/ep002-locked-script-v5.json")
                .getInputStream()) {
            for(var shot:mapper.readTree(stream).path("shots")) {
                if("SHOT07".equals(shot.path("shotKey").asText()))
                    return shot.path("englishNarration").asText();
            }
        }
        throw new IllegalStateException("Locked SHOT07 narration absent");
    }

    private String alignment(String speech) throws Exception {
        ObjectNode root=mapper.createObjectNode();
        var normalized=root.putObject("normalized_alignment");
        var chars=normalized.putArray("characters");
        var starts=normalized.putArray("character_start_times_seconds");
        var ends=normalized.putArray("character_end_times_seconds");
        for(int i=0;i<speech.length();i++) {
            chars.add(String.valueOf(speech.charAt(i)));
            starts.add(i*.060);
            ends.add((i+1)*.060);
        }
        return mapper.writeValueAsString(root);
    }

    private Ep002Shot07TermResolver.TermCue storm(String narration) {
        int start=narration.toLowerCase().indexOf("retry storm");
        return new Ep002Shot07TermResolver.TermCue("RETRY_STORM","retry storm",
                (int)Math.floor(start*.060*30),
                (int)Math.ceil((start+"retry storm".length())*.060*30));
    }

    private Ep002Shot07TermResolver.TermCue cascade(String narration) {
        int start=narration.toLowerCase().indexOf("cascading failure");
        return new Ep002Shot07TermResolver.TermCue("CASCADING_FAILURE","cascading failure",
                (int)Math.floor(start*.060*30),
                (int)Math.ceil((start+"cascading failure".length())*.060*30));
    }

    @Test
    void startsOnFirstRealSpokenNowWatchFrameFromExistingApprovedNarration() throws Exception {
        String script=shot07Narration();
        int position=script.indexOf("Now watch what happens");
        assertTrue(position>0);
        assertTrue(position>script.toLowerCase().indexOf("retry storm"));
        assertTrue(position<script.toLowerCase().indexOf("cascading failure"));
        int aligned=Ep002Shot07TermResolver.resolveCriticalPulseStartFrame(
                mapper,alignment(script),
                BigDecimal.valueOf((script.length()+1)*.060),
                storm(script),cascade(script));
        assertEquals((int)Math.floor(position*.060*30),aligned,
                "Must read a genuine character start, never infer seconds from next term");
        assertTrue(aligned>storm(script).endFrame());
        assertTrue(aligned<cascade(script).startFrame());
    }

    @Test
    void missingOrAmbiguousAudioPhraseFailsClosed() throws Exception {
        String script=shot07Narration();
        String omitted=script.replace("Now watch what happens.","The database gets slower.");
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot07TermResolver.resolveCriticalPulseStartFrame(
                        mapper,alignment(omitted),
                        BigDecimal.valueOf((omitted.length()+1)*.060),
                        storm(script),cascade(script)));
        String duplicated=script+" Now watch what happens.";
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot07TermResolver.resolveCriticalPulseStartFrame(
                        mapper,alignment(duplicated),
                        BigDecimal.valueOf((duplicated.length()+1)*.060),
                        storm(script),cascade(script)));
    }

    @Test
    void refusesWrongTermBoundsAndAbsentGenuineAlignment() throws Exception {
        String script=shot07Narration();
        String raw=alignment(script);
        var storm=storm(script);
        var cascade=cascade(script);
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot07TermResolver.resolveCriticalPulseStartFrame(
                        mapper,raw,BigDecimal.valueOf((script.length()+1)*.060),
                        new Ep002Shot07TermResolver.TermCue("RETRY_STORM","storm",
                                0,cascade.startFrame()),
                        cascade));
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot07TermResolver.resolveCriticalPulseStartFrame(
                        mapper,"{}",BigDecimal.TEN,storm,cascade));
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot07TermResolver.resolveCriticalPulseStartFrame(
                        mapper,raw,BigDecimal.valueOf((script.length()+1)*.060),
                        new Ep002Shot07TermResolver.TermCue("WRONG","wrong",0,1),
                        cascade));
    }
}
