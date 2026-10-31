package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.director.EpisodeBuildAgentClient;
import com.architecturalthinking.mediaos.system.AiRuntimePolicyService;
import com.architecturalthinking.mediaos.system.AiUsageCapture;
import com.architecturalthinking.mediaos.system.PreviewAuthorizationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EpisodeResearchAgentService {
    private static final String OPERATION = "EPISODE_SCOPED_RESEARCH";
    private final EpisodeWorkspaceService workspace;
    private final EpisodeLearningService learning;
    private final EpisodeBuildAgentClient research;
    private final ShotPromptContextService firstPass;
    private final AiRuntimePolicyService paid;
    private final PreviewAuthorizationService tokens;
    private final ObjectMapper mapper;
    private final boolean enabled;

    public EpisodeResearchAgentService(EpisodeWorkspaceService workspace,
                                       EpisodeLearningService learning,
                                       EpisodeBuildAgentClient research,
                                       ShotPromptContextService firstPass,
                                       AiRuntimePolicyService paid,
                                       PreviewAuthorizationService tokens,
                                       ObjectMapper mapper,
                                       @Value("${mediaos.episode-research.enabled:false}") boolean enabled) {
        this.workspace = workspace;
        this.learning = learning;
        this.research = research;
        this.firstPass = firstPass;
        this.paid = paid;
        this.tokens = tokens;
        this.mapper = mapper;
        this.enabled = enabled;
    }

    public Map<String,Object> preview(UUID episodeId, int expectedRevision) {
        Prepared prepared = prepare(episodeId, expectedRevision);
        boolean canRun = paid.paidAiEnabled() && research.configured();
        Map<String,Object> response = new LinkedHashMap<>();
        response.put("stage", "RESEARCH");
        response.put("episodeId", episodeId);
        response.put("expectedRevision", expectedRevision);
        response.put("briefRevision", prepared.briefRevision());
        response.put("ruleFingerprint", prepared.rulesFingerprint());
        response.put("mandatoryRules", prepared.mandatoryRules());
        response.put("zeroTokenPreview", true);
        response.put("maxOutputTokens", 9000);
        response.put("model", research.model());
        response.put("canRun", canRun);
        response.put("autoLock", false);
        response.put("requiresDirectorReview", true);
        response.put("blockers", !paid.paidAiEnabled()
                ? List.of("Paid AI is OFF.")
                : !research.configured() ? List.of("Research OpenAI is not configured.") : List.of());
        if (canRun) {
            var authorization = tokens.issue(OPERATION, prepared.payload());
            response.put("authorizationToken", authorization.token().toString());
            response.put("expiresAt", authorization.expiresAt().toString());
        } else {
            response.put("authorizationToken", null);
            response.put("expiresAt", null);
        }
        return response;
    }

    public Map<String,Object> generate(UUID episodeId, int expectedRevision,
                                       String previewToken, UUID auditedPreflight) {
        if (auditedPreflight == null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Episode preflight audit is required.");
        Prepared prepared = prepare(episodeId, expectedRevision);
        paid.requirePaidAiEnabled("episode-scoped Research");
        if (!research.configured())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Research AI is not configured.");
        tokens.consume(previewToken, OPERATION, prepared.payload());

        Map<String,Object> input = new LinkedHashMap<>();
        input.put("episodeId", episodeId.toString());
        input.put("episode", prepared.episode());
        input.put("brief", prepared.brief());
        input.put("sourcesSuppliedByDirectorUnverified", prepared.sources());
        input.put("lockedExistingAssets", prepared.assets());
        input.put("researchInstructions", """
                Draft a truthful technical architecture map for THIS episode.
                Do not claim the Director's sources have been independently verified.
                Capture ambiguities in unresolvedQuestions for Director review.
                """);

        UUID callId = paid.beginCall("RESEARCH", OPERATION, research.model(), 9000);
        AiUsageCapture.clear();
        EpisodeBuildAgentClient.TruthAudit proposal;
        try {
            proposal = research.auditTruthForEpisode(episodeId, input, prepared.rulesAppendix());
            var usage = AiUsageCapture.take();
            if (usage != null)
                paid.recordUsage(callId, usage.inputTokens(), usage.outputTokens(),
                        usage.totalTokens(), usage.cachedInputTokens(), usage.reasoningTokens());
            paid.completeSuccess(callId);
        } catch (Exception error) {
            paid.completeFailure(callId, error.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Research generation failed. No Research DRAFT was saved.", error);
        } finally {
            AiUsageCapture.clear();
        }

        if (proposal == null || proposal.summary() == null || proposal.summary().isBlank()
                || proposal.actors() == null || proposal.actors().size() < 3
                || proposal.synchronousFlow() == null || proposal.synchronousFlow().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Research was incomplete. No DRAFT was saved. No automatic retry.");

        Map<String,Object> artifact = researchArtifact(proposal, prepared);
        String summary = proposal.summary();
        if (summary.length() > 1900) summary = summary.substring(0, 1900);
        Map<String,Object> updated = workspace.draftResearchForBrief(episodeId, artifact,
                summary, expectedRevision, prepared.briefRevision(), auditedPreflight);
        return Map.of("episodeId", episodeId, "stage", "RESEARCH",
                "status", "READY_FOR_REVIEW", "directorLocked", false,
                "draftRevision", expectedRevision+1, "workspace", updated);
    }

    public Map<String,Object> attachSources(UUID episodeId, int expectedRevision,
                                             String sourceNotes, UUID auditId) {
        if (!enabled || !workspace.writesEnabled())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Research edits are disabled.");
        if (episodeId == null || ProductionOverviewService.EPISODE_ID.equals(episodeId))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EP001 is protected.");
        if (auditId == null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Audited Director action required.");
        String verified = EpisodeWorkspaceService.validatedSources(sourceNotes);
        List<String> references = verified.lines().map(String::trim)
                .filter(line -> !line.isBlank()).limit(20).toList();
        if (references.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide technical references.");
        Map<String,Object> context = workspace.context(episodeId,"ALL");
        Map<?,?> stage = null;
        for (Object item : (List<?>) context.get("stages"))
            if (item instanceof Map<?,?> row && "RESEARCH".equals(row.get("stageKey")))
                stage = row;
        if (stage == null || !"READY_FOR_REVIEW".equals(stage.get("status"))
                || !(stage.get("revision") instanceof Number revision)
                || revision.intValue() != expectedRevision || expectedRevision < 1
                || !(stage.get("artifact") instanceof Map<?,?> draft))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Research is locked or the draft revision changed.");
        Map<String,Object> revised = new LinkedHashMap<>();
        draft.forEach((key,value) -> revised.put(String.valueOf(key),value));
        revised.put("technicalSources", references);
        revised.put("technicalSourcesStatus", "DIRECTOR_ADDED_REQUIRES_INDEPENDENT_VERIFICATION");
        revised.put("sourceCorrectionByDirector", true);
        return workspace.draft(episodeId, "RESEARCH", revised,
                "Director added technical references to the Research DRAFT.",
                expectedRevision, auditId);
    }

    public static Map<String,Object> researchArtifact(
            EpisodeBuildAgentClient.TruthAudit proposed, Prepared prepared) {
        Map<String,Object> artifact = new LinkedHashMap<>();
        artifact.put("centralQuestion", prepared.title());
        artifact.put("viewerPromise", proposed.summary());
        List<String> truth = new ArrayList<>();
        if (proposed.synchronousFlow() != null) truth.addAll(proposed.synchronousFlow());
        if (truth.size() < 3 && proposed.actors() != null) truth.addAll(proposed.actors());
        artifact.put("truthMap", truth);
        artifact.put("outOfScope", proposed.outOfScope() == null ? List.of() : proposed.outOfScope());
        artifact.put("technicalSources", prepared.sourceEntries());
        artifact.put("technicalSourcesStatus", "DIRECTOR_SUPPLIED_UNVERIFIED");
        artifact.put("unresolvedQuestions",
                proposed.unresolvedQuestions() == null ? List.of() : proposed.unresolvedQuestions());
        artifact.put("sourceBriefRevision", prepared.briefRevision());
        artifact.put("sourceBriefFingerprint", hash(prepared.brief()+"\n"+prepared.sources()));
        artifact.put("researchDetail", proposed);
        return artifact;
    }

    private Prepared prepare(UUID id, int expectedRevision) {
        if (id == null || ProductionOverviewService.EPISODE_ID.equals(id))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Research generation is for new, isolated episodes only. EP001 remains protected.");
        if (!enabled || !workspace.writesEnabled())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "New episode Research is disabled until its secure rollout.");
        if (expectedRevision < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Research revision.");

        Map<String,Object> episode = workspace.episode(id);
        Map<String,Object> briefRow = workspace.brief(id);
        learning.requireEarlierLearningReviewed(id);
        Map<String,Object> workspaceContext = workspace.context(id, "ALL");
        Object stages = workspaceContext.get("stages");
        Map<?,?> researchStage = null;
        if (stages instanceof List<?> list)
            for (Object item : list)
                if (item instanceof Map<?,?> row && "RESEARCH".equals(row.get("stageKey")))
                    researchStage = row;
        if (researchStage == null || !(researchStage.get("revision") instanceof Number number)
                || number.intValue() != expectedRevision
                || "LOCKED".equals(researchStage.get("status")))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Research draft changed or is locked. Refresh to generate a new version.");

        String brief = String.valueOf(briefRow.get("brief"));
        String sources = String.valueOf(briefRow.get("sources"));
        int briefRevision = ((Number)briefRow.get("revision")).intValue();
        var compiled = firstPass.prepareForStage(id, "TRUTH", "RESEARCH",
                "Prepare evidence-aware Research for " + episode.get("title"), brief + "\n" + sources);

        List<Map<String,Object>> assets = new ArrayList<>();
        Object available = workspaceContext.get("assetsAvailable");
        if (available instanceof List<?> list)
            for (Object item : list)
                if (item instanceof Map<?,?> row)
                    assets.add(Map.of("assetKey", String.valueOf(row.get("assetKey"))));

        List<String> sourceEntries = sources.lines()
                .map(String::trim).filter(line -> !line.isBlank()).limit(20).toList();
        String payload = "EPISODE="+id+"|RESEARCH_REV="+expectedRevision
                +"|BRIEF_REV="+briefRevision+"|BRIEF_SHA="+hash(brief+"\n"+sources)
                +"|RULES="+compiled.fingerprint();
        return new Prepared(episode, String.valueOf(episode.get("title")), brief, sources,
                briefRevision, compiled.fingerprint(), compiled.appendix(), compiled.mandatoryRuleCount(),
                payload, List.copyOf(assets), sourceEntries);
    }

    public record Prepared(Map<String,Object> episode, String title, String brief, String sources,
                           int briefRevision, String rulesFingerprint, String rulesAppendix, int mandatoryRules,
                           String payload, List<Map<String,Object>> assets, List<String> sourceEntries) {}

    private static String hash(String data) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(data.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 required", ex);
        }
    }
}
