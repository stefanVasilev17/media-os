package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SplineSceneBlueprintControllerTest {

    @Test
    void rejectsBlueprintForDifferentSceneUrlBeforeDatabaseWrite() {
        var controller = new SplineSceneBlueprintController(
                null,
                new ObjectMapper(),
                "https://prod.spline.design/expected/scene.splinecode",
                null
        );

        var request = new SplineSceneBlueprintController.CaptureRequest(
                1,
                "https://prod.spline.design/other/scene.splinecode",
                "a".repeat(64),
                1,
                0,
                0,
                Map.of(),
                Map.of("objects", List.of(Map.of("uuid", "1")))
        );

        assertThatThrownBy(() -> controller.capture(request))
                .isInstanceOf(SplineSceneBlueprintController.InvalidBlueprintException.class)
                .hasMessageContaining("does not match");
    }

    @Test
    void rejectsObjectCountMismatchBeforeDatabaseWrite() {
        var controller = new SplineSceneBlueprintController(
                null,
                new ObjectMapper(),
                "",
                null
        );

        var request = new SplineSceneBlueprintController.CaptureRequest(
                1,
                "https://prod.spline.design/example/scene.splinecode",
                "b".repeat(64),
                2,
                0,
                0,
                Map.of(),
                Map.of("objects", List.of(Map.of("uuid", "1")))
        );

        assertThatThrownBy(() -> controller.capture(request))
                .isInstanceOf(SplineSceneBlueprintController.InvalidBlueprintException.class)
                .hasMessageContaining("object list");
    }
}
