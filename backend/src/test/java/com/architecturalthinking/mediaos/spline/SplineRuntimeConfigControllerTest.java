package com.architecturalthinking.mediaos.spline;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SplineRuntimeConfigControllerTest {

    @Test
    void exposesConfiguredRuntimeSceneUrl() {
        var controller = new SplineRuntimeConfigController(
                " https://prod.spline.design/example/scene.splinecode "
        );

        var config = controller.runtimeConfig();

        assertThat(config.configured()).isTrue();
        assertThat(config.sceneUrl())
                .isEqualTo("https://prod.spline.design/example/scene.splinecode");
    }

    @Test
    void reportsMissingRuntimeSceneUrl() {
        var controller = new SplineRuntimeConfigController(" ");

        var config = controller.runtimeConfig();

        assertThat(config.configured()).isFalse();
        assertThat(config.sceneUrl()).isEmpty();
    }
}
