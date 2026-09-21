package com.architecturalthinking.mediaos.spline;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SplineCommandOptimizerTest {

    @Test
    void recognizesReferenceComponentCreationBenchmark() {
        String message = """
                Create a new sandbox component named `MEDIA_OS_AGENT_TEST_CARD`.
                Use the existing `Headers` card as the visual reference.
                Do not modify the original reference.
                Create the new component in an empty area below the main architecture map.
                Change only the new card's title text to `AGENT TEST`.
                """;

        var intent = SplineCommandOptimizer.tryParseReferenceComponentCreate(message);

        assertThat(intent).isPresent();
        assertThat(intent.orElseThrow().targetRootName()).isEqualTo("MEDIA_OS_AGENT_TEST_CARD");
        assertThat(intent.orElseThrow().referenceObjectName()).isEqualTo("Headers");
        assertThat(intent.orElseThrow().titleText()).isEqualTo("AGENT TEST");
        assertThat(intent.orElseThrow().placementPolicy()).isEqualTo("BELOW_MAIN_ARCHITECTURE_MAP");
    }

    @Test
    void leavesOrdinaryEditsOnGenericCreatorPath() {
        String message = "Move MEDIA_OS_CONNECTION_TEST 80 pixels to the right.";

        assertThat(SplineCommandOptimizer.tryParseReferenceComponentCreate(message)).isEmpty();
    }

    @Test
    void refusesReferenceCreationWhenTargetIsNotSandboxNamed() {
        String message = "Create a card called LoginCopy. Use the existing `Headers` card as the visual reference.";

        assertThat(SplineCommandOptimizer.tryParseReferenceComponentCreate(message)).isEmpty();
    }
}
