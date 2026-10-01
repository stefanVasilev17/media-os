package com.architecturalthinking.mediaos.director;

import com.architecturalthinking.mediaos.system.AiRuntimePolicyService;
import com.architecturalthinking.mediaos.system.AiSpendGuardAspect;
import com.architecturalthinking.mediaos.system.PreviewAuthorizationService;
import com.architecturalthinking.mediaos.workflow.CreativeAgentClient;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/director/build")
public class EpisodeBuildController {

    private static final String BUILD_OPERATION = "EPISODE_BUILD_START";

    private final EpisodeBuildService buildService;
    private final EpisodeBuildAgentClient buildAgent;
    private final CreativeAgentClient creativeAgent;
    private final AiRuntimePolicyService aiPolicy;
    private final PreviewAuthorizationService previewAuthorization;

    public EpisodeBuildController(
            EpisodeBuildService buildService,
            EpisodeBuildAgentClient buildAgent,
            CreativeAgentClient creativeAgent,
            AiRuntimePolicyService aiPolicy,
            PreviewAuthorizationService previewAuthorization
    ) {
        this.buildService = buildService;
        this.buildAgent = buildAgent;
        this.creativeAgent = creativeAgent;
        this.aiPolicy = aiPolicy;
        this.previewAuthorization = previewAuthorization;
    }

    public record StartRequest(
            @Min(15) @Max(30) Integer budgetMinutes
    ) {}

    @GetMapping
    public Map<String, Object> state() {
        return buildService.state();
    }

    @GetMapping("/preview")
    public Map<String, Object> preview() {
        Map<String, Object> buildState = buildService.state();
        AiRuntimePolicyService.Policy policy = aiPolicy.policy();
        boolean apiConfigured = buildAgent.configured() && creativeAgent.configured();
        boolean canStart = Boolean.TRUE.equals(buildState.get("canStartCurrentEpisode"));

        List<Map<String, Object>> calls = List.of(
                plannedCall("TRUTH", "Truth audit", buildAgent.model(), 9000),
                plannedCall("SCRIPT", "Initial script draft", creativeAgent.model(), 14000),
                plannedCall("SCENE", "Initial scene plan", creativeAgent.model(), 12000)
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("zeroTokenPreview", true);
        result.put("apiConfigured", apiConfigured);
        result.put("paidAiEnabled", policy.paidAiEnabled());
        result.put("autoRepairEnabled", policy.autoRepairEnabled());
        result.put("canStartCurrentEpisode", canStart);
        result.put("plannedPaidCalls", 3);
        result.put("maximumAutomaticCalls", policy.autoRepairEnabled() ? 5 : 3);
        result.put("plannedCalls", calls);
        result.put("automaticRepairCalls", policy.autoRepairEnabled()
                ? List.of(
                        plannedCall("SCRIPT", "Validation repair if needed", creativeAgent.model(), 14000),
                        plannedCall("SCENE", "Validation repair if needed", creativeAgent.model(), 12000)
                )
                : List.of());
        result.put("handoffUsesPaidAi", false);
        result.put("nothingLocksAutomatically", true);

        if (apiConfigured && policy.paidAiEnabled() && canStart) {
            PreviewAuthorizationService.IssuedAuthorization authorization = previewAuthorization.issue(
                    BUILD_OPERATION,
                    previewAuthorization.episodeBuildPayload()
            );
            result.put("authorizationToken", authorization.token());
            result.put("authorizationExpiresAt", authorization.expiresAt());
            result.put("authorizationSingleUse", true);
        } else {
            result.put("authorizationToken", null);
            result.put("authorizationExpiresAt", null);
            result.put("authorizationSingleUse", true);
        }

        result.put("note", policy.autoRepairEnabled()
                ? "Preview only. Starting the build can use up to five paid model calls when validation repairs are needed. A fresh single-use backend authorization is required to start."
                : "Preview only. Starting the build uses three planned paid model calls. Automatic repair is OFF, and a fresh single-use backend authorization is required to start.");
        return result;
    }

    @PostMapping("/topics/generate")
    public Map<String, Object> generateTopics() {
        aiPolicy.requirePaidAiEnabled("topic generation");
        return buildService.generateTopics();
    }

    @PostMapping("/start")
    public Map<String, Object> start(
            @Valid @RequestBody(required = false) StartRequest request,
            @RequestHeader(value = AiSpendGuardAspect.PREVIEW_AUTHORIZATION_HEADER, required = false) String previewToken
    ) {
        aiPolicy.requirePaidAiEnabled("the initial episode build");
        previewAuthorization.consume(previewToken, BUILD_OPERATION, previewAuthorization.episodeBuildPayload());
        int budget = request == null || request.budgetMinutes() == null ? 20 : request.budgetMinutes();
        return buildService.startCurrentEpisode(budget);
    }

    @PostMapping("/retry")
    public Map<String, Object> retry() {
        aiPolicy.requirePaidAiEnabled("the episode build retry");
        return buildService.retryLatest();
    }

    private Map<String, Object> plannedCall(String agent, String operation, String model, int maxOutputTokens) {
        Map<String, Object> call = new LinkedHashMap<>();
        call.put("agent", agent);
        call.put("operation", operation);
        call.put("model", model);
        call.put("maxOutputTokens", maxOutputTokens);
        return call;
    }
}
