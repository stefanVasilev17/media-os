package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class SplineCapabilityCatalogServiceTest {

    @Test
    void derivesDirectRuntimeCapabilitiesAndKnowledgeGaps() {
        var service = new SplineCapabilityCatalogService(null, new ObjectMapper());

        Map<String, Object> blueprint = Map.of(
                "objects", List.of(
                        Map.of(
                                "uuid", "root",
                                "name", "Headers",
                                "type", "Group",
                                "authoredEventRefCount", 2,
                                "capabilities", Map.of(
                                        "transform", true,
                                        "visibility", true,
                                        "stateCurrentExposed", false,
                                        "color", false,
                                        "runtimeText", false,
                                        "material", true
                                )
                        ),
                        Map.of(
                                "uuid", "child",
                                "name", "CardBody",
                                "type", "RoundedRectangle",
                                "parentUuid", "root",
                                "authoredEventRefCount", 0,
                                "capabilities", Map.of(
                                        "transform", true,
                                        "visibility", true,
                                        "stateCurrentExposed", false,
                                        "color", true,
                                        "runtimeText", false,
                                        "material", true
                                )
                        )
                )
        );

        Map<String, Object> catalog = service.buildCatalogDocument("a".repeat(64), blueprint);

        @SuppressWarnings("unchecked")
        Map<String, Object> summary = (Map<String, Object>) catalog.get("summary");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> objects = (List<Map<String, Object>>) catalog.get("objects");

        assertThat(summary.get("objectCount")).isEqualTo(2);
        assertThat(summary.get("rootCount")).isEqualTo(1);
        assertThat(summary.get("runtimeTransform")).isEqualTo(2);
        assertThat(summary.get("runtimeText")).isEqualTo(0);

        Map<String, Object> root = objects.get(0);
        assertThat(root.get("name")).isEqualTo("Headers");
        assertThat(root.get("subtreeSize")).isEqualTo(2);

        @SuppressWarnings("unchecked")
        List<String> direct = (List<String>) root.get("directOperations");
        assertThat(direct).contains("CLONE_VISUAL", "MOVE", "SET_VISIBLE", "SET_MATERIAL");

        @SuppressWarnings("unchecked")
        List<String> overlay = (List<String>) root.get("authoringOverlayRequiredFor");
        assertThat(overlay).contains("SET_DISPLAY_LABEL", "ENUMERATE_AUTHORED_STATES", "REPLAY_AUTHORED_ACTION_GRAPH");
    }
}
