package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class Ep004Shot01DirectorRenderServiceTest {
    private static final ObjectMapper MAPPER=new ObjectMapper();
    private static final List<String> ANCHORS=List.of(
        "On November twelfth, twenty twenty-six, millions of people",
        "or send an important reply. For many, Outlook",
        "were affected too, even when their main features",
        "But behind that familiar error was a much",
        "away from trouble. That is normally how a",
        "toward the remaining servers helped spread the failure.",
        "The central question is not just why Microsoft",
        "how can the very mechanism meant to rescue"
    );

    static JsonNode source(){
        var beats=MAPPER.createArrayNode();
        for(int i=0;i<ANCHORS.size();i++){
            beats.addObject().put("beatId",Ep004Shot01DirectorRenderService.BEAT_IDS.get(i))
                .put("cueAnchor",ANCHORS.get(i));
        }
        var root=MAPPER.createObjectNode();
        root.set("visualBeats",beats);
        return root;
    }

    static JsonNode realAlignment() {
        StringBuilder recording=new StringBuilder();
        for(String anchor:ANCHORS) {
            recording.append(anchor).append(" and the request continues smoothly ");
        }
        var chars=MAPPER.createArrayNode();
        var starts=MAPPER.createArrayNode();
        var ends=MAPPER.createArrayNode();
        String spoken=recording.toString();
        for(int i=0;i<spoken.length();i++){
            chars.add(String.valueOf(spoken.charAt(i)));
            starts.add(i*0.045);
            ends.add(i*0.045+0.03);
        }
        var root=MAPPER.createObjectNode();
        var alignment=MAPPER.createObjectNode();
        alignment.set("characters",chars);
        alignment.set("character_start_times_seconds",starts);
        alignment.set("character_end_times_seconds",ends);
        root.set("alignment",alignment);
        return root;
    }

    @Test
    void allEightRealProviderPhrasesMapToStrictIncreasingFramesAfterMovingPrelude(){
        Map<String,Integer> found=Ep004Shot01DirectorRenderService.actualCueFrames(
                source(),realAlignment(),2700);
        assertEquals(8,found.size());
        int prev=59;
        for(String key:Ep004Shot01DirectorRenderService.BEAT_IDS) {
            int frame=found.get(key);
            assertTrue(frame>prev,key);
            prev=frame;
        }
        assertEquals(60,Ep004Shot01DirectorRenderService.BREATH_FRAMES);
        assertEquals(30,Ep004Shot01DirectorRenderService.FPS);
    }

    @Test
    void noFakeCuesWhenProviderDataMissingOrStoryDifferent(){
        var empty=MAPPER.createObjectNode();
        assertThrows(IllegalArgumentException.class,()->
                Ep004Shot01DirectorRenderService.actualCueFrames(source(),empty,2700));
        var altered=source().deepCopy();
        ((com.fasterxml.jackson.databind.node.ObjectNode)altered.path("visualBeats").get(2))
            .put("cueAnchor","unknown content never spoken in the actual recording");
        assertThrows(IllegalArgumentException.class,()->
                Ep004Shot01DirectorRenderService.actualCueFrames(altered,realAlignment(),2700));
    }
}
