package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class Ep002DirectorVisualFeedbackControllerTest {
    @Test
    void validFeedbackIsTrimmedAndBounded() {
        assertEquals("Make the login button brighter.",
                Ep002DirectorVisualFeedbackController.validatedText("  Make the login button brighter.  "));
        assertEquals("x".repeat(3000),
                Ep002DirectorVisualFeedbackController.validatedText("x".repeat(3000)));
    }

    @Test
    void emptyShortOrOversizedFeedbackIsRejectedWithoutAgentExecution() {
        for (String input : new String[]{null,"","   ","tiny","x".repeat(3001)}) {
            ResponseStatusException error=assertThrows(ResponseStatusException.class,
                    ()->Ep002DirectorVisualFeedbackController.validatedText(input));
            assertEquals(HttpStatus.BAD_REQUEST,error.getStatusCode());
        }
    }

    @Test
    void onlyExplicitChangeAreasAreAccepted() {
        assertEquals("CAMERA",Ep002DirectorVisualFeedbackController.validatedArea(" camera "));
        assertEquals("LAYOUT",Ep002DirectorVisualFeedbackController.validatedArea("LAYOUT"));
        assertEquals("TIMING",Ep002DirectorVisualFeedbackController.validatedArea("timing"));
        for (String area : new String[]{null,"DEPLOY","VOICE","EP001","SCRIPT"}) {
            assertEquals(HttpStatus.BAD_REQUEST,
                    assertThrows(ResponseStatusException.class,
                            ()->Ep002DirectorVisualFeedbackController.validatedArea(area)).getStatusCode());
        }
    }

    @Test
    void visuallyLockedSceneRequiresExplicitDirectorAcknowledgement() {
        Ep002DirectorVisualFeedbackController.requireLockedVisualAcknowledgment(true);
        for (Boolean acknowledged : new Boolean[]{null,false}) {
            assertEquals(HttpStatus.CONFLICT,
                    assertThrows(ResponseStatusException.class,
                            ()->Ep002DirectorVisualFeedbackController.requireLockedVisualAcknowledgment(acknowledged))
                            .getStatusCode());
        }
    }
}
