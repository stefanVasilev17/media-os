package com.architecturalthinking.mediaos.director;

import com.architecturalthinking.mediaos.system.AiRuntimePolicyService;
import com.architecturalthinking.mediaos.workflow.CreativeAgentClient;
import com.architecturalthinking.mediaos.workflow.ProductionOverviewService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
public class EpisodeBuildService {

    private static final Logger log = LoggerFactory.getLogger(EpisodeBuildService.class);
    private static final UUID PROJECT_ID = ProductionOverviewService.PROJECT_ID;
    private static final UUID EPISODE_ID = ProductionOverviewService.EPISODE_ID;
    private static final UUID CURRENT_TOPIC_ID = UUID.fromString("99999999-aaaa-4444-8888-000000000001");

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final EpisodeBuildAgentClient buildAgent;
    private final CreativeAgentClient creativeAgent;
    private final ProductionOverviewService overviewService;
    private final AiRuntimePolicyService aiPolicy;
    private final AtomicBoolean workerBusy = new AtomicBoolean(false);

    public EpisodeBuildService(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            EpisodeBuildAgentClient buildAgent,
            CreativeAgentClient creativeAgent,
            ProductionOverviewService overviewService,
            AiRuntimePolicyService aiPolicy
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.buildAgent = buildAgent;
        this.creativeAgent = creativeAgent;
        this.overviewService = overviewService;
        this.aiPolicy = aiPolicy;
    }

