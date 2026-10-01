package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.director.DirectorAgentClient;
import com.architecturalthinking.mediaos.director.EpisodeBuildAgentClient;
import com.architecturalthinking.mediaos.workflow.CreativeAgentClient;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.http.HttpStatus.CONFLICT;

@Aspect
@Component
public class AiSpendGuardAspect {

    public static final String PREVIEW_AUTHORIZATION_HEADER = "X-MediaOS-Preview-Authorization";

    private final AiRuntimePolicyService policyService;
    private final PreviewAuthorizationService previewAuthorization;

    public AiSpendGuardAspect(
            AiRuntimePolicyService policyService,
            PreviewAuthorizationService previewAuthorization
    ) {
        this.policyService = policyService;
        this.previewAuthorization = previewAuthorization;
    }

    @Around("execution(public * com.architecturalthinking.mediaos.director.DirectorAgentClient.generate(..))")
    public Object guardDirector(ProceedingJoinPoint joinPoint) throws Throwable {
        DirectorAgentClient target = (DirectorAgentClient) joinPoint.getTarget();
        Object[] args = joinPoint.getArgs();
        String mode = args.length > 0 && args[0] != null ? String.valueOf(args[0]) : "DISCUSS";
        String message = args.length > 1 ? lastDirectorUserMessage(args[1]) : "";
        String operation = "DIRECTOR_" + mode.toUpperCase();
        return guardedCall(
                joinPoint,
                "DIRECTOR",
                operation,
                target.model(),
                3000,
                false,
                previewAuthorization.directorPayload(mode, message)
        );
    }

    @Around("execution(public * com.architecturalthinking.mediaos.director.EpisodeBuildAgentClient.suggestTopics(..))")
    public Object guardTopicPlanning(ProceedingJoinPoint joinPoint) throws Throwable {
        EpisodeBuildAgentClient target = (EpisodeBuildAgentClient) joinPoint.getTarget();
        return guardedCall(
                joinPoint,
                "TOPIC",
                "TOPIC_CANDIDATES",
                target.model(),
                9000,
                false,
                previewAuthorization.topicPayload()
        );
    }

    @Around("execution(public * com.architecturalthinking.mediaos.director.EpisodeBuildAgentClient.auditTruth(..))")
    public Object guardTruthAudit(ProceedingJoinPoint joinPoint) throws Throwable {
        EpisodeBuildAgentClient target = (EpisodeBuildAgentClient) joinPoint.getTarget();
        return guardedCall(joinPoint, "TRUTH", "TRUTH_AUDIT", target.model(), 9000, false, null);
    }

    @Around("execution(public * com.architecturalthinking.mediaos.workflow.CreativeAgentClient.generate(..))")
    public Object guardCreativeAgent(ProceedingJoinPoint joinPoint) throws Throwable {
        CreativeAgentClient target = (CreativeAgentClient) joinPoint.getTarget();
        Object[] args = joinPoint.getArgs();
        String stage = args.length > 0 && args[0] != null ? String.valueOf(args[0]) : "CREATIVE";
        String action = args.length > 1 && args[1] != null ? String.valueOf(args[1]) : "GENERATE";
        String message = args.length > 2 ? lastCreativeUserMessage(args[2]) : "";
        Map<?, ?> context = args.length > 3 && args[3] instanceof Map<?, ?> map ? map : Map.of();
        boolean automaticRepair = "REVISE".equalsIgnoreCase(action)
                && (context.containsKey("validationFailures") || context.containsKey("repairInstruction"));
        int outputLimit = "SCENE".equalsIgnoreCase(stage) ? 12000 : 14000;
        String operation = stage.toUpperCase() + "_" + action.toUpperCase();
        String previewPayload = automaticRepair
                ? null
                : previewAuthorization.creativePayload(stage, action, message);
        return guardedCall(
                joinPoint,
                stage.toUpperCase(),
                operation,
                target.model(),
                outputLimit,
                automaticRepair,
                previewPayload
        );
    }

    private Object guardedCall(
            ProceedingJoinPoint joinPoint,
            String agentKey,
            String operation,
            String model,
            int requestedOutputTokenLimit,
            boolean automaticRepair,
            String previewPayload
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

        if (!automaticRepair && previewPayload != null && currentRequest() != null) {
            try {
                previewAuthorization.consume(currentPreviewToken(), operation, previewPayload);
            } catch (ResponseStatusException ex) {
                policyService.recordBlocked(
                        agentKey,
                        operation,
                        model,
                        requestedOutputTokenLimit,
                        "Backend preview authorization rejected the paid action before any API request was sent."
                );
                throw ex;
            }
        }

        UUID callId = policyService.beginCall(agentKey, operation, model, requestedOutputTokenLimit);
        AiUsageCapture.clear();
        try {
            Object result = joinPoint.proceed();
            persistUsage(callId);
            policyService.completeSuccess(callId);
            return result;
        } catch (Throwable failure) {
            persistUsage(callId);
            policyService.completeFailure(callId, failure.getMessage());
            throw failure;
        } finally {
            AiUsageCapture.clear();
        }
    }

    private String lastDirectorUserMessage(Object transcriptArg) {
        if (!(transcriptArg instanceof List<?> transcript)) return "";
        for (int i = transcript.size() - 1; i >= 0; i--) {
            Object item = transcript.get(i);
            if (item instanceof DirectorAgentClient.TranscriptMessage message
                    && "USER".equalsIgnoreCase(message.sender())) {
                return message.content();
            }
        }
        return "";
    }

    private String lastCreativeUserMessage(Object transcriptArg) {
        if (!(transcriptArg instanceof List<?> transcript)) return "";
        for (int i = transcript.size() - 1; i >= 0; i--) {
            Object item = transcript.get(i);
            if (item instanceof CreativeAgentClient.TranscriptMessage message
                    && "USER".equalsIgnoreCase(message.sender())) {
                return message.content();
            }
        }
        return "";
    }

    private ServletRequestAttributes currentRequest() {
        return RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes
                ? attributes
                : null;
    }

    private String currentPreviewToken() {
        ServletRequestAttributes attributes = currentRequest();
        return attributes == null ? null : attributes.getRequest().getHeader(PREVIEW_AUTHORIZATION_HEADER);
    }

    private void persistUsage(UUID callId) {
        AiUsageCapture.Usage usage = AiUsageCapture.take();
        if (usage == null) return;
        policyService.recordUsage(
                callId,
                usage.inputTokens(),
                usage.outputTokens(),
                usage.totalTokens(),
                usage.cachedInputTokens(),
                usage.reasoningTokens()
        );
    }
}
