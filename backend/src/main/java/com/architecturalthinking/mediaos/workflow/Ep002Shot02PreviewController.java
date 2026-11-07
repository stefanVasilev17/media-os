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
@RequestMapping("/api/v1/creative/episodes/EP002/shots/SHOT02/render-preview")
public class Ep002Shot02PreviewController {
    private final Ep002DirectorVoiceCueService cues;
    private final Ep002FactoryReadinessBridgeService episode;
    private final RemotionRenderController renders;
    private final JdbcClient jdbc;
    private final boolean renderEnabled;
    private final String pinnedWorkerSha;

    public Ep002Shot02PreviewController(
            Ep002DirectorVoiceCueService cues,
            Ep002FactoryReadinessBridgeService episode,
            RemotionRenderController renders,
            JdbcClient jdbc,
            @Value("${mediaos.ep002.shot02-preview-enabled:false}") boolean renderEnabled,
            @Value("${MEDIAOS_SHOT02_RELEASE_WORKER_SHA:${mediaos.ep002.shot02-worker-source-sha:}}") String pinnedWorkerSha) {
        this.cues=cues;
        this.episode=episode;
        this.renders=renders;
        this.jdbc=jdbc;
        this.renderEnabled=renderEnabled;
        this.pinnedWorkerSha=pinnedWorkerSha==null?"":pinnedWorkerSha.trim();
    }

    public record PreviewRequest(
            UUID requestId, String expectedEpisodeFingerprint,
            Boolean editorialPauses) {
        public PreviewRequest(UUID requestId,String expectedEpisodeFingerprint) {
            this(requestId,expectedEpisodeFingerprint,false);
        }
    }

    @PostMapping
    @Transactional(isolation=Isolation.SERIALIZABLE)
    public Map<String,Object> create(@RequestBody PreviewRequest request,
                                     HttpServletRequest http) {
        DirectorIdentity.requireDirector();
        if (!renderEnabled || !pinnedWorkerSha.matches("[a-f0-9]{40}")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT02 preview requires a separately approved and pinned cloud worker release.");
        }
        Object audited=http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT");
        if (!(audited instanceof Map<?,?> record)
                || !(record.get("auditId") instanceof UUID)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "SHOT02 preview needs a recorded Director creation preflight.");
        }
        if (request==null || request.requestId()==null
                || request.expectedEpisodeFingerprint()==null
                || !request.expectedEpisodeFingerprint().matches("[a-f0-9]{64}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Current episode fingerprint and unique request ID are required.");
        }

