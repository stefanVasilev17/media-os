package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.AiRuntimePolicyService;
import com.architecturalthinking.mediaos.system.PreviewAuthorizationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Cost-controlled, episode-isolated Script/Scene generation.
 *
 * All data passed to the model is obtained by UUID from this episode workspace.
 * The existing EP001 CreativeWorkflowController is deliberately untouched.
 * Successful generation saves only a reviewable DRAFT, never a Director LOCK.
 */
@Service
public class EpisodeScopedAgentService {
    private static final UUID EP001 = ProductionOverviewService.EPISODE_ID;
    private final EpisodeWorkspaceService workspace;
    private final CreativeAgentClient creative;
    private final AiRuntimePolicyService aiPolicy;
    private final PreviewAuthorizationService previewAuthorization;

    public EpisodeScopedAgentService(EpisodeWorkspaceService workspace, CreativeAgentClient creative,
                                     AiRuntimePolicyService aiPolicy,
                                     PreviewAuthorizationService previewAuthorization) {
        this.workspace = workspace;
        this.creative = creative;
        this.aiPolicy = aiPolicy;
        this.previewAuthorization = previewAuthorization;
    }

    public Map<String, Object> preview(UUID episodeId, String rawStage, String rawAction,
                                       String message, int expectedRevision) {
        Prepared run = prepare(episodeId, rawStage, rawAction, message, expectedRevision);
        boolean enabled = aiPolicy.paidAiEnabled();
        boolean configured = creative.configured();
        List<String> blockers = new ArrayList<>();
        if (!enabled) blockers.add("Paid AI is OFF in MediaOS Settings.");
        if (!configured) blockers.add("Creative AI is not configured.");
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("episodeId", episodeId);
        result.put("stage", run.stage());
        result.put("action", run.action());
        result.put("expectedRevision", expectedRevision);
        result.put("upstreamRevision", run.upstreamRevision());
        result.put("upstreamStage", run.upstreamStage());
        result.put("zeroTokenPreview", true);
        result.put("previewUsesPaidAi", false);
        result.put("paidAiEnabled", enabled);
        result.put("canRun", blockers.isEmpty());
        result.put("blockers", blockers);
        result.put("model", creative.model());
        result.put("maxOutputTokens", "SCRIPT".equals(run.stage()) ? 14000 : 12000);
        result.put("automaticDirectorLock", false);
        result.put("contextRuleCount", run.ruleCount());
        result.put("contextApprovedAssetCount", run.assetCount());

        if (blockers.isEmpty()) {
            var issued = previewAuthorization.issue(run.operation(),
                    previewAuthorization.episodeCreativePayload(episodeId, run.stage(), run.action(),
                            run.message(), expectedRevision, run.upstreamRevision()));
            result.put("authorizationToken", issued.token());
            result.put("authorizationExpiresAt", issued.expiresAt());
            result.put("authorizationSingleUse", true);
        } else {
            result.put("authorizationToken", null);
            result.put("authorizationExpiresAt", null);
        }
        return result;
    }

    public Map<String, Object> run(UUID episodeId, String rawStage, String rawAction,
                                   String message, int expectedRevision, UUID auditId) {
        Prepared run = prepare(episodeId, rawStage, rawAction, message, expectedRevision);
        aiPolicy.requirePaidAiEnabled("episode " + run.stage() + " generation");
        if (!creative.configured()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "The episode creative agent is not configured.");

        List<CreativeAgentClient.TranscriptMessage> transcript = new ArrayList<>();
        if ("REVISE".equals(run.action())) {
            transcript.addAll(workspace.agentTranscript(episodeId, run.stage(), 12));
            transcript.add(new CreativeAgentClient.TranscriptMessage("USER", run.message()));
        }

        // The spending aspect consumes an episode-bound single-use preview token
        // immediately before the model call, and records token usage in MediaOS.
        CreativeAgentClient.AgentReply reply = creative.generate(
                run.stage(), run.action(), transcript, run.modelContext());
        if (reply == null || reply.artifact() == null || reply.artifact().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "AI returned no valid draft artifact. Nothing was saved.");
        }

