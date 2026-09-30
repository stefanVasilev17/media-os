package com.architecturalthinking.mediaos.director;

import com.architecturalthinking.mediaos.system.AiRuntimePolicyService;
import com.architecturalthinking.mediaos.workflow.CreativeAgentClient;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/director/build")
public class EpisodeBuildController {

    private final EpisodeBuildService buildService;
    private final EpisodeBuildAgentClient buildAgent;
    private final CreativeAgentClient creativeAgent;
    private final AiRuntimePolicyService aiPolicy;

    public EpisodeBuildController(
            EpisodeBuildService buildService,
            EpisodeBuildAgentClient buildAgent,
            CreativeAgentClient creativeAgent,
            AiRuntimePolicyService aiPolicy
    ) {
        this.buildService = buildService;
        this.buildAgent = buildAgent;
        this.creativeAgent = creativeAgent;
        this.aiPolicy = aiPolicy;
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

        List<Map<String, Object>> calls = List.of(
                plannedCall("TRUTH", "Truth audit", buildAgent.model(), 9000),
                plannedCall("SCRIPT", "Initial script draft", creativeAgent.model(), 14000),
                plannedCall("SCENE", "Initial scene plan", creativeAgent.model(), 12000)
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("zeroTokenPreview", true);
        result.put("apiConfigured", buildAgent.configured() && creativeAgent.configured());
        result.put("paidAiEnabled", policy.paidAiEnabled());
        result.put("autoRepairEnabled", policy.autoRepairEnabled());
        result.put("canStartCurrentEpisode", Boolean.TRUE.equals(buildState.get("canStartCurrentEpisode")));
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
        result.put("note", policy.autoRepairEnabled()
                ? "Preview only. Starting the build can use up to five paid model calls when validation repairs are needed."
                : "Preview only. Starting the build uses three planned paid model calls. Automatic repair is OFF, so MediaOS cannot silently spend extra credits on repair calls.");
        return result;
    }

    @PostMapping("/topics/generate")
    public Map<String, Object> generateTopics() {
        aiPolicy.requirePaidAiEnabled("topic generation");
        return buildService.generateTopics();
    }

    @PostMapping("/start")
    public Map<String, Object> start(@Valid @RequestBody(required = false) StartRequest request) {
        aiPolicy.requirePaidAiEnabled("the initial episode build");
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
