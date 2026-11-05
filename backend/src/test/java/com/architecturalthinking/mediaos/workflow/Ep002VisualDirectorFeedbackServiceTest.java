package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Ep002VisualDirectorFeedbackServiceTest {
    private final DirectorIdentity.Actor director=
            new DirectorIdentity.Actor("urn:mediaos:test","the-director","actor");

    private Ep002SequentialVisualPreflightService.Preflight preflight() {
        JdbcClient jdbc=mock(JdbcClient.class,RETURNS_DEEP_STUBS);
        ObjectMapper mapper=new ObjectMapper();
        var batch=new Ep002EpisodeBatchPlanService(jdbc,mapper);
        var bridge=new Ep002FactoryReadinessBridgeService(jdbc,batch,mapper);
        var snapshot=bridge.project(batch.snapshot(),Map.of(),Set.of());
        return Ep002SequentialVisualPreflightService.project(snapshot,Set.of("SHOT01"));
    }

    private static Ep002VisualDirectorFeedbackService.SubmitRequest request(
            String fingerprint) {
        return new Ep002VisualDirectorFeedbackService.SubmitRequest(
                UUID.randomUUID(),fingerprint,"SHOT02","CAMERA",
                "The camera moved too quickly to read the Gateway node.",
                "Slow the initial push-in and keep the Gateway label readable.",
                true);
    }

    @Test
    void allowsOnlyDetailedConfirmedNotesForTheCurrentShot02() {
        var current=preflight();
        var valid=request(current.inputFingerprint());
        assertDoesNotThrow(()->Ep002VisualDirectorFeedbackService.validate(valid));
        assertDoesNotThrow(()->Ep002VisualDirectorFeedbackService.assertCurrentTarget(valid,current));
        assertEquals("SHOT02",current.nextShotKey());
        assertNull(current.executableCodexPrompt());
        assertFalse(current.readyForCodex());
    }

    @Test
    void rejectsMissingOrUnconfirmedDirectorApprovalAndEmptyCorrection() {
        var current=preflight();
        var valid=request(current.inputFingerprint());
        var wrong=new Ep002VisualDirectorFeedbackService.SubmitRequest(
                valid.requestId(),valid.expectedEpisodeFingerprint(),valid.shotKey(),
                valid.changeArea(),valid.problemObserved(),valid.requestedCorrection(),false);
        assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                ()->Ep002VisualDirectorFeedbackService.validate(wrong)).getStatusCode());

        var empty=new Ep002VisualDirectorFeedbackService.SubmitRequest(
                valid.requestId(),valid.expectedEpisodeFingerprint(),valid.shotKey(),
                valid.changeArea(),valid.problemObserved(),"fix",true);
        assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                ()->Ep002VisualDirectorFeedbackService.validate(empty)).getStatusCode());

        var missingCategory=new Ep002VisualDirectorFeedbackService.SubmitRequest(
                valid.requestId(),valid.expectedEpisodeFingerprint(),valid.shotKey(),
                null,valid.problemObserved(),valid.requestedCorrection(),true);
        assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                ()->Ep002VisualDirectorFeedbackService.validate(missingCategory)).getStatusCode());
    }

    @Test
    void lockedShot01AndSkippedShot03CannotReceiveNextShotFeedback() {
        var current=preflight();
        for(var illegal: new String[]{"SHOT01","SHOT03","SHOT99"}) {
            var changed=new Ep002VisualDirectorFeedbackService.SubmitRequest(
                    UUID.randomUUID(),current.inputFingerprint(),illegal,"CAMERA",
                    "The camera moved too quickly to read the Gateway node.",
                    "Slow the initial push-in and keep the Gateway label readable.",true);
            if("SHOT99".equals(illegal)||"SHOT01".equals(illegal)) {
                assertEquals(HttpStatus.BAD_REQUEST,assertThrows(ResponseStatusException.class,
                        ()->Ep002VisualDirectorFeedbackService.validate(changed)).getStatusCode());
            } else {
                assertDoesNotThrow(()->Ep002VisualDirectorFeedbackService.validate(changed));
                assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                        ()->Ep002VisualDirectorFeedbackService.assertCurrentTarget(changed,current))
                        .getStatusCode());
            }
        }
    }

    @Test
    void staleEpisodeFingerprintIsRejectedBeforeFeedbackCanBeWritten() {
        var current=preflight();
        var stale=request("0".repeat(64));
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->Ep002VisualDirectorFeedbackService.assertCurrentTarget(stale,current))
                .getStatusCode());
    }

    @Test
    void replayRequiresMatchingUuidDirectorAndExactOriginalContent() {
        var request=request("a".repeat(64));
        var stored=new Ep002VisualDirectorFeedbackService.Feedback(
                UUID.randomUUID(),request.requestId(),"SHOT02",
                "DIRECTOR_FEEDBACK_RECORDED",request.expectedEpisodeFingerprint(),
                1,"b".repeat(64),null,"CAMERA",request.problemObserved(),
                request.requestedCorrection(),"2026-11-05T21:00:00Z",
                director.issuer(),director.subject());
        assertSame(stored,Ep002VisualDirectorFeedbackService.replay(stored,request,director));

        var anotherActor=new DirectorIdentity.Actor(
                "urn:mediaos:test","another-director","actor");
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->Ep002VisualDirectorFeedbackService.replay(stored,request,anotherActor))
                .getStatusCode());

        var changed=new Ep002VisualDirectorFeedbackService.SubmitRequest(
                request.requestId(),request.expectedEpisodeFingerprint(),"SHOT02","CAMERA",
                request.problemObserved(),
                "Move the camera to a different place without Director review.",true);
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->Ep002VisualDirectorFeedbackService.replay(stored,changed,director))
                .getStatusCode());
    }
}
