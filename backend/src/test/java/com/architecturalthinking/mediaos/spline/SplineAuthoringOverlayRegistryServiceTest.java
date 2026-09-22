package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SplineAuthoringOverlayRegistryServiceTest {

    @Test
    void createsStableSafeLabelVariableNames() {
        var service = new SplineAuthoringOverlayRegistryService(null, new ObjectMapper());

        String first = service.requestedLabelVariable(
                "Cookie/Token",
                "12345678-abcd-0000-1111-222222222222"
        );
        String second = service.requestedLabelVariable(
                "Cookie/Token",
                "12345678-abcd-0000-1111-222222222222"
        );

        assertThat(first).isEqualTo(second);
        assertThat(first).startsWith("AT_COOKIE_TOKEN_LABEL_12345678");
        assertThat(first).doesNotContain("/", " ", "-");
        assertThat(first.length()).isLessThanOrEqualTo(90);
    }

    @Test
    void capsVeryLongLabelVariableNames() {
        var service = new SplineAuthoringOverlayRegistryService(null, new ObjectMapper());

        String variable = service.requestedLabelVariable(
                "This is an extremely long reusable architecture slot name that must not create an unbounded variable identifier",
                "abcdef12-0000-0000-0000-000000000000"
        );

        assertThat(variable).startsWith("AT_");
        assertThat(variable).endsWith("_ABCDEF12");
        assertThat(variable.length()).isLessThanOrEqualTo(90);
    }
}
