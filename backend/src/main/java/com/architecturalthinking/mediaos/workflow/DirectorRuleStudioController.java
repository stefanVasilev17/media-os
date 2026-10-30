package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.AiRuntimePolicyService;
import com.architecturalthinking.mediaos.system.AiUsageCapture;
import com.architecturalthinking.mediaos.system.PreviewAuthorizationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rule-studio")
public class DirectorRuleStudioController {
    private static final String OPERATION = "DIRECTOR_RULE_FORMULATE";
    private static final String CAPABILITY = "X-MediaOS-Director-Approval";
    private static final String PAID_TOKEN = "X-MediaOS-Preview-Authorization";

    private final DirectorRuleStudioService rules;
    private final DirectorRuleStudioAiClient ai;
    private final AiRuntimePolicyService policy;
    private final PreviewAuthorizationService tokens;

    public DirectorRuleStudioController(DirectorRuleStudioService rules,
                                        DirectorRuleStudioAiClient ai,
                                        AiRuntimePolicyService policy,
                                        PreviewAuthorizationService tokens) {
        this.rules = rules;
        this.ai = ai;
        this.policy = policy;
        this.tokens = tokens;
    }

    public record RuleRequest(UUID episodeId, @NotBlank String scope,
                              UUID parentProposalId,
                              @NotBlank @Size(min=5,max=4000) String message) {}
    public record ManualRequest(UUID episodeId, @NotBlank String scope,
                                UUID parentProposalId,
                                @NotBlank @Size(min=5,max=4000) String message,
                                @NotBlank @Size(min=15,max=2000) String ruleEnglish) {}
    public record ReviewRequest(@NotBlank String decision,
                                @NotBlank String expectedFingerprint,
                                boolean comparedExistingRules,
                                @NotBlank @Size(min=3,max=120) String reviewer,
                                @NotBlank @Size(min=15,max=1500) String directorNote) {}

    @GetMapping
    public Map<String, Object> home() {
        return Map.of("proposals", rules.recent(), "writesEnabled", rules.writesEnabled(),
                "aiConfigured", ai.configured(), "paidAiEnabled", policy.paidAiEnabled(),
                "model", ai.model(), "automaticActivation", false);
    }

    @GetMapping("/proposals/{id}")
    public Map<String, Object> proposal(@PathVariable UUID id) {
        Map<String, Object> response = new LinkedHashMap<>(rules.proposal(id));
        UUID episodeId = response.get("episodeId") == null
                ? null : UUID.fromString((String) response.get("episodeId"));
        response.put("comparison", rules.compare(episodeId, (String) response.get("scope"),
                (String) response.get("proposedRule")));
        return response;
    }

    @GetMapping("/effective-rules")
    public Map<String, Object> effectiveRules(@RequestParam(required=false) UUID episodeId,
                                              @RequestParam(defaultValue="VOICE_VISUAL") String scope) {
        return Map.of("episodeId", episodeId == null ? "GLOBAL" : episodeId.toString(),
                "scope", scope, "rules", rules.effectiveRules(episodeId, scope));
    }

    @PostMapping("/manual")
    public Map<String, Object> manual(@Valid @RequestBody ManualRequest req,
                                      @RequestHeader(value=CAPABILITY, required=false) String director) {
        rules.requireDirector(director);
        Map<String, Object> prepared = rules.previewContext(
                req.episodeId(), req.scope(), req.message(), req.parentProposalId());
        Map<String, Object> draft = rules.create(new DirectorRuleStudioService.DraftInput(
                req.episodeId(), req.scope(), req.parentProposalId(), req.message(),
                req.ruleEnglish(), "Manual Director wording; review before activation.",
                "", "", "MANUAL", (String) prepared.get("rulesFingerprint")), director);
        return proposal(UUID.fromString((String) draft.get("id")));
    }