    public Map<String, Object> state() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("configured", buildAgent.configured() && creativeAgent.configured());
        result.put("model", buildAgent.model());
        result.put("cloudOnly", true);
        result.put("windowsRequired", false);
        result.put("policy", creativePolicy());
        result.put("topics", topicCandidates());
        result.put("latestRun", latestRun());
        result.put("canStartCurrentEpisode", canStartCurrentEpisode());
        return result;
    }

    public Map<String, Object> generateTopics() {
        if (!buildAgent.configured()) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Episode topic intelligence is not configured.");
        }

        Map<String, Object> context = new LinkedHashMap<>();
        context.put("creativePolicy", creativePolicy());
        context.put("currentEpisode", overviewService.episode());
        context.put("currentSource", overviewService.sourceSnapshot());
        context.put("existingTopics", topicCandidates());
        context.put("productionOverview", overviewService.overview());

        EpisodeBuildAgentClient.TopicBatch batch = buildAgent.suggestTopics(context);
        jdbc.sql("""
                update episode_topic_candidate
                set status='ARCHIVED'
                where project_id=:projectId and status='READY'
                """)
                .param("projectId", PROJECT_ID)
                .update();

        for (EpisodeBuildAgentClient.TopicCandidate candidate : batch.candidates()) {
            jdbc.sql("""
                    insert into episode_topic_candidate(
                      id, project_id, title, central_question, viewer_promise, evergreen_reason,
                      mass_entry, senior_lesson, system_boundary, core_tension, aha_candidates,
                      failure_tradeoff, reuse_plan, new_assets, series_path, thumbnail_idea,
                      estimated_complexity, recommended_build_minutes, status
                    ) values (
                      :id,:projectId,:title,:centralQuestion,:viewerPromise,:evergreenReason,
                      :massEntry,:seniorLesson,:systemBoundary,:coreTension,cast(:aha as jsonb),
                      :failureTradeoff,:reusePlan,cast(:newAssets as jsonb),:seriesPath,:thumbnailIdea,
                      :complexity,:minutes,'READY'
                    )
                    """)
                    .param("id", UUID.randomUUID())
                    .param("projectId", PROJECT_ID)
                    .param("title", clean(candidate.title()))
                    .param("centralQuestion", clean(candidate.centralQuestion()))
                    .param("viewerPromise", clean(candidate.viewerPromise()))
                    .param("evergreenReason", clean(candidate.evergreenReason()))
                    .param("massEntry", clean(candidate.massEntry()))
                    .param("seniorLesson", clean(candidate.seniorLesson()))
                    .param("systemBoundary", clean(candidate.systemBoundary()))
                    .param("coreTension", clean(candidate.coreTension()))
                    .param("aha", writeJson(candidate.ahaCandidates()))
                    .param("failureTradeoff", clean(candidate.failureTradeoff()))
                    .param("reusePlan", clean(candidate.reusePlan()))
                    .param("newAssets", writeJson(candidate.newAssets()))
                    .param("seriesPath", clean(candidate.seriesPath()))
                    .param("thumbnailIdea", clean(candidate.thumbnailIdea()))
                    .param("complexity", normalizeComplexity(candidate.estimatedComplexity()))
                    .param("minutes", clamp(candidate.recommendedBuildMinutes(), 15, 30))
                    .update();
        }
        return state();
    }

    public Map<String, Object> startCurrentEpisode(int requestedBudgetMinutes) {
        if (!buildAgent.configured() || !creativeAgent.configured()) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Cloud creative intelligence is not configured.");
        }
        if (activeRunExists()) {
            throw new ResponseStatusException(CONFLICT, "An autonomous episode build is already running.");
        }
        if (!canStartCurrentEpisode()) {
            throw new ResponseStatusException(CONFLICT, "The current Script or Scene already contains creator work. Review that work instead of replacing it with a new autonomous first pass.");
        }

        int budgetMinutes = clamp(requestedBudgetMinutes <= 0 ? 20 : requestedBudgetMinutes, 15, 30);
        UUID runId = UUID.randomUUID();
        jdbc.sql("""
                insert into episode_build_run(
                  id, episode_id, topic_candidate_id, status, current_step,
                  progress_percent, budget_minutes, started_at
                ) values (:id,:episodeId,:topicId,'QUEUED','TRUTH',0,:budget,now())
                """)
                .param("id", runId)
                .param("episodeId", EPISODE_ID)
                .param("topicId", CURRENT_TOPIC_ID)
                .param("budget", budgetMinutes)
                .update();

        createStep(runId, "TRUTH", 10);
        createStep(runId, "SCRIPT", 20);
        createStep(runId, "SCENE", 30);
        createStep(runId, "HANDOFF", 40);

        jdbc.sql("update episode set current_stage='AUTONOMOUS_BUILD' where id=:episodeId")
                .param("episodeId", EPISODE_ID)
                .update();

        return state();
    }

    public Map<String, Object> retryLatest() {
        Map<String, Object> run = latestRun();
        if (run.isEmpty()) throw new ResponseStatusException(CONFLICT, "There is no episode build to retry.");
        String status = String.valueOf(run.get("status"));
        if (!List.of("FAILED", "NEEDS_REVIEW").contains(status)) {
            throw new ResponseStatusException(CONFLICT, "Only a failed or review-blocked build can be retried.");
        }
        UUID runId = UUID.fromString(String.valueOf(run.get("id")));
        jdbc.sql("""
                update episode_build_run
                set status='QUEUED', error_message=null, updated_at=now()
                where id=:runId
                """)
                .param("runId", runId)
                .update();
        jdbc.sql("""
                update episode_build_step
                set status='QUEUED', error_message=null, updated_at=now()
                where run_id=:runId and step_key=(select current_step from episode_build_run where id=:runId)
                """)
                .param("runId", runId)
                .update();
        return state();
    }

    @Scheduled(fixedDelay = 2500L, initialDelay = 5000L)
    public void processBuildQueue() {
        if (!workerBusy.compareAndSet(false, true)) return;
        try {
            Map<String, Object> run = nextRunnableRun();
            if (run.isEmpty()) return;
            UUID runId = (UUID) run.get("id");
            String step = String.valueOf(run.get("currentStep"));
            processStep(runId, step);
        } catch (Exception ex) {
            log.error("Autonomous episode build worker failed", ex);
        } finally {
            workerBusy.set(false);
        }
    }

    private void processStep(UUID runId, String step) {
        try {
            markRunRunning(runId, step);
            markStepRunning(runId, step);
            switch (step) {
                case "TRUTH" -> runTruth(runId);
                case "SCRIPT" -> runScript(runId);
                case "SCENE" -> runScene(runId);
                case "HANDOFF" -> runHandoff(runId);
                default -> failRun(runId, step, "Unknown build step: " + step, false);
            }
        } catch (Exception ex) {
            log.warn("Episode build step failed runId={} step={} error={}", runId, step, ex.toString());
            failRun(runId, step, clean(ex.getMessage()), false);
        }
    }

    private void runTruth(UUID runId) {
        if (stepComplete(runId, "TRUTH")) {
            advance(runId, "SCRIPT", 20);
            return;
        }

        Map<String, Object> context = new LinkedHashMap<>();
        context.put("episode", overviewService.episode());
        context.put("sourceSnapshot", overviewService.sourceSnapshot());
        context.put("topic", currentTopic());
        context.put("creativePolicy", creativePolicy());
        context.put("productionOverview", overviewService.overview());
        EpisodeBuildAgentClient.TruthAudit audit = buildAgent.auditTruth(context);
        Map<String, Object> artifact = objectMapper.convertValue(audit, new TypeReference<LinkedHashMap<String, Object>>() {});

        boolean reviewBlock = audit.confidence() < 0.65d || (audit.unresolvedQuestions() != null && audit.unresolvedQuestions().size() > 3);
        if (reviewBlock) {
            saveStepArtifact(runId, "TRUTH", artifact, "Truth audit needs creator review before autonomous scripting.");
            failRun(runId, "TRUTH", "Truth audit contains too much unresolved uncertainty for a reliable autonomous Script draft.", true);
            return;
        }

        saveStepArtifact(runId, "TRUTH", artifact, "Truth audit complete. Script Agent can work without inventing missing architecture facts.");
        advance(runId, "SCRIPT", 25);
    }

    private void runScript(UUID runId) {
        if (stageRevisionReady(runId, "SCRIPT")) {
            completeStep(runId, "SCRIPT", "Script draft already persisted and validated for this build run.");
            advance(runId, "SCENE", 55);
            return;
        }

        Map<String, Object> stage = stageRow("SCRIPT");
        Map<String, Object> context = creativeContext("SCRIPT", stage);
        context.put("autonomousInitialBuild", true);
        context.put("truthAudit", stepArtifact(runId, "TRUTH"));
        context.put("buildBudgetMinutes", buildBudget(runId));

        CreativeAgentClient.AgentReply reply = creativeAgent.generate("SCRIPT", "GENERATE", List.of(), context);
        List<String> failures = validateScriptDraft(reply.artifact());
        if (!failures.isEmpty() && !aiPolicy.autoRepairEnabled()) {
            saveCreativeStage(runId, "SCRIPT", reply, failures);
            failRun(runId, "SCRIPT", validationReviewMessage("Script", failures, false), true);
            return;
        }
        if (!failures.isEmpty()) {
            Map<String, Object> repairContext = new LinkedHashMap<>(context);
            repairContext.put("currentArtifact", reply.artifact());
            repairContext.put("validationFailures", failures);
            repairContext.put("repairInstruction", "Repair every validation failure and return the complete Script artifact, not a patch.");
            reply = creativeAgent.generate("SCRIPT", "REVISE", List.of(), repairContext);
            failures = validateScriptDraft(reply.artifact());
        }
        if (!failures.isEmpty()) {
            saveCreativeStage(runId, "SCRIPT", reply, failures);
            failRun(runId, "SCRIPT", validationReviewMessage("Script", failures, true), true);
            return;
        }

        saveCreativeStage(runId, "SCRIPT", reply, List.of());
        completeStep(runId, "SCRIPT", "Complete ~20-minute timecoded Script draft is ready for creator review.");
        advance(runId, "SCENE", 60);
    }

    private void runScene(UUID runId) {
        if (stageRevisionReady(runId, "SCENE")) {
            completeStep(runId, "SCENE", "Scene draft already persisted and validated for this build run.");
            advance(runId, "HANDOFF", 90);
            return;
        }

        Map<String, Object> scriptStage = stageRow("SCRIPT");
        Map<String, Object> sceneStage = stageRow("SCENE");
        Map<String, Object> scriptArtifact = asMap(scriptStage.get("artifact"));
        if (scriptArtifact.isEmpty()) throw new IllegalStateException("Script draft is missing; Scene Agent cannot work safely.");

        Map<String, Object> context = creativeContext("SCENE", sceneStage);
        context.put("autonomousInitialBuild", true);
        context.put("provisionalScriptDraft", scriptArtifact);
        context.put("lockedUpstreamHandoff", Map.of(
                "sourceStageKey", "SCRIPT",
                "sourceRevision", scriptStage.get("revision"),
                "autonomousDraft", true,
                "payload", Map.of("artifact", scriptArtifact)
        ));

        CreativeAgentClient.AgentReply reply = creativeAgent.generate("SCENE", "GENERATE", List.of(), context);
        List<String> failures = validateSceneDraft(reply.artifact(), number(scriptArtifact.get("targetDurationSeconds")));
        if (!failures.isEmpty() && !aiPolicy.autoRepairEnabled()) {
            saveCreativeStage(runId, "SCENE", reply, failures);
            failRun(runId, "SCENE", validationReviewMessage("Scene", failures, false), true);
            return;
        }
        if (!failures.isEmpty()) {
            Map<String, Object> repairContext = new LinkedHashMap<>(context);
            repairContext.put("currentArtifact", reply.artifact());
            repairContext.put("validationFailures", failures);
            repairContext.put("repairInstruction", "Repair every validation failure while preserving the provisional Script narration and exact duration. Return the complete Scene artifact.");
            reply = creativeAgent.generate("SCENE", "REVISE", List.of(), repairContext);
            failures = validateSceneDraft(reply.artifact(), number(scriptArtifact.get("targetDurationSeconds")));
        }
        if (!failures.isEmpty()) {
            saveCreativeStage(runId, "SCENE", reply, failures);
            failRun(runId, "SCENE", validationReviewMessage("Scene", failures, true), true);
            return;
        }

        saveCreativeStage(runId, "SCENE", reply, List.of());
        completeStep(runId, "SCENE", "Full timed Scene plan and shot-by-shot Spline prompts are ready for creator review.");
        advance(runId, "HANDOFF", 92);
    }

    private void runHandoff(UUID runId) {
        Map<String, Object> script = asMap(stageRow("SCRIPT").get("artifact"));
        Map<String, Object> scene = asMap(stageRow("SCENE").get("artifact"));
        if (script.isEmpty() || scene.isEmpty()) throw new IllegalStateException("Script and Scene drafts must both exist before the initial build can finish.");

        Map<String, Object> handoff = new LinkedHashMap<>();
        handoff.put("scriptRevision", stageRow("SCRIPT").get("revision"));
        handoff.put("sceneRevision", stageRow("SCENE").get("revision"));
        handoff.put("scriptDurationSeconds", script.get("targetDurationSeconds"));
        handoff.put("sceneCount", asList(scene.get("timeline")).size());
        handoff.put("shotCount", asList(scene.get("shots")).size());
        handoff.put("reviewOrder", List.of("SCRIPT", "SCENE", "SPLINE"));
        handoff.put("creatorAction", "Review Script first. If Script changes, the provisional Scene draft is invalidated automatically. Lock Script, then review/regenerate Scene, then lock Scene before Spline execution.");
        saveStepArtifact(runId, "HANDOFF", handoff, "Initial episode version assembled. Creator review can begin.");

        jdbc.sql("""
                update episode_build_run
                set status='COMPLETE', current_step='REVIEW', progress_percent=100,
                    completed_at=now(), error_message=null, updated_at=now()
                where id=:runId
                """)
                .param("runId", runId)
                .update();
        jdbc.sql("update episode set current_stage='SCRIPT_REVIEW' where id=:episodeId")
                .param("episodeId", EPISODE_ID)
                .update();
        completeStep(runId, "HANDOFF", "Initial version complete. Review Script → Scene → Spline and lock only after creator approval.");
    }

    private Map<String, Object> creativeContext(String key, Map<String, Object> stage) {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("episode", overviewService.episode());
        context.put("sourceSnapshot", overviewService.sourceSnapshot());
        context.put("currentArtifact", stage.get("artifact"));
        context.put("currentRevision", stage.get("revision"));
        context.put("currentSummary", stage.get("summary"));
        context.put("creatorMemory", creatorMemory(key));
        context.put("productionOverview", overviewService.overview());
        context.put("creativePolicy", creativePolicy());
        return context;
    }

    private void saveCreativeStage(
            UUID runId,
            String stageKey,
            CreativeAgentClient.AgentReply reply,
            List<String> remaining
    ) {
        Map<String, Object> stage = stageRow(stageKey);
        int revision = number(stage.get("revision")) + 1;
        UUID revisionId = UUID.randomUUID();
        String summary = clean(reply.summary()).isBlank()
                ? "Autonomous initial " + stageKey.toLowerCase(Locale.ROOT) + " draft is ready for creator review."
                : clean(reply.summary());
        String nextAction = remaining.isEmpty()
                ? "Review the complete draft, correct it in chat, then lock only when approved."
                : remaining.get(0);
        Map<String, Object> readiness = Map.of("ready", remaining.isEmpty(), "remainingTasks", remaining);

        jdbc.sql("""
                update production_stage
                set artifact=cast(:artifact as jsonb), current_revision=:revision,
                    summary=:summary, next_action=:nextAction,
                    readiness=cast(:readiness as jsonb), status='ACTIVE', updated_at=now()
                where episode_id=:episodeId and stage_key=:stageKey and status <> 'LOCKED'
                """)
                .param("artifact", writeJson(reply.artifact()))
                .param("revision", revision)
                .param("summary", summary)
                .param("nextAction", nextAction)
                .param("readiness", writeJson(readiness))
                .param("episodeId", EPISODE_ID)
                .param("stageKey", stageKey)
                .update();

        jdbc.sql("""
                insert into production_stage_revision(
                  id, production_stage_id, revision, artifact, summary,
                  change_summary, created_by, source_build_run_id
                ) values (
                  :id,:stageId,:revision,cast(:artifact as jsonb),:summary,
                  :changeSummary,'AUTO_BUILD',:runId
                )
                """)
                .param("id", revisionId)
                .param("stageId", stage.get("id"))
                .param("revision", revision)
                .param("artifact", writeJson(reply.artifact()))
                .param("summary", summary)
                .param("changeSummary", "Autonomous initial episode build")
                .param("runId", runId)
                .update();

        UUID threadId = threadId(stageKey);
        jdbc.sql("insert into agent_message(id, thread_id, sender, content) values (:id,:threadId,'AGENT',:content)")
                .param("id", UUID.randomUUID())
                .param("threadId", threadId)
                .param("content", clean(reply.reply()).isBlank() ? summary : clean(reply.reply()))
                .update();
    }

    private List<String> validateScriptDraft(Map<String, Object> artifact) {
        List<String> failures = new ArrayList<>();
        if (artifact == null || artifact.isEmpty()) return List.of("Script artifact is empty.");
        int duration = number(artifact.get("targetDurationSeconds"));
        if (duration < 1140 || duration > 1260) failures.add("Working duration must be 1140–1260 seconds.");
        List<Map<String, Object>> timeline = mapList(artifact.get("timeline"));
        if (timeline.size() < 24) failures.add("Timeline needs at least 24 controlled blocks.");
        int expected = 0;
        int aha = 0;
        int reels = 0;
        int listPassages = 0;
        for (Map<String, Object> block : timeline) {
            int start = number(block.get("startSecond"));
            int end = number(block.get("endSecond"));
            if (start != expected || end <= start || end - start > 60) {
                failures.add("Timeline must be contiguous and each block must be 60 seconds or less.");
                break;
            }
            expected = end;
            if (blank(block.get("narration")) || blank(block.get("voiceDirection")) || blank(block.get("purpose")) || blank(block.get("handoffNotes"))) {
                failures.add("Every Script block needs narration, voice direction, purpose, and Scene handoff notes.");
                break;
            }
            if (Boolean.TRUE.equals(block.get("ahaMoment"))) aha++;
            if (Boolean.TRUE.equals(block.get("reelCandidate"))) reels++;
            if (Boolean.TRUE.equals(block.get("listPassage"))) listPassages++;
        }
        if (expected != duration) failures.add("Final Script timestamp must equal targetDurationSeconds.");
        if (aha < 3) failures.add("Script needs at least three genuine Aha moments.");
        if (reels < 3) failures.add("Script needs at least three reel-ready passages.");
        if (listPassages > 2) failures.add("Script may use at most two list-style narration passages.");
        if (blank(artifact.get("handoffPrompt"))) failures.add("Scene Agent handoff prompt is missing.");
        return dedupe(failures);
    }

    private List<String> validateSceneDraft(Map<String, Object> artifact, int expectedDuration) {
        List<String> failures = new ArrayList<>();
        if (artifact == null || artifact.isEmpty()) return List.of("Scene artifact is empty.");
        List<Map<String, Object>> timeline = mapList(artifact.get("timeline"));
        List<Map<String, Object>> shots = mapList(artifact.get("shots"));
        if (timeline.size() < 8) failures.add("Scene timeline needs enough blocks to cover the episode.");
        if (shots.size() < 8) failures.add("Shot plan needs at least eight controlled shots.");
        int expected = 0;
        for (Map<String, Object> shot : shots) {
            int start = number(shot.get("startSecond"));
            int end = number(shot.get("endSecond"));
            if (start != expected || end <= start) {
                failures.add("Shots must cover the episode contiguously with no gaps or overlaps.");
                break;
            }
            expected = end;
            if (blank(shot.get("shotKey")) || blank(shot.get("script")) || blank(shot.get("voiceDirection"))
                    || blank(shot.get("camera")) || blank(shot.get("visualGoal")) || blank(shot.get("promptForSpline"))
                    || asList(shot.get("moves")).isEmpty()) {
                failures.add("Every shot needs script, voice direction, moves, camera, visual goal, and a deterministic Spline prompt.");
                break;
            }
        }
        if (expected != expectedDuration) failures.add("Final Scene shot must end at the Script duration.");
        if (blank(artifact.get("handoffPrompt"))) failures.add("Spline handoff prompt is missing.");
        return dedupe(failures);
    }

    private String validationReviewMessage(String stage, List<String> failures, boolean repairAttempted) {
        String spendNote = repairAttempted
                ? "One automatic repair call was already used; MediaOS made no further AI call."
                : "Automatic repair is OFF; MediaOS made no additional AI call.";
        return stage + " validation found " + failures.size() + " issue(s). " + spendNote + " Review the saved draft before spending again: " + String.join(" ", failures);
    }

    private void createStep(UUID runId, String key, int sequence) {
        jdbc.sql("""
                insert into episode_build_step(id, run_id, step_key, sequence_no, status)
                values (:id,:runId,:key,:sequence,'QUEUED')
                """)
                .param("id", UUID.randomUUID())
                .param("runId", runId)
                .param("key", key)
                .param("sequence", sequence)
                .update();
    }

    private void markRunRunning(UUID runId, String step) {
        jdbc.sql("""
                update episode_build_run
                set status='RUNNING', current_step=:step, error_message=null,
                    started_at=coalesce(started_at,now()), updated_at=now()
                where id=:runId and status in ('QUEUED','RUNNING')
                """)
                .param("runId", runId)
                .param("step", step)
                .update();
    }

    private void markStepRunning(UUID runId, String step) {
        jdbc.sql("""
                update episode_build_step
                set status='RUNNING', started_at=coalesce(started_at,now()),
                    error_message=null, updated_at=now()
                where run_id=:runId and step_key=:step and status <> 'COMPLETE'
                """)
                .param("runId", runId)
                .param("step", step)
                .update();
    }

    private void saveStepArtifact(UUID runId, String step, Map<String, Object> artifact, String summary) {
        jdbc.sql("""
                update episode_build_step
                set artifact=cast(:artifact as jsonb), summary=:summary,
                    status='COMPLETE', completed_at=now(), error_message=null, updated_at=now()
                where run_id=:runId and step_key=:step
                """)
                .param("runId", runId)
                .param("step", step)
                .param("artifact", writeJson(artifact))
                .param("summary", summary)
                .update();
    }

    private void completeStep(UUID runId, String step, String summary) {
        jdbc.sql("""
                update episode_build_step
                set status='COMPLETE', summary=:summary, completed_at=coalesce(completed_at,now()),
                    error_message=null, updated_at=now()
                where run_id=:runId and step_key=:step
                """)
                .param("runId", runId)
                .param("step", step)
                .param("summary", summary)
                .update();
    }

    private void advance(UUID runId, String nextStep, int progress) {
        jdbc.sql("""
                update episode_build_run
                set current_step=:nextStep, progress_percent=:progress,
                    status='RUNNING', error_message=null, updated_at=now()
                where id=:runId
                """)
                .param("runId", runId)
                .param("nextStep", nextStep)
                .param("progress", progress)
                .update();
    }

    private void failRun(UUID runId, String step, String message, boolean review) {
        String status = review ? "NEEDS_REVIEW" : "FAILED";
        jdbc.sql("""
                update episode_build_run
                set status=:status, current_step=:step, error_message=:message, updated_at=now()
                where id=:runId
                """)
                .param("runId", runId)
                .param("status", status)
                .param("step", step)
                .param("message", message)
                .update();
        jdbc.sql("""
                update episode_build_step
                set status=:status, error_message=:message, updated_at=now()
                where run_id=:runId and step_key=:step
                """)
                .param("runId", runId)
                .param("status", status)
                .param("step", step)
                .param("message", message)
                .update();
    }

    private boolean stepComplete(UUID runId, String step) {
        return jdbc.sql("select status='COMPLETE' from episode_build_step where run_id=:runId and step_key=:step")
                .param("runId", runId)
                .param("step", step)
                .query(Boolean.class)
                .optional()
                .orElse(false);
    }

    private boolean stageRevisionReady(UUID runId, String stageKey) {
        return jdbc.sql("""
                select exists(
                  select 1
                  from production_stage_revision r
                  join production_stage s on s.id=r.production_stage_id
                  where s.episode_id=:episodeId and s.stage_key=:stageKey
                    and r.source_build_run_id=:runId
                    and coalesce((s.readiness->>'ready')::boolean, false)
                )
                """)
                .param("episodeId", EPISODE_ID)
                .param("stageKey", stageKey)
                .param("runId", runId)
                .query(Boolean.class)
                .single();
    }

    private Map<String, Object> stepArtifact(UUID runId, String step) {
        return jdbc.sql("select artifact::text from episode_build_step where run_id=:runId and step_key=:step")
                .param("runId", runId)
                .param("step", step)
                .query(String.class)
                .optional()
                .map(this::readMap)
                .orElseGet(LinkedHashMap::new);
    }

    private int buildBudget(UUID runId) {
        return jdbc.sql("select budget_minutes from episode_build_run where id=:runId")
                .param("runId", runId)
                .query(Integer.class)
                .single();
    }

    private Map<String, Object> nextRunnableRun() {
        return jdbc.sql("""
                select id, current_step, status
                from episode_build_run
                where episode_id=:episodeId and status in ('QUEUED','RUNNING')
                order by created_at
                limit 1
                """)
                .param("episodeId", EPISODE_ID)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "id", rs.getObject("id", UUID.class),
                        "currentStep", rs.getString("current_step"),
                        "status", rs.getString("status")
                ))
                .optional()
                .orElseGet(LinkedHashMap::new);
    }

    private boolean activeRunExists() {
        return jdbc.sql("""
                select exists(
                  select 1 from episode_build_run
                  where episode_id=:episodeId and status in ('QUEUED','RUNNING')
                )
                """)
                .param("episodeId", EPISODE_ID)
                .query(Boolean.class)
                .single();
    }

    private boolean canStartCurrentEpisode() {
        if (activeRunExists()) return false;
        return jdbc.sql("""
                select count(*)=0
                from production_stage
                where episode_id=:episodeId
                  and stage_key in ('SCRIPT','SCENE')
                  and (status='LOCKED' or current_revision > 0)
                """)
                .param("episodeId", EPISODE_ID)
                .query(Boolean.class)
                .single();
    }

    private Map<String, Object> latestRun() {
        return jdbc.sql("""
                select id, topic_candidate_id, status, current_step, progress_percent,
                       budget_minutes, error_message, started_at, completed_at, created_at, updated_at
                from episode_build_run
                where episode_id=:episodeId
                order by created_at desc
                limit 1
                """)
                .param("episodeId", EPISODE_ID)
                .query((rs, rowNum) -> {
                    UUID runId = rs.getObject("id", UUID.class);
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", runId);
                    row.put("topicCandidateId", rs.getObject("topic_candidate_id", UUID.class));
                    row.put("status", rs.getString("status"));
                    row.put("currentStep", rs.getString("current_step"));
                    row.put("progressPercent", rs.getInt("progress_percent"));
                    row.put("budgetMinutes", rs.getInt("budget_minutes"));
                    row.put("errorMessage", rs.getString("error_message"));
                    row.put("startedAt", rs.getObject("started_at", OffsetDateTime.class));
                    row.put("completedAt", rs.getObject("completed_at", OffsetDateTime.class));
                    row.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    row.put("updatedAt", rs.getObject("updated_at", OffsetDateTime.class));
                    row.put("steps", buildSteps(runId));
                    return row;
                })
                .optional()
                .orElseGet(LinkedHashMap::new);
    }

    private List<Map<String, Object>> buildSteps(UUID runId) {
        return jdbc.sql("""
                select step_key, sequence_no, status, summary, error_message,
                       started_at, completed_at, updated_at
                from episode_build_step
                where run_id=:runId
                order by sequence_no
                """)
                .param("runId", runId)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("stepKey", rs.getString("step_key"));
                    row.put("sequence", rs.getInt("sequence_no"));
                    row.put("status", rs.getString("status"));
                    row.put("summary", rs.getString("summary"));
                    row.put("errorMessage", rs.getString("error_message"));
                    row.put("startedAt", rs.getObject("started_at", OffsetDateTime.class));
                    row.put("completedAt", rs.getObject("completed_at", OffsetDateTime.class));
                    row.put("updatedAt", rs.getObject("updated_at", OffsetDateTime.class));
                    return row;
                })
                .list();
    }

    private Map<String, Object> creativePolicy() {
        return jdbc.sql("select version, payload::text, updated_at from project_creative_policy where project_id=:projectId")
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "version", rs.getString("version"),
                        "payload", readMap(rs.getString("payload")),
                        "updatedAt", rs.getObject("updated_at", OffsetDateTime.class)
                ))
                .optional()
                .orElseGet(LinkedHashMap::new);
    }

    private Map<String, Object> currentTopic() {
        return topicCandidates().stream()
                .filter(item -> "CURRENT".equals(item.get("status")))
                .findFirst()
                .orElseGet(LinkedHashMap::new);
    }

    private List<Map<String, Object>> topicCandidates() {
        return jdbc.sql("""
                select id, title, central_question, viewer_promise, evergreen_reason, mass_entry,
                       senior_lesson, system_boundary, core_tension, aha_candidates::text,
                       failure_tradeoff, reuse_plan, new_assets::text, series_path, thumbnail_idea,
                       estimated_complexity, recommended_build_minutes, status, created_at
                from episode_topic_candidate
                where project_id=:projectId and status in ('CURRENT','READY')
                order by case when status='CURRENT' then 0 else 1 end, created_at desc
                limit 12
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("title", rs.getString("title"));
                    row.put("centralQuestion", rs.getString("central_question"));
                    row.put("viewerPromise", rs.getString("viewer_promise"));
                    row.put("evergreenReason", rs.getString("evergreen_reason"));
                    row.put("massEntry", rs.getString("mass_entry"));
                    row.put("seniorLesson", rs.getString("senior_lesson"));
                    row.put("systemBoundary", rs.getString("system_boundary"));
                    row.put("coreTension", rs.getString("core_tension"));
                    row.put("ahaCandidates", readList(rs.getString("aha_candidates")));
                    row.put("failureTradeoff", rs.getString("failure_tradeoff"));
                    row.put("reusePlan", rs.getString("reuse_plan"));
                    row.put("newAssets", readList(rs.getString("new_assets")));
                    row.put("seriesPath", rs.getString("series_path"));
                    row.put("thumbnailIdea", rs.getString("thumbnail_idea"));
                    row.put("estimatedComplexity", rs.getString("estimated_complexity"));
                    row.put("recommendedBuildMinutes", rs.getInt("recommended_build_minutes"));
                    row.put("status", rs.getString("status"));
                    row.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    return row;
                })
                .list();
    }

    private Map<String, Object> stageRow(String key) {
        return jdbc.sql("""
                select id, stage_key, status, summary, next_action, artifact::text, current_revision
                from production_stage
                where episode_id=:episodeId and stage_key=:stageKey
                """)
                .param("episodeId", EPISODE_ID)
                .param("stageKey", key)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("stageKey", rs.getString("stage_key"));
                    row.put("status", rs.getString("status"));
                    row.put("summary", rs.getString("summary"));
                    row.put("nextAction", rs.getString("next_action"));
                    row.put("artifact", readNullableMap(rs.getString("artifact")));
                    row.put("revision", rs.getInt("current_revision"));
                    return row;
                })
                .single();
    }

    private UUID threadId(String key) {
        String agentKey = "SCRIPT".equals(key) ? "SCRIPT_AGENT" : "SCENE_AGENT";
        return jdbc.sql("""
                select t.id
                from agent_thread t
                join agent_profile ap on ap.id=t.agent_profile_id
                where t.episode_id=:episodeId and ap.agent_key=:agentKey
                order by t.created_at desc
                limit 1
                """)
                .param("episodeId", EPISODE_ID)
                .param("agentKey", agentKey)
                .query(UUID.class)
                .single();
    }

    private List<Map<String, Object>> creatorMemory(String key) {
        String agentKey = "SCRIPT".equals(key) ? "SCRIPT_AGENT" : "SCENE_AGENT";
        return jdbc.sql("""
                select memory_type, content, created_at
                from agent_memory
                where episode_id=:episodeId and agent_key=:agentKey
                order by created_at desc
                limit 30
                """)
                .param("episodeId", EPISODE_ID)
                .param("agentKey", agentKey)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "type", rs.getString("memory_type"),
                        "content", rs.getString("content"),
                        "createdAt", rs.getObject("created_at", OffsetDateTime.class)
                ))
                .list();
    }

    private String normalizeComplexity(String value) {
        String normalized = clean(value).toUpperCase(Locale.ROOT);
        return List.of("LOW", "MEDIUM", "HIGH").contains(normalized) ? normalized : "MEDIUM";
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private int number(Object value) {
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ex) {
            return 0;
        }
    }

    private boolean blank(Object value) {
        return value == null || String.valueOf(value).isBlank();
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : new LinkedHashMap<>();
    }

    private List<?> asList(Object value) {
        return value instanceof List<?> list ? list : List.of();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> mapList(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> map) result.add((Map<String, Object>) map);
        }
        return result;
    }

    private List<String> dedupe(List<String> values) {
        return new ArrayList<>(values.stream().distinct().toList());
    }

    private Map<String, Object> readMap(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception ex) {
            return new LinkedHashMap<>();
        }
    }

    private Map<String, Object> readNullableMap(String json) {
        if (json == null || json.isBlank()) return null;
        return readMap(json);
    }

    private List<String> readList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize autonomous episode build data.", ex);
        }
    }
}
