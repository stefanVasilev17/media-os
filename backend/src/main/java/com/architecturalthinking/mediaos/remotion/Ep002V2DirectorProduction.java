package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import com.architecturalthinking.mediaos.workflow.Ep002DirectorVoiceCueService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/master/v2")
public class Ep002V2DirectorProduction implements ApplicationRunner {
    private static final Logger log=LoggerFactory.getLogger(Ep002V2DirectorProduction.class);
    private static final UUID OLD_SHOT10=UUID.fromString("2034d8c6-99b2-46a5-9469-bf3df325d6c0");
    static final String SHOT10_AUTH="DIRECTOR_CHAT_2026_11_12_EP002_V2_SIMPLIFIED_SHOT10_ONE_CPU";
    private static final String MASTER_AUTH="DIRECTOR_CHAT_2026_11_12_EP002_V2_TEN_2S_BREATHING_MASTER_ONE_CPU";
    static final String MASTER_MODE="DIRECTOR_V2_60_FRAME_BREATHS";
    static final String SHOT10_VISUAL_BLOB="c61949419d0aa18b02434f8a050791bf1929016d";
    private final JdbcClient jdbc;
    private final RemotionRenderController renders;
    private final Ep002DirectorVoiceCueService cues;
    private final ObjectMapper mapper;
    private final boolean requested;
    private final String workerSha;

    public Ep002V2DirectorProduction(JdbcClient jdbc,RemotionRenderController renders,
            Ep002DirectorVoiceCueService cues,ObjectMapper mapper,
            @Value("${MEDIAOS_EP002_V2_DIRECTOR_CHAT_RENDER_ONCE:false}") boolean requested,
            @Value("${MEDIAOS_EP002_V2_RELEASE_SHA:}") String workerSha) {
        this.jdbc=jdbc;this.renders=renders;this.cues=cues;this.mapper=mapper;
        this.requested=requested;this.workerSha=workerSha==null?"":workerSha.trim();
    }

    private record Source(String id,String composition,String status,int width,int height,
                          int fps,int frames,Long bytes,boolean stored) {}
    private Source source(String id) {
        return jdbc.sql("""
                select id::text,composition_id,status,width,height,fps,duration_in_frames,
                       size_bytes,video_data is not null
                from remotion_render where id=:id and project_id=:project
                """).param("id",UUID.fromString(id)).param("project",Ep002DirectorMasterController.PROJECT_ID)
                .query((rs,i)->new Source(rs.getString(1),rs.getString(2),rs.getString(3),
                        rs.getInt(4),rs.getInt(5),rs.getInt(6),rs.getInt(7),
                        (Long)rs.getObject(8),rs.getBoolean(9))).optional().orElse(null);
    }

    private Map<String,Object> one(String authorization) {
        return jdbc.sql("""
                select id from remotion_render where project_id=:project
                  and input_props->>'authorizationSource'=:auth
                order by created_at desc,id desc limit 1
                """).param("project",Ep002DirectorMasterController.PROJECT_ID)
                .param("auth",authorization)
                .query((rs,i)->rs.getObject(1,UUID.class))
                .optional().map(renders::render)
                .orElseGet(()->Map.of("status","NOT_RENDERED"));
    }

    private boolean releaseReady(){
        return requested&&workerSha.matches("[a-f0-9]{40}")
                &&workerSha.equals(System.getenv("RAILWAY_GIT_COMMIT_SHA"));
    }

    @Override
    public void run(ApplicationArguments args) {
        if(!requested)return;
        try{
            Map<String,Object> result=queueShot10Once();
            log.info("EP002_V2_SHOT10_REQUEST status={} renderId={} reason={}",
                    result.get("status"),result.get("renderId"),result.get("reason"));
        }catch(Exception e){
            log.error("EP002_V2_SHOT10_NOT_QUEUED {}",e.toString());
        }
    }

