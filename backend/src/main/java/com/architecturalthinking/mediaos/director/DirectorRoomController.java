package com.architecturalthinking.mediaos.director;

import com.fasterxml.jackson.core.JsonProcessingException;
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
@RequestMapping("/api/v1/director")
public class DirectorRoomController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID EPISODE_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final DirectorAgentClient directorAgent;

    public DirectorRoomController(JdbcClient jdbc, ObjectMapper objectMapper, DirectorAgentClient directorAgent) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.directorAgent = directorAgent;
    }

    public record MessageRequest(
            @NotBlank @Size(max = 6000) String message,
            String mode
    ) {}

    @GetMapping("/room")
    public Map<String, Object> room() {
        return roomState();
    }

    @PostMapping("/messages")
    public Map<String, Object> message(@Valid @RequestBody MessageRequest request) {
        UUID threadId = directorThreadId();
        String creatorMessage = request.message().trim();
        String mode = normalizeMode(request.mode());

        insertMessage(threadId, "USER", creatorMessage);

        DirectorAgentClient.DirectorReply reply;
        try {
            reply = directorAgent.generate(mode, transcript(threadId, 28), directorContext());
        } catch (IllegalStateException ex) {
            HttpStatus status = directorAgent.configured() ? HttpStatus.BAD_GATEWAY : HttpStatus.SERVICE_UNAVAILABLE;
            throw new ResponseStatusException(status, ex.getMessage(), ex);
        }

        UUID assistantMessageId = insertMessage(threadId, "AGENT", reply.reply().trim());
        UUID proposalId = null;
        boolean proposalCandidate = ("PROPOSAL".equals(reply.responseType()) || "DECISION_READY".equals(reply.responseType()))
                && reply.proposalTitle() != null
                && !reply.proposalTitle().isBlank()
                && reply.proposalSummary() != null
                && !reply.proposalSummary().isBlank();

        if (proposalCandidate) {
            proposalId = createProposal(threadId, reply);
            if ("DECISION_READY".equals(reply.responseType()) && explicitlyRequestsLock(creatorMessage)) {
                lockProposal(proposalId, "Locked from an explicit Director Room command.");
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("messageId", assistantMessageId);
        result.put("responseType", reply.responseType());
        result.put("proposalId", proposalId);
        result.put("recommendedNextAction", reply.recommendedNextAction());
        result.put("room", roomState());
        return result;
    }

    @PostMapping("/proposals/{proposalId}/lock")
    public Map<String, Object> lock(@PathVariable UUID proposalId) {
        assertDirectorProposal(proposalId);
        lockProposal(proposalId, "Locked by the creator in Director Room.");
        return roomState();
    }

    @PostMapping("/proposals/{proposalId}/dismiss")
    public Map<String, Object> dismiss(@PathVariable UUID proposalId) {
        assertDirectorProposal(proposalId);
        jdbc.sql("update proposal set status='DISMISSED' where id=:proposalId and status <> 'LOCKED'")
                .param("proposalId", proposalId)
                .update();
        return roomState();
    }

    private Map<String, Object> roomState() {
        UUID threadId = directorThreadId();
        Map<String, Object> episode = episodeSnapshot();
        Map<String, Object> metrics = productionMetrics();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("episode", episode);
        result.put("agent", Map.of(
                "name", "MediaOS Director",
                "configured", directorAgent.configured(),
                "model", directorAgent.model(),
                "executionTarget", "RAILWAY_CLOUD",
                "windowsRequired", false
        ));
        result.put("pipeline", pipeline(episode, metrics));
        result.put("metrics", metrics);
        result.put("messages", messageRows(threadId, 80));
        result.put("proposals", proposalRows(threadId, false));
        result.put("decisions", proposalRows(threadId, true));
        result.put("operatingRules", List.of(
                "Discussion never mutates production by itself.",
                "Only explicit creator approval locks a Director decision.",
                "Every downstream page must receive deterministic, versioned handoff contracts.",
                "All MediaOS agent pages must run cloud-first with no Windows-machine dependency."
        ));
        return result;
    }

    private Map<String, Object> episodeSnapshot() {
        return jdbc.sql("""
                select e.id, e.episode_number, e.title, e.current_stage, e.status,
                       e.source_of_truth_version, p.name as project_name
                from episode e
                join project p on p.id=e.project_id
                where e.id=:episodeId
                """)
                .param("episodeId", EPISODE_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("episodeNumber", rs.getString("episode_number"));
                    row.put("title", rs.getString("title"));
                    row.put("currentStage", rs.getString("current_stage"));
                    row.put("status", rs.getString("status"));
                    row.put("sourceOfTruthVersion", rs.getString("source_of_truth_version"));
                    row.put("projectName", rs.getString("project_name"));
                    return row;
                })
                .single();
    }

    private Map<String, Object> productionMetrics() {
        long shotsPrepared = count("""
                select count(*) from production_job
                where project_id=:projectId
                  and agent_key='SPLINE_SHOT_AGENT'
                  and task_type='CREATE_RUNTIME_SHOT_V1'
                  and status='SUCCEEDED'
                """);
        long rendersReady = renderCount("READY");
        long rendersActive = count("""
                select count(*) from spline_shot_render
                where project_id=:projectId and status in ('QUEUED','RENDERING')
                """);
        long rendersFailed = renderCount("FAILED");
        long openProposals = count("""
                select count(*)
                from proposal p
                join agent_thread t on t.id=p.thread_id
                join agent_profile ap on ap.id=t.agent_profile_id
                where t.episode_id=:episodeId
                  and ap.agent_key='DIRECTOR_AGENT'
                  and p.status='READY_FOR_REVIEW'
                """, true);
        long lockedDecisions = count("""
                select count(*)
                from proposal p
                join agent_thread t on t.id=p.thread_id
                join agent_profile ap on ap.id=t.agent_profile_id
                where t.episode_id=:episodeId
                  and ap.agent_key='DIRECTOR_AGENT'
                  and p.status='LOCKED'
                """, true);

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("shotsPrepared", shotsPrepared);
        metrics.put("rendersReady", rendersReady);
        metrics.put("rendersActive", rendersActive);
        metrics.put("rendersFailed", rendersFailed);
        metrics.put("openProposals", openProposals);
        metrics.put("lockedDecisions", lockedDecisions);
        return metrics;
    }

    private List<Map<String, Object>> pipeline(Map<String, Object> episode, Map<String, Object> metrics) {
        long shots = ((Number) metrics.get("shotsPrepared")).longValue();
        long rendersReady = ((Number) metrics.get("rendersReady")).longValue();
        long rendersActive = ((Number) metrics.get("rendersActive")).longValue();
        String truthVersion = String.valueOf(episode.getOrDefault("sourceOfTruthVersion", ""));

        List<Map<String, Object>> stages = new ArrayList<>();
        stages.add(stage("DIRECTOR", "Director Room", "ACTIVE", "Conversation, critique, impact analysis and locked decisions."));
        stages.add(stage("RESEARCH", "Research & Truth", truthVersion.isBlank() || "null".equals(truthVersion) ? "PLANNED" : "REFERENCE", truthVersion.isBlank() ? "Not tracked yet." : "Source of truth " + truthVersion + " is attached to the episode."));
        stages.add(stage("SCRIPT", "Script", "PLANNED", "Dedicated Script Agent page will consume the locked Truth Contract."));
        stages.add(stage("SCENES", "Scene Architect", "PLANNED", "Timecoded visual plan and scene-to-shot decomposition."));
        stages.add(stage("SHOTS", "Shot Director", shots > 0 ? "ACTIVE" : "READY", shots + " prepared runtime shot revision(s) currently exist."));
        stages.add(stage("OBJECTS", "Object Resolver", "PLANNED", "Canonical object, camera, path and asset resolution before execution."));
        stages.add(stage("SPLINE", "Spline Execution", shots > 0 ? "ACTIVE" : "READY", "Cloud browser/runtime execution; no Windows runner dependency."));
        stages.add(stage("RENDER", "GPU Render", rendersActive > 0 ? "ACTIVE" : rendersReady > 0 ? "READY" : "READY", rendersReady + " ready render(s), " + rendersActive + " in flight."));
        stages.add(stage("QA", "Render QA", rendersReady > 0 ? "READY" : "WAITING", "QA can start once a shot render is ready."));
        return stages;
    }

    private Map<String, Object> stage(String key, String label, String status, String detail) {
        return Map.of("key", key, "label", label, "status", status, "detail", detail);
    }

    private Map<String, Object> directorContext() {
        UUID threadId = directorThreadId();
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("episode", episodeSnapshot());
        context.put("productionMetrics", productionMetrics());
        context.put("lockedDecisions", proposalRows(threadId, true));
        context.put("openProposals", proposalRows(threadId, false));
        context.put("recentShots", recentShots());
        context.put("runtimePolicy", Map.of(
                "cloudOnly", true,
                "windowsMachineAllowed", false,
                "splineExecution", "browser/runtime",
                "gpuRendering", "Runpod Serverless on demand"
        ));
        return context;
    }

    private List<Map<String, Object>> recentShots() {
        return jdbc.sql("""
                select id, target, status, payload->>'shotKey' as shot_key,
                       payload->>'creatorMessage' as creator_message, created_at
                from production_job
                where project_id=:projectId
                  and agent_key='SPLINE_SHOT_AGENT'
                  and task_type='CREATE_RUNTIME_SHOT_V1'
                order by created_at desc
                limit 8
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("target", rs.getString("target"));
                    row.put("status", rs.getString("status"));
                    row.put("shotKey", rs.getString("shot_key"));
                    row.put("creatorMessage", rs.getString("creator_message"));
                    row.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    return row;
                })
                .list();
    }

    private UUID directorThreadId() {
        return jdbc.sql("""
                select t.id
                from agent_thread t
                join agent_profile ap on ap.id=t.agent_profile_id
                where t.episode_id=:episodeId and ap.agent_key='DIRECTOR_AGENT'
                order by t.created_at desc
                limit 1
                """)
                .param("episodeId", EPISODE_ID)
                .query(UUID.class)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Director Room thread is not initialized."));
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

    private List<DirectorAgentClient.TranscriptMessage> transcript(UUID threadId, int limit) {
        return jdbc.sql("""
                select sender, content
                from (
                  select sender, content, created_at
                  from agent_message
                  where thread_id=:threadId
                  order by created_at desc
                  limit :limit
                ) recent
                order by created_at asc
                """)
                .param("threadId", threadId)
                .param("limit", limit)
                .query((rs, rowNum) -> new DirectorAgentClient.TranscriptMessage(
                        rs.getString("sender"),
                        rs.getString("content")
                ))
                .list();
    }

    private List<Map<String, Object>> messageRows(UUID threadId, int limit) {
        return jdbc.sql("""
                select id, sender, content, created_at
                from (
                  select id, sender, content, created_at
                  from agent_message
                  where thread_id=:threadId
                  order by created_at desc
                  limit :limit
                ) recent
                order by created_at asc
                """)
                .param("threadId", threadId)
                .param("limit", limit)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "id", rs.getObject("id", UUID.class),
                        "sender", rs.getString("sender"),
                        "content", rs.getString("content"),
                        "createdAt", rs.getObject("created_at", OffsetDateTime.class)
                ))
                .list();
    }

    private List<Map<String, Object>> proposalRows(UUID threadId, boolean locked) {
        String status = locked ? "LOCKED" : "READY_FOR_REVIEW";
        return jdbc.sql("""
                select p.id, p.title, p.summary, p.risk_level, p.confidence, p.status,
                       p.affected_objects::text, p.proposed_operations::text, p.created_at,
                       (select max(ad.created_at) from approval_decision ad where ad.proposal_id=p.id) as decided_at
                from proposal p
                where p.thread_id=:threadId and p.status=:status
                order by p.created_at desc
                limit 30
                """)
                .param("threadId", threadId)
                .param("status", status)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("title", rs.getString("title"));
                    row.put("summary", rs.getString("summary"));
                    row.put("riskLevel", rs.getString("risk_level"));
                    row.put("confidence", rs.getBigDecimal("confidence"));
                    row.put("status", rs.getString("status"));
                    row.put("affectedObjects", readJsonList(rs.getString("affected_objects")));
                    row.put("downstreamImpact", readJsonList(rs.getString("proposed_operations")));
                    row.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    row.put("decidedAt", rs.getObject("decided_at", OffsetDateTime.class));
                    return row;
                })
                .list();
    }

    private UUID createProposal(UUID threadId, DirectorAgentClient.DirectorReply reply) {
        UUID id = UUID.randomUUID();
        String risk = reply.riskLevel() == null || "NONE".equals(reply.riskLevel()) ? "LOW" : reply.riskLevel();
        double confidence = Math.max(0.0d, Math.min(1.0d, reply.confidence()));
        List<String> operations = new ArrayList<>(reply.downstreamImpact() == null ? List.of() : reply.downstreamImpact());
        if (reply.recommendedNextAction() != null && !reply.recommendedNextAction().isBlank()) {
            operations.add("NEXT: " + reply.recommendedNextAction());
        }

        jdbc.sql("""
                insert into proposal(
                  id, thread_id, title, summary, risk_level, confidence, status,
                  affected_objects, proposed_operations
                ) values (
                  :id, :threadId, :title, :summary, :risk, :confidence, 'READY_FOR_REVIEW',
                  cast(:affected as jsonb), cast(:operations as jsonb)
                )
                """)
                .param("id", id)
                .param("threadId", threadId)
                .param("title", reply.proposalTitle().trim())
                .param("summary", reply.proposalSummary().trim())
                .param("risk", risk)
                .param("confidence", confidence)
                .param("affected", writeJson(reply.affectedObjects() == null ? List.of() : reply.affectedObjects()))
                .param("operations", writeJson(operations))
                .update();
        return id;
    }

    private void lockProposal(UUID proposalId, String comment) {
        String currentStatus = jdbc.sql("select status from proposal where id=:proposalId")
                .param("proposalId", proposalId)
                .query(String.class)
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Director proposal not found."));
        if ("LOCKED".equals(currentStatus)) return;
        if ("DISMISSED".equals(currentStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dismissed Director proposals cannot be locked.");
        }

        jdbc.sql("insert into approval_decision(id, proposal_id, decision, creator_comment) values (:id,:proposalId,'APPROVE',:comment)")
                .param("id", UUID.randomUUID())
                .param("proposalId", proposalId)
                .param("comment", comment)
                .update();
        jdbc.sql("update proposal set status='LOCKED' where id=:proposalId")
                .param("proposalId", proposalId)
                .update();
    }

    private void assertDirectorProposal(UUID proposalId) {
        boolean exists = jdbc.sql("""
                select exists(
                  select 1
                  from proposal p
                  join agent_thread t on t.id=p.thread_id
                  join agent_profile ap on ap.id=t.agent_profile_id
                  where p.id=:proposalId
                    and t.episode_id=:episodeId
                    and ap.agent_key='DIRECTOR_AGENT'
                )
                """)
                .param("proposalId", proposalId)
                .param("episodeId", EPISODE_ID)
                .query(Boolean.class)
                .single();
        if (!exists) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Director proposal not found.");
    }

    private String normalizeMode(String raw) {
        String mode = raw == null ? "DISCUSS" : raw.trim().toUpperCase(Locale.ROOT);
        return switch (mode) {
            case "CHALLENGE", "IMPROVE", "IMPACT" -> mode;
            default -> "DISCUSS";
        };
    }

    private boolean explicitlyRequestsLock(String message) {
        String normalized = message.toLowerCase(Locale.ROOT);
        return normalized.contains("заключи")
                || normalized.contains("одобрявам")
                || normalized.contains("одобри и заключи")
                || normalized.contains("lock this")
                || normalized.contains("lock it")
                || normalized.contains("approve and lock");
    }

    private long renderCount(String status) {
        return jdbc.sql("select count(*) from spline_shot_render where project_id=:projectId and status=:status")
                .param("projectId", PROJECT_ID)
                .param("status", status)
                .query(Long.class)
                .single();
    }

    private long count(String sql) {
        return jdbc.sql(sql)
                .param("projectId", PROJECT_ID)
                .query(Long.class)
                .single();
    }

    private long count(String sql, boolean episodeScoped) {
        JdbcClient.StatementSpec statement = jdbc.sql(sql);
        if (episodeScoped) statement = statement.param("episodeId", EPISODE_ID);
        return statement.query(Long.class).single();
    }

    @SuppressWarnings("unchecked")
    private List<String> readJsonList(String value) {
        if (value == null || value.isBlank()) return List.of();
        try {
            return objectMapper.readValue(value, List.class);
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize Director data.", ex);
        }
    }
}
