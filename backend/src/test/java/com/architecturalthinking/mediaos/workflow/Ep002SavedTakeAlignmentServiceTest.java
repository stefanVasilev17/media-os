package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Ep002SavedTakeAlignmentServiceTest {
    private final JdbcClient jdbc=mock(JdbcClient.class);
    private final ElevenLabsForcedAlignmentService provider=mock(ElevenLabsForcedAlignmentService.class);
    private final PlatformTransactionManager manager=mock(PlatformTransactionManager.class);

    private Ep002SavedTakeAlignmentService service() {
        return new Ep002SavedTakeAlignmentService(jdbc,provider,manager,new ObjectMapper(),true);
    }

    @Test
    void rejectsInvalidShotBeforeAnyPaidApiOrDatabaseRequest() {
        var service=service();
        assertThrows(ResponseStatusException.class,()->
            service.align("SHOT99",UUID.randomUUID(),1,UUID.randomUUID(),true));
        verifyNoInteractions(provider,jdbc);
    }

    @Test
    void rejectsAnInvalidShotForAlignmentStatusRead() {
        assertThrows(ResponseStatusException.class,()->service().status("SHOT00"));
        verifyNoInteractions(provider,jdbc);
    }

    @Test
    void classifiesProvider403WithoutLeakingResponseBodyOrApiCredentials() {
        var providerError=new HttpClientErrorException(
                HttpStatus.FORBIDDEN,"secret-body-must-not-be-logged");
        String category=Ep002SavedTakeAlignmentService.safeFailureCategory(
                new IllegalStateException("Provider operation failed",providerError));
        assertEquals("PROVIDER_HTTP_403",category);
        assertFalse(category.contains("secret"));
    }

    @Test
    void unrelatedCommitOrTransportFailureRemainsUncertain() {
        assertEquals("PROVIDER_OR_COMMIT_UNCERTAIN",
                Ep002SavedTakeAlignmentService.safeFailureCategory(
                        new IllegalStateException("Persistence could not be confirmed")));
    }

    @Test
    void controllerReturnsSafeOriginalErrorStatusAndMessageAsJson() {
        var controller=new Ep002SavedTakeAlignmentController(service());
        var answer=controller.alignmentFailure(new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Paid alignment result is unresolved. Do not retry."));
        assertEquals(HttpStatus.BAD_GATEWAY,answer.getStatusCode());
        assertNotNull(answer.getBody());
        assertEquals(502,answer.getBody().get("httpStatus"));
        assertTrue(String.valueOf(answer.getBody().get("detail")).contains("Do not retry"));
    }

    @Test
    void existingTakeCannotBeSubmittedFromAnotherEpisode() {
        assertThrows(ResponseStatusException.class,()->
            service().align("EP001_SHOT01",UUID.randomUUID(),1,UUID.randomUUID(),true));
        verifyNoInteractions(provider,jdbc);
    }
}
