package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.remotion.RemotionRenderController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class Ep002Shot08UserRequestedRenderLaunch implements ApplicationRunner {
    private static final Logger log=LoggerFactory.getLogger(Ep002Shot08UserRequestedRenderLaunch.class);
    private static final String AUTHORIZATION="USER_EXPLICIT_CHAT_REQUEST_2026_11_09_SHOT08_RECOVERY_RENDER";

    private final Ep002DirectorVoiceCueService cues;
    private final Ep002FactoryReadinessBridgeService bridge;
    private final RemotionRenderController renders;
    private final JdbcClient jdbc;
    private final boolean userRequested;
    private final boolean visualReady;
    private final boolean renderEnabled;
    private final String workerSha;

    public Ep002Shot08UserRequestedRenderLaunch(
            Ep002DirectorVoiceCueService cues,
            Ep002FactoryReadinessBridgeService bridge,
            RemotionRenderController renders,
            JdbcClient jdbc,
            @Value("${mediaos.ep002.shot08-chat-render-once:false}") boolean userRequested,
            @Value("${mediaos.ep002.shot08-recovery-visual-contract-ready:false}")
                boolean visualReady,
            @Value("${mediaos.ep002.shot08-preview-enabled:false}") boolean renderEnabled,
            @Value("${MEDIAOS_SHOT08_RELEASE_WORKER_SHA:}") String workerSha) {
        this.cues=cues;
        this.bridge=bridge;
        this.renders=renders;
        this.jdbc=jdbc;
        this.userRequested=userRequested;
        this.visualReady=visualReady;
        this.renderEnabled=renderEnabled;
        this.workerSha=workerSha==null?"":workerSha.trim();
    }

    @Override
    public void run(ApplicationArguments args) {
        if(!userRequested)return;
        if(!visualReady||!renderEnabled||!workerSha.matches("[a-f0-9]{40}")) {
            log.warn("SHOT08_CHAT_REQUEST_NOT_QUEUED: visual release, paid CPU capability or pinned worker SHA missing");
            return;
        }
        try {
            var ready=cues.shot08InternalReadiness();
            if(!ready.ready()||ready.voiceTakeId()==null
                    ||ready.verifiedCues().size()!=6||ready.termCues().size()!=21) {
                log.warn("SHOT08_CHAT_REQUEST_NOT_QUEUED: {}",
                        ready.reason());
                return;
            }
            var current=bridge.snapshot();
            var shot=current.shots().stream().filter(s->"SHOT08".equals(s.shotKey()))
                    .findFirst().orElseThrow();
            if(!current.sourceVerified()
                    ||!current.inputFingerprint().equals(ready.inputFingerprint())
                    ||!ready.voiceTakeId().equals(shot.preferredTakeId())
                    ||!shot.currentVoiceApproved()
                    ||shot.measuredVoiceSeconds()==null
                    ||shot.durationFrames()==null
                    ||shot.durationFrames()!=ready.durationInFrames())
                throw new IllegalStateException("Current approved selected voice changed");
            UUID requestId=UUID.nameUUIDFromBytes(
                    (AUTHORIZATION+"|"+ready.inputFingerprint()+"|"+
                            ready.voiceTakeId()+"|"+workerSha).getBytes(StandardCharsets.UTF_8));
            Map<String,Object> props=new LinkedHashMap<>();
            props.put("shotKey","EP002_SHOT08");
            props.put("durationInFrames",ready.durationInFrames());
            props.put("voiceTakeId",ready.voiceTakeId());
            props.put("scriptRevision",shot.scriptRevision());
            props.put("timingMode",ready.timingMode());
            props.put("verifiedCues",ready.verifiedCues());
            props.put("termCues",ready.termCues());
            props.put("inputFingerprint",ready.inputFingerprint());
            props.put("visualSourceSha",Ep002RecoverySource.RECOVERY_VISUAL_BLOB_SHA);
            props.put("expectedSourceCommit",workerSha);
            props.put("renderRequestId",requestId.toString());
            props.put("authorizationSource",AUTHORIZATION);
            var render=renders.ensureVerifiedEp002Shot08Preview(props);
            UUID id=(UUID)render.get("renderId");
            jdbc.sql("""
                    insert into episode_shot_render_lineage(
                        id,episode_key,shot_key,script_revision,script_sha256,
                        preferred_take_id,visual_source_git_blob_sha,
                        dependency_sha256,remotion_render_id,remotion_commit_sha,render_status)
                    values(:id,'EP002','SHOT08',:revision,:narration,:take,
                           :visual,:fingerprint,:render,:worker,'QUEUED')
                    on conflict(episode_key,shot_key,dependency_sha256,remotion_render_id)
                        do nothing
                    """)
                    .param("id",UUID.randomUUID())
                    .param("revision",shot.scriptRevision())
                    .param("narration",shot.narrationSha256())
                    .param("take",UUID.fromString(ready.voiceTakeId()))
                    .param("visual",Ep002RecoverySource.RECOVERY_VISUAL_BLOB_SHA)
                    .param("fingerprint",ready.inputFingerprint())
                    .param("render",id).param("worker",workerSha).update();
            log.info("SHOT08_CHAT_DIRECTOR_USER_REQUEST_RENDER_QUEUED renderId={} voiceTakeId={} frames={} workerSha={} realBeats=6 realTerms=21",
                    id,ready.voiceTakeId(),ready.durationInFrames(),workerSha);
        }catch(Exception problem){
            log.error("SHOT08_CHAT_REQUEST_NOT_QUEUED: {}",problem.toString());
        }
    }
}
