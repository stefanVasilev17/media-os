package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative")
public class CreativeWorkflowController {

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final CreativeAgentClient creativeAgent;
    private final ProductionOverviewService overviewService;

    public CreativeWorkflowController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            CreativeAgentClient creativeAgent,
            ProductionOverviewService overviewService
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.creativeAgent = creativeAgent;
        this.overviewService = overviewService;
    }

    public record MessageRequest(@NotBlank @Size(max = 6000) String message) {}

    @GetMapping("/overview")
    public Map<String, Object> overview() {
        return overviewService.overview();
    }

    @GetMapping("/{stageKey}")
    public Map<String, Object> stage(@PathVariable String stageKey) {
        return stageState(normalizeStage(stageKey));
    }

    @PostMapping("/{stageKey}/generate")
    public Map<String, Object> generate(@PathVariable String stageKey) {
        String key = normalizeStage(stageKey);
        Map<String, Object> stage = stageRow(key);
        assertEditable(stage);
        assertUpstreamReady(key);

        CreativeAgentClient.AgentReply reply;
        try {
            reply = creativeAgent.generate(key, "GENERATE", List.of(), agentContext(key, stage));
        } catch (IllegalStateException ex) {
            HttpStatus status = creativeAgent.configured() ? HttpStatus.BAD_GATEWAY : HttpStatus.SERVICE_UNAVAILABLE;
            throw new ResponseStatusException(status, ex.getMessage(), ex);
        }

        UUID threadId = threadId(key);
        UUID assistantMessageId = insertMessage(threadId, "AGENT", reply.reply().trim());
        UUID revisionId = saveRevision(key, stage, reply, "AGENT");
        rememberIfUseful(key, null, assistantMessageId, revisionId, reply.memoryType(), reply.memoryNote());
        return stageState(key);
    }

    @PostMapping("/{stageKey}/messages")
    public Map<String, Object> message(@PathVariable String stageKey, @Valid @RequestBody MessageRequest request) {
        String key = normalizeStage(stageKey);
        Map<String, Object> stage = stageRow(key);
        assertEditable(stage);
        assertUpstreamReady(key);

        UUID threadId = threadId(key);
        String creatorMessage = request.message().trim();
        UUID creatorMessageId = insertMessage(threadId, "USER", creatorMessage);

        CreativeAgentClient.AgentReply reply;
        try {
            reply = creativeAgent.generate(key, "REVISE", transcript(threadId, 24), agentContext(key, stageRow(key)));
        } catch (IllegalStateException ex) {
            HttpStatus status = creativeAgent.configured() ? HttpStatus.BAD_GATEWAY : HttpStatus.SERVICE_UNAVAILABLE;
            throw new ResponseStatusException(status, ex.getMessage(), ex);
        }

        insertMessage(threadId, "AGENT", reply.reply().trim());
        UUID revisionId = saveRevision(key, stageRow(key), reply, "CREATOR_REVIEW");
        String memoryType = inferMemoryType(creatorMessage, reply.memoryType());
        rememberIfUseful(key, creatorMessage, creatorMessageId, revisionId, memoryType, reply.memoryNote());
        return stageState(key);
    }

    @PostMapping("/{stageKey}/lock")
    public Map<String, Object> lock(@PathVariable String stageKey) {
        String key = normalizeStage(stageKey);
        Map<String, Object> stage = stageRow(key);
        if ("LOCKED".equals(stage.get("status"))) {
            return lockResult(key);
        }
        assertEditable(stage);
        assertUpstreamReady(key);

        Map<String, Object> artifact = asMap(stage.get("artifact"));
        if (artifact.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Create the complete " + stage.get("displayName") + " artifact before locking it.");
        }

        List<String> remaining = validateArtifact(key, artifact);
        if (!remaining.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot lock yet: " + String.join(" ", remaining));
        }

        int revision = number(stage.get("revision"));
        jdbc.sql("""
                update production_stage
                set status='LOCKED', readiness=cast(:readiness as jsonb), locked_at=now(), updated_at=now()
                where episode_id=:episodeId and stage_key=:stageKey
                """)
                .param("readiness", writeJson(Map.of("ready", true, "remainingTasks", List.of())))
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("stageKey", key)
                .update();

        jdbc.sql("update agent_thread set status='LOCKED' where id=:threadId")
                .param("threadId", threadId(key))
                .update();

        String target = nextStageKey(key);
        Map<String, Object> handoff = new LinkedHashMap<>();
        handoff.put("sourceStage", key);
        handoff.put("sourceRevision", revision);
        handoff.put("summary", stage.get("summary"));
        handoff.put("nextAgentPrompt", artifact.getOrDefault("handoffPrompt", ""));
        handoff.put("artifact", artifact);

        jdbc.sql("""
                insert into agent_handoff(id, episode_id, source_stage_key, target_stage_key, source_revision, payload)
                values (:id,:episodeId,:source,:target,:revision,cast(:payload as jsonb))
                on conflict (episode_id, source_stage_key, source_revision, target_stage_key) do nothing
                """)
                .param("id", UUID.randomUUID())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("source", key)
                .param("target", target)
                .param("revision", revision)
                .param("payload", writeJson(handoff))
                .update();

        saveMemory(key, "LOCK_SUMMARY", "Locked revision " + revision + ". " + String.valueOf(stage.getOrDefault("summary", "")), null, null);
        advance(key, target, revision);
        return lockResult(key);
    }

    private Map<String, Object> lockResult(String key) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("stage", stageState(key));
        result.put("nextStageKey", nextStageKey(key));
        result.put("nextRoute", nextRoute(key));
        result.put("overview", overviewService.overview());
        return result;
    }

    private Map<String, Object> stageState(String key) {
        Map<String, Object> stage = stageRow(key);
        Map<String, Object> artifact = asMap(stage.get("artifact"));
        List<String> remaining = artifact.isEmpty()
                ? List.of("Create the complete " + stage.get("displayName") + " artifact.")
                : validateArtifact(key, artifact);

        boolean locked = "LOCKED".equals(stage.get("status"));
        boolean upstreamReady = upstreamReady(key);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("episode", overviewService.episode());
        result.put("stageKey", key);
        result.put("displayName", stage.get("displayName"));
        result.put("status", stage.get("status"));
        result.put("summary", stage.get("summary"));
        result.put("nextAction", stage.get("nextAction"));
        result.put("revision", stage.get("revision"));
        result.put("artifact", stage.get("artifact"));
        result.put("messages", messages(threadId(key), 60));
        result.put("memory", memories(key, 20));
        result.put("readyToLock", !locked && upstreamReady && remaining.isEmpty());
        result.put("remainingTasks", locked ? List.of() : remaining);
        result.put("locked", locked);
        result.put("lockedAt", stage.get("lockedAt"));
        result.put("upstreamReady", upstreamReady);
        result.put("upstream", latestHandoffFor(key));
        result.put("nextStageKey", nextStageKey(key));
        result.put("nextRoute", nextRoute(key));
        result.put("agentConfigured", creativeAgent.configured());
        return result;
    }

    private UUID saveRevision(String key, Map<String, Object> stage, CreativeAgentClient.AgentReply reply, String createdBy) {
        if (reply.artifact() == null || reply.artifact().isEmpty()) {
            throw new IllegalStateException("Creative agent returned an empty artifact.");
        }
        int revision = number(stage.get("revision")) + 1;
        List<String> remaining = validateArtifact(key, reply.artifact());
        Map<String, Object> readiness = Map.of("ready", remaining.isEmpty(), "remainingTasks", remaining);
        UUID revisionId = UUID.randomUUID();
        String summary = blankTo(reply.summary(), "Revision " + revision + " is ready for creator review.");
        String nextAction = blankTo(reply.nextAction(), remaining.isEmpty() ? "Review and lock when approved." : remaining.get(0));

        jdbc.sql("""
                update production_stage
                set artifact=cast(:artifact as jsonb), current_revision=:revision,
                    summary=:summary, next_action=:nextAction,
                    readiness=cast(:readiness as jsonb), status='ACTIVE', updated_at=now()
                where episode_id=:episodeId and stage_key=:stageKey
                """)
                .param("artifact", writeJson(reply.artifact()))
                .param("revision", revision)
                .param("summary", summary)
                .param("nextAction", nextAction)
                .param("readiness", writeJson(readiness))
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("stageKey", key)
                .update();

        jdbc.sql("""
                insert into production_stage_revision(
                  id, production_stage_id, revision, artifact, summary, change_summary, created_by
                ) values (:id,:stageId,:revision,cast(:artifact as jsonb),:summary,:changeSummary,:createdBy)
                """)
                .param("id", revisionId)
                .param("stageId", stage.get("id"))
                .param("revision", revision)
                .param("artifact", writeJson(reply.artifact()))
                .param("summary", summary)
                .param("changeSummary", blankTo(reply.changeSummary(), createdBy + " revision"))
                .param("createdBy", createdBy)
                .update();
        return revisionId;
    }

    private Map<String, Object> agentContext(String key, Map<String, Object> stage) {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("episode", overviewService.episode());
        context.put("sourceSnapshot", overviewService.sourceSnapshot());
        context.put("currentArtifact", stage.get("artifact"));
        context.put("currentRevision", stage.get("revision"));
        context.put("currentSummary", stage.get("summary"));
        context.put("lockedUpstreamHandoff", latestHandoffFor(key));
        context.put("creatorMemory", memories(key, 30));
        context.put("productionOverview", overviewService.overview());
        return context;
    }

    private void advance(String key, String target, int revision) {
        if ("SCRIPT".equals(key)) {
            jdbc.sql("""
                    update production_stage
                    set status='ACTIVE', summary=:summary,
                        next_action='Generate the combined timed Scene plan, divide it into shots, then review and lock it.',
                        updated_at=now()
                    where episode_id=:episodeId and stage_key='SCENE' and status <> 'LOCKED'
                    """)
                    .param("summary", "Locked Script revision " + revision + " is ready for Scene planning.")
                    .param("episodeId", ProductionOverviewService.EPISODE_ID)
                    .update();
            jdbc.sql("update agent_thread set status='ACTIVE' where id=:threadId")
                    .param("threadId", threadId("SCENE"))
                    .update();
            jdbc.sql("update episode set current_stage='SCENE_DESIGN' where id=:episodeId")
                    .param("episodeId", ProductionOverviewService.EPISODE_ID)
                    .update();
        } else if ("SCENE".equals(key)) {
            jdbc.sql("""
                    update production_stage
                    set status='ACTIVE', next_action='Execute the locked Scene shot prompts in the existing Spline workspace.', updated_at=now()
                    where episode_id=:episodeId and stage_key='SPLINE' and status <> 'LOCKED'
                    """)
                    .param("episodeId", ProductionOverviewService.EPISODE_ID)
                    .update();
            jdbc.sql("update episode set current_stage='SPLINE_BUILD' where id=:episodeId")
                    .param("episodeId", ProductionOverviewService.EPISODE_ID)
                    .update();
        }
    }

    private void assertEditable(Map<String, Object> stage) {
        if ("LOCKED".equals(stage.get("status"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, stage.get("displayName") + " is locked. Unlocking a production handoff is intentionally not supported; create a new revision only before lock.");
        }
    }

    private void assertUpstreamReady(String key) {
        if (!upstreamReady(key)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lock the Script contract before generating or revising Scene work.");
        }
    }

    private boolean upstreamReady(String key) {
        if ("SCRIPT".equals(key)) return true;
        return jdbc.sql("""
                select exists(
                  select 1 from production_stage
                  where episode_id=:episodeId and stage_key='SCRIPT' and status='LOCKED'
                )
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .query(Boolean.class)
                .single();
    }

    private Map<String, Object> latestHandoffFor(String targetStageKey) {
        return jdbc.sql("""
                select source_stage_key, source_revision, payload::text, created_at
                from agent_handoff
                where episode_id=:episodeId and target_stage_key=:target
                order by created_at desc
                limit 1
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("target", targetStageKey)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("sourceStageKey", rs.getString("source_stage_key"));
                    row.put("sourceRevision", rs.getInt("source_revision"));
                    row.put("payload", readMap(rs.getString("payload")));
                    row.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    return row;
                })
                .optional()
                .orElseGet(LinkedHashMap::new);
    }

    private List<String> validateArtifact(String key, Map<String, Object> artifact) {
        return "SCRIPT".equals(key) ? validateScript(artifact) : validateScene(artifact);
    }

    private List<String> validateScript(Map<String, Object> artifact) {
        List<String> missing = new ArrayList<>();
        int duration = number(artifact.get("targetDurationSeconds"));
        if (duration < 780 || duration > 960) {
            missing.add("Target duration must stay inside 13–16 minutes (780–960 seconds). ");
        }
        List<Map<String, Object>> timeline = mapList(artifact.get("timeline"));
        if (timeline.size() < 8) {
            missing.add("The mandatory Script timeline is incomplete. ");
            return missing;
        }

        int expectedStart = 0;
        int aha = 0;
        int reels = 0;
        boolean contentMissing = false;
        for (Map<String, Object> item : timeline) {
            int start = number(item.get("startSecond"));
            int end = number(item.get("endSecond"));
            if (start != expectedStart || end <= start) {
                missing.add("Script timeline must be contiguous, ordered, and gap-free from second 0. ");
                break;
            }
            expectedStart = end;
            if (blank(item.get("narration")) || blank(item.get("voiceDirection")) || blank(item.get("purpose"))) contentMissing = true;
            if (Boolean.TRUE.equals(item.get("ahaMoment"))) aha++;
            if (Boolean.TRUE.equals(item.get("reelCandidate"))) reels++;
        }
        if (expectedStart != duration) missing.add("The final Script timeline timestamp must equal targetDurationSeconds. ");
        if (contentMissing) missing.add("Every Script timeline item needs narration, voice direction, and purpose. ");
        if (aha < 3) missing.add("Preserve at least three explicit Aha moments. ");
        if (reels < 3) missing.add("Preserve at least three reel-ready moments. ");
        if (blank(artifact.get("handoffPrompt"))) missing.add("Add the complete handoff prompt for Scene Agent. ");
        return dedupe(missing);
    }

    private List<String> validateScene(Map<String, Object> artifact) {
        List<String> missing = new ArrayList<>();
        Map<String, Object> upstream = latestHandoffFor("SCENE");
        Map<String, Object> upstreamPayload = asMap(upstream.get("payload"));
        Map<String, Object> scriptArtifact = asMap(upstreamPayload.get("artifact"));
        int duration = number(scriptArtifact.get("targetDurationSeconds"));
        if (duration <= 0) {
            missing.add("A locked Script duration is required. ");
            return missing;
        }

        List<Map<String, Object>> timeline = mapList(artifact.get("timeline"));
        if (timeline.size() < 8) {
            missing.add("The combined Scene timeline is incomplete. ");
        } else {
            int expectedStart = 0;
            boolean contentMissing = false;
            for (Map<String, Object> item : timeline) {
                int start = number(item.get("startSecond"));
                int end = number(item.get("endSecond"));
                if (start != expectedStart || end <= start) {
                    missing.add("Scene timeline must be contiguous, ordered, and gap-free from second 0. ");
                    break;
                }
                expectedStart = end;
                if (blank(item.get("narration")) || blank(item.get("voiceDirection")) || blank(item.get("visualFocus"))
                        || blank(item.get("camera")) || asList(item.get("sceneMoves")).isEmpty()) contentMissing = true;
            }
            if (expectedStart != duration) missing.add("The Scene timeline must end at the locked Script duration. ");
            if (contentMissing) missing.add("Every Scene timeline item needs narration, voice direction, visual focus, scene moves, and camera behavior. ");
        }

        List<Map<String, Object>> shots = mapList(artifact.get("shots"));
        if (shots.size() < 8) {
            missing.add("Divide the episode into a complete set of controlled shots. ");
        } else {
            int expectedStart = 0;
            boolean shotMissing = false;
            for (Map<String, Object> shot : shots) {
                int start = number(shot.get("startSecond"));
                int end = number(shot.get("endSecond"));
                if (start != expectedStart || end <= start) {
                    missing.add("Shots must cover the episode contiguously with no gaps or overlaps. ");
                    break;
                }
                expectedStart = end;
                if (blank(shot.get("shotKey")) || blank(shot.get("script")) || blank(shot.get("voiceDirection"))
                        || blank(shot.get("camera")) || blank(shot.get("visualGoal")) || blank(shot.get("promptForSpline"))
                        || asList(shot.get("moves")).isEmpty()) shotMissing = true;
            }
            if (expectedStart != duration) missing.add("The final shot must end at the locked Script duration. ");
            if (shotMissing) missing.add("Every shot needs script, voice direction, moves, camera, visual goal, and a deterministic Spline prompt. ");
        }
        if (blank(artifact.get("handoffPrompt"))) missing.add("Add the complete Spline handoff prompt. ");
        return dedupe(missing);
    }

    private Map<String, Object> stageRow(String key) {
        return jdbc.sql("""
                select id, stage_key, display_name, status, summary, next_action,
                       artifact::text, current_revision, locked_at
                from production_stage
                where episode_id=:episodeId and stage_key=:stageKey
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("stageKey", key)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("stageKey", rs.getString("stage_key"));
                    row.put("displayName", rs.getString("display_name"));
                    row.put("status", rs.getString("status"));
                    row.put("summary", rs.getString("summary"));
                    row.put("nextAction", rs.getString("next_action"));
                    row.put("artifact", readNullableMap(rs.getString("artifact")));
                    row.put("revision", rs.getInt("current_revision"));
                    row.put("lockedAt", rs.getObject("locked_at", OffsetDateTime.class));
                    return row;
                })
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Production stage not found: " + key));
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
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("agentKey", agentKey)
                .query(UUID.class)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, key + " Agent thread is not initialized."));
    }

    private UUID insertMessage(UUID threadId, String sender, String content) {
        UUID id = UUID.randomUUID();
        jdbc.sql("insert into agent_message(id, thread_id, sender, content) values (:id,:threadId,:sender,:content)")
                .param("id", id)
                .param("threadId", threadId)
                .param("sender", sender)
                .param("content", content)
                .update();
        return id;
    }

    private List<CreativeAgentClient.TranscriptMessage> transcript(UUID threadId, int limit) {
        return jdbc.sql("""
                select sender, content
                from (
                  select sender, content, created_at
                  from agent_message
                  where thread_id=:threadId and sender in ('USER','AGENT')
                  order by created_at desc
                  limit :limit
                ) recent
                order by created_at asc
                """)
                .param("threadId", threadId)
                .param("limit", limit)
                .query((rs, rowNum) -> new CreativeAgentClient.TranscriptMessage(rs.getString("sender"), rs.getString("content")))
                .list();
    }

    private List<Map<String, Object>> messages(UUID threadId, int limit) {
        return jdbc.sql("""
                select id, sender, content, created_at
                from (
                  select id, sender, content, created_at
                  from agent_message
                  where thread_id=:threadId and sender in ('USER','AGENT')
                  order by created_at desc
                  limit :limit
                ) recent
                order by created_at asc
                """)
                .param("threadId", threadId)
                .param("limit", limit)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("sender", rs.getString("sender"));
                    row.put("content", rs.getString("content"));
                    row.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    return row;
                })
                .list();
    }

    private List<Map<String, Object>> memories(String key, int limit) {
        String agentKey = "SCRIPT".equals(key) ? "SCRIPT_AGENT" : "SCENE_AGENT";
        return jdbc.sql("""
                select id, memory_type, content, created_at
                from agent_memory
                where episode_id=:episodeId and agent_key=:agentKey
                order by created_at desc
                limit :limit
                """)
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("agentKey", agentKey)
                .param("limit", limit)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "id", rs.getObject("id", UUID.class),
                        "type", rs.getString("memory_type"),
                        "content", rs.getString("content"),
                        "createdAt", rs.getObject("created_at", OffsetDateTime.class)
                ))
                .list();
    }

    private void rememberIfUseful(
            String key,
            String creatorMessage,
            UUID sourceMessageId,
            UUID revisionId,
            String memoryType,
            String memoryNote
    ) {
        if (memoryType == null || "NONE".equals(memoryType) || memoryNote == null || memoryNote.isBlank()) return;
        String content = creatorMessage == null || creatorMessage.isBlank()
                ? memoryNote.trim()
                : "Creator feedback: " + creatorMessage.trim() + "\nDurable lesson: " + memoryNote.trim();
        saveMemory(key, memoryType, content, sourceMessageId, revisionId);
    }

    private void saveMemory(String key, String type, String content, UUID sourceMessageId, UUID revisionId) {
        String agentKey = "SCRIPT".equals(key) ? "SCRIPT_AGENT" : "SCENE_AGENT";
        jdbc.sql("""
                insert into agent_memory(
                  id, episode_id, agent_key, memory_type, content, source_message_id, source_stage_revision_id
                ) values (:id,:episodeId,:agentKey,:type,:content,:sourceMessageId,:revisionId)
                """)
                .param("id", UUID.randomUUID())
                .param("episodeId", ProductionOverviewService.EPISODE_ID)
                .param("agentKey", agentKey)
                .param("type", type)
                .param("content", content)
                .param("sourceMessageId", sourceMessageId)
                .param("revisionId", revisionId)
                .update();
    }

    private String inferMemoryType(String creatorMessage, String modelType) {
        String text = creatorMessage.toLowerCase(Locale.ROOT);
        if (containsAny(text, "занапред", "винаги", "никога", "предпочитам", "отсега нататък", "from now on", "always", "never", "prefer")) return "PREFERENCE";
        if (containsAny(text, "коригирай", "поправи", "промени", "смени", "вместо", "не искам", "грешно", "correct", "fix", "change", "instead", "wrong", "don't want")) return "CORRECTION";
        if (containsAny(text, "перфектно", "супер", "много добро", "страхотно", "харесва ми", "одобрявам", "perfect", "great", "excellent", "love it", "approved")) return "PRAISE";
        return modelType == null || modelType.isBlank() ? "NONE" : modelType;
    }

    private boolean containsAny(String text, String... values) {
        for (String value : values) if (text.contains(value)) return true;
        return false;
    }

    private String nextStageKey(String key) {
        return "SCRIPT".equals(key) ? "SCENE" : "SPLINE";
    }

    private String nextRoute(String key) {
        return "SCRIPT".equals(key) ? "#/agents/scene" : "#/agents/spline";
    }

    private String normalizeStage(String raw) {
        String key = raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT);
        if (!List.of("SCRIPT", "SCENE").contains(key)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Creative stage not found.");
        }
        return key;
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

    private String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
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

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize creative workflow data.", ex);
        }
    }
}
