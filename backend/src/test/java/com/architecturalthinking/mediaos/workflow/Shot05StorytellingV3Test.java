package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class Shot05StorytellingV3Test {
    private static final String GATEWAY_FIRST =
            "The API Gateway is the first stop for our login request after it crosses the network. "
            + "It doesn't check your password. Instead, it checks whether the request can continue and where it should go next. "
            + "And if something is wrong, the login can stop right here.";

    @Test
    void v3ChangesOnlyC01AndKeepsAllOtherApprovedNarrationExact() {
        var source = new ArrayList<>(Shot05ImportRebaseTest.proposed());
        var v2 = Shot05StorytellingV3Test.withVoice(source,0,
                "Now we know where the request is going. Follow it to the server. Before the password is checked, the request meets its first server-side checkpoint: the API Gateway.");
        var v2complete = withVoice(v2,6,
                "Those failures were only examples. Our green request passes. Now it reaches another decision: which healthy server should receive it?");
        var v3 = withVoice(v2complete,0,GATEWAY_FIRST);
        var approved = DirectorScriptAmendmentController.scopedApprovedShot05(Shot05ImportRebaseTest.canonical(),v3);
        assertEquals(7, approved.size());
        for (int i=1;i<approved.size();i++) assertEquals(v2complete.get(i).narration(),approved.get(i).narration());
    }

    @Test
    void unreviewedChangesToLockedC02AreRejected() {
        var supplied = new ArrayList<>(Shot05ImportRebaseTest.proposed());
        supplied = withVoice(supplied,0,GATEWAY_FIRST);
        supplied = withVoice(supplied,6,"Those failures were only examples. Our green request passes. Now it reaches another decision: which healthy server should receive it?");
        supplied = withVoice(supplied,1,"This is a different and unapproved routing narration.");
        var invalid = supplied;
        assertThrows(ResponseStatusException.class,
                () -> DirectorScriptAmendmentController.scopedApprovedShot05(Shot05ImportRebaseTest.canonical(),invalid));
    }

    @Test
    void openingSilenceIsStillExactlyOnePointTwoFiveSeconds() {
        assertEquals(1.25,
                VoiceClipController.shot05OpeningSilenceSeconds("SHOT 05",
                        List.of(Map.of("narration",GATEWAY_FIRST))));
        assertEquals(0,
                VoiceClipController.shot05OpeningSilenceSeconds("SHOT 01",
                        List.of(Map.of("narration",GATEWAY_FIRST))));
    }

    private static ArrayList<LockedScriptImportController.TimelineBlock> withVoice(
            List<LockedScriptImportController.TimelineBlock> src,int i,String narration) {
        var updated=new ArrayList<>(src);
        var old=updated.get(i);
        updated.set(i,new LockedScriptImportController.TimelineBlock(old.sectionId(),old.sectionTitle(),
                old.shotKey(),old.startSecond(),old.endSecond(),narration,old.voiceDirection()));
        return updated;
    }
}
