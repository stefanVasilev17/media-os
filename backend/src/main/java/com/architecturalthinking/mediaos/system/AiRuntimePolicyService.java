package com.architecturalthinking.mediaos.system;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.http.HttpStatus.CONFLICT;

@Service
public class AiRuntimePolicyService {

    private final JdbcClient jdbc;

    public AiRuntimePolicyService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Policy policy() {
        return jdbc.sql("""
                select paid_ai_enabled, auto_repair_enabled, updated_at
                from ai_runtime_policy
                where id = 1
                """)
                .query((rs, rowNum) -> new Policy(
                        rs.getBoolean("paid_ai_enabled"),
                        rs.getBoolean("auto_repair_enabled"),
                        rs.getObject("updated_at", OffsetDateTime.class)
                ))
                .optional()
                .orElse(new Policy(false, false, null));
    }

    public boolean paidAiEnabled() {
        return policy().paidAiEnabled();
    }

    public boolean autoRepairEnabled() {
        return policy().autoRepairEnabled();
    }

    public void requirePaidAiEnabled(String operation) {
        if (paidAiEnabled()) return;
        throw new ResponseStatusException(
                CONFLICT,
                "Paid AI is OFF in MediaOS Settings. No model request was sent. Enable Paid AI only when you are ready to spend API credits, then retry " + operation + "."
        );
    }

    public Map<String, Object> update(Boolean paidAiEnabled, Boolean autoRepairEnabled) {
        Policy current = policy();
        boolean nextPaid = paidAiEnabled == null ? current.paidAiEnabled() : paidAiEnabled;
        boolean nextRepair = autoRepairEnabled == null ? current.autoRepairEnabled() : autoRepairEnabled;
        if (!nextPaid) nextRepair = false;

        jdbc.sql("""
                update ai_runtime_policy
                set paid_ai_enabled = :paid,
                    auto_repair_enabled = :repair,
                    updated_at = now()
                where id = 1
                """)
                .param("paid", nextPaid)
                .param("repair", nextRepair)
                .update();
        return snapshot();
    }

