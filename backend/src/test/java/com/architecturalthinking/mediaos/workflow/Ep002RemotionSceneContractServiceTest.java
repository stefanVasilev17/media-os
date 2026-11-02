package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class Ep002RemotionSceneContractServiceTest {
    private static final String TAKE="00000000-0000-0000-0000-000000000001";
    private final Ep002ProductionContractService sources=new Ep002ProductionContractService(
            mock(JdbcClient.class),new ObjectMapper());

    private Map<String,Object> fixture(boolean chosen,boolean changed) {
        String text=changed?"Updated narration from Director.":"You tap Login.";
        String hash=Ep002ProductionContractService.sha256(text);
        var script=new LinkedHashMap<String,Object>();
        script.put("revision",1);
        script.put("narration",text);
        script.put("sha256",hash);

        var voice=new LinkedHashMap<String,Object>();
        voice.put("preferredTakeId",chosen?TAKE:null);
        voice.put("sourceScriptRevision",chosen?1:null);
        voice.put("audioUrl",chosen?"/api/v1/creative/episodes/EP002/shots/SHOT01/takes/"+TAKE+"/audio":null);
        voice.put("durationSeconds",chosen?new BigDecimal("39.122"):null);

        JsonNode approved=sources.sourceVisual(0);
        var visual=new LinkedHashMap<String,Object>();
        visual.put("sourceGitBlobSha",Ep002ProductionContractService.VISUAL_SHA);
        visual.put("version","v1.0");
        visual.put("cueReviewStatus",changed?"REVIEW_AFTER_NARRATION_EDIT":"SOURCE_TEXT_UNCHANGED");
        visual.put("beats",approved.path("beats"));
        visual.put("cameraDirection",approved.path("cameraDirection").asText());
        visual.put("truthContinuity",approved.path("truthContinuity").asText());
        visual.put("transition",approved.path("transition").asText());

        var dependencies=new LinkedHashMap<String,Object>();
        dependencies.put("dependencySha256",chosen?Ep002ProductionContractService.sha256(
                "production dependency with "+TAKE):null);
        var source=new LinkedHashMap<String,Object>();
        source.put("contractVersion","EPISODE_SHOT_PRODUCTION_V1");
        source.put("episodeKey","EP002");
        source.put("shotKey","SHOT01");
        source.put("script",script);
        source.put("voice",voice);
        source.put("visual",visual);
        source.put("dependencies",dependencies);
        return source;
    }

    @Test
    void buildsFiveVerifiedDirectionAndAssetInstructionsWithoutInventingFrameCues() {
        var scene=Ep002RemotionSceneContractService.fromProductionData(fixture(true,false));
        assertEquals("REMOTION_SCENE_V1",scene.schemaVersion());
        assertEquals("EP002-SHOT01-DRAFT",scene.video().compositionId());
        assertFalse(scene.video().registeredInRemotion());
        assertEquals(1174,scene.video().durationInFrames());
        assertEquals(1920,scene.video().width());
        assertEquals(1080,scene.video().height());
        assertEquals(30,scene.video().fps());
        assertEquals(5,scene.beats().size());
        assertTrue(scene.beats().stream().allMatch(beat->
                beat.startFrame()==null && beat.endFrame()==null
                && beat.cueStatus()==Ep002RemotionSceneContractService.CueStatus.EDITORIAL_ONLY_UNALIGNED));
        assertEquals(2,scene.assets().stream().filter(asset->
                asset.usage()==Ep002RemotionSceneContractService.AssetUsage.NEW_PROPOSAL).count());
        assertTrue(scene.assets().stream().allMatch(asset->
                asset.resolution()==Ep002RemotionSceneContractService.AssetResolution.UNVERIFIED));
        assertEquals("READY_FOR_CODE_GENERATION",scene.readiness().status());
        assertTrue(scene.readiness().cueAlignmentRequired());
        assertFalse(scene.readiness().canSubmitRender());
        assertEquals(scene.contractId(),Ep002RemotionSceneContractService.fromProductionData(fixture(true,false)).contractId());
    }

    @Test
    void missingVoiceOrDurationIsNotPretendedReady() {
        var scene=Ep002RemotionSceneContractService.fromProductionData(fixture(false,false));
        assertEquals("BLOCKED",scene.readiness().status());
        assertTrue(scene.readiness().blockers().contains("PREFERRED_VOICE_REQUIRED"));
        assertNull(scene.video().durationInFrames());
        assertFalse(scene.readiness().canSubmitRender());
    }

    @Test
    void changedNarrationRequiresCueReviewEvenWithExistingVoice() {
        var scene=Ep002RemotionSceneContractService.fromProductionData(fixture(true,true));
        assertEquals("BLOCKED",scene.readiness().status());
        assertTrue(scene.readiness().blockers().contains("NARRATION_CUE_REVIEW_REQUIRED"));
    }

    @Test
    void rejectsStaleVoiceTakeOrTamperedVisualPlan() {
        var stale=fixture(true,false);
        @SuppressWarnings("unchecked")
        var voice=(Map<String,Object>)stale.get("voice");
        voice.put("sourceScriptRevision",2);
        assertThrows(IllegalArgumentException.class,()->
                Ep002RemotionSceneContractService.fromProductionData(stale));
        var tampered=fixture(true,false);
        @SuppressWarnings("unchecked")
        var visual=(Map<String,Object>)tampered.get("visual");
        visual.put("sourceGitBlobSha","0000000000000000000000000000000000000000");
        assertThrows(IllegalArgumentException.class,()->
                Ep002RemotionSceneContractService.fromProductionData(tampered));
    }

    @Test
    void refusesUnsupportedShotKeysBeforeCallingProduction() {
        var scene=new Ep002RemotionSceneContractService(mock(Ep002ProductionContractService.class));
        assertThrows(ResponseStatusException.class,()->scene.contract("SHOT02"));
        assertThrows(ResponseStatusException.class,()->scene.contract("SHOT12"));
    }
}
