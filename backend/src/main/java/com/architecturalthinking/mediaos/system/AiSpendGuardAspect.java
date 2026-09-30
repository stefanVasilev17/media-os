package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.director.DirectorAgentClient;
import com.architecturalthinking.mediaos.director.EpisodeBuildAgentClient;
import com.architecturalthinking.mediaos.workflow.CreativeAgentClient;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

import static org.springframework.http.HttpStatus.CONFLICT;

@Aspect
@Component
public class AiSpendGuardAspect {

    private final AiRuntimePolicyService policyService;

    public AiSpendGuardAspect(AiRuntimePolicyService policyService) {
        this.policyService = policyService;
    }

    @Around("execution(public * com.architecturalthinking.mediaos.director.DirectorAgentClient.generate(..))")
    public Object guardDirector(ProceedingJoinPoint joinPoint) throws Throwable {
        DirectorAgentClient target = (DirectorAgentClient) joinPoint.getTarget();
        Object[] args = joinPoint.getArgs();
        String mode = args.length > 0 && args[0] != null ? String.valueOf(args[0]) : "DISCUSS";
        return guardedCall(joinPoint, "DIRECTOR", "DIRECTOR_" + mode, target.model(), 3000, false);
    }

    @Around("execution(public * com.architecturalthinking.mediaos.director.EpisodeBuildAgentClient.suggestTopics(..))")
    public Object guardTopicPlanning(ProceedingJoinPoint joinPoint) throws Throwable {
        EpisodeBuildAgentClient target = (EpisodeBuildAgentClient) joinPoint.getTarget();
        return guardedCall(joinPoint, "TOPIC", "TOPIC_CANDIDATES", target.model(), 9000, false);
    }

    @Around("execution(public * com.architecturalthinking.mediaos.director.EpisodeBuildAgentClient.auditTruth(..))")
    public Object guardTruthAudit(ProceedingJoinPoint joinPoint) throws Throwable {
        EpisodeBuildAgentClient target = (EpisodeBuildAgentClient) joinPoint.getTarget();
        return guardedCall(joinPoint, "TRUTH", "TRUTH_AUDIT", target.model(), 9000, false);
    }

    @Around("execution(public * com.architecturalthinking.mediaos.workflow.CreativeAgentClient.generate(..))")
    public Object guardCreativeAgent(ProceedingJoinPoint joinPoint) throws Throwable {
        CreativeAgentClient target = (CreativeAgentClient) joinPoint.getTarget();
        Object[] args = joinPoint.getArgs();
        String stage = args.length > 0 && args[0] != null ? String.valueOf(args[0]) : "CREATIVE";
        String action = args.length > 1 && args[1] != null ? String.valueOf(args[1]) : "GENERATE";
        Map<?, ?> context = args.length > 3 && args[3] instanceof Map<?, ?> map ? map : Map.of();
        boolean automaticRepair = "REVISE".equalsIgnoreCase(action)
                && (context.containsKey("validationFailures") || context.containsKey("repairInstruction"));
        int outputLimit = "SCENE".equalsIgnoreCase(stage) ? 12000 : 14000;
        return guardedCall(
                joinPoint,
                stage.toUpperCase(),
                stage.toUpperCase() + "_" + action.toUpperCase(),
                target.model(),
                outputLimit,
                automaticRepair
        );
    }

    private Object guardedCall(
            ProceedingJoinPoint joinPoint,
            String agentKey,
            String operation,
            String model,
            int requestedOutputTokenLimit,
            boolean automaticRepair
    ) throws Throwable {
        AiRuntimePolicyService.Policy policy = policyService.policy();

        if (!policy.paidAiEnabled()) {
            String reason = "Paid AI is OFF. MediaOS blocked the model call before any API request was sent.";
            policyService.recordBlocked(agentKey, operation, model, requestedOutputTokenLimit, reason);
            throw new ResponseStatusException(CONFLICT, reason + " Enable Paid AI in Settings only when you are ready to spend credits.");
        }

        if (automaticRepair && !policy.autoRepairEnabled()) {
            String reason = "Automatic AI repair is OFF. MediaOS blocked the extra repair call before it could spend more credits.";
            policyService.recordBlocked(agentKey, operation, model, requestedOutputTokenLimit, reason);
            throw new ResponseStatusException(CONFLICT, reason + " Review the validation failure first, then decide whether another model call is worth it.");
        }

        UUID callId = policyService.beginCall(agentKey, operation, model, requestedOutputTokenLimit);
        try {
            Object result = joinPoint.proceed();
            policyService.completeSuccess(callId);
            return result;
        } catch (Throwable failure) {
            policyService.completeFailure(callId, failure.getMessage());
            throw failure;
        }
    }
}
