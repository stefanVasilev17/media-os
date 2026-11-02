package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
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
    void existingTakeCannotBeSubmittedFromAnotherEpisode() {
        assertThrows(ResponseStatusException.class,()->
            service().align("EP001_SHOT01",UUID.randomUUID(),1,UUID.randomUUID(),true));
        verifyNoInteractions(provider,jdbc);
    }
}
