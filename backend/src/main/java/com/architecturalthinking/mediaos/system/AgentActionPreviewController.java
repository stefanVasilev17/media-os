package com.architecturalthinking.mediaos.system;

import com.architecturalthinking.mediaos.director.DirectorAgentClient;
import com.architecturalthinking.mediaos.director.EpisodeBuildAgentClient;
import com.architecturalthinking.mediaos.workflow.CreativeAgentClient;
import com.architecturalthinking.mediaos.workflow.ProductionOverviewService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/previews")
public class AgentActionPreviewController {

    private final JdbcClient jdbc;
    private final AiRuntimePolicyService aiPolicy;
    private final PreviewAuthorizationService previewAuthorization;
    private final DirectorAgentClient directorAgent;
    private final EpisodeBuildAgentClient buildAgent;
    private final CreativeAgentClient creativeAgent;

    public AgentActionPreviewController(
            JdbcClient jdbc,
            AiRuntimePolicyService aiPolicy,
            PreviewAuthorizationService previewAuthorization,
            DirectorAgentClient directorAgent,
            EpisodeBuildAgentClient buildAgent,
            CreativeAgentClient creativeAgent
    ) {
        this.jdbc = jdbc;
        this.aiPolicy = aiPolicy;
        this.previewAuthorization = previewAuthorization;
        this.directorAgent = directorAgent;
        this.buildAgent = buildAgent;
        this.creativeAgent = creativeAgent;
    }

    public record DirectorPreviewRequest(
            @Size(max = 6000) String message,
            String mode
    ) {}

    public record CreativePreviewRequest(
            String action,
            @Size(max = 6000) String message
    ) {}

    @PostMapping("/director")
    public Map<String, Object> director(@Valid @RequestBody(required = false) DirectorPreviewRequest request) {
        String message = clean(request == null ? null : request.message());
        String mode = normalizeDirectorMode(request == null ? null : request.mode());
        String operation = "DIRECTOR_" + mode;
        AiRuntimePolicyService.Policy policy = aiPolicy.policy();

        List<String> blockers = new ArrayList<>();
        if (message.isBlank()) blockers.add("Write a Director message first.");
        if (!directorAgent.configured()) blockers.add("OpenAI API is not configured for Director.");
        if (!policy.paidAiEnabled()) blockers.add("Paid AI is OFF in Settings.");

        Map<String, Object> result = basePreview(
                "DIRECTOR",
                "Director discussion",
                operation,
                directorAgent.model(),
                3000,
                policy,
                directorAgent.configured(),
                blockers
        );
        result.put("mode", mode);
        result.put("messageCharacters", message.length());
        result.put("contextSources", List.of(
                "Current episode state",
                "Production metrics",
                "Locked and open Director proposals",
                "Recent Spline shot jobs",
                "Recent Director conversation"
        ));
        result.put("onSuccess", List.of(
                "Stores your message and the Director reply.",
                "May create a reviewable proposal when the Director recommends a concrete production change.",
                "Does not spend anything during this preview."
        ));
        result.put("locksAutomatically", false);
        attachAuthorization(result, blockers, operation, previewAuthorization.directorPayload(mode, message));
        return result;
    }

    @PostMapping("/creative/{stageKey}")
    public Map<String, Object> creative(
            @PathVariable String stageKey,
            @Valid @RequestBody(required = false) CreativePreviewRequest request
    ) {
        String key = normalizeCreativeStage(stageKey);
        String action = normalizeCreativeAction(request == null ? null : request.action());
        String message = clean(request == null ? null : request.message());
        String operation = key + "_" + action;
        AiRuntimePolicyService.Policy policy = aiPolicy.policy();
        Map<String, Object> stage = stageSnapshot(key);
        boolean upstreamReady = upstreamReady(key);
        boolean locked = "LOCKED".equals(stage.get("status"));

        List<String> blockers = new ArrayList<>();
        if (locked) blockers.add(stage.get("displayName") + " is already locked.");
        if (!upstreamReady) blockers.add("The required upstream production contract is not locked yet.");
        if ("REVISE".equals(action) && message.isBlank()) blockers.add("Write a correction before previewing a revision.");
        if (!creativeAgent.configured()) blockers.add("OpenAI API is not configured for creative agents.");
        if (!policy.paidAiEnabled()) blockers.add("Paid AI is OFF in Settings.");

        int outputLimit = "SCENE".equals(key) ? 12000 : 14000;
        Map<String, Object> result = basePreview(
                key,
                stage.get("displayName") + " Agent",
                operation,
                creativeAgent.model(),
                outputLimit,
                policy,
                creativeAgent.configured(),
                blockers
        );
        result.put("action", action);
        result.put("currentRevision", stage.get("revision"));
        result.put("hasArtifact", stage.get("hasArtifact"));
        result.put("messageCharacters", message.length());
        result.put("upstreamReady", upstreamReady);
        result.put("contextSources", "SCRIPT".equals(key)
                ? List.of("Episode source of truth", "Locked Research & Truth handoff", "Current Script draft", "Creator memory", "Production overview")
                : List.of("Episode source of truth", "Locked Script handoff", "Current Scene draft", "Creator memory", "Production overview"));
        result.put("onSuccess", List.of(
                "GENERATE".equals(action) ? "Creates one complete draft revision." : "Creates one complete revised artifact revision.",
                "Runs deterministic validation after the model returns.",
                "Does not lock the stage automatically."
        ));
        result.put("locksAutomatically", false);
        attachAuthorization(result, blockers, operation, previewAuthorization.creativePayload(key, action, message));
        return result;
    }

