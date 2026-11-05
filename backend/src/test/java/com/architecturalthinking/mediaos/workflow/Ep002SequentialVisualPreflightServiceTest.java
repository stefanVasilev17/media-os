package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Ep002SequentialVisualPreflightServiceTest {
    private Ep002FactoryReadinessBridgeService.Snapshot source() {
        JdbcClient jdbc = mock(JdbcClient.class, RETURNS_DEEP_STUBS);
        ObjectMapper mapper = new ObjectMapper();
        var batch = new Ep002EpisodeBatchPlanService(jdbc, mapper);
        var bridge = new Ep002FactoryReadinessBridgeService(jdbc, batch, mapper);
        return bridge.project(batch.snapshot(), Map.of(), Set.of());
    }

    @Test
    void theFirstAndOnlyLiveCodexCandidateIsShot02NotLockedShot01() {
        var state = Ep002SequentialVisualPreflightService.project(
                source(), Set.of("SHOT01"));
        assertEquals("EP002_SEQUENTIAL_VISUAL_PREFLIGHT_V1", state.schemaVersion());
        assertEquals("EP002", state.episodeKey());
        assertEquals("SHOT02", state.nextShotKey());
        assertEquals("SHOT01", state.previousAcceptedShotKey());
        assertEquals("SHOT03", state.followingShotKey());
        assertEquals(1, state.acceptedSceneCount());
        assertEquals(10, state.remainingSceneCount());
        assertEquals("SINGLE_SHOT_PREFLIGHT_BLOCKED_NO_CODE_TASK", state.status());
        assertEquals("remotion-engine/src/episodes/ep002/Shot02GeneratedScene.tsx",
                state.candidate().codeDestination());
        assertEquals("SHOT02", state.candidate().shotKey());
        assertEquals(5, state.candidate().beatCount());
        assertEquals(Ep002FactoryReadinessBridgeService.PROTECTED_SHOT01,
                state.protectedShot01Path());
        assertTrue(state.candidate().approvedVisualStory().path("beats").size()>0);
        assertTrue(state.mandatoryRuleFiles().stream()
                .anyMatch(x -> x.path().equals(
                        "docs/visual/CODEX_VISUAL_LESSONS_LEDGER.md")));
        assertTrue(state.mandatoryRuleFiles().stream()
                .anyMatch(x -> x.path().equals(
                        "docs/visual/AT_REMOTION_VISUAL_CONSTITUTION_V1.md")));
        assertTrue(state.blockers().contains(
                "REAL_HEAR_SEE_TIMED_CUES_REQUIRED_FOR_ALL_SHOTS"));
        assertNull(state.executableCodexPrompt());
        assertFalse(state.readyForCodex());
        assertFalse(state.startsCodex());
        assertFalse(state.startsRender());
        assertFalse(state.latestPolicyGitVerified());
        assertFalse(state.realCueFramesVerified());
    }

    @Test
    void refusesToAdvancePastUnacceptedEarlierShot() {
        ResponseStatusException problem = assertThrows(ResponseStatusException.class,
                () -> Ep002SequentialVisualPreflightService.project(
                        source(), Set.of("SHOT01","SHOT03")));
        assertEquals(HttpStatus.CONFLICT, problem.getStatusCode());
    }

    @Test
    void cannotReplaceOrSkipDirectorLockedShot01() {
        ResponseStatusException problem = assertThrows(ResponseStatusException.class,
                () -> Ep002SequentialVisualPreflightService.project(
                        source(), Set.of("SHOT02")));
        assertEquals(HttpStatus.CONFLICT, problem.getStatusCode());
    }

    @Test
    void aHypotheticallyAcceptedShot02WouldMakeShot03TheOnlyNextCandidate() {
        var state = Ep002SequentialVisualPreflightService.project(
                source(), Set.of("SHOT01", "SHOT02"));
        assertEquals("SHOT03", state.nextShotKey());
        assertEquals("SHOT02", state.previousAcceptedShotKey());
        assertEquals("SHOT04", state.followingShotKey());
        assertEquals(2, state.acceptedSceneCount());
        assertEquals(9, state.remainingSceneCount());
        assertFalse(state.readyForCodex());
    }

    @Test
    void artificialVoiceCountersCannotBypassPolicyAndVisualAcceptanceGates() {
        var original = source();
        var forged = new Ep002FactoryReadinessBridgeService.Snapshot(
                original.schemaVersion(), original.episodeKey(),
                original.scriptVersion(), original.visualPassVersion(),
                original.originalVisualGitBlobSha(), original.inputFingerprint(),
                original.shotCount(), original.approvedBeatCount(),
                original.editorialSeconds(), original.protectedScenes(),
                original.sceneCandidates(), 11, 11, 11, true,
                true, true, false, original.blockers(), original.shots());
        var state = Ep002SequentialVisualPreflightService.project(
                forged, Set.of("SHOT01"));
        assertEquals("SHOT02", state.nextShotKey());
        assertFalse(state.readyForCodex());
        assertNull(state.executableCodexPrompt());
        assertTrue(state.blockers().contains(
                "VERSIONED_VISUAL_POLICY_AND_LEDGER_GIT_SHA_NOT_YET_VERIFIED"));
        assertTrue(state.blockers().contains(
                "SEQUENTIAL_DIRECTOR_ACCEPTANCE_STORAGE_AND_GATE_NOT_YET_IMPLEMENTED"));
    }

    @Test
    void rejectsUnknownAcceptanceAndVisualSourceDrift() {
        var first = assertThrows(ResponseStatusException.class,
                () -> Ep002SequentialVisualPreflightService.project(
                        source(), Set.of("SHOT01","SHOT99")));
        assertEquals(HttpStatus.CONFLICT, first.getStatusCode());

        var original = source();
        var forged = new Ep002FactoryReadinessBridgeService.Snapshot(
                original.schemaVersion(), original.episodeKey(),
                original.scriptVersion(), original.visualPassVersion(),
                original.originalVisualGitBlobSha(), original.inputFingerprint(),
                11, 58, original.editorialSeconds(), 1, original.sceneCandidates(),
                original.selectedVoiceTakes(), original.measuredVoiceTakes(),
                original.verifiedTimedShots(), true, false, false, false,
                original.blockers(), original.shots());
        assertEquals(HttpStatus.CONFLICT, assertThrows(ResponseStatusException.class,
                () -> Ep002SequentialVisualPreflightService.project(
                        forged, Set.of("SHOT01"))).getStatusCode());
    }
}
