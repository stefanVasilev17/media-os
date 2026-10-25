package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DirectorShot10DraftControllerTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final String TITLE = "What Really Happens When You Click Login?";

    private JsonNode canonical() {
        return JSON.valueToTree(Map.of(
            "schemaVersion", "mediaos.director-shot-draft.v1",
            "episodeNumber", "EP001",
            "title", TITLE,
            "shotKey", "SHOT 10",
            "shotTitle", "Authentication State / Session Creation",
            "source", "EP001_SHOT10_V7_DIRECTOR_REVIEW",
            "status", "DIRECTOR_REVIEW",
            "durationSeconds", 72,
            "fps", 30,
            "timeline", new Object[]{
                segment(1, 0, 22),
                segment(2, 22, 46),
                segment(3, 46, 72)
            }
        ));
    }

    private Map<String, Object> segment(int number, int start, int end) {
        return Map.of(
            "segmentId", String.format("SHOT10-SEG-%02d", number),
            "shotKey", "SHOT 10",
            "clipKey", String.format("SHOT 10-C%02d", number),
            "startSecond", start,
            "endSecond", end,
            "hear", "Draft narration for clip " + number,
            "voiceDirection", "calm, conversational, confident",
            "visual", Map.of(
                "summary", "Spacious original Living Architecture Map and 3D proof details.",
                "objects", new String[]{"Authentication State", "Phone WAITING"},
                "camera", "Slow continuous track, no hard cuts.",
                "semanticAnchors", new String[]{"AUTHENTICATION_STATE", "TRUST_PROOF"},
                "effects", new String[]{"Readability hold"}
            )
        );
    }

    @Test
    void acceptsShortStandaloneDirectorReviewWithThreeClips() {
        DirectorShot10DraftController.validateDraft(canonical(), TITLE);
    }

    @Test
    void rejectsLegacyProductionContractSchemaInsteadOfSilentlyReplacingLocks() {
        var draft = (com.fasterxml.jackson.databind.node.ObjectNode) canonical();
        draft.put("schemaVersion", "mediaos.production-contract.v1");
        var problem = assertThrows(ResponseStatusException.class,
            () -> DirectorShot10DraftController.validateDraft(draft, TITLE));
        assertEquals(HttpStatus.BAD_REQUEST, problem.getStatusCode());
    }

    @Test
    void rejectsLongOrNonDraftVersions() {
        var draft = (com.fasterxml.jackson.databind.node.ObjectNode) canonical();
        draft.put("durationSeconds", 115);
        assertThrows(ResponseStatusException.class,
            () -> DirectorShot10DraftController.validateDraft(draft, TITLE));
        draft.put("durationSeconds", 72);
        draft.put("status", "DIRECTOR_LOCKED");
        assertThrows(ResponseStatusException.class,
            () -> DirectorShot10DraftController.validateDraft(draft, TITLE));
    }

    @Test
    void rejectsWrongClipBoundaryOrChangedShotKey() {
        var draft = canonical();
        ((com.fasterxml.jackson.databind.node.ObjectNode) draft.path("timeline").get(1)).put("startSecond", 23);
        assertThrows(ResponseStatusException.class,
            () -> DirectorShot10DraftController.validateDraft(draft, TITLE));
        var other = canonical();
        ((com.fasterxml.jackson.databind.node.ObjectNode) other).put("shotKey", "SHOT 09");
        assertThrows(ResponseStatusException.class,
            () -> DirectorShot10DraftController.validateDraft(other, TITLE));
    }

    @Test
    void rejectsMissingVoiceOrVisualNarrative() {
        var draft = canonical();
        ((com.fasterxml.jackson.databind.node.ObjectNode) draft.path("timeline").get(0)).put("hear", "");
        assertThrows(ResponseStatusException.class,
            () -> DirectorShot10DraftController.validateDraft(draft, TITLE));
        var other = canonical();
        ((com.fasterxml.jackson.databind.node.ObjectNode) other.path("timeline").get(0)
            .path("visual")).put("summary", "");
        assertThrows(ResponseStatusException.class,
            () -> DirectorShot10DraftController.validateDraft(other, TITLE));
    }

    @Test
    void usesTimestampEndToGuardAgainstAudioTruncation() {
        String alignment = "{\"normalized_alignment\":{\"character_end_times_seconds\":[0.1,2.4,21.9]}}";
        assertEquals(21.9, DirectorShot10DraftController.alignmentEndSeconds(alignment), 0.0001);
        assertEquals(0.0, DirectorShot10DraftController.alignmentEndSeconds("{\"alignment\":{}}"), 0.0001);
    }
}