    @PostMapping("/ai/preview")
    public Map<String, Object> preview(@Valid @RequestBody RuleRequest req,
                                       @RequestHeader(value=CAPABILITY, required=false) String director) {
        rules.requireDirector(director);
        policy.requirePaidAiEnabled("Director Rule Studio");
        if (!ai.configured())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "OPENAI_API_KEY not configured.");
        Map<String, Object> ctx = rules.previewContext(
                req.episodeId(), req.scope(), req.message(), req.parentProposalId());
        var issued = tokens.issue(OPERATION, authorizationPayload(req, ctx));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("authorizationToken", issued.token().toString());
        result.put("expiresAt", issued.expiresAt().toString());
        result.put("model", ai.model());
        result.put("maxOutputTokens", 1600);
        result.put("zeroTokenPreview", true);
        result.put("requiresConfirmation", true);
        result.put("mandatoryRuleCount", ctx.get("mandatoryRuleCount"));
        result.put("additionalRuleCount", ctx.get("optionalRuleCount"));
        result.put("policyVersion", ctx.get("policyVersion"));
        result.put("ruleFingerprint", ctx.get("rulesFingerprint"));
        result.put("relatedRules", ctx.get("relatedRules"));
        return result;
    }

    @PostMapping("/ai/run")
    public Map<String, Object> generate(@Valid @RequestBody RuleRequest req,
                                        @RequestHeader(value=CAPABILITY, required=false) String director,
                                        @RequestHeader(value=PAID_TOKEN, required=false) String paidToken) {
        rules.requireDirector(director);
        policy.requirePaidAiEnabled("Director Rule Studio");
        if (!ai.configured())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "OPENAI_API_KEY not configured.");

        Map<String, Object> ctx = rules.previewContext(req.episodeId(), req.scope(),
                req.message(), req.parentProposalId());
        tokens.consume(paidToken, OPERATION, authorizationPayload(req, ctx));
        UUID callId = policy.beginCall("RULE_STUDIO", OPERATION, ai.model(), 1600);
        AiUsageCapture.clear();
        DirectorRuleStudioAiClient.RuleSuggestion suggestion;
        try {
            suggestion = ai.reformulate(req.message(), req.scope(), String.valueOf(ctx.get("parentRule")),
                    String.valueOf(ctx.get("compiledRules")), ctx.get("relatedRules"));
            var usage = AiUsageCapture.take();
            if (usage != null) policy.recordUsage(callId, usage.inputTokens(), usage.outputTokens(),
                    usage.totalTokens(), usage.cachedInputTokens(), usage.reasoningTokens());
            policy.completeSuccess(callId);
        } catch (Exception error) {
            policy.completeFailure(callId, error.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "AI rule formulation failed. No rule was published.", error);
        } finally {
            AiUsageCapture.clear();
        }
        Map<String, Object> created = rules.create(new DirectorRuleStudioService.DraftInput(
                req.episodeId(), req.scope(), req.parentProposalId(), req.message(),
                suggestion.ruleEnglish(), suggestion.explanationBulgarian(),
                suggestion.positiveExample(), suggestion.negativeExample(),
                "OPENAI", (String) ctx.get("rulesFingerprint")), director);
        Map<String, Object> result = new LinkedHashMap<>(proposal(UUID.fromString((String) created.get("id"))));
        result.put("published", false);
        result.put("nextAction", "Director Review → Approve & Activate");
        return result;
    }

    @PostMapping("/proposals/{id}/review")
    public Map<String, Object> review(@PathVariable UUID id,
                                      @Valid @RequestBody ReviewRequest req,
                                      @RequestHeader(value=CAPABILITY, required=false) String director) {
        var reviewed = rules.decide(id, req.decision(), req.expectedFingerprint(),
                req.comparedExistingRules(), req.reviewer(),
                req.directorNote(), director);
        return proposal(UUID.fromString((String) reviewed.get("id")));
    }

    static String authorizationPayload(RuleRequest req, Map<String, Object> context) {
        return "EPISODE=" + (req.episodeId() == null ? "GLOBAL" : req.episodeId())
                + "|SCOPE=" + req.scope()
                + "|PARENT=" + (req.parentProposalId() == null ? "NONE" : req.parentProposalId())
                + "|RULES=" + context.get("rulesFingerprint")
                + "|CURRENT_MEMORY=" + context.get("currentRulesFingerprint")
                + "|MESSAGE=" + req.message();
    }
}