    @GetMapping("/topics")
    public Map<String, Object> topics() {
        String operation = "TOPIC_CANDIDATES";
        AiRuntimePolicyService.Policy policy = aiPolicy.policy();
        List<String> blockers = new ArrayList<>();
        if (!buildAgent.configured()) blockers.add("OpenAI API is not configured for Topic Agent.");
        if (!policy.paidAiEnabled()) blockers.add("Paid AI is OFF in Settings.");

        Map<String, Object> result = basePreview(
                "TOPIC",
                "Topic Agent",
                operation,
                buildAgent.model(),
                9000,
                policy,
                buildAgent.configured(),
                blockers
        );
        result.put("contextSources", List.of(
                "Canonical creative policy",
                "Current episode",
                "Current source snapshot",
                "Existing topic candidates",
                "Production overview"
        ));
        result.put("onSuccess", List.of(
                "Generates exactly six structured future episode candidates.",
                "Archives only the previous READY candidates after the model call succeeds.",
                "Does not change the current episode or lock a decision."
        ));
        result.put("locksAutomatically", false);
        attachAuthorization(result, blockers, operation, previewAuthorization.topicPayload());
        return result;
    }

    private void attachAuthorization(
            Map<String, Object> result,
            List<String> blockers,
            String operation,
            String payload
    ) {
        if (!blockers.isEmpty()) {
            result.put("authorizationToken", null);
            result.put("authorizationExpiresAt", null);
            return;
        }
        PreviewAuthorizationService.IssuedAuthorization authorization = previewAuthorization.issue(operation, payload);
        result.put("authorizationToken", authorization.token());
        result.put("authorizationExpiresAt", authorization.expiresAt());
        result.put("authorizationSingleUse", true);
    }

    private Map<String, Object> basePreview(
            String agentKey,
            String agentName,
            String operation,
            String model,
            int maxOutputTokens,
            AiRuntimePolicyService.Policy policy,
            boolean configured,
            List<String> blockers
    ) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("zeroTokenPreview", true);
        result.put("agentKey", agentKey);
        result.put("agentName", agentName);
        result.put("operation", operation);
        result.put("model", model);
        result.put("plannedPaidCalls", 1);
        result.put("maxOutputTokens", maxOutputTokens);
        result.put("paidAiEnabled", policy.paidAiEnabled());
        result.put("apiConfigured", configured);
        result.put("autoRepairEnabled", policy.autoRepairEnabled());
        result.put("canRun", blockers.isEmpty());
        result.put("blockers", blockers);
        result.put("previewMutatesState", false);
        result.put("previewUsesPaidAi", false);
        return result;
    }

    private Map<String, Object> stageSnapshot(String key) {
        return jdbc.sql("""
                select display_name, status, current_revision, artifact is not null as has_artifact
                from production_stage
                where episode_id=:episodeId and stage_key=:stageKey
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("stageKey", key)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "displayName", rs.getString("display_name"),
                        "status", rs.getString("status"),
                        "revision", rs.getInt("current_revision"),
                        "hasArtifact", rs.getBoolean("has_artifact")
                ))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Production stage not found: " + key));
    }

    private boolean upstreamReady(String key) {
        String requiredStage = "SCRIPT".equals(key) ? "RESEARCH" : "SCRIPT";
        return jdbc.sql("""
                select exists(
                  select 1 from production_stage
                  where episode_id=:episodeId and stage_key=:requiredStage and status='LOCKED'
                )
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("requiredStage", requiredStage)
                .query(Boolean.class)
                .single();
    }

    private String normalizeCreativeStage(String value) {
        String normalized = clean(value).toUpperCase(Locale.ROOT);
        if (!List.of("SCRIPT", "SCENE").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported creative preview stage: " + value);
        }
        return normalized;
    }

    private String normalizeCreativeAction(String value) {
        return "REVISE".equalsIgnoreCase(clean(value)) ? "REVISE" : "GENERATE";
    }

    private String normalizeDirectorMode(String value) {
        String normalized = clean(value).toUpperCase(Locale.ROOT);
        return List.of("DISCUSS", "CHALLENGE", "IMPROVE", "IMPACT").contains(normalized) ? normalized : "DISCUSS";
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
