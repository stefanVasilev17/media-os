package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class SplineCapabilityCatalogServiceTest {

    @Test
    void doesNotPretendRuntimeHierarchyExistsWhenNoParentEdgesAreExposed() {
        var service = new SplineCapabilityCatalogService(null, new ObjectMapper());

        Map<String, Object> blueprint = Map.of(
                "objects", List.of(
                        runtimeObject("1", "Headers", false),
                        runtimeObject("2", "CardBody", true)
                )
        );

        Map<String, Object> catalog = service.buildCatalogDocument("a".repeat(64), blueprint);

        @SuppressWarnings("unchecked")
        Map<String, Object> summary = (Map<String, Object>) catalog.get("summary");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> objects = (List<Map<String, Object>>) catalog.get("objects");

        assertThat(summary.get("objectCount")).isEqualTo(2);
        assertThat(summary.get("runtimeHierarchyEdges")).isEqualTo(0);
        assertThat(summary.get("runtimeHierarchyAvailable")).isEqualTo(false);
        assertThat(summary.get("runtimeTransform")).isEqualTo(2);
        assertThat(summary.get("runtimeText")).isEqualTo(0);

        Map<String, Object> headers = objects.stream()
                .filter(item -> "Headers".equals(item.get("name")))
                .findFirst()
                .orElseThrow();

        assertThat(headers.get("runtimeHierarchyStatus")).isEqualTo("NOT_EXPOSED_BY_RUNTIME");

        @SuppressWarnings("unchecked")
        List<String> direct = (List<String>) headers.get("directOperations");
        assertThat(direct).contains("CLONE_VISUAL", "MOVE", "SET_VISIBLE", "SET_MATERIAL");

        @SuppressWarnings("unchecked")
        List<String> overlay = (List<String>) headers.get("authoringOverlayRequiredFor");
        assertThat(overlay).contains("SET_DISPLAY_LABEL", "ENUMERATE_AUTHORED_STATES", "REPLAY_AUTHORED_ACTION_GRAPH");
    }

    @Test
    void fusesUniqueEditorPathsWithoutGuessingAmbiguousNames() {
        var service = new SplineCapabilityCatalogService(null, new ObjectMapper());

        Map<String, Object> blueprint = Map.of(
                "objects", List.of(
                        runtimeObject("1", "Headers", false),
                        runtimeObject("2", "CardBody", true),
                        runtimeObject("3", "Repeated", false)
                )
        );

        Map<String, Object> editorCatalog = Map.of(
                "sections", List.of(
                        Map.of(
                                "name", "Headers",
                                "type", "Group",
                                "path", "Headers",
                                "loaded", true,
                                "children", List.of(
                                        Map.of(
                                                "name", "CardBody",
                                                "type", "Shape",
                                                "path", "Headers/CardBody",
                                                "loaded", true,
                                                "children", List.of()
                                        ),
                                        Map.of(
                                                "name", "Repeated",
                                                "type", "Shape",
                                                "path", "Headers/Repeated",
                                                "loaded", true,
                                                "children", List.of()
                                        )
                                )
                        ),
                        Map.of(
                                "name", "Repeated",
                                "type", "Group",
                                "path", "Repeated",
                                "loaded", false,
                                "children", List.of()
                        )
                )
        );

        Map<String, Object> catalog = service.buildCatalogDocument("b".repeat(64), blueprint, editorCatalog);

        @SuppressWarnings("unchecked")
        Map<String, Object> summary = (Map<String, Object>) catalog.get("summary");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> objects = (List<Map<String, Object>>) catalog.get("objects");

        assertThat(summary.get("editorCatalogNodeCount")).isEqualTo(4);
        assertThat(summary.get("editorRootSectionCount")).isEqualTo(2);
        assertThat(summary.get("editorHierarchyMatchedUnique")).isEqualTo(2);
        assertThat(summary.get("editorHierarchyAmbiguous")).isEqualTo(1);

        Map<String, Object> cardBody = objects.stream()
                .filter(item -> "CardBody".equals(item.get("name")))
                .findFirst()
                .orElseThrow();

        @SuppressWarnings("unchecked")
        Map<String, Object> hierarchy = (Map<String, Object>) cardBody.get("editorHierarchy");
        assertThat(hierarchy.get("matchStatus")).isEqualTo("MATCHED_UNIQUE_NAME");
        assertThat(hierarchy.get("path")).isEqualTo("Headers/CardBody");
        assertThat(hierarchy.get("parentPath")).isEqualTo("Headers");

        Map<String, Object> repeated = objects.stream()
                .filter(item -> "Repeated".equals(item.get("name")))
                .findFirst()
                .orElseThrow();

        @SuppressWarnings("unchecked")
        Map<String, Object> repeatedHierarchy = (Map<String, Object>) repeated.get("editorHierarchy");
        assertThat(repeatedHierarchy.get("matchStatus")).isEqualTo("AMBIGUOUS_NAME");
    }

    private static Map<String, Object> runtimeObject(String uuid, String name, boolean color) {
        return Map.of(
                "uuid", uuid,
                "name", name,
                "type", "Group",
                "authoredEventRefCount", 0,
                "capabilities", Map.of(
                        "transform", true,
                        "visibility", true,
                        "stateCurrentExposed", false,
                        "color", color,
                        "runtimeText", false,
                        "material", true
                )
        );
    }
}
