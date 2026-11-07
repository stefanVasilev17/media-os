package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class Ep002Shot02EditorialPausePlanTest {
    private final ObjectMapper json=new ObjectMapper();
    private static final BigDecimal SECONDS=new BigDecimal("50.000");

    private String officialNarration() throws Exception {
        try(InputStream input=getClass().getResourceAsStream(
                "/episode-production/ep002-locked-script-v4.json")) {
            assertNotNull(input,"Use the locked Director script fixture, not rewritten audio text");
            JsonNode root=json.readTree(input);
            for(JsonNode shot:root.path("shots"))
                if("SHOT02".equals(shot.path("shotKey").asText()))
                    return shot.path("englishNarration").asText();
            fail("Locked SHOT02 narration absent");
            return "";
        }
    }

    private String alignment(String narration) throws Exception {
        ObjectNode block=json.createObjectNode();
        ObjectNode normalized=block.putObject("normalized_alignment");
        ArrayNode characters=normalized.putArray("characters");
        ArrayNode starts=normalized.putArray("character_start_times_seconds");
        ArrayNode ends=normalized.putArray("character_end_times_seconds");
        for(int i=0;i<narration.length();i++){
            characters.add(String.valueOf(narration.charAt(i)));
            starts.add(i*.04d);
            ends.add(i*.04d+.025d);
        }
        return json.writeValueAsString(block);
    }

    private Ep002Shot02EditorialPausePlan.Plan plan(String narration) throws Exception {
        String existing=alignment(narration);
        var beats=Ep002VoiceBeatResolver.resolve(json,existing,SECONDS,
            List.of("At nine o’clock","The software hasn’t changed",
                "Each tap sends a Login request",
                "At first, answers return quickly",
                "The Auth servers share the traffic"),5);
        var terms=Ep002Shot02TermResolver.resolve(json,existing,SECONDS,beats);
        return Ep002Shot02EditorialPausePlan.fromVerified(
            json,existing,SECONDS,beats,terms);
    }

    @Test
    void nineNaturalSpeechBoundariesCreateSeventeenPointNineSecondsOfRealSilence()
            throws Exception {
        var p=plan(officialNarration());
        assertEquals(9,p.pauses().size());
        assertEquals(537,p.addedFrames());
        assertEquals(1500,p.sourceDurationInFrames());
        assertEquals(2037,p.durationInFrames());
        assertEquals(Ep002Shot02EditorialPausePlan.TIMING_MODE,p.timingMode());
        assertEquals(5,p.verifiedCues().size());
        assertEquals(7,p.termCues().size());
        assertEquals(2037,p.verifiedCues().getLast().endFrame());
        for(int i=1;i<p.pauses().size();i++)
            assertTrue(p.pauses().get(i).atFrame()>p.pauses().get(i-1).atFrame());
        for(int i=1;i<p.termCues().size();i++)
            assertTrue(p.termCues().get(i).startFrame()
                >=p.termCues().get(i-1).endFrame());
        for(int i=0;i<p.verifiedCues().size()-1;i++)
            assertEquals(p.verifiedCues().get(i).endFrame(),
                p.verifiedCues().get(i+1).startFrame());
    }

    @Test
    void everyInsertedPauseShiftsLaterWordsButPreservesEarlierWordEnds()
            throws Exception {
        String aligned=alignment(officialNarration());
        var oldBeats=Ep002VoiceBeatResolver.resolve(json,aligned,SECONDS,
            List.of("At nine o’clock","The software hasn’t changed",
                "Each tap sends a Login request",
                "At first, answers return quickly",
                "The Auth servers share the traffic"),5);
        var oldTerms=Ep002Shot02TermResolver.resolve(json,aligned,SECONDS,oldBeats);
        var p=Ep002Shot02EditorialPausePlan.fromVerified(json,aligned,SECONDS,oldBeats,oldTerms);
        assertEquals(oldTerms.getFirst().startFrame()
            +p.pauses().stream().filter(x->x.atFrame()<=oldTerms.getFirst().startFrame())
                .mapToInt(Ep002Shot02EditorialPausePlan.Pause::holdFrames).sum(),
                p.termCues().getFirst().startFrame());
        for(int i=0;i<7;i++)
            assertEquals(oldTerms.get(i).endFrame()
                +p.pauses().stream().filter(x->x.atFrame()<oldTerms.get(i).endFrame())
                    .mapToInt(Ep002Shot02EditorialPausePlan.Pause::holdFrames).sum(),
                p.termCues().get(i).endFrame());
    }

    @Test
    void cpuCanOnlyUseExactlyTheseNineOrderedSilencesAndOriginalSource()
            throws Exception {
        var p=plan(officialNarration());
        Map<String,Object> props=new LinkedHashMap<>();
        props.put("timingMode",p.timingMode());
        props.put("sourceDurationInFrames",p.sourceDurationInFrames());
        props.put("editorialSilencePlan",p.pauses().stream().map(item->{
            Map<String,Object> row=new LinkedHashMap<>();
            row.put("afterPhrase",item.afterPhrase());
            row.put("atFrame",item.atFrame());
            row.put("holdFrames",item.holdFrames());
            return row;
        }).toList());
        assertEquals(1500,Ep002Shot02EditorialPausePlan.sourceFramesForRender(
            props,p.durationInFrames()));
        assertEquals(-1,Ep002Shot02EditorialPausePlan.sourceFramesForRender(
            props,p.durationInFrames()-30));
        var bad=new ArrayList<>((List<Map<String,Object>>)props.get("editorialSilencePlan"));
        var first=new LinkedHashMap<>(bad.getFirst());
        first.put("holdFrames",210);
        bad.set(0,first);
        props.put("editorialSilencePlan",bad);
        assertEquals(-1,Ep002Shot02EditorialPausePlan.sourceFramesForRender(
            props,p.durationInFrames()));
        assertEquals(1500,Ep002Shot02EditorialPausePlan.sourceFramesForRender(
            Map.of("timingMode","ELEVENLABS_CHARACTER_TIMESTAMPS"),1500));
    }

    @Test
    void cannotInventPausesWhenSelectedTakeNarrationOrAlignmentDiffers()
            throws Exception {
        String locked=officialNarration();
        String altered=locked.replace("before the seats are gone",
            "before the tickets disappear");
        assertThrows(IllegalArgumentException.class,()->plan(altered));
        assertThrows(IllegalArgumentException.class,()->
            Ep002Shot02EditorialPausePlan.fromVerified(json,"{}",SECONDS,List.of(),List.of()));
    }
}
