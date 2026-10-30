package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.AiRuntimePolicyService;
import com.architecturalthinking.mediaos.system.AiSpendGuardAspect;
import com.architecturalthinking.mediaos.system.AiUsageCapture;
import com.architecturalthinking.mediaos.system.PreviewAuthorizationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
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
@RequestMapping("/api/v1/episodes/{episodeId}/shot-revisions/{shotKey}")
public class ShotRevisionAgentController {
    private static final String OPERATION = "SHOT_REVISION_REVISE";
    private final ShotRevisionService revisions;
    private final EpisodeWorkspaceService episodes;
    private final ShotRevisionAiClient ai;
    private final AiRuntimePolicyService policy;
    private final PreviewAuthorizationService authorizations;
    private final ShotQualityGateService quality;

    public ShotRevisionAgentController(ShotRevisionService revisions, EpisodeWorkspaceService episodes,
                                       ShotRevisionAiClient ai, AiRuntimePolicyService policy,
                                       PreviewAuthorizationService authorizations, ShotQualityGateService quality) {
        this.revisions = revisions;
        this.episodes = episodes;
        this.ai = ai;
        this.policy = policy;
        this.authorizations = authorizations;
        this.quality = quality;
    }

    public record ChatRequest(@NotBlank @Size(max=6000) String message) {}
    public record DraftRequest(@NotNull @Min(0) Integer expectedRevision,
                               @NotBlank @Size(max=16000) String narration,
                               @Size(max=1200) String voiceDirection,
                               @Size(max=12000) String visualDirection,
                               @Size(max=2000) String changeSummary) {}
    public record LockRequest(@NotNull @Min(1) Integer expectedRevision,
                              @NotBlank String decision,
                              @NotBlank @Size(min=10,max=1500) String directorNote) {}
    public record AiRequest(@NotNull @Min(0) Integer expectedRevision,
                            @NotBlank @Size(max=6000) String message,
                            boolean aiEnabled) {}

    @GetMapping
    public Map<String, Object> state(@PathVariable UUID episodeId, @PathVariable String shotKey) {
        Map<String, Object> result = new LinkedHashMap<>(revisions.state(episodeId, shotKey));
        result.put("writesEnabled", episodes.writesEnabled());
        result.put("paidAiEnabled", policy.paidAiEnabled());
        result.put("aiConfigured", ai.configured());
        result.put("aiModel", ai.model());
        result.put("qualityRuleFingerprint", quality.fingerprint(episodeId));
        return result;
    }

    @PostMapping("/messages")
    public Map<String, Object> manualMessage(@PathVariable UUID episodeId,
                                              @PathVariable String shotKey,
                                              @Valid @RequestBody ChatRequest request) {
        requireWrites();
        return revisions.message(episodeId, shotKey, request.message());
    }

    @PutMapping("/draft")
    public Map<String, Object> saveDraft(@PathVariable UUID episodeId, @PathVariable String shotKey,
                                         @Valid @RequestBody DraftRequest request) {
        requireWrites();
        return revisions.saveDraft(episodeId, shotKey, request.expectedRevision(),
                request.narration(), request.voiceDirection(), request.visualDirection(),
                request.changeSummary(), "MANUAL");
    }