    public UUID beginCall(String agentKey, String operation, String model, Integer requestedOutputTokenLimit) {
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                insert into ai_call_ledger(
                    id, agent_key, operation, model, requested_output_token_limit, status, started_at
                ) values (
                    :id, :agentKey, :operation, :model, :tokenLimit, 'STARTED', now()
                )
                """)
                .param("id", id)
                .param("agentKey", clean(agentKey, 80))
                .param("operation", clean(operation, 120))
                .param("model", cleanNullable(model, 120))
                .param("tokenLimit", requestedOutputTokenLimit)
                .update();
        return id;
    }

    public void recordBlocked(String agentKey, String operation, String model, Integer requestedOutputTokenLimit, String reason) {
        jdbc.sql("""
                insert into ai_call_ledger(
                    id, agent_key, operation, model, requested_output_token_limit,
                    status, blocked_reason, started_at, completed_at
                ) values (
                    :id, :agentKey, :operation, :model, :tokenLimit,
                    'BLOCKED', :reason, now(), now()
                )
                """)
                .param("id", UUID.randomUUID())
                .param("agentKey", clean(agentKey, 80))
                .param("operation", clean(operation, 120))
                .param("model", cleanNullable(model, 120))
                .param("tokenLimit", requestedOutputTokenLimit)
                .param("reason", cleanNullable(reason, 1000))
                .update();
    }

    public void completeSuccess(UUID callId) {
        jdbc.sql("""
                update ai_call_ledger
                set status = 'SUCCEEDED', completed_at = now()
                where id = :id
                """)
                .param("id", callId)
                .update();
    }

    public void completeFailure(UUID callId, String failureMessage) {
        jdbc.sql("""
                update ai_call_ledger
                set status = 'FAILED', failure_message = :failure, completed_at = now()
                where id = :id
                """)
                .param("id", callId)
                .param("failure", cleanNullable(failureMessage, 1500))
                .update();
    }

    public void recordUsage(
            UUID callId,
            int inputTokens,
            int outputTokens,
            int totalTokens,
            int cachedInputTokens,
            int reasoningTokens
    ) {
        jdbc.sql("""
                update ai_call_ledger
                set input_tokens = :inputTokens,
                    output_tokens = :outputTokens,
                    total_tokens = :totalTokens,
                    cached_input_tokens = :cachedInputTokens,
                    reasoning_tokens = :reasoningTokens
                where id = :id
                """)
                .param("id", callId)
                .param("inputTokens", Math.max(0, inputTokens))
                .param("outputTokens", Math.max(0, outputTokens))
                .param("totalTokens", Math.max(0, totalTokens))
                .param("cachedInputTokens", Math.max(0, cachedInputTokens))
                .param("reasoningTokens", Math.max(0, reasoningTokens))
                .update();
    }

    public Map<String, Object> snapshot() {
        Policy current = policy();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("paidAiEnabled", current.paidAiEnabled());
        result.put("autoRepairEnabled", current.autoRepairEnabled());
        result.put("updatedAt", current.updatedAt());
        result.put("safetyMode", current.paidAiEnabled() ? "PAID_AI_ON" : "ZERO_SPEND");
        result.put("tokenUsageCaptured", true);
        result.put("month", monthSummary());
        result.put("recentCalls", recentCalls());
        return result;
    }

    private Map<String, Object> monthSummary() {
        return jdbc.sql("""
                select count(*) as attempts,
                       count(*) filter (where status = 'SUCCEEDED') as succeeded,
                       count(*) filter (where status = 'FAILED') as failed,
                       count(*) filter (where status = 'BLOCKED') as blocked,
                       coalesce(sum(input_tokens), 0) as input_tokens,
                       coalesce(sum(output_tokens), 0) as output_tokens,
                       coalesce(sum(total_tokens), 0) as total_tokens,
                       coalesce(sum(cached_input_tokens), 0) as cached_input_tokens,
                       coalesce(sum(reasoning_tokens), 0) as reasoning_tokens
                from ai_call_ledger
                where started_at >= date_trunc('month', now())
                """)
                .query((rs, rowNum) -> {
                    Map<String, Object> summary = new LinkedHashMap<>();
                    summary.put("attempts", rs.getLong("attempts"));
                    summary.put("succeeded", rs.getLong("succeeded"));
                    summary.put("failed", rs.getLong("failed"));
                    summary.put("blocked", rs.getLong("blocked"));
                    summary.put("inputTokens", rs.getLong("input_tokens"));
                    summary.put("outputTokens", rs.getLong("output_tokens"));
                    summary.put("totalTokens", rs.getLong("total_tokens"));
                    summary.put("cachedInputTokens", rs.getLong("cached_input_tokens"));
                    summary.put("reasoningTokens", rs.getLong("reasoning_tokens"));
                    return summary;
                })
                .single();
    }

    private List<Map<String, Object>> recentCalls() {
        return jdbc.sql("""
                select id, agent_key, operation, model, requested_output_token_limit,
                       status, blocked_reason, failure_message,
                       input_tokens, output_tokens, total_tokens, cached_input_tokens, reasoning_tokens,
                       started_at, completed_at
                from ai_call_ledger
                order by started_at desc
                limit 12
                """)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("agentKey", rs.getString("agent_key"));
                    item.put("operation", rs.getString("operation"));
                    item.put("model", rs.getString("model"));
                    item.put("requestedOutputTokenLimit", rs.getObject("requested_output_token_limit"));
                    item.put("status", rs.getString("status"));
                    item.put("blockedReason", rs.getString("blocked_reason"));
                    item.put("failureMessage", rs.getString("failure_message"));
                    item.put("inputTokens", rs.getObject("input_tokens"));
                    item.put("outputTokens", rs.getObject("output_tokens"));
                    item.put("totalTokens", rs.getObject("total_tokens"));
                    item.put("cachedInputTokens", rs.getObject("cached_input_tokens"));
                    item.put("reasoningTokens", rs.getObject("reasoning_tokens"));
                    item.put("startedAt", rs.getObject("started_at", OffsetDateTime.class));
                    item.put("completedAt", rs.getObject("completed_at", OffsetDateTime.class));
                    return item;
                })
                .list();
    }

    private String clean(String value, int maxLength) {
        String normalized = value == null ? "unknown" : value.trim();
        if (normalized.isBlank()) normalized = "unknown";
        return normalized.length() <= maxLength ? normalized : normalized.substring(0, maxLength);
    }

    private String cleanNullable(String value, int maxLength) {
        if (value == null) return null;
        String normalized = value.trim();
        if (normalized.isBlank()) return null;
        return normalized.length() <= maxLength ? normalized : normalized.substring(0, maxLength);
    }

    public record Policy(boolean paidAiEnabled, boolean autoRepairEnabled, OffsetDateTime updatedAt) {}
}