        var snapshot=episode.snapshot();
        var shot=snapshot.shots().stream()
                .filter(s->"SHOT02".equals(s.shotKey()))
                .findFirst().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.CONFLICT,"Current SHOT02 is not available."));
        if (!snapshot.sourceVerified()
                || !snapshot.inputFingerprint().equals(request.expectedEpisodeFingerprint())
                || !shot.currentVoiceApproved() || !shot.hearSeeTimingVerified()
                || shot.measuredVoiceSeconds()==null || shot.durationFrames()==null
                || shot.durationFrames()<6 || shot.durationFrames()>108000
                || shot.preferredTakeId()==null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Current Director-approved SHOT02 source and voice are not render-ready.");
        }

        var verified=cues.shot02RenderReadiness();
        if (!verified.ready() || !snapshot.inputFingerprint().equals(verified.inputFingerprint())
                || !shot.preferredTakeId().equals(verified.voiceTakeId())
                || shot.durationFrames()!=verified.durationInFrames()
                || verified.verifiedCues().size()!=5 || verified.termCues().size()!=7) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Current real ElevenLabs beat and term timing failed SHOT02 render preflight.");
        }

        boolean naturalSlow=usesSlowNaturalTake(verified.voiceTakeId());
        boolean editorial=Boolean.TRUE.equals(request.editorialPauses());
        if (naturalSlow && editorial) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Slow Natural ElevenLabs voice already has spoken pauses. "
                    +"Do not insert nine additional editorial silence gaps.");
        }
        Ep002Shot02EditorialPausePlan.Plan plan=editorial
                ?cues.editorialPlan(verified):null;
        var props=new LinkedHashMap<String,Object>();
        props.put("shotKey","EP002_SHOT02");
        props.put("durationInFrames",editorial?plan.durationInFrames():verified.durationInFrames());
        props.put("voiceTakeId",verified.voiceTakeId());
        props.put("scriptRevision",shot.scriptRevision());
        props.put("timingMode",editorial?plan.timingMode():verified.timingMode());
        props.put("verifiedCues",editorial?plan.verifiedCues():verified.verifiedCues());
        props.put("termCues",editorial?plan.termCues():verified.termCues());
        if(editorial){
            props.put("sourceDurationInFrames",plan.sourceDurationInFrames());
            props.put("editorialSilencePlan",plan.pauses());
            props.put("editorialAddedFrames",plan.addedFrames());
        }
        props.put("inputFingerprint",verified.inputFingerprint());
        props.put("visualSourceSha",Ep002ProductionContractService.VISUAL_SHA);
        props.put("expectedSourceCommit",pinnedWorkerSha);
        props.put("renderRequestId",request.requestId().toString());

        Map<String,Object> render=renders.ensureVerifiedEp002Shot02Preview(props);
        UUID renderId=(UUID)render.get("renderId");
        jdbc.sql("""
            insert into episode_shot_render_lineage
              (id,episode_key,shot_key,script_revision,script_sha256,preferred_take_id,
               visual_source_git_blob_sha,dependency_sha256,remotion_render_id,
               remotion_commit_sha,render_status)
            values (:id,'EP002','SHOT02',:revision,:narration,:take,
                    :visual,:fingerprint,:render,:worker,'QUEUED')
            on conflict (episode_key,shot_key,dependency_sha256,remotion_render_id)
                do nothing
            """)
                .param("id",UUID.randomUUID())
                .param("revision",shot.scriptRevision())
                .param("narration",shot.narrationSha256())
                .param("take",UUID.fromString(verified.voiceTakeId()))
                .param("visual",Ep002ProductionContractService.VISUAL_SHA)
                .param("fingerprint",verified.inputFingerprint())
                .param("render",renderId)
                .param("worker",pinnedWorkerSha).update();
        return render;
    }

    @GetMapping("/editorial-plan")
    @Transactional(readOnly=true)
    public Map<String,Object> editorialPlan(){
        DirectorIdentity.requireDirector();
        var ready=cues.shot02RenderReadiness();
        if(!ready.ready())return Map.of("ready",false,"reason",ready.reason());
        if(usesSlowNaturalTake(ready.voiceTakeId())) {
            return Map.of(
                "ready",true,
                "naturalSlowTake",true,
                "reason","REAL_ELEVEN_V4_NATURAL_PAUSES_NO_EDITORIAL_SILENCE",
                "timingMode",ready.timingMode(),
                "sourceDurationInFrames",ready.durationInFrames(),
                "durationInFrames",ready.durationInFrames(),
                "addedFrames",0,
                "pauses",java.util.List.of());
        }
        var plan=cues.editorialPlan(ready);
        return Map.of(
            "ready",true,
            "timingMode",plan.timingMode(),
            "sourceDurationInFrames",plan.sourceDurationInFrames(),
            "durationInFrames",plan.durationInFrames(),
            "addedFrames",plan.addedFrames(),
            "pauses",plan.pauses());
    }

    private boolean usesSlowNaturalTake(String takeId) {
        if (takeId==null || takeId.isBlank()) return false;
        try {
            return jdbc.sql("""
                    select coalesce(elevenlabs_alignment->>'mediaos_delivery_mode'
                                    =:mode,false)
                    from ep002_creative_voice_take
                    where id=:take and shot_key='SHOT02'
                    """)
                    .param("mode",Ep002Shot02SlowNaturalVoice.DELIVERY_MODE)
                    .param("take",UUID.fromString(takeId))
                    .query(Boolean.class).optional().orElse(false);
        } catch (IllegalArgumentException invalid) {
            return false;
        }
    }

    @GetMapping("/capability")
    public Map<String,Object> capability() {
        DirectorIdentity.requireDirector();
        boolean pinned=pinnedWorkerSha.matches("[a-f0-9]{40}");
        return Map.of("enabled",renderEnabled,
                "workerPinned",pinned,"canQueue",renderEnabled&&pinned);
    }

    @GetMapping
    @Transactional(readOnly=true)
    public Map<String,Object> latest() {
        DirectorIdentity.requireDirector();
        var verified=cues.shot02RenderReadiness();
        if (!verified.ready())
            return Map.of("status","BLOCKED","reason",verified.reason());
        return jdbc.sql("""
                select r.id,r.status,r.progress,r.error,r.duration_in_frames
                from episode_shot_render_lineage lineage
                join remotion_render r on r.id=lineage.remotion_render_id
                where lineage.episode_key='EP002' and lineage.shot_key='SHOT02'
                  and lineage.dependency_sha256=:fingerprint
                  and lineage.preferred_take_id::text=:take
                  and r.input_props->>'inputFingerprint'=:fingerprint
                order by lineage.created_at desc,lineage.id desc limit 1
                """).param("fingerprint",verified.inputFingerprint())
                .param("take",verified.voiceTakeId())
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
}