    @PostMapping("/director-lock")
    public Map<String, Object> lock(@PathVariable UUID episodeId, @PathVariable String shotKey,
                                    @Valid @RequestBody LockRequest request) {
        requireWrites();
        if (!"DIRECTOR_APPROVE".equals(request.decision()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only explicit DIRECTOR_APPROVE may publish the new Voice and Video revision.");
        return revisions.lock(episodeId, shotKey, request.expectedRevision(), request.directorNote());
    }

    @PostMapping("/ai/preview")
    public Map<String, Object> preview(@PathVariable UUID episodeId, @PathVariable String shotKey,
                                       @Valid @RequestBody AiRequest request) {
        requireWrites();
        checkAiOn(request.aiEnabled());
        ShotRevisionService.Context context = verifyRevision(episodeId, shotKey, request.expectedRevision());
        String payload = previewPayload(episodeId, shotKey, request.expectedRevision(),
                context.scriptRevision(), request.message(), quality.fingerprint(episodeId));
        var authorization = authorizations.issue(OPERATION, payload);
        return Map.of(
                "canRun", true,
                "model", ai.model(),
                "estimatedMaxOutputTokens", 5500,
                "zeroTokenPreview", true,
                "requiresExplicitApproval", true,
                "authorizationToken", authorization.token().toString(),
                "authorizationExpiresAt", authorization.expiresAt().toString());
    }

    @PostMapping("/ai/run")
    public Map<String, Object> run(@PathVariable UUID episodeId, @PathVariable String shotKey,
                                   @Valid @RequestBody AiRequest request, HttpServletRequest http) {
        requireWrites();
        checkAiOn(request.aiEnabled());
        if (!(http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT") instanceof Map<?, ?> audit)
                || !(audit.get("auditId") instanceof UUID))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Audited production preflight required.");
        ShotRevisionService.Context context = verifyRevision(episodeId, shotKey, request.expectedRevision());
        authorizations.consume(http.getHeader(AiSpendGuardAspect.PREVIEW_AUTHORIZATION_HEADER),
                OPERATION, previewPayload(episodeId, shotKey, request.expectedRevision(),
                        context.scriptRevision(), request.message(), quality.fingerprint(episodeId)));
        var base = context.draft() != null ? context.draft() : context.approved();
        String narration = base == null ? context.originalNarration() : base.narration();
        String voice = base == null ? "calm, conversational, confident" : base.voiceDirection();
        String visual = base == null ? "" : base.visualDirection();

        Map<String, Object> promptContext = new LinkedHashMap<>();
        promptContext.put("episodeId", episodeId.toString());
        promptContext.put("shotKey", shotKey);
        promptContext.put("shotTitle", context.title());
        promptContext.put("scriptRevision", context.scriptRevision());
        promptContext.put("currentNarration", narration);
        promptContext.put("currentVoiceDirection", voice);
        promptContext.put("currentVisualDirection", visual);
        promptContext.put("approvedSource", context.approved() == null ? "ORIGINAL_LOCKED_SCRIPT" : "SHOT_REVISION_LOCK");
        promptContext.put("policy", episodes.context(episodeId, "ALL").get("policy"));
        promptContext.put("rules", episodes.context(episodeId, "ALL").get("rules"));
        promptContext.put("sourceRule", "Only this shot may change. Director LOCK is required to publish changes.");
        promptContext.put("deterministicChecks", quality.assertions(episodeId));
        Object existingMessages = revisions.state(episodeId, shotKey).get("messages");
        if (existingMessages instanceof List<?> history) {
            promptContext.put("recentConversation", history.subList(Math.max(0, history.size() - 10), history.size()));
        }


        UUID call = policy.beginCall("SHOT_REVISION", OPERATION, ai.model(), 5500);
        AiUsageCapture.clear();
        ShotRevisionAiClient.Suggestion suggestion;
        try {
            suggestion = ai.revise(request.message(), promptContext);
            AiUsageCapture.Usage usage = AiUsageCapture.take();
            if (usage != null) policy.recordUsage(call, usage.inputTokens(), usage.outputTokens(),
                    usage.totalTokens(), usage.cachedInputTokens(), usage.reasoningTokens());
            policy.completeSuccess(call);
        } catch (Exception ex) {
            policy.completeFailure(call, ex.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "The OpenAI revision request failed. No new draft was saved.", ex);
        } finally {
            AiUsageCapture.clear();
        }

        // Deterministic checks cost no further AI tokens. Never persist a failing
        // candidate, and never auto-regenerate with another paid request.
        quality.requirePass(episodeId, suggestion.narration(),
                suggestion.voiceDirection(), suggestion.visualDirection());
        revisions.saveDraft(episodeId, shotKey, request.expectedRevision(), suggestion.narration(),
                suggestion.voiceDirection(), suggestion.visualDirection(), suggestion.changeSummary(), "OPENAI");
        revisions.recordAiConversation(episodeId, shotKey, request.message(),
                suggestion.reply() + System.lineSeparator() + System.lineSeparator()
                    + "REVISED ENGLISH NARRATION (DRAFT):" + System.lineSeparator()
                    + suggestion.narration());
        Map<String, Object> result = new LinkedHashMap<>(revisions.state(episodeId, shotKey));
        result.put("agentReply", suggestion.reply());
        result.put("directorLocked", false);
        return result;
    }

    private ShotRevisionService.Context verifyRevision(UUID episodeId, String shotKey, int expected) {
        var c = revisions.context(episodeId, shotKey);
        var current = c.draft() != null ? c.draft() : c.approved();
        int actual = current == null ? 0 : current.revision();
        if (actual != expected) throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Shot changed after preview. Refresh before requesting the model.");
        return c;
    }

    private void requireWrites() {
        if (!episodes.writesEnabled())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Episode-aware Director revisions are disabled until the rollout safety gate is approved.");
    }

    private void checkAiOn(boolean enabled) {
        if (!enabled) throw new ResponseStatusException(HttpStatus.CONFLICT, "AI is OFF for this shot.");
        policy.requirePaidAiEnabled("shot revision");
        if (!ai.configured())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "OpenAI API is not configured.");
    }

    static String previewPayload(UUID episode, String shot, int revision, int scriptRevision, String message) {
        return previewPayload(episode, shot, revision, scriptRevision, message, "");
    }

    static String previewPayload(UUID episode, String shot, int revision, int scriptRevision,
                                 String message, String ruleFingerprint) {
        return "EPISODE=" + episode + "|SHOT=" + shot + "|REVISION=" + revision
                + "|SCRIPT=" + scriptRevision + "|RULES=" + ruleFingerprint
                + "|PROMPT=" + message.trim();
    }
}
