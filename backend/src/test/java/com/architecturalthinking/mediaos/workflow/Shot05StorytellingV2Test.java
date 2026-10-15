package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class Shot05StorytellingV2Test {

    private static final String NEW_OPENING =
            "Now we know where the request is going. Follow it to the server. Before the password is checked, the request meets its first server-side checkpoint: the API Gateway.";
    private static final String NEW_ENDING =
            "Those failures were only examples. Our green request passes. Now it reaches another decision: which healthy server should receive it?";

    @Test
    void acceptsOnlyTheExactV2OpeningAndEndingWithUnchangedMiddleFive() {
        var canonical = Shot05ImportRebaseTest.canonical();
        var approved = new ArrayList<>(Shot05ImportRebaseTest.proposed());
        approved.set(0, updated(approved.get(0), NEW_OPENING));
        approved.set(6, updated(approved.get(6), NEW_ENDING));
        assertEquals(7, DirectorScriptAmendmentController.scopedApprovedShot05(canonical, approved).size());
    }

    @Test
    void rejectsUndocumentedChangesToPreviouslyApprovedMiddleClips() {
        var canonical = Shot05ImportRebaseTest.canonical();
        var changed = new ArrayList<>(Shot05ImportRebaseTest.proposed());
        changed.set(0, updated(changed.get(0), NEW_OPENING));
        changed.set(6, updated(changed.get(6), NEW_ENDING));
        changed.set(3, updated(changed.get(3), "Unreviewed change to a locked voice clip."));
        assertThrows(ResponseStatusException.class,
                () -> DirectorScriptAmendmentController.scopedApprovedShot05(canonical, changed));
    }

    private static LockedScriptImportController.TimelineBlock updated(
            LockedScriptImportController.TimelineBlock block,
            String text
    ) {
        return new LockedScriptImportController.TimelineBlock(
                block.sectionId(), block.sectionTitle(), block.shotKey(),
                block.startSecond(), block.endSecond(), text, block.voiceDirection());
    }
}
