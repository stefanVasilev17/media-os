package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class SplineSceneSlotRegistryServiceTest {

    @Test
    void derivesOnlyEvidenceBackedSlotCandidates() {
        var service = new SplineSceneSlotRegistryService(null, new ObjectMapper(), null);

        Map<String, Object> catalog = Map.of(
                "objects", List.of(
                        object("AccessDenied", true, 4, "MATCHED_UNIQUE_NAME", "PHONE_DEVICE/AccessDenied", true),
                        object("AccessDenied_BODY", true, 0, "MATCHED_UNIQUE_NAME", "PHONE_DEVICE/AccessDenied/AccessDenied_BODY", true),
                        object("AccessDenied_BORDER", true, 0, "MATCHED_UNIQUE_NAME", "PHONE_DEVICE/AccessDenied/AccessDenied_BORDER", true),
                        object("AccessDenied_ICON", true, 0, "MATCHED_UNIQUE_NAME", "PHONE_DEVICE/AccessDenied/AccessDenied_ICON", true),
                        object("LeafOnly", true, 0, "MATCHED_UNIQUE_NAME", "PHONE_DEVICE/LeafOnly", true),
                        object("Repeated", false, 3, "AMBIGUOUS_NAME", null, true),
                        object("CAM_LOGIN", true, 2, "MATCHED_UNIQUE_NAME", "CAM_LOGIN", true)
                )
        );

        var candidates = service.deriveCandidates(catalog);

        assertThat(candidates).hasSize(1);
        var candidate = candidates.get(0);
        assertThat(candidate.objectName()).isEqualTo("AccessDenied");
        assertThat(candidate.candidateKind()).isEqualTo("EDITOR_GROUP_AND_VISUAL_FAMILY");
        assertThat(candidate.addressStrategy()).isEqualTo("EDITOR_PATH_AND_RUNTIME_NAME");
        assertThat(candidate.placementStrategy()).isEqualTo("RUNTIME_DIRECT");
        assertThat(candidate.labelStrategy()).isEqualTo("AUTHORING_VARIABLE_REQUIRED");
        assertThat(candidate.behaviorStrategy()).isEqualTo("AUTHORING_OVERLAY_REQUIRED");
    }

    private static Map<String, Object> object(
            String name,
            boolean unique,
            int knownChildCount,
            String matchStatus,
            String path,
            boolean transform
    ) {
        Map<String, Object> hierarchy = new java.util.LinkedHashMap<>();
        hierarchy.put("matchStatus", matchStatus);
        hierarchy.put("knownChildCount", knownChildCount);
        if (path != null) hierarchy.put("path", path);

        Map<String, Object> object = new java.util.LinkedHashMap<>();
        object.put("uuid", "uuid-" + name);
        object.put("name", name);
        object.put("stableUniqueName", unique);
        object.put("editorHierarchy", hierarchy);
        object.put("runtimeCapabilities", Map.of(
                "transform", transform,
                "visibility", true,
                "runtimeText", false
        ));
        object.put("directOperations", List.of("CLONE_VISUAL", "MOVE", "SET_VISIBLE"));
        object.put("authoredEventRefCount", 0);
        return object;
    }
}
