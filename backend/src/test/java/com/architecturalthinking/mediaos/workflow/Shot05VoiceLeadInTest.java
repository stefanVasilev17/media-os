package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.assertEquals;

class Shot05VoiceLeadInTest {

    @Test
    void v2AddsRealLeadInWithoutChangingOtherShots() {
        var v2 = List.<Map<String,Object>>of(Map.of("narration",
                "Now we know where the request is going. Follow it to the server."));
        assertEquals(1.25d, VoiceClipController.shot05OpeningSilenceSeconds("SHOT 05", v2));
        assertEquals(0.0d, VoiceClipController.shot05OpeningSilenceSeconds("SHOT 04", v2));
    }

    @Test
    void v1VoiceHasNoAdditionalSilence() {
        var v1 = List.<Map<String,Object>>of(Map.of("narration",
                "When you press Login, your request reaches the first stop on the server side."));
        assertEquals(0.0d, VoiceClipController.shot05OpeningSilenceSeconds("SHOT 05", v1));
        assertEquals(0.0d, VoiceClipController.shot05OpeningSilenceSeconds("SHOT 05", List.of()));
    }
}
