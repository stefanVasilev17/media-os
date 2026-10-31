package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class EpisodeWorkspaceServiceTest {
    private final JdbcClient jdbc = mock(JdbcClient.class);
    private final ProductionMemoryService memory = mock(ProductionMemoryService.class);
    private final CreativePolicyService policy = mock(CreativePolicyService.class);
    private final EpisodeWorkspaceService safe = new EpisodeWorkspaceService(
            jdbc, new ObjectMapper(), memory, policy, mock(EpisodeLearningService.class), false, false);

    @Test
    void creationCannotRunWithoutExplicitEnablement() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> safe.create("EP002", "Why Login Fails Even When the Server Is Healthy", UUID.randomUUID()));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verifyNoInteractions(jdbc);
    }

    @Test
    void episodeDraftsAreDisabledUntilProductionRoutingGate() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> safe.draft(UUID.randomUUID(), "RESEARCH", Map.of("centralQuestion", "A"),
                        "Scope draft", 0, UUID.randomUUID()));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verifyNoInteractions(jdbc);
    }

    @Test
    void noDirectorLocksWithoutWriteEnablement() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> safe.directorLock(UUID.randomUUID(), "RESEARCH", 1,
                        "DIRECTOR_APPROVE", "I reviewed the real Truth Map.", UUID.randomUUID()));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verifyNoInteractions(jdbc);
    }

    @Test
    void directorLockRequiresVerifiedRoleBeforeAnyDatabaseAccess() {
        EpisodeWorkspaceService writable = new EpisodeWorkspaceService(
                jdbc, new ObjectMapper(), memory, policy, mock(EpisodeLearningService.class), false, true);
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> writable.directorLock(UUID.randomUUID(), "RESEARCH", 1,
                        "DIRECTOR_APPROVE", "Reviewed the entire proposed Truth Map.", UUID.randomUUID()));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verifyNoInteractions(jdbc);
    }

    @Test
    void noEpisodeMemoryWritesWithoutEnablement() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> safe.rememberEpisodeCorrection(UUID.randomUUID(), "SCRIPT",
                        "Keep narration causal", "Director", UUID.randomUUID()));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verifyNoInteractions(jdbc);
    }

    @Test
    void newResearchDraftNeedsTheProductionWriteGateBeforeAnyDatabaseWork() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> safe.draftResearchForBrief(UUID.randomUUID(), Map.of(
                        "truthMap", java.util.List.of("A", "B", "C")),
                        "No source should be saved while writes are off.",
                        0, 1, UUID.randomUUID()));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verifyNoInteractions(jdbc);
    }

    @Test
    void newEpisodeCannotBeCreatedFromShortUnreviewedBrief() {
        assertThrows(ResponseStatusException.class,
                () -> EpisodeWorkspaceService.validatedBrief("Not enough"));
        assertThat(EpisodeWorkspaceService.validatedBrief(
                "  Explain the full cache failure recovery path.  "))
                .isEqualTo("Explain the full cache failure recovery path.");
        assertThrows(ResponseStatusException.class,
                () -> EpisodeWorkspaceService.validatedSources("x".repeat(12001)));
    }

    @Test
    void noSilentAssetLinkCreationWhenGated() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> safe.referenceAsset(UUID.randomUUID(), "ATPhone", "", UUID.randomUUID()));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verifyNoInteractions(jdbc);
    }
}
