package com.architecturalthinking.mediaos.remotion;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RemotionShot03ClaimTargetTest {
    @Test
    void shot04CanBeScopedWithoutWideningShot03Target() {
        assertTrue(RemotionCpuWorkerController.isEp004Shot04Target(
             "EP004-SHOT04-CONTINUOUS-GATEWAYS-V1-VISUAL"));
        assertFalse(RemotionCpuWorkerController.isEp004Shot04Target(
             "EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL"));
        assertFalse(RemotionCpuWorkerController.isEp004Shot04Target("SHOT04"));
    }

    @Test
    void onlyExactDirectorShot03CompositionIsTargetableOnExistingSharedWorker() {
        assertTrue(RemotionCpuWorkerController.isEp004Shot03Target(
                "EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL"));
        for(String bad:java.util.List.of(
                "EP004-SHOT03-LIVING-WORLD-STORYBOARD-V1",
                "EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL",
                "EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL/extra",
                "EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL ",
                "EP004-SHOT04-LIVING-GATEWAYS-V1-VISUAL",
                "SHOT03","")) {
            assertFalse(RemotionCpuWorkerController.isEp004Shot03Target(bad));
        }
    }
}