    private Map<String,Object> queueShot10Once() throws Exception {
        if(!releaseReady())return Map.of("status","BLOCKED","reason","EXACT_WORKER_SHA_NOT_PINNED");
        Map<String,Object> prior=one(SHOT10_AUTH);
        if(!"NOT_RENDERED".equals(prior.get("status")))return prior;
        var old=jdbc.sql("""
                select r.input_props::text as props,r.status,r.duration_in_frames,
                       r.width,r.height,r.fps,r.profile,
                       l.script_revision,l.script_sha256,l.preferred_take_id,
                       l.dependency_sha256
                from remotion_render r
                join episode_shot_render_lineage l on l.remotion_render_id=r.id
                  and l.episode_key='EP002' and l.shot_key='SHOT10'
                where r.id=:id and r.project_id=:project
                """).param("id",OLD_SHOT10).param("project",Ep002DirectorMasterController.PROJECT_ID)
                .query((rs,i)->{
                    Map<String,Object> row=new LinkedHashMap<>();
                    row.put("props",rs.getString("props"));
                    row.put("status",rs.getString("status"));
                    row.put("frames",rs.getInt("duration_in_frames"));
                    row.put("width",rs.getInt("width"));
                    row.put("height",rs.getInt("height"));
                    row.put("fps",rs.getInt("fps"));
                    row.put("profile",rs.getString("profile"));
                    row.put("revision",rs.getInt("script_revision"));
                    row.put("narration",rs.getString("script_sha256"));
                    row.put("take",rs.getObject("preferred_take_id",UUID.class));
                    row.put("fingerprint",rs.getString("dependency_sha256"));
                    return row;
                })
                .optional().orElse(null);
        if(old==null||!"SUCCEEDED".equals(old.get("status"))
                ||!"REVIEW".equals(old.get("profile"))
                ||(int)old.get("frames")!=2360||(int)old.get("width")!=1920
                ||(int)old.get("height")!=1080||(int)old.get("fps")!=30)
            return Map.of("status","BLOCKED","reason","EXACT_ORIGINAL_SHOT10_METADATA_CHANGED");
        Map<String,Object> props=mapper.readValue((String)old.get("props"),
                new TypeReference<Map<String,Object>>(){});
        String fingerprint=(String)old.get("fingerprint");
        String take=((UUID)old.get("take")).toString();
        int revision=(int)old.get("revision");
        if(!"EP002_SHOT10".equals(props.get("shotKey"))
                ||!take.equals(props.get("voiceTakeId"))
                ||!fingerprint.equals(props.get("inputFingerprint"))
                ||((Number)props.get("scriptRevision")).intValue()!=revision
                ||!cues.matchesCurrentShot10Render(fingerprint,take,revision,2360)
                ||!(props.get("verifiedCues") instanceof List<?> beats&&beats.size()==6)
                ||!(props.get("termCues") instanceof List<?> terms&&terms.size()==21))
            return Map.of("status","BLOCKED","reason","CURRENT_APPROVED_SHOT10_VOICE_OR_CUES_CHANGED");
        props.put("expectedSourceCommit",workerSha);
        props.put("visualSourceSha",SHOT10_VISUAL_BLOB);
        props.put("authorizationSource",SHOT10_AUTH);
        props.put("renderRequestId",UUID.nameUUIDFromBytes(
                (SHOT10_AUTH+"|"+fingerprint+"|"+workerSha).getBytes(StandardCharsets.UTF_8)).toString());
        Map<String,Object> result=renders.ensureVerifiedEp002Shot10Preview(props);
        UUID renderId=(UUID)result.get("renderId");
        jdbc.sql("""
                insert into episode_shot_render_lineage(
                  id,episode_key,shot_key,script_revision,script_sha256,
                  preferred_take_id,visual_source_git_blob_sha,dependency_sha256,
                  remotion_render_id,remotion_commit_sha,render_status)
                values (:id,'EP002','SHOT10',:revision,:narration,:take,
                  :visual,:fingerprint,:render,:worker,'QUEUED')
                on conflict(episode_key,shot_key,dependency_sha256,remotion_render_id)
                  do nothing
                """).param("id",UUID.randomUUID()).param("revision",revision)
                .param("narration",old.get("narration")).param("take",old.get("take"))
                .param("visual",SHOT10_VISUAL_BLOB).param("fingerprint",fingerprint)
                .param("render",renderId).param("worker",workerSha).update();
        return result;
    }

