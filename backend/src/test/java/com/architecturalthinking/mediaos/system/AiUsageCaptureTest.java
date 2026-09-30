package com.architecturalthinking.mediaos.system;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AiUsageCaptureTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @AfterEach
    void clearUsage() {
        AiUsageCapture.clear();
    }

    @Test
    void capturesResponsesApiUsageExactly() throws Exception {
        AiUsageCapture.capture(objectMapper.readTree("""
                {
                  "usage": {
                    "input_tokens": 1250,
                    "input_tokens_details": {"cached_tokens": 700},
                    "output_tokens": 480,
                    "output_tokens_details": {"reasoning_tokens": 210},
                    "total_tokens": 1730
                  }
                }
                """));

        AiUsageCapture.Usage usage = AiUsageCapture.take();

        assertThat(usage).isNotNull();
        assertThat(usage.inputTokens()).isEqualTo(1250);
        assertThat(usage.outputTokens()).isEqualTo(480);
        assertThat(usage.totalTokens()).isEqualTo(1730);
        assertThat(usage.cachedInputTokens()).isEqualTo(700);
        assertThat(usage.reasoningTokens()).isEqualTo(210);
    }

    @Test
    void ignoresResponsesWithoutCompleteUsage() throws Exception {
        AiUsageCapture.capture(objectMapper.readTree("{\"usage\":null}"));
        assertThat(AiUsageCapture.take()).isNull();
    }
}
