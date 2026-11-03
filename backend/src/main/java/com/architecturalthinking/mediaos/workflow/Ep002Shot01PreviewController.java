package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.remotion.RemotionRenderController;
import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/shots/SHOT01/render-preview")
public class Ep002Shot01PreviewController {
    private static final String VISUAL_SHA=Ep002ProductionContractService.VISUAL_SHA;
    private final Ep002RemotionSceneContractService scenes;
    private final RemotionRenderController renders;
    private final JdbcClient jdbc;

    public Ep002Shot01PreviewController(Ep002RemotionSceneContractService scenes,
                                       RemotionRenderController renders,JdbcClient jdbc) {
        this.scenes=scenes;
        this.renders=renders;
        this.jdbc=jdbc;
    }

    public record PreviewRequest(String expectedContractId,boolean acceptProvisionalCueTiming,UUID renderRequestId) {}

    @PostMapping
    @Transactional
    public Map<String,Object> create(@RequestBody PreviewRequest request) {
        DirectorIdentity.requireDirector();
        if(request==null || request.expectedContractId()==null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expected current scene contract ID.");
        var scene=scenes.contract("SHOT01");
        if(!scene.contractId().equals(request.expectedContractId()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Script, selected voice or visual source has changed; refresh the blueprint.");
        var inputs=scene.inputs();
        if(inputs.preferredTakeId()==null || inputs.measuredDurationSeconds()==null
                || inputs.productionDependencySha256()==null
                || scene.video().durationInFrames()==null)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Select a current-version voice recording with measured duration before rendering.");
        boolean voiceAligned=scene.beats().size()==5 && scene.beats().stream().allMatch(beat->
                beat.cueStatus()==Ep002RemotionSceneContractService.CueStatus.AUDIO_ALIGNED
                && beat.startFrame()!=null && beat.endFrame()!=null);
        if(!voiceAligned && !request.acceptProvisionalCueTiming())
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Voice timestamps are unavailable; confirm provisional storyboard timing.");
        if(scene.video().durationInFrames()<30 || scene.video().durationInFrames()>108000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Unsupported preview duration.");
        List<String> blockers=scene.readiness().blockers();
        if(blockers.stream().anyMatch(s->!"NARRATION_CUE_REVIEW_REQUIRED".equals(s)))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Scene blueprint prerequisites are incomplete.");
        var props=new LinkedHashMap<String,Object>();
        props.put("durationInFrames",scene.video().durationInFrames());
        props.put("presentation","STORYBOARD_PREVIEW_V1");
        props.put("shotKey","EP002_SHOT01");
        props.put("scriptRevision",inputs.scriptRevision());
        props.put("voiceTakeId",inputs.preferredTakeId());
        props.put("contractId",scene.contractId());
        props.put("dependencySha256",inputs.productionDependencySha256());
        props.put("visualSourceSha",VISUAL_SHA);
        addExplicitRenderRequestId(props,request.renderRequestId());
        props.put("provisionalCueTiming",!voiceAligned);
        props.put("timingMode",voiceAligned?"ELEVENLABS_CHARACTER_TIMESTAMPS":"PROVISIONAL_STORYBOARD");
        if (voiceAligned) props.put("beatStartFrames",
                scene.beats().stream().map(Ep002RemotionSceneContractService.Beat::startFrame).toList());
        Map<String,Object> render=renders.ensureVerifiedEp002Preview(props);
        UUID renderId=(UUID)render.get("renderId");
        jdbc.sql("""
                insert into episode_shot_render_lineage
                (id,episode_key,shot_key,script_revision,script_sha256,preferred_take_id,
                 visual_source_git_blob_sha,dependency_sha256,remotion_render_id,
                 remotion_commit_sha,render_status)
                values (:id,'EP002','SHOT01',:revision,:scriptHash,:takeId,
                        :visualSha,:dependency,:render,'WORKER_SOURCE_UNVERIFIED','QUEUED')
                on conflict (episode_key,shot_key,dependency_sha256,remotion_render_id)
                    do nothing
                """)
                .param("id",UUID.randomUUID())
                .param("revision",inputs.scriptRevision())
                .param("scriptHash",inputs.narrationSha256())
                .param("takeId",UUID.fromString(inputs.preferredTakeId()))
                .param("visualSha",VISUAL_SHA)
                .param("dependency",inputs.productionDependencySha256())
                .param("render",renderId).update();
        return render;
    }

    static void addExplicitRenderRequestId(Map<String,Object> props,UUID renderRequestId) {
        if (renderRequestId!=null)
            props.put("renderRequestId",renderRequestId.toString());
    }

    @GetMapping
    public Map<String,Object> latest() {
        var scene=scenes.contract("SHOT01");
        String dependency=scene.inputs().productionDependencySha256();
        if(dependency==null) return Map.of("status","NO_SELECTED_VOICE");
        return jdbc.sql("""
                select r.id as id,r.status as status,r.progress as progress,
                       r.error as error,r.duration_in_frames as frames,
                       r.finished_at as finished_at
                from episode_shot_render_lineage lineage
                join remotion_render r on r.id=lineage.remotion_render_id
                where lineage.episode_key='EP002' and lineage.shot_key='SHOT01'
                  and lineage.dependency_sha256=:dependency
                  and r.input_props->>'contractId'=:contractId
                order by lineage.created_at desc,lineage.id desc limit 1
                """).param("dependency",dependency)
                .param("contractId",scene.contractId())
                .query((rs,n)->{
                    var value=new LinkedHashMap<String,Object>();
                    String status=rs.getString("status");
                    UUID id=rs.getObject("id",UUID.class);
                    value.put("status",status);
                    value.put("renderId",id.toString());
                    value.put("progress",rs.getInt("progress"));
                    value.put("durationInFrames",rs.getInt("frames"));
                    value.put("error",rs.getString("error"));
                    value.put("videoUrl","SUCCEEDED".equals(status)?
                            "/api/v1/remotion/renders/"+id+"/video":null);
                    return value;
                }).optional().orElseGet(()->new LinkedHashMap<String,Object>(Map.of("status","NOT_RENDERED")));
    }
}