    static List<String> sourceIds(String shot10Id){
        if(shot10Id==null||!shot10Id.matches(
            "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
                ||OLD_SHOT10.toString().equals(shot10Id))
            throw new IllegalArgumentException("EP002 V2 must use a new SHOT10 MP4");
        ArrayList<String> ids=new ArrayList<>(Ep002DirectorMasterController.SOURCE_IDS);
        ids.set(9,shot10Id);
        return List.copyOf(ids);
    }

    @Scheduled(initialDelay=15000,fixedDelay=15000)
    public void queueMasterAfterShot10(){
        if(!releaseReady())return;
        try{
            Map<String,Object> current=one(MASTER_AUTH);
            if(!"NOT_RENDERED".equals(current.get("status")))return;
            Map<String,Object> shot=one(SHOT10_AUTH);
            if(!"READY".equals(shot.get("status")))return;
            String id=String.valueOf(shot.get("renderId"));
            List<String> ids=sourceIds(id);
            StringBuilder digest=new StringBuilder("EP002_DIRECTOR_V2_BREATH_MASTER_EXACT_2026_11_12\\n");
            int sourceFrames=0;
            for(int i=0;i<11;i++){
                Source s=source(ids.get(i));
                if(s==null||!"SUCCEEDED".equals(s.status())||!s.stored()
                        ||s.bytes()==null||s.bytes()<1000
                        ||s.width()!=1920||s.height()!=1080||s.fps()!=30
                        ||s.frames()<150||!Ep002DirectorMasterController.expectedComposition(i)
                            .equals(s.composition())
                        ||(i==9&&s.frames()!=2360)
                        ||(Ep002DirectorMasterController.EXPECTED_FRAMES.get(i)!=null
                          &&Ep002DirectorMasterController.EXPECTED_FRAMES.get(i)!=s.frames()))
                    throw new IllegalStateException("EP002_V2_SOURCE_MISSING_OR_CHANGED_SHOT_"+(i+1));
                sourceFrames+=s.frames();
                digest.append(i).append(':').append(s.id()).append(':')
                      .append(s.frames()).append(':').append(s.bytes()).append('\\n');
            }
            if(sourceFrames!=23446)
                throw new IllegalStateException("EP002_V2_UNEXPECTED_TOTAL_SOURCE_FRAMES_"+sourceFrames);
            String sourceDigest=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(digest.toString().getBytes(StandardCharsets.UTF_8)));
            Map<String,Object> props=new LinkedHashMap<>();
            props.put("durationInFrames",sourceFrames+600);
            props.put("sourceRenderIds",ids);
            props.put("sourceDigest",sourceDigest);
            props.put("shot10RenderId",id);
            props.put("expectedSourceCommit",workerSha);
            props.put("directorPaidCpuConfirmed",true);
            props.put("masterMode",MASTER_MODE);
            props.put("breathingFramesPerSeam",60);
            props.put("breathingSeams",10);
            props.put("authorizationSource",MASTER_AUTH);
            props.put("renderRequestId",UUID.nameUUIDFromBytes(
                (MASTER_AUTH+"|"+sourceDigest+"|"+workerSha)
                    .getBytes(StandardCharsets.UTF_8)).toString());
            Map<String,Object> result=renders.ensureVerifiedEp002Master(props);
            log.info("EP002_V2_MASTER_REQUEST status={} renderId={} shot10={} frames={}",
                    result.get("status"),result.get("renderId"),id,sourceFrames+600);
        }catch(Exception e){
            log.warn("EP002_V2_MASTER_NOT_QUEUED {}",e.toString());
        }
    }

    @GetMapping("/preflight")
    public Map<String,Object> preflight(){
        DirectorIdentity.requireDirector();
        Map<String,Object> response=new LinkedHashMap<>();
        response.put("shot10",one(SHOT10_AUTH));
        response.put("master",one(MASTER_AUTH));
        response.put("expectedFrames",24046);
        response.put("breathFramesPerBoundary",60);
        response.put("boundaryCount",10);
        response.put("workerPinned",releaseReady());
        response.put("historicalMasterId","8876235a-8037-4f19-8f5c-d2398f3ef22f");
        response.put("directorFinalLock",false);
        return response;
    }
}
