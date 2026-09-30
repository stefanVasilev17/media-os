package com.architecturalthinking.mediaos.system;

import com.fasterxml.jackson.databind.JsonNode;

public final class AiUsageCapture {

    private static final ThreadLocal<Usage> CURRENT = new ThreadLocal<>();

    private AiUsageCapture() {}

    public static void capture(JsonNode root) {
        if (root == null) return;
        JsonNode usage = root.path("usage");
        if (!usage.isObject()) return;

        int inputTokens = usage.path("input_tokens").asInt(-1);
        int outputTokens = usage.path("output_tokens").asInt(-1);
        int totalTokens = usage.path("total_tokens").asInt(-1);
        if (inputTokens < 0 || outputTokens < 0 || totalTokens < 0) return;

        int cachedInputTokens = usage.path("input_tokens_details").path("cached_tokens").asInt(0);
        int reasoningTokens = usage.path("output_tokens_details").path("reasoning_tokens").asInt(0);
        CURRENT.set(new Usage(
                inputTokens,
                outputTokens,
                totalTokens,
                Math.max(0, cachedInputTokens),
                Math.max(0, reasoningTokens)
        ));
    }

    public static Usage take() {
        Usage usage = CURRENT.get();
        CURRENT.remove();
        return usage;
    }

    public static void clear() {
        CURRENT.remove();
    }

    public record Usage(
            int inputTokens,
            int outputTokens,
            int totalTokens,
            int cachedInputTokens,
            int reasoningTokens
    ) {}
}
