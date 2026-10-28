package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.workflow.CreativeAgentClient;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class EpisodeScopedAiSpendGuardTest {
    @Test
    void refusesScopedPaidCallWhenNoRequestBoundAuthorizationExists() throws Throwable {
        var policy = mock(AiRuntimePolicyService.class);
        var tokens = mock(PreviewAuthorizationService.class);
        var creative = mock(CreativeAgentClient.class);
        var joinPoint = mock(ProceedingJoinPoint.class);
        when(joinPoint.getTarget()).thenReturn(creative);
        when(joinPoint.getArgs()).thenReturn(new Object[]{
                "SCRIPT", "GENERATE", List.of(),
                Map.of("scopedEpisodeId", UUID.randomUUID().toString(),
                        "scopedExpectedRevision", 0, "scopedUpstreamRevision", 1)
        });
        var aspect = new AiSpendGuardAspect(policy, tokens);
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> aspect.guardCreativeAgent(joinPoint));
        assertThat(error.getStatusCode()).isEqualTo(HttpStatus.PRECONDITION_REQUIRED);
        verify(joinPoint, never()).proceed();
        verifyNoInteractions(policy, tokens);
    }
}
