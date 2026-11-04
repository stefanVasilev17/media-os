package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class Ep002EpisodeBatchPlanServiceTest {

    @Test
    void plansAllElevenApprovedShotsAsOneBatchWithoutRendering() {
        JdbcClient jdbc=mock(JdbcClient.class,RETURNS_DEEP_STUBS);
        var service=new Ep002EpisodeBatchPlanService(jdbc,new ObjectMapper());

        var plan=service.snapshot();

        assertEquals("EP002",plan.episodeKey());
        assertEquals("EPISODE_BATCH_PLAN_V1",plan.schemaVersion());
        assertEquals("READ_ONLY_PLAN_NO_EXECUTION",plan.state());
        assertEquals(11,plan.shotCount());
        assertEquals(59,plan.visualBeatCount());
        assertEquals(810,plan.editorialSeconds());
        assertEquals(10,plan.scenesToPrepare());
        assertEquals(1,plan.protectedScenes());
        assertEquals(0,plan.preferredVoiceCount());
        assertEquals(11,plan.missingPreferredVoiceCount());
        assertEquals(5,plan.waves().size());
        assertTrue(plan.waves().stream().noneMatch(Ep002EpisodeBatchPlanService.BatchWave::executionAvailable));
        assertTrue(plan.inputFingerprint().matches("[a-f0-9]{64}"));
        assertEquals("PRESERVE_DIRECTOR_LOCKED_SCENE",plan.shots().get(0).action());
        assertTrue(plan.shots().get(0).directorVisualLocked());
        assertEquals("LOCKED_SOURCE_RENDER_NOT_VERIFIED",plan.shots().get(0).renderStatus());
        for(int i=1;i<11;i++){
            assertEquals(String.format("SHOT%02d",i+1),plan.shots().get(i).shotKey());
            assertEquals("BATCH_SCENE_CODE_CANDIDATE",plan.shots().get(i).action());
            assertFalse(plan.shots().get(i).directorVisualLocked());
            assertEquals("PREFERRED_VOICE_REQUIRED",plan.shots().get(i).voiceStatus());
        }
    }

    @Test
    void replayAllowsOnlySameDirectorAndSameSnapshotFingerprint() {
        var actor=new DirectorIdentity.Actor("urn:mediaos:test","director-one","actor");
        var original=new Ep002EpisodeBatchPlanService.StoredPlan(
                UUID.randomUUID(),UUID.randomUUID(),"PREPARED_NOT_EXECUTING",
                "f".repeat(64),null,"2026-11-04","urn:mediaos:test","director-one");
        assertSame(original,Ep002EpisodeBatchPlanService.matchedReplay(
                original,"f".repeat(64),actor));
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->Ep002EpisodeBatchPlanService.matchedReplay(
                        original,"e".repeat(64),actor)).getStatusCode());
        assertEquals(HttpStatus.CONFLICT,assertThrows(ResponseStatusException.class,
                ()->Ep002EpisodeBatchPlanService.matchedReplay(
                        original,"f".repeat(64),
                        new DirectorIdentity.Actor("urn:mediaos:test","another-director","actor")))
                .getStatusCode());
    }

    @Test
    void approvedSourceIsReadWithoutGenerationOrVisualChanges() {
        var service=new Ep002EpisodeBatchPlanService(
                mock(JdbcClient.class,RETURNS_DEEP_STUBS),new ObjectMapper());
        var plan=service.snapshot();
        assertEquals("SHOT01",plan.shots().get(0).shotKey());
        assertEquals("The Login That Keeps Waiting",plan.shots().get(0).title());
        assertEquals("9:00 AM: The Ticket Sale Opens",plan.shots().get(1).title());
        assertEquals("NO_REGISTERED_BATCH_RENDERER",plan.shots().get(1).renderStatus());
        assertEquals(Ep002ProductionContractService.VISUAL_SHA,
                plan.shots().get(10).visualSourceSha());
    }
}