        // Deterministic minimum gates keep incomplete drafts out of the active
        // workspace. This is not final semantic approval by the Director.
        EpisodeWorkspaceRules.validateArtifactForLock(run.stage(), reply.artifact());
        Map<String, Object> saved = workspace.agentDraft(episodeId, run.stage(), reply.artifact(),
                reply.summary() == null || reply.summary().isBlank()
                        ? "Agent produced a reviewable " + run.stage() + " draft."
                        : reply.summary(),
                expectedRevision, auditId, run.message(), reply.reply());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("episodeId", episodeId);
        result.put("stage", run.stage());
        result.put("status", "READY_FOR_REVIEW");
        result.put("directorLocked", false);
        result.put("expectedRevision", expectedRevision + 1);
        result.put("agentReply", reply.reply());
        result.put("workspace", saved);
        return result;
    }

    private Prepared prepare(UUID id, String rawStage, String rawAction,
                             String message, int expectedRevision) {
        if (id == null || EP001.equals(id))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Episode-scoped generation never modifies the locked EP001 workflow.");
        if (!workspace.writesEnabled())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Episode-aware agent execution is disabled until Director rollout approval.");

        String stage = EpisodeWorkspaceRules.editableStage(rawStage);
        if (!List.of("SCRIPT", "SCENE").contains(stage))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only Script and Scene agents are supported.");
        String action = rawAction == null ? "" : rawAction.trim().toUpperCase(Locale.ROOT);
        if (!List.of("GENERATE", "REVISE").contains(action))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Action must be GENERATE or REVISE.");
        String prompt = message == null ? "" : message.trim();
        if (prompt.length() > 6000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Creator prompt exceeds 6000 characters.");
        if ("REVISE".equals(action) && prompt.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Revision requires a creator correction.");
        if ("GENERATE".equals(action) && !prompt.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Use REVISE for a user-directed change; GENERATE accepts no custom prompt.");
        if (expectedRevision < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expected draft revision must be nonnegative.");

        Map<String, Object> episodeContext = workspace.context(id, stage);
        Map<String, Object> stageRow = stage(episodeContext, stage);
        int revision = number(stageRow.get("revision"));
        if (revision != expectedRevision || "LOCKED".equals(stageRow.get("status")))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Stage is locked or its revision changed. Refresh before generating.");
        if ("REVISE".equals(action) && (revision == 0 || !(stageRow.get("artifact") instanceof Map<?, ?>)))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "There is no existing draft to revise.");

        String upstream = "SCRIPT".equals(stage) ? "RESEARCH" : "SCRIPT";
        Map<String, Object> prior = stage(episodeContext, upstream);
        int priorRevision = number(prior.get("revision"));
        if (!"LOCKED".equals(prior.get("status")) || priorRevision < 1
                || !(prior.get("artifact") instanceof Map<?, ?> artifact) || artifact.isEmpty())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An independently Director-LOCKED " + upstream + " artifact is required.");

        Map<String, Object> authoritative = new LinkedHashMap<>();
        authoritative.put("scopedEpisodeId", id.toString());
        authoritative.put("scopedExpectedRevision", revision);
        authoritative.put("scopedUpstreamRevision", priorRevision);
        authoritative.put("episode", episodeContext.get("episode"));
        authoritative.put("projectPolicy", episodeContext.get("policy"));
        authoritative.put("rules", episodeContext.get("rules"));
        authoritative.put("directorLockedShots", episodeContext.get("directorLockedShots"));
        authoritative.put("approvedAssets", episodeContext.get("assetsAvailable"));
        authoritative.put("episodeAssetReferences", episodeContext.get("assetsReferenced"));
        authoritative.put("lockedUpstreamStage", prior);
        authoritative.put("currentStage", stageRow);
        authoritative.put("currentArtifact", stageRow.get("artifact"));
        authoritative.put("instruction", "The locked upstream stage is the only episode Truth Map/Script source. Never use EP001 source snapshots, scripts, conversations, voice files, render states or locks for this episode.");

        int ruleCount = episodeContext.get("rules") instanceof List<?> list ? list.size() : 0;
        int assetCount = episodeContext.get("assetsAvailable") instanceof List<?> list ? list.size() : 0;
        if (ruleCount == 0 || assetCount == 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Required Production Memory or approved asset catalog is unavailable.");

        return new Prepared(stage, action, prompt, stage + "_" + action, upstream,
                priorRevision, ruleCount, assetCount, authoritative);
    }

    private Map<String, Object> stage(Map<String, Object> context, String key) {
        Object raw = context.get("stages");
        if (raw instanceof List<?> stages)
            for (Object item : stages)
                if (item instanceof Map<?, ?> m && key.equals(m.get("stageKey"))) {
                    Map<String, Object> result = new LinkedHashMap<>();
                    m.forEach((k, v) -> result.put(String.valueOf(k), v));
                    return result;
                }
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Episode " + key + " stage is missing.");
    }

    private int number(Object value) {
        return value instanceof Number n ? n.intValue() : -1;
    }

    private record Prepared(String stage, String action, String message, String operation,
                            String upstreamStage, int upstreamRevision, int ruleCount,
                            int assetCount, Map<String, Object> modelContext) {}
}
