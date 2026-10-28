package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class EpisodeLearningServiceTest {
    private final JdbcClient jdbc = mock(JdbcClient.class);
    private final UUID episode = UUID.randomUUID();
    private final UUID proposal = UUID.randomUUID();
    private final UUID audit = UUID.randomUUID();

    @Test
    void noLearningDiscoveryWhenWorkspaceWritesDisabled() {
        EpisodeLearningService learning = new EpisodeLearningService(jdbc, false, false, "");
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> learning.refresh(episode, audit));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verifyNoInteractions(jdbc);
    }

    @Test
    void promotionCannotBeEnabledWithoutAnExplicitReleaseFlag() {
        EpisodeLearningService learning = new EpisodeLearningService(
                jdbc, true, false, "QA-approved-director-secret-longer-than-32-characters");
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> learning.decide(episode, proposal, "PROMOTE_GLOBAL",
                        "Reviewed impact across every episode.", "QA Director", true,
                        "global-fingerprint", "QA-approved-director-secret-longer-than-32-characters", audit));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verifyNoInteractions(jdbc);
    }

    @Test
    void invalidOrMissingDirectorCapabilityCannotPromoteOrDiscardLessons() {
        EpisodeLearningService learning = new EpisodeLearningService(
                jdbc, true, true, "QA-approved-director-secret-longer-than-32-characters");
        for (String action : new String[]{"PROMOTE_GLOBAL", "KEEP_EPISODE", "REJECT"}) {
            for (String token : new String[]{null, "incorrect-token"}) {
                ResponseStatusException error = assertThrows(ResponseStatusException.class,
                        () -> learning.decide(episode, proposal, action,
                                "Reviewed this learning proposal against global rules.",
                                "QA Director", true, "fingerprint", token, audit));
                assertThat(error.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            }
        }
        verifyNoInteractions(jdbc);
    }

    @Test
    void shortSecretCannotUnlockGlobalPromotion() {
        EpisodeLearningService learning = new EpisodeLearningService(jdbc, true, true, "insecure");
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> learning.decide(episode, proposal, "PROMOTE_GLOBAL",
                        "Reviewed this learning proposal against global rules.", "QA Director", true,
                        "fingerprint", "insecure", audit));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verifyNoInteractions(jdbc);
    }

    @Test
    void learningReviewCannotRunAgainstDisabledWorkspaceEvenWithDirectorCapability() {
        EpisodeLearningService learning = new EpisodeLearningService(
                jdbc, false, true, "QA-approved-director-secret-longer-than-32-characters");
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> learning.decide(episode, proposal, "PROMOTE_GLOBAL",
                        "Reviewed this learning proposal against global rules.", "QA Director", true,
                        "fingerprint", "QA-approved-director-secret-longer-than-32-characters", audit));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verifyNoInteractions(jdbc);
    }
}
