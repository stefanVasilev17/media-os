package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.remotion.RemotionRenderController;
import com.architecturalthinking.mediaos.system.DirectorIdentity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/shots/SHOT11/render-preview")
public class Ep002Shot11PreviewController {
    private final Ep002DirectorVoiceCueService cues;
    private final Ep002FactoryReadinessBridgeService episode;
    private final RemotionRenderController renders;
    private final JdbcClient jdbc;
    private final boolean renderEnabled;
    private final boolean finaleVisualContractReady;
    private final String pinnedWorkerSha;

    public Ep002Shot11PreviewController(
            Ep002DirectorVoiceCueService cues,
            Ep002FactoryReadinessBridgeService episode,
            RemotionRenderController renders,
            JdbcClient jdbc,
            @Value("${mediaos.ep002.shot11-preview-enabled:false}") boolean renderEnabled,
            @Value("${mediaos.ep002.shot11-finale-visual-contract-ready:false}")
                boolean finaleVisualContractReady,
            @Value("${MEDIAOS_SHOT11_RELEASE_WORKER_SHA:${mediaos.ep002.shot11-worker-source-sha:}}")
                String pinnedWorkerSha) {
        this.cues=cues;this.episode=episode;this.renders=renders;this.jdbc=jdbc;
        this.renderEnabled=renderEnabled;
        this.finaleVisualContractReady=finaleVisualContractReady;
        this.pinnedWorkerSha=pinnedWorkerSha==null?"":pinnedWorkerSha.trim();
    }

    private static final UUID LOCKED_SHOT10_RENDER=UUID.fromString(
            "2034d8c6-99b2-46a5-9469-bf3df325d6c0");
    private static final String LOCKED_SHOT10_SOURCE_SHA=
            "a4d9fe5d1dcec033f36ce68a190160fd8077faea";
    private static final int SHOT10_LOCKED_FRAMES=2360;
    private static final int SHOT09_WORLD_LAST_FRAME=8048;

    private record ActualShot10Boundary(Integer priorWorldLastFrame,
                                        Integer criticalPulse,Integer cascadeStart,
                                        Integer beats,Integer terms) {}

