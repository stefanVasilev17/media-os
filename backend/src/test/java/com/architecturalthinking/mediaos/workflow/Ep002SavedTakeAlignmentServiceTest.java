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
    void recognizesMetadataOnlyElevenLabsTtsResponseAsMissingNotPaidRealAlignment() {
        String stored="""
          {"alignment":null,"normalized_alignment":null,
           "mediaos_delivery_mode":"ELEVEN_V4_SLOW_NATURAL_PAUSES_V1",
           "mediaos_spoken_script_sha256":"original"}
          """;
        assertEquals(Ep002SavedAlignmentInspection.State.MISSING,
                Ep002SavedAlignmentInspection.inspect(new ObjectMapper(),stored));
    }

    @Test
    void recognizesNonEmptyOriginalOrNormalizedCharacterTimestamps() {
        String block="""
          {"characters":["A"," ","B"],"character_start_times_seconds":[0,0.1,0.2],
           "character_end_times_seconds":[0.08,0.12,0.31]}
          """;
        String direct="{\"alignment\":"+block+"}";
        String normalized="{\"alignment\":null,\"normalized_alignment\":"+block+"}";
        assertEquals(Ep002SavedAlignmentInspection.State.PRESENT,
                Ep002SavedAlignmentInspection.inspect(new ObjectMapper(),direct));
        assertEquals(Ep002SavedAlignmentInspection.State.PRESENT,
                Ep002SavedAlignmentInspection.inspect(new ObjectMapper(),normalized));
    }

    @Test
    void malformedExistingTimestampArraysMustNotTriggerExtraPaidAlignment() {
        for(String stored:new String[]{
                "{\"normalized_alignment\":{\"characters\":[\"a\"],\"character_start_times_seconds\":[],\"character_end_times_seconds\":[0.1]}}",
                "{\"alignment\":{\"characters\":[\"a\"],\"character_start_times_seconds\":[0.5],\"character_end_times_seconds\":[0.2]}}",
                "{\"alignment\":\"unexpected-string\"}",
                "{not-json",
                "[1,2,3]"
        }) {
            assertEquals(Ep002SavedAlignmentInspection.State.MALFORMED,
                    Ep002SavedAlignmentInspection.inspect(new ObjectMapper(),stored));
        }
    }

    @Test
    void emptyTimestampArraysAlsoRequireFreshExplicitAlignmentAuthorization() {
        assertEquals(Ep002SavedAlignmentInspection.State.MISSING,
                Ep002SavedAlignmentInspection.inspect(new ObjectMapper(),
                        "{\"alignment\":{\"characters\":[],\"character_start_times_seconds\":[],\"character_end_times_seconds\":[]}}"));
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
