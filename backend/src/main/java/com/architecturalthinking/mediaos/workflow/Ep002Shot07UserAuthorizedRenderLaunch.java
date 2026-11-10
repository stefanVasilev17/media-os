package com.architecturalthinking.mediaos.workflow;

import com.architecturalthinking.mediaos.remotion.RemotionRenderController;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class Ep002Shot07UserAuthorizedRenderLaunch implements ApplicationRunner {
    private static final Logger log=LoggerFactory.getLogger(Ep002Shot07UserAuthorizedRenderLaunch.class);
    private static final String AUTHORIZATION="DIRECTOR_EXPLICIT_CHAT_ONE_CPU_SHOT07_V2_2026_11_10";
    private static final String APPROVED_TAKE="3105980d-8a47-4a34-821e-53ae67605eb0";
    private static final String APPROVED_WORKER_SHA="fa4a0d534f8e091fe9d68587e210a574bcd1e854";
    private static final String COMPOSITION="EP002-SHOT07-CANDIDATE";

    private final Ep002DirectorVoiceCueService cues;
    private final Ep002FactoryReadinessBridgeService bridge;
    private final RemotionRenderController renders;
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final boolean userAuthorizedOnce;
    private final boolean renderEnabled;
    private final String workerSha;

    public Ep002Shot07UserAuthorizedRenderLaunch(
            Ep002DirectorVoiceCueService cues,
            Ep002FactoryReadinessBridgeService bridge,
            RemotionRenderController renders,
            JdbcClient jdbc,
            ObjectMapper mapper,
            @Value("\${mediaos.ep002.shot07-chat-render-once:false}") boolean userAuthorizedOnce,
            @Value("\${mediaos.ep002.shot07-preview-enabled:false}") boolean renderEnabled,
            @Value("\${MEDIAOS_SHOT07_RELEASE_WORKER_SHA:}") String workerSha) {
        this.cues=cues;
        this.bridge=bridge;
        this.renders=renders;
        this.jdbc=jdbc;
        this.mapper=mapper;
        this.userAuthorizedOnce=userAuthorizedOnce;
        this.renderEnabled=renderEnabled;
        this.workerSha=workerSha==null?"":workerSha.trim();
    }

    private record SelectedTake(BigDecimal seconds,String alignment) {}

    @Override
    public void run(ApplicationArguments args) {
        if(!userAuthorizedOnce)return;
        if(!renderEnabled || !APPROVED_WORKER_SHA.equals(workerSha)) {
            log.warn("SHOT07_V2_CHAT_NOT_QUEUED: paid CPU disabled or correct deployed Worker source not pinned");
            return;
        }
        try {
            var snapshot=bridge.snapshot();
            var shot=snapshot.shots().stream()
                    .filter(s->"SHOT07".equals(s.shotKey()))
                    .findFirst().orElseThrow();
            if(!snapshot.sourceVerified()
                    ||!snapshot.inputFingerprint().matches("[a-f0-9]{64}")
                    ||!shot.currentVoiceApproved()
                    ||!shot.hearSeeTimingVerified()
                    ||!APPROVED_TAKE.equals(shot.preferredTakeId())
                    ||shot.durationFrames()==null||shot.durationFrames()<150
                    ||shot.verifiedCueFrames()==null||!shot.verifiedCueFrames().isArray()
                    ||shot.verifiedCueFrames().size()!=5) {
                log.warn("SHOT07_V2_CHAT_NOT_QUEUED: current source, authentic Director cue review or exact approved Take unavailable");
                return;
            }
            if(!cues.matchesCurrentShot07Render(
                    snapshot.inputFingerprint(),APPROVED_TAKE,
                    shot.scriptRevision(),shot.durationFrames())) {
                log.warn("SHOT07_V2_CHAT_NOT_QUEUED: current-fingerprint Director HEAR-SEE audit is missing. Reverify SHOT07 cues in MediaOS; no paid CPU queued");
                return;
            }
            SelectedTake take=jdbc.sql("""
                    select duration_seconds,elevenlabs_alignment::text as alignment
                    from ep002_creative_voice_take
                    where id=:take and shot_key='SHOT07'
                      and revision=:revision and narration_sha256=:narration
                      and approved_at is not null
                    """)
                    .param("take",UUID.fromString(APPROVED_TAKE))
                    .param("revision",shot.scriptRevision())
                    .param("narration",shot.narrationSha256())
                    .query((rs,n)->new SelectedTake(
                            rs.getBigDecimal("duration_seconds"),
                            rs.getString("alignment"))).optional().orElse(null);
            if(take==null||take.seconds()==null||take.alignment()==null
                    ||take.alignment().isBlank()
                    ||shot.measuredVoiceSeconds()==null
                    ||take.seconds().compareTo(shot.measuredVoiceSeconds())!=0
                    ||(int)Math.ceil(take.seconds().doubleValue()*30d)!=shot.durationFrames()) {
                log.warn("SHOT07_V2_CHAT_NOT_QUEUED: exact approved ElevenLabs Take timing changed");
                return;
            }
            List<Ep002VoiceBeatResolver.BeatCue> beats=mapper.convertValue(
                    shot.verifiedCueFrames(),
                    new TypeReference<List<Ep002VoiceBeatResolver.BeatCue>>() {});
            if(beats.size()!=5)throw new IllegalStateException("Five authentic beat cues required");
            int last=0;
            for(int i=0;i<beats.size();i++){
                var beat=beats.get(i);
                if(beat.beatNumber()!=i+1||beat.startFrame()!=last
                        ||beat.endFrame()<=last
                        ||beat.endFrame()>shot.durationFrames())
                    throw new IllegalStateException("SHOT07 verified beat boundaries invalid");
                last=beat.endFrame();
            }
            if(last!=shot.durationFrames())
                throw new IllegalStateException("SHOT07 verified voice timeline incomplete");
            var terms=Ep002Shot07TermResolver.resolve(mapper,take.alignment(),take.seconds(),beats);
            if(terms.size()!=15)throw new IllegalStateException("Real 15 terms missing");
            Long existing=jdbc.sql("""
                    select count(*) from remotion_render
                    where composition_id=:composition
                      and input_props->>'voiceTakeId'=:take
                      and input_props->>'expectedSourceCommit'=:worker
                    """)
                    .param("composition",COMPOSITION)
                    .param("take",APPROVED_TAKE)
                    .param("worker",workerSha)
                    .query(Long.class).single();
            if(existing>0) {
                log.info("SHOT07_V2_CHAT_ALREADY_PRESENT count={} take={} worker={} — no duplicate paid job",
                        existing,APPROVED_TAKE,workerSha);
                return;
            }
            UUID requestId=UUID.nameUUIDFromBytes(
                    (AUTHORIZATION+"|"+snapshot.inputFingerprint()+"|"+
                            APPROVED_TAKE+"|"+workerSha).getBytes(StandardCharsets.UTF_8));
            Map<String,Object> props=new LinkedHashMap<>();
            props.put("shotKey","EP002_SHOT07");
            props.put("durationInFrames",shot.durationFrames());
            props.put("voiceTakeId",APPROVED_TAKE);
            props.put("scriptRevision",shot.scriptRevision());
            props.put("timingMode","ELEVENLABS_CHARACTER_TIMESTAMPS");
            props.put("verifiedCues",beats);
            props.put("termCues",terms);
            props.put("inputFingerprint",snapshot.inputFingerprint());
            props.put("visualSourceSha",Ep002ProductionContractService.VISUAL_SHA);
            props.put("expectedSourceCommit",workerSha);
            props.put("renderRequestId",requestId.toString());
            props.put("authorizationSource",AUTHORIZATION);
            var result=renders.ensureVerifiedEp002Shot07Preview(props);
            UUID renderId=(UUID)result.get("renderId");
            jdbc.sql("""
                    insert into episode_shot_render_lineage(
                      id,episode_key,shot_key,script_revision,script_sha256,
                      preferred_take_id,visual_source_git_blob_sha,
                      dependency_sha256,remotion_render_id,remotion_commit_sha,render_status)
                    values(:id,'EP002','SHOT07',:revision,:narration,:take,
                      :visual,:fingerprint,:render,:worker,'QUEUED')
                    on conflict(episode_key,shot_key,dependency_sha256,remotion_render_id)
                      do nothing
                    """)
                    .param("id",UUID.randomUUID())
                    .param("revision",shot.scriptRevision())
                    .param("narration",shot.narrationSha256())
                    .param("take",UUID.fromString(APPROVED_TAKE))
                    .param("visual",Ep002ProductionContractService.VISUAL_SHA)
                    .param("fingerprint",snapshot.inputFingerprint())
                    .param("render",renderId)
                    .param("worker",workerSha).update();
            log.info("SHOT07_V2_CHAT_ONE_PAID_RENDER_QUEUED renderId={} voiceTakeId={} frames={} workerSha={} realBeats=5 realTerms=15",
                    renderId,APPROVED_TAKE,shot.durationFrames(),workerSha);
        } catch(Exception failure) {
            log.error("SHOT07_V2_CHAT_NOT_QUEUED: {}",failure.toString());
        }
    }
}
