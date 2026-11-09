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
@RequestMapping("/api/v1/creative/episodes/EP002/shots/SHOT06/render-preview")
public class Ep002Shot06PreviewController {
    private final Ep002DirectorVoiceCueService cues;
    private final Ep002FactoryReadinessBridgeService episode;
    private final RemotionRenderController renders;
    private final JdbcClient jdbc;
    private final boolean renderEnabled;
    private final String pinnedWorkerSha;

    public Ep002Shot06PreviewController(
            Ep002DirectorVoiceCueService cues,
            Ep002FactoryReadinessBridgeService episode,
            RemotionRenderController renders,
            JdbcClient jdbc,
            @Value("${mediaos.ep002.shot06-preview-enabled:false}") boolean renderEnabled,
            @Value("${MEDIAOS_SHOT06_RELEASE_WORKER_SHA:${mediaos.ep002.shot06-worker-source-sha:}}")
                String pinnedWorkerSha) {
        this.cues=cues;this.episode=episode;this.renders=renders;this.jdbc=jdbc;
        this.renderEnabled=renderEnabled;
        this.pinnedWorkerSha=pinnedWorkerSha==null?"":pinnedWorkerSha.trim();
    }

    public record PreviewRequest(UUID requestId,String expectedEpisodeFingerprint,
                                 Boolean confirmPaidCpuRender) {}

    @GetMapping("/capability")
    public Map<String,Object> capability() {
        DirectorIdentity.requireDirector();
        boolean pinned=pinnedWorkerSha.matches("[a-f0-9]{40}");
        return Map.of("enabled",renderEnabled,"workerPinned",pinned,
                "canQueue",renderEnabled&&pinned);
    }

    @GetMapping
    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public Map<String,Object> latest() {
        DirectorIdentity.requireDirector();
        var ready=cues.shot06RenderReadiness();
        if(!ready.ready())return Map.of("status","BLOCKED","reason",ready.reason());
        return jdbc.sql("""
                select r.id,r.status,r.progress,r.error,r.duration_in_frames
                from episode_shot_render_lineage lineage
                join remotion_render r on r.id=lineage.remotion_render_id
                where lineage.episode_key='EP002' and lineage.shot_key='SHOT06'
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
        if(!renderEnabled||!pinnedWorkerSha.matches("[a-f0-9]{40}"))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT06 render requires separately approved pinned Worker release.");
        Object audited=http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if(!(audited instanceof Map<?,?> fields)
                ||!(fields.get("auditId") instanceof UUID))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT06 render requires a real audited Director creation preflight.");
        if(request==null||request.requestId()==null
                ||request.expectedEpisodeFingerprint()==null
                ||!request.expectedEpisodeFingerprint().matches("[a-f0-9]{64}")
                ||!Boolean.TRUE.equals(request.confirmPaidCpuRender()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unique request, current fingerprint and explicit paid CPU consent required.");

        var source=episode.snapshot();
        var shot=source.shots().stream().filter(s->"SHOT06".equals(s.shotKey()))
                .findFirst().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.CONFLICT,"Current SHOT06 unavailable."));
        if(!source.sourceVerified()
                ||!source.inputFingerprint().equals(request.expectedEpisodeFingerprint())
                ||!shot.currentVoiceApproved()||!shot.hearSeeTimingVerified()
                ||shot.preferredTakeId()==null||shot.measuredVoiceSeconds()==null
                ||shot.durationFrames()==null||shot.durationFrames()<150)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT06 requires current approved voice and real verified HEAR to SEE cues.");

        var ready=cues.shot06RenderReadiness();
        if(!ready.ready()||!ready.inputFingerprint().equals(source.inputFingerprint())
                ||!shot.preferredTakeId().equals(ready.voiceTakeId())
                ||shot.durationFrames()!=ready.durationInFrames()
                ||ready.verifiedCues().size()!=5||ready.termCues().size()!=15)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT06 selected Take or fifteen genuine term cues are not render-ready.");

        Map<String,Object> props=new LinkedHashMap<>();
        props.put("shotKey","EP002_SHOT06");
        props.put("durationInFrames",ready.durationInFrames());
        props.put("voiceTakeId",ready.voiceTakeId());
        props.put("scriptRevision",shot.scriptRevision());
        props.put("timingMode",ready.timingMode());
        props.put("verifiedCues",ready.verifiedCues());
        props.put("termCues",ready.termCues());
        props.put("inputFingerprint",ready.inputFingerprint());
        props.put("visualSourceSha",Ep002ProductionContractService.VISUAL_SHA);
        props.put("expectedSourceCommit",pinnedWorkerSha);
        props.put("renderRequestId",request.requestId().toString());
        Map<String,Object> render=renders.ensureVerifiedEp002Shot06Preview(props);
        UUID renderId=(UUID)render.get("renderId");
        jdbc.sql("""
                insert into episode_shot_render_lineage
                  (id,episode_key,shot_key,script_revision,script_sha256,preferred_take_id,
                   visual_source_git_blob_sha,dependency_sha256,remotion_render_id,
                   remotion_commit_sha,render_status)
                values (:id,'EP002','SHOT06',:revision,:narration,:take,
                        :visual,:fingerprint,:render,:worker,'QUEUED')
                on conflict (episode_key,shot_key,dependency_sha256,remotion_render_id)
                    do nothing
                """)
                .param("id",UUID.randomUUID()).param("revision",shot.scriptRevision())
                .param("narration",shot.narrationSha256())
                .param("take",UUID.fromString(ready.voiceTakeId()))
                .param("visual",Ep002ProductionContractService.VISUAL_SHA)
                .param("fingerprint",ready.inputFingerprint()).param("render",renderId)
                .param("worker",pinnedWorkerSha).update();
        return render;
    }
}
