package com.architecturalthinking.mediaos.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EpisodeWorkspaceRulesTest {
    @Test
    void acceptsResearchWithRealTruthMapScopeAndSources() {
        EpisodeWorkspaceRules.validateArtifactForLock("research", Map.of(
                "centralQuestion", "Why is a healthy Auth Service unable to complete login?",
                "viewerPromise", "Understand end-to-end failure when a dependency is slow.",
                "truthMap", List.of("Auth Service", "User Database", "Deadline"),
                "technicalSources", List.of("Google SRE"),
                "outOfScope", List.of("Session restoration")));
    }

    @Test
    void blocksResearchWithoutGroundedTechnicalSources() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> EpisodeWorkspaceRules.validateArtifactForLock("RESEARCH", Map.of(
                        "centralQuestion", "A", "viewerPromise", "B",
                        "truthMap", List.of("A", "B", "C"), "outOfScope", List.of("OAuth"))));
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void acceptsInterviewGradeScriptWithinFifteenMinuteLimit() {
        EpisodeWorkspaceRules.validateArtifactForLock("SCRIPT", Map.of(
                "overview", "One complete engineering causal story",
                "timeline", List.of(1, 2, 3, 4, 5), "targetDurationSeconds", 840));
    }

    @Test
    void rejectsOverlongScriptAtDirectorLock() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> EpisodeWorkspaceRules.validateArtifactForLock("SCRIPT", Map.of(
                        "overview", "Twenty minute draft", "timeline", List.of(1, 2, 3, 4, 5),
                        "targetDurationSeconds", 1200)));
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void sceneRequiresAtLeastThreePlannedShots() {
        assertThrows(ResponseStatusException.class, () ->
                EpisodeWorkspaceRules.validateArtifactForLock("SCENE", Map.of(
                        "overview", "A visual plan", "shots", List.of("SHOT01", "SHOT02"))));
        EpisodeWorkspaceRules.validateArtifactForLock("SCENE", Map.of(
                "overview", "Complete plan", "shots", List.of("SHOT01", "SHOT02", "SHOT03")));
    }

    @Test
    void rejectedAutomaticLockDoesNotTrustAgentText() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> EpisodeWorkspaceRules.validateDirectorDecision("AUTOMATICALLY_APPROVE", "Agent claims done"));
        assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void explicitDirectorDecisionNeedsMeaningfulNote() {
        assertThrows(ResponseStatusException.class,
                () -> EpisodeWorkspaceRules.validateDirectorDecision("DIRECTOR_APPROVE", "OK"));
        EpisodeWorkspaceRules.validateDirectorDecision("DIRECTOR_APPROVE",
                "Reviewed the Truth Map, architecture boundary and supporting sources.");
    }

    @Test
    void refusesVoiceAndVisualLocksBeforeSpecializedQaExists() {
        for (String stage : List.of("VOICE", "VISUAL", "PUBLISH", "SPLINE", "UNLOCK")) {
            assertThrows(ResponseStatusException.class,
                    () -> EpisodeWorkspaceRules.editableStage(stage));
        }
    }
}
