package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class EpisodeScopedAgentControllerTest {
    @Test
    void refusesPaidGenerationWithoutPreviewHeaderBeforeCallingAgent() {
        var agents = mock(EpisodeScopedAgentService.class);
        var workspace = mock(EpisodeWorkspaceService.class);
        var controller = new EpisodeScopedAgentController(agents, workspace);
        var request = new MockHttpServletRequest("POST",
                "/api/v1/episodes/33333333-3333-4333-8333-333333333333/agents/script/run");
        var body = new EpisodeScopedAgentController.Request("GENERATE", 0, "");
        var error = assertThrows(ResponseStatusException.class, () ->
                controller.run(UUID.fromString("33333333-3333-4333-8333-333333333333"),
                        "script", body, request));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.PRECONDITION_REQUIRED);
        verifyNoInteractions(agents);
    }
}
