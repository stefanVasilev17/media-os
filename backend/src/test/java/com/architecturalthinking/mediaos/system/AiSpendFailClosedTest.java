package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.director.EpisodeBuildAgentClient;
import com.architecturalthinking.mediaos.workflow.CreativeAgentClient;
import com.architecturalthinking.mediaos.workflow.ShotPromptContextService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AiSpendFailClosedTest {
    private final AiRuntimePolicyService policy = mock(AiRuntimePolicyService.class);
    private final PreviewAuthorizationService preview = mock(PreviewAuthorizationService.class);
    private final ShotPromptContextService firstPass = mock(ShotPromptContextService.class);
    private final AiSpendGuardAspect guard = new AiSpendGuardAspect(policy, preview, firstPass);

    @Test
    void paidLegacyTruthAuditWithoutPreviewCannotReachModel() throws Throwable {
        when(policy.policy()).thenReturn(new AiRuntimePolicyService.Policy(true, false, null));
        ProceedingJoinPoint call = mock(ProceedingJoinPoint.class);
        EpisodeBuildAgentClient agent = mock(EpisodeBuildAgentClient.class);
        when(call.getTarget()).thenReturn(agent);
        when(agent.model()).thenReturn("test-model");

        ResponseStatusException denied = assertThrows(ResponseStatusException.class,
                () -> guard.guardTruthAudit(call));

        assertEquals(HttpStatus.PRECONDITION_REQUIRED, denied.getStatusCode());
        verify(call, never()).proceed();
        verifyNoInteractions(preview);
        verify(policy).recordBlocked(eq("TRUTH"), eq("TRUTH_AUDIT"), eq("test-model"),
                eq(9000), contains("verified interactive Director"));
    }

    @Test
    void automatedRepairWithoutWorkloadIdentityCannotReachModel() throws Throwable {
        when(policy.policy()).thenReturn(new AiRuntimePolicyService.Policy(true, true, null));
        ProceedingJoinPoint call = mock(ProceedingJoinPoint.class);
        CreativeAgentClient agent = mock(CreativeAgentClient.class);
        when(agent.model()).thenReturn("test-model");
        when(call.getTarget()).thenReturn(agent);
        when(call.getArgs()).thenReturn(new Object[]{
                "SCRIPT", "REVISE", List.of(), Map.of("validationFailures", List.of("bad artifact"))});

        ResponseStatusException denied = assertThrows(ResponseStatusException.class,
                () -> guard.guardCreativeAgent(call));

        assertEquals(HttpStatus.PRECONDITION_REQUIRED, denied.getStatusCode());
        verify(call, never()).proceed();
        verifyNoInteractions(preview);
        verify(policy).recordBlocked(eq("SCRIPT"), eq("SCRIPT_REVISE"), eq("test-model"),
                eq(14000), contains("workload authorization"));
    }
}
