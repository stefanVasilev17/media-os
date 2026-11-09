package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Ep002FactoryReadinessBridgeServiceTest {
    private record Fixture(Ep002FactoryReadinessBridgeService bridge,
                           Ep002EpisodeBatchPlanService.Plan plan) {}

    private Fixture fixture() {
        JdbcClient jdbc = mock(JdbcClient.class, RETURNS_DEEP_STUBS);
        ObjectMapper mapper = new ObjectMapper();
        var batch = new Ep002EpisodeBatchPlanService(jdbc, mapper);
        var bridge = new Ep002FactoryReadinessBridgeService(jdbc, batch, mapper);
        return new Fixture(bridge, batch.snapshot());
    }

    @Test
    void connectsAllLockedSourcesWithoutPretendingTheEpisodeIsReady() {
        Fixture fixture = fixture();
        var ready = fixture.bridge().project(fixture.plan(), Map.of(), Set.of());

        assertEquals("EP002_FACTORY_READINESS_BRIDGE_V1", ready.schemaVersion());
        assertEquals("EP002", ready.episodeKey());
        assertEquals("v5.0", ready.scriptVersion());
        assertEquals("v1.0+RECOVERY", ready.visualPassVersion());
        assertEquals(Ep002ProductionContractService.VISUAL_SHA,
                ready.originalVisualGitBlobSha());
        assertEquals(fixture.plan().inputFingerprint(), ready.inputFingerprint());
        assertEquals(11, ready.shotCount());
        assertEquals(59, ready.approvedBeatCount());
        assertEquals(810, ready.editorialSeconds());
        assertEquals(1, ready.protectedScenes());
        assertEquals(10, ready.sceneCandidates());
        assertEquals(0, ready.selectedVoiceTakes());
        assertEquals(0, ready.measuredVoiceTakes());
        assertEquals(0, ready.verifiedTimedShots());
        assertTrue(ready.sourceVerified());
        assertFalse(ready.eligibleForCodexCloud());
        assertFalse(ready.canRender());
        assertFalse(ready.startsPaidOperation());

        assertEquals(11, ready.shots().size());
        var first = ready.shots().getFirst();
        assertEquals("SHOT01", first.shotKey());
        assertTrue(first.directorVisualLocked());
        assertEquals(Ep002FactoryReadinessBridgeService.PROTECTED_SHOT01,
                first.existingScenePath());
        assertNull(first.proposedScenePath());
        assertEquals(5, first.approvedVisualStory().path("beats").size());
        assertTrue(first.blockers().contains("SHOT01_CUE_AND_EXISTING_RENDER_REVIEW_REQUIRED"));

        var second = ready.shots().get(1);
        assertEquals("SHOT02", second.shotKey());
        assertFalse(second.directorVisualLocked());
        assertNull(second.existingScenePath());
        assertEquals("remotion-engine/src/episodes/ep002/Shot02GeneratedScene.tsx",
                second.proposedScenePath());
        assertNotNull(second.narration());
        assertTrue(second.narration().contains("tickets"));
        assertEquals(5, second.approvedVisualStory().path("beats").size());
        assertFalse(second.hearSeeTimingVerified());
        assertTrue(second.blockers().contains("DIRECTOR_SELECTED_TAKE_REQUIRED"));
        assertEquals("EDITORIAL_ONLY_NOT_AUDIO_ALIGNED", second.timingAuthority());

        assertEquals("SHOT08",ready.shots().get(7).shotKey());
        assertEquals(6,ready.shots().get(7).approvedVisualStory().path("beats").size());
        assertEquals("After that retry storm",ready.shots().get(7)
                .approvedVisualStory().path("beats").path(0).path("spokenAnchor").asText());
        assertEquals("SHOT11", ready.shots().getLast().shotKey());
        assertEquals("remotion-engine/src/episodes/ep002/Shot11GeneratedScene.tsx",
                ready.shots().getLast().proposedScenePath());
    }

    @Test
    void aSelectedMeasuredTakeDoesNotInventBeatTimingOrIgnoreAnUncertainCharge() {
        Fixture fixture = fixture();
        var original = fixture.plan().shots().get(1);
        var updated = new Ep002EpisodeBatchPlanService.ShotPlan(
                original.shotKey(), original.title(), original.beatCount(),
                original.editorialSeconds(), 1, original.narrationSha256(),
                original.visualSourceSha(), UUID.randomUUID().toString(),
                new BigDecimal("34.125"), "VOICE_MEASURED_ALIGNMENT_NEEDS_SHOT_MAPPING",
                original.action(), original.renderStatus(),
                original.directorVisualLocked(), original.visualGoal());
        var plan = replace(fixture.plan(), 1, updated);
        var initial = fixture.bridge().project(fixture.plan(), Map.of(), Set.of())
                .shots().get(1);
        var working = new Ep002FactoryReadinessBridgeService.WorkingScript(
                1, initial.narration(), initial.voiceDirection());

        var result = fixture.bridge().project(plan, Map.of("SHOT02", working),
                Set.of("SHOT02"));
        assertEquals(1, result.selectedVoiceTakes());
        assertEquals(1, result.measuredVoiceTakes());
        assertEquals(1024, result.shots().get(1).durationFrames());
        assertFalse(result.shots().get(1).hearSeeTimingVerified());
        assertTrue(result.shots().get(1).blockers().contains(
                "APPROVED_HEAR_SEE_BEATS_NEED_VERIFIED_AUDIO_CUE_MAPPING"));
        assertTrue(result.shots().get(1).blockers().contains(
                "ELEVENLABS_IN_FLIGHT_OR_UNCERTAIN_MUST_BE_RECONCILED"));
        assertTrue(result.blockers().contains("UNRESOLVED_PAID_VOICE_REQUESTS"));
        assertFalse(result.eligibleForCodexCloud());
    }

    @Test
    void narrationMismatchRejectsAStaleProjection() {
        Fixture fixture = fixture();
        var original = fixture.plan().shots().get(1);
        var updated = new Ep002EpisodeBatchPlanService.ShotPlan(
                original.shotKey(), original.title(), original.beatCount(),
                original.editorialSeconds(), 1, original.narrationSha256(),
                original.visualSourceSha(), null, null, original.voiceStatus(),
                original.action(), original.renderStatus(),
                original.directorVisualLocked(), original.visualGoal());
        var plan = replace(fixture.plan(), 1, updated);
        var error = assertThrows(ResponseStatusException.class,
                () -> fixture.bridge().project(plan,
                        Map.of("SHOT02", new Ep002FactoryReadinessBridgeService.WorkingScript(
                                1, "Unapproved or stale narration", "direction")), Set.of()));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    @Test
    void neverAllowsProtectedShot01ToBecomeAGeneratedCandidate() {
        Fixture fixture = fixture();
        var original = fixture.plan().shots().getFirst();
        var replaced = new Ep002EpisodeBatchPlanService.ShotPlan(
                original.shotKey(), original.title(), original.beatCount(),
                original.editorialSeconds(), original.scriptRevision(),
                original.narrationSha256(), original.visualSourceSha(),
                original.preferredTakeId(), original.measuredVoiceSeconds(),
                original.voiceStatus(), "BATCH_SCENE_CODE_CANDIDATE",
                original.renderStatus(), false, original.visualGoal());
        var changed = replace(fixture.plan(), 0, replaced);
        assertThrows(IllegalStateException.class,
                () -> fixture.bridge().project(changed, Map.of(), Set.of()));
    }

    private static Ep002EpisodeBatchPlanService.Plan replace(
            Ep002EpisodeBatchPlanService.Plan plan, int index,
            Ep002EpisodeBatchPlanService.ShotPlan shot) {
        var shots = new ArrayList<>(plan.shots());
        shots.set(index, shot);
        return new Ep002EpisodeBatchPlanService.Plan(
                plan.schemaVersion(), plan.episodeKey(), plan.title(),
                plan.inputFingerprint(), plan.shotCount(), plan.visualBeatCount(),
                plan.editorialSeconds(), plan.scenesToPrepare(),
                plan.protectedScenes(), plan.preferredVoiceCount(),
                plan.missingPreferredVoiceCount(), plan.reusableRenders(),
                plan.state(), List.copyOf(shots), plan.waves());
    }
}