    private Map<String,Object> lockedShot10Boundary() {
        ActualShot10Boundary boundary=jdbc.sql("""
                select (r.input_props->'lockedShot09Handoff'->>'worldLastFrame')::integer
                           as prior_world,
                       (r.input_props->'lockedShot09Handoff'->>'criticalPulseStartFrame')::integer
                           as critical_pulse,
                       (r.input_props->'lockedShot09Handoff'->>'cascadeStartFrame')::integer
                           as cascade_start,
                       jsonb_array_length(r.input_props->'verifiedCues') as beats,
                       jsonb_array_length(r.input_props->'termCues') as terms
                  from remotion_render r
                 where r.id=:id and r.composition_id='EP002-SHOT10-CANDIDATE'
                   and r.status='SUCCEEDED' and r.width=1920 and r.height=1080
                   and r.fps=30 and r.duration_in_frames=:frames
                   and r.input_props->>'expectedSourceCommit'=:sha
                   and r.input_props->>'shotKey'='EP002_SHOT10'
                   and r.input_props->'lockedShot09Handoff'->>'renderId'=
                       'd4b6c8ff-10c5-4181-aa59-fcd16a4470ba'
                   and r.input_props->'lockedShot09Handoff'->>'sourceCommit'=
                       'b33f00ee81f89301115a4fd79874802c712f2724'
                   and r.input_props->'lockedShot09Handoff'->>'lastFrame'='3062'
                   and r.input_props->'lockedShot09Handoff'->>'durationInFrames'='3063'
                   and r.input_props->'lockedShot09Handoff'->>'shot08WorldLastFrame'='4986'
                """)
                .param("id",LOCKED_SHOT10_RENDER)
                .param("frames",SHOT10_LOCKED_FRAMES)
                .param("sha",LOCKED_SHOT10_SOURCE_SHA)
                .query((rs,row)->new ActualShot10Boundary(
                        (Integer)rs.getObject("prior_world"),
                        (Integer)rs.getObject("critical_pulse"),
                        (Integer)rs.getObject("cascade_start"),
                        (Integer)rs.getObject("beats"),
                        (Integer)rs.getObject("terms")))
                .optional().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.CONFLICT,"SHOT11_REQUIRES_EXACT_DIRECTOR_LOCKED_SHOT10_FINAL_MP4"));
        if(boundary.priorWorldLastFrame()==null
                ||boundary.priorWorldLastFrame()!=SHOT09_WORLD_LAST_FRAME
                ||boundary.criticalPulse()==null||boundary.criticalPulse()<0
                ||boundary.cascadeStart()==null||boundary.cascadeStart()<=boundary.criticalPulse()
                ||boundary.cascadeStart()>=2674
                ||boundary.beats()==null||boundary.beats()!=6
                ||boundary.terms()==null||boundary.terms()!=21)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT11_LOCKED_SHOT10_REAL_VOICE_AND_HANDOFF_INVALID");
        return Map.of("renderId",LOCKED_SHOT10_RENDER.toString(),
                "sourceCommit",LOCKED_SHOT10_SOURCE_SHA,
                "durationInFrames",SHOT10_LOCKED_FRAMES,
                "lastFrame",SHOT10_LOCKED_FRAMES-1,
                "shot09WorldLastFrame",SHOT09_WORLD_LAST_FRAME,
                "worldLastFrame",SHOT09_WORLD_LAST_FRAME+SHOT10_LOCKED_FRAMES-1,
                "criticalPulseStartFrame",boundary.criticalPulse(),
                "cascadeStartFrame",boundary.cascadeStart());
    }

    public record PreviewRequest(UUID requestId,String expectedEpisodeFingerprint,
                                 Boolean confirmPaidCpuRender) {}

    @GetMapping("/capability")
    public Map<String,Object> capability() {
        DirectorIdentity.requireDirector();
        boolean pinned=pinnedWorkerSha.matches("[a-f0-9]{40}");
        boolean boundaryReady;
        try { lockedShot10Boundary();boundaryReady=true; }
        catch(ResponseStatusException unavailable) { boundaryReady=false; }
        boolean enabled=renderEnabled&&finaleVisualContractReady;
        return Map.of("enabled",enabled,"workerPinned",pinned,
                "lockedShot10BoundaryReady",boundaryReady,
                "canQueue",enabled&&pinned&&boundaryReady,
                "reason",!boundaryReady?"LOCKED_SHOT10_DIRECTOR_BOUNDARY_NOT_AVAILABLE":
                        finaleVisualContractReady?"FINALE_VISUAL_SOURCE_READY":"FINALE_VISUAL_SOURCE_NOT_RELEASED");
    }

    @GetMapping
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Map<String,Object> latest() {
        DirectorIdentity.requireDirector();
        var ready=cues.shot11RenderReadiness();
        if(!ready.ready())return Map.of("status","BLOCKED","reason",ready.reason());
        return jdbc.sql("""
                select r.id,r.status,r.progress,r.error,r.duration_in_frames
                from episode_shot_render_lineage lineage
                join remotion_render r on r.id=lineage.remotion_render_id
                where lineage.episode_key='EP002' and lineage.shot_key='SHOT11'
                  and lineage.dependency_sha256=:fingerprint
                  and lineage.preferred_take_id::text=:take
                  and r.input_props->>'inputFingerprint'=:fingerprint
                  and r.input_props->>'expectedSourceCommit'=:workerSha
                order by lineage.created_at desc,lineage.id desc limit 1
                """)
                .param("fingerprint",ready.inputFingerprint())
                .param("take",ready.voiceTakeId())
                .param("workerSha",pinnedWorkerSha)
                .query((rs,n)->{
                    Map<String,Object> result=new LinkedHashMap<>();
                    UUID id=rs.getObject("id",UUID.class);
                    String status=rs.getString("status");
                    result.put("renderId",id.toString());
                    result.put("status",status);
                    result.put("progress",rs.getInt("progress"));
                    result.put("durationInFrames",rs.getInt("duration_in_frames"));
                    result.put("error",rs.getString("error"));
                    result.put("videoUrl","SUCCEEDED".equals(status)
                            ?"/api/v1/remotion/renders/"+id+"/video":null);
                    return result;
                }).optional().orElseGet(()->Map.of("status","NOT_RENDERED"));
    }

    @PostMapping
    @Transactional(isolation=Isolation.SERIALIZABLE)
    public Map<String,Object> create(@RequestBody PreviewRequest request,
                                      HttpServletRequest http) {
        DirectorIdentity.requireDirector();
        if(!finaleVisualContractReady)throw new ResponseStatusException(HttpStatus.CONFLICT,
                "SHOT11 finale visual/voice contract is not released yet.");
        if(!renderEnabled||!pinnedWorkerSha.matches("[a-f0-9]{40}"))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT11 render requires separately approved pinned Worker release.");
        Object audited=http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(audited instanceof Map<?,?> fields)
                ||!(fields.get("auditId") instanceof UUID))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT11 render requires a real audited Director creation preflight.");
        if(request==null||request.requestId()==null
                ||request.expectedEpisodeFingerprint()==null
                ||!request.expectedEpisodeFingerprint().matches("[a-f0-9]{64}")
                ||!Boolean.TRUE.equals(request.confirmPaidCpuRender()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unique request, current fingerprint and explicit paid CPU consent required.");

        var source=episode.snapshot();
        var shot=source.shots().stream().filter(s->"SHOT11".equals(s.shotKey()))
                .findFirst().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.CONFLICT,"Current SHOT11 unavailable."));
        if(!source.sourceVerified()
                ||!source.inputFingerprint().equals(request.expectedEpisodeFingerprint())
                ||!shot.currentVoiceApproved()
                ||shot.preferredTakeId()==null||shot.measuredVoiceSeconds()==null
                ||shot.durationFrames()==null||shot.durationFrames()<150)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT11 requires current approved voice and real verified HEAR to SEE cues.");

        var ready=cues.shot11RenderReadiness();
        if(!ready.ready()||!ready.inputFingerprint().equals(source.inputFingerprint())
                ||!shot.preferredTakeId().equals(ready.voiceTakeId())
                ||shot.durationFrames()!=ready.durationInFrames()
                ||ready.verifiedCues().size()!=5||ready.termCues().size()!=19)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT11 finale Take requires five real beats and nineteen spoken term cues.");

        Map<String,Object> lockedBoundary=lockedShot10Boundary();
        Map<String,Object> props=new LinkedHashMap<>();
        props.put("shotKey","EP002_SHOT11");
        props.put("lockedShot10Handoff",lockedBoundary);
        props.put("durationInFrames",ready.durationInFrames());
        props.put("voiceTakeId",ready.voiceTakeId());
        props.put("scriptRevision",shot.scriptRevision());
        props.put("timingMode",ready.timingMode());
        props.put("verifiedCues",ready.verifiedCues());
        props.put("termCues",ready.termCues());
        props.put("inputFingerprint",ready.inputFingerprint());
        props.put("visualSourceSha",Ep002RecoverySource.RECOVERY_VISUAL_BLOB_SHA);
        props.put("expectedSourceCommit",pinnedWorkerSha);
        props.put("renderRequestId",request.requestId().toString());
        Map<String,Object> render=renders.ensureVerifiedEp002Shot11Preview(props);
        UUID renderId=(UUID)render.get("renderId");
        jdbc.sql("""
                insert into episode_shot_render_lineage
                  (id,episode_key,shot_key,script_revision,script_sha256,preferred_take_id,
                   visual_source_git_blob_sha,dependency_sha256,remotion_render_id,
                   remotion_commit_sha,render_status)
                values (:id,'EP002','SHOT11',:revision,:narration,:take,
                        :visual,:fingerprint,:render,:worker,'QUEUED')
                on conflict (episode_key,shot_key,dependency_sha256,remotion_render_id)
                    do nothing
                """)
                .param("id",UUID.randomUUID()).param("revision",shot.scriptRevision())
                .param("narration",shot.narrationSha256())
                .param("take",UUID.fromString(ready.voiceTakeId()))
                .param("visual",Ep002RecoverySource.RECOVERY_VISUAL_BLOB_SHA)
                .param("fingerprint",ready.inputFingerprint()).param("render",renderId)
                .param("worker",pinnedWorkerSha).update();
        return render;
    }
}
