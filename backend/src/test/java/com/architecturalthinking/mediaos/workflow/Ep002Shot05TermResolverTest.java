package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class Ep002Shot05TermResolverTest {
    private final ObjectMapper mapper=new ObjectMapper();

    @Test
    void mapsActualWordPositionsRatherThanFakeEditorialFrames() throws Exception {
        String script;
        try(var stream=new ClassPathResource("episode-production/ep002-locked-script-v4.json")
                .getInputStream()){
            script=null;
            for(var shot:mapper.readTree(stream).path("shots")) {
                if("SHOT05".equals(shot.path("shotKey").asText())){
                    script=shot.path("englishNarration").asText();
                    break;
                }
            }
        }
        assertNotNull(script);
        ObjectNode root=mapper.createObjectNode();
        var alignment=root.putObject("normalized_alignment");
        var chars=alignment.putArray("characters");
        var starts=alignment.putArray("character_start_times_seconds");
        var ends=alignment.putArray("character_end_times_seconds");
        for(int i=0;i<script.length();i++){
            chars.add(String.valueOf(script.charAt(i)));
            starts.add(i*.060);
            ends.add((i+1)*.060);
        }
        BigDecimal seconds=BigDecimal.valueOf((script.length()+1)*.060);
        String raw=mapper.writeValueAsString(root);
        var beats=Ep002VoiceBeatResolver.resolve(mapper,raw,seconds,
                List.of("To see why the Login is still waiting",
                        "Before checking an account",
                        "Let’s replay the last few moments",
                        "Another Login arrives",
                        "We call these in-flight requests"),5);
        var terms=Ep002Shot05TermResolver.resolve(mapper,raw,seconds,beats);
        assertEquals(15,terms.size());
        assertEquals("CONNECTION_POOL",terms.getFirst().id());
        assertEquals("TIME_RUNNING_OUT",terms.getLast().id());
        assertEquals("EIGHT_MAX",terms.get(2).id());
        assertTrue(terms.get(2).startFrame()<terms.get(3).startFrame(),
                "Eight-slot maximum is introduced before the replay");
        for(int i=1;i<terms.size();i++)
            assertTrue(terms.get(i).startFrame()>=terms.get(i-1).endFrame());
    }

    @Test
    void missingAlignmentFailsClosedBeforeAnyRender() {
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot05TermResolver.resolve(mapper,"{}",BigDecimal.TEN,List.of()));
        assertThrows(IllegalArgumentException.class,()->
                Ep002Shot05TermResolver.resolve(null,"{}",BigDecimal.TEN,List.of()));
    }
}
