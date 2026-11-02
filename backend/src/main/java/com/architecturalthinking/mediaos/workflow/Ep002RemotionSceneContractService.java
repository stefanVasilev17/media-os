package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class Ep002RemotionSceneContractService {
    public enum AssetUsage { REUSE_REFERENCE, NEW_PROPOSAL }
    public enum AssetResolution { UNVERIFIED }
    public enum CameraIntent { CLOSE_PHONE, HOLD_PHONE, FOCUS_AUTH, RACK_FOCUS_PHONE, PREPARE_REWIND }
    public enum Operation { PHONE_PRESS, SPINNER_WAIT, SHOW_TIME_RAIL, HEALTH_PULSE, SHOW_SHALLOW_PROBES,
        EMPHASIZE_UNRESOLVED_WAIT, RETRACT_TIME_RAIL, SHOW_NINE_OCLOCK_MARKER }
    public enum CueStatus { EDITORIAL_ONLY_UNALIGNED }

    public record Asset(String key,AssetUsage usage,AssetResolution resolution) {}
    public record Beat(int number,String approvedDirection,String cueAnchor,CueStatus cueStatus,
                       CameraIntent cameraIntent,List<Operation> operations,List<String> assetKeys,
                       Integer startFrame,Integer endFrame) {}
    public record VideoSpec(int width,int height,int fps,String colorSpace,Integer durationInFrames,
                            String durationAuthority,String compositionId,boolean registeredInRemotion) {}
    public record Inputs(int scriptRevision,String narrationSha256,String preferredTakeId,
                         String audioUrl,BigDecimal measuredDurationSeconds,
                         String approvedVisualGitBlobSha,String productionDependencySha256) {}
    public record Readiness(String status,List<String> blockers,boolean cueAlignmentRequired,
                            boolean canSubmitRender) {}
    public record SceneContract(String schemaVersion,String episodeKey,String shotKey,
                                String contractId,String codeGenerationPolicy,VideoSpec video,
                                Inputs inputs,List<Asset> assets,List<Beat> beats,
                                String cameraDirection,String continuityGuardrails,
                                String endingTransition,String cueTimingAuthority,
                                Readiness readiness) {}

    private static final List<Asset> ASSETS=List.of(
        new Asset("PHONE_LOGIN",AssetUsage.REUSE_REFERENCE,AssetResolution.UNVERIFIED),
        new Asset("SPINNER",AssetUsage.REUSE_REFERENCE,AssetResolution.UNVERIFIED),
        new Asset("AUTH_NODE",AssetUsage.REUSE_REFERENCE,AssetResolution.UNVERIFIED),
        new Asset("CAMERA_RIG",AssetUsage.REUSE_REFERENCE,AssetResolution.UNVERIFIED),
        new Asset("DIM_LAYER",AssetUsage.REUSE_REFERENCE,AssetResolution.UNVERIFIED),
        new Asset("TIME_RAIL",AssetUsage.NEW_PROPOSAL,AssetResolution.UNVERIFIED),
        new Asset("REWIND_0900",AssetUsage.NEW_PROPOSAL,AssetResolution.UNVERIFIED)
    );

    private static final List<String> CUES=List.of(
        "tap Login","A few seconds pass. Then ten","server ... still running",
        "login is still waiting","go back to nine o'clock"
    );
    private static final List<CameraIntent> CAMERAS=List.of(
        CameraIntent.CLOSE_PHONE,CameraIntent.HOLD_PHONE,CameraIntent.FOCUS_AUTH,
        CameraIntent.RACK_FOCUS_PHONE,CameraIntent.PREPARE_REWIND
    );
    private static final List<List<Operation>> ACTIONS=List.of(
        List.of(Operation.PHONE_PRESS,Operation.SPINNER_WAIT),
        List.of(Operation.SHOW_TIME_RAIL),
        List.of(Operation.HEALTH_PULSE,Operation.SHOW_SHALLOW_PROBES),
        List.of(Operation.EMPHASIZE_UNRESOLVED_WAIT),
        List.of(Operation.RETRACT_TIME_RAIL,Operation.SHOW_NINE_OCLOCK_MARKER)
    );
    private static final List<List<String>> BEAT_ASSETS=List.of(
        List.of("PHONE_LOGIN","SPINNER","CAMERA_RIG"),
        List.of("PHONE_LOGIN","SPINNER","TIME_RAIL"),
        List.of("AUTH_NODE","CAMERA_RIG","DIM_LAYER"),
        List.of("PHONE_LOGIN","SPINNER","AUTH_NODE","CAMERA_RIG"),
        List.of("TIME_RAIL","REWIND_0900","CAMERA_RIG")
    );

    private final Ep002ProductionContractService production;

    public Ep002RemotionSceneContractService(Ep002ProductionContractService production) {
        this.production=production;
    }

    public SceneContract contract(String shotKey) {
        if (!"SHOT01".equals(shotKey))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Stage 2 typed scene contract is implemented only for EP002 SHOT01.");
        return fromProductionData(production.contract(shotKey));
    }

    @SuppressWarnings("unchecked")
    public static SceneContract fromProductionData(Map<String,Object> source) {
        if (!"EP002".equals(source.get("episodeKey")) || !"SHOT01".equals(source.get("shotKey"))
                || !"EPISODE_SHOT_PRODUCTION_V1".equals(source.get("contractVersion")))
            throw new IllegalArgumentException("Wrong episode, SHOT or production contract version.");
        Map<String,Object> script=(Map<String,Object>)source.get("script");
        Map<String,Object> voice=(Map<String,Object>)source.get("voice");
        Map<String,Object> visual=(Map<String,Object>)source.get("visual");
        Map<String,Object> dependency=(Map<String,Object>)source.get("dependencies");
        if (script==null || voice==null || visual==null || dependency==null
                || !"5c43c7fd3bd66b5899f0956a9cfd80bdead834f1".equals(visual.get("sourceGitBlobSha"))
                || !"v1.0".equals(visual.get("version"))) {
            throw new IllegalArgumentException("Unexpected visual source or incomplete Stage 1 contract.");
        }

        Object rawBeats=visual.get("beats");
        if (!(rawBeats instanceof JsonNode approved) || !approved.isArray() || approved.size()!=5)
            throw new IllegalArgumentException("SHOT01 must contain the five approved visual beats.");
        List<Beat> beats=new ArrayList<>();
        for (int i=0;i<5;i++) {
            JsonNode beat=approved.path(i);
            String direction=beat.path("direction").asText();
            if (beat.path("number").asInt()!=i+1 || direction.isBlank()
                    || !direction.contains(CUES.get(i))) {
                throw new IllegalArgumentException("Approved SHOT01 visual beat or cue changed: "+(i+1));
            }
            beats.add(new Beat(i+1,direction,CUES.get(i),CueStatus.EDITORIAL_ONLY_UNALIGNED,
                    CAMERAS.get(i),ACTIONS.get(i),BEAT_ASSETS.get(i),null,null));
        }
        if (!(script.get("sha256") instanceof String hash) || !hash.matches("[a-f0-9]{64}")
                || !(script.get("revision") instanceof Number revision) || revision.intValue()<0)
            throw new IllegalArgumentException("Invalid saved script revision or narration digest.");
        if (!Ep002ProductionContractService.sha256(String.valueOf(script.get("narration"))).equals(hash))
            throw new IllegalArgumentException("Stage 1 narration hash no longer matches script.");

        Object preferred=voice.get("preferredTakeId");
        String takeId=preferred instanceof String s&&!s.isBlank()?s:null;
        BigDecimal measured=null;
        Object rawSeconds=voice.get("durationSeconds");
        if(rawSeconds instanceof Number value) {
            measured=new BigDecimal(value.toString());
            if(measured.signum()<=0 || measured.compareTo(new BigDecimal("86400"))>=0)
                throw new IllegalArgumentException("Actual voice duration is invalid.");
        }
        List<String> blockers=new ArrayList<>();
        if (takeId==null) blockers.add("PREFERRED_VOICE_REQUIRED");
        if (takeId!=null && measured==null) blockers.add("MEASURED_AUDIO_DURATION_REQUIRED");
        if (!"SOURCE_TEXT_UNCHANGED".equals(visual.get("cueReviewStatus")))
            blockers.add("NARRATION_CUE_REVIEW_REQUIRED");
        if (takeId!=null && !Integer.valueOf(revision.intValue()).equals(voice.get("sourceScriptRevision")))
            throw new IllegalArgumentException("Preferred voice take belongs to a different script revision.");
        if (takeId!=null && !(voice.get("audioUrl") instanceof String audioUrl
                && audioUrl.equals("/api/v1/creative/episodes/EP002/shots/SHOT01/takes/"+takeId+"/audio")))
            throw new IllegalArgumentException("Voice audio URL is not a canonical EP002 take path.");

        String dependencyHash=(String)dependency.get("dependencySha256");
        if (takeId!=null && (dependencyHash==null || !dependencyHash.matches("[a-f0-9]{64}")))
            throw new IllegalArgumentException("A selected voice requires a valid render dependency fingerprint.");
        Integer frameCount=measured==null?null:measured.multiply(BigDecimal.valueOf(30))
                .setScale(0,RoundingMode.CEILING).intValueExact();
        VideoSpec video=new VideoSpec(1920,1080,30,"REC709",frameCount,
                measured==null?"UNMEASURED":"MEASURED_AUDIO_CEIL_TO_FRAME",
                "EP002-SHOT01-DRAFT",false);
        Inputs inputs=new Inputs(revision.intValue(),hash,takeId,(String)voice.get("audioUrl"),
                measured,(String)visual.get("sourceGitBlobSha"),dependencyHash);
        Readiness readiness=new Readiness(blockers.isEmpty()?"READY_FOR_CODE_GENERATION":"BLOCKED",
                List.copyOf(blockers),true,false);
        String contractId=Ep002ProductionContractService.sha256(String.join("\n",
                "REMOTION_SCENE_V1","EP002","SHOT01",
                hash, String.valueOf(revision.intValue()),String.valueOf(takeId),
                String.valueOf(dependencyHash),"5c43c7fd3bd66b5899f0956a9cfd80bdead834f1"));
        return new SceneContract("REMOTION_SCENE_V1","EP002","SHOT01",contractId,
                "REVIEWED_SOURCE_CHANGES_ONLY_NO_AUTO_EXECUTION",video,inputs,
                ASSETS,List.copyOf(beats),(String)visual.get("cameraDirection"),
                (String)visual.get("truthContinuity"),(String)visual.get("transition"),
                "EDITORIAL_CUES_ONLY_NO_FRAME_ALIGNMENT",readiness);
    }
}
