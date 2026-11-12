package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/master/v4")
public final class Ep002V4DirectorCleanCutProduction {
    private static final Logger log=LoggerFactory.getLogger(Ep002V4DirectorCleanCutProduction.class);
    static final String MODE="DIRECTOR_V4_CLEAN_CUT_NO_BRIDGE";
    static final String TRANSITION="ZERO_ADDED_FRAMES_DIRECT_CUT";
    static final String AUTH="DIRECTOR_CHAT_2026_11_12_EP002_V4_CLEAN_CUT_UPDATED_SHOT10_ONE_RENDER";
    static final String SHOT10_ID="96e427d2-b518-47c0-a287-59ea42cfab52";
    private final JdbcClient jdbc;
    private final RemotionRenderController renders;
    private final boolean directorApproved;
    private final String pinnedSha;

    public Ep002V4DirectorCleanCutProduction(JdbcClient jdbc,RemotionRenderController renders,
        @Value("${MEDIAOS_EP002_V4_CLEAN_CUT_RENDER_ONCE:false}") boolean directorApproved,
        @Value("${MEDIAOS_EP002_V4_RELEASE_SHA:}") String pinnedSha){
        this.jdbc=jdbc;this.renders=renders;
        this.directorApproved=directorApproved;
        this.pinnedSha=pinnedSha==null?"":pinnedSha.trim();
    }
    private record Source(String id,String composition,String status,int width,int height,
                          int fps,int frames,Long bytes,boolean stored){}

    private Source source(String id){
        return jdbc.sql("""
            select id::text,composition_id,status,width,height,fps,duration_in_frames,
                   size_bytes,video_data is not null
            from remotion_render
            where id=:id and project_id=:project
            """)
            .param("id",UUID.fromString(id))
            .param("project",Ep002DirectorMasterController.PROJECT_ID)
            .query((rs,index)->new Source(rs.getString(1),rs.getString(2),
                rs.getString(3),rs.getInt(4),rs.getInt(5),rs.getInt(6),
                rs.getInt(7),(Long)rs.getObject(8),rs.getBoolean(9)))
            .optional().orElse(null);
    }

    private Map<String,Object> one(){
        return jdbc.sql("""
            select id from remotion_render
             where project_id=:project
               and composition_id='EP002-DIRECTOR-MASTER'
               and input_props->>'authorizationSource'=:auth
             order by created_at desc,id desc limit 1
            """)
            .param("project",Ep002DirectorMasterController.PROJECT_ID)
            .param("auth",AUTH)
            .query((rs,index)->rs.getObject(1,UUID.class))
            .optional().map(renders::render)
            .orElseGet(()->Map.of("status","NOT_RENDERED"));
    }

    private boolean sourcePinned(){
        return directorApproved
            &&pinnedSha.matches("[a-f0-9]{40}")
            &&pinnedSha.equals(System.getenv("RAILWAY_GIT_COMMIT_SHA"));
    }

    @Scheduled(initialDelay=15000,fixedDelay=60000)
    public void queueExactlyOneDirectorV4(){
        if(!sourcePinned())return;
        try{
            if(!"NOT_RENDERED".equals(one().get("status")))return;
            List<String> ids=Ep002V2DirectorProduction.sourceIds(SHOT10_ID);
            if(ids.size()!=11
                ||!SHOT10_ID.equals(ids.get(9))
                ||ids.stream().distinct().count()!=11)
                throw new IllegalStateException("EP002_V4_EXACT_APPROVED_SOURCE_LIST_INVALID");

            int frames=0;
            StringBuilder digest=new StringBuilder(
                "EP002_V4_FRAME_MATCHED_ELEVEN_SOURCE_PINS_2026_11_12\n");
            for(int i=0;i<11;i++){
                Source s=source(ids.get(i));
                if(s==null||!"SUCCEEDED".equals(s.status())||!s.stored()
                    ||s.bytes()==null||s.bytes()<1000
                    ||s.width()!=1920||s.height()!=1080||s.fps()!=30
                    ||s.frames()<150
                    ||!Ep002DirectorMasterController.expectedComposition(i)
                          .equals(s.composition())
                    ||(i==9&&s.frames()!=2360)
                    ||(Ep002DirectorMasterController.EXPECTED_FRAMES.get(i)!=null
                        &&Ep002DirectorMasterController.EXPECTED_FRAMES.get(i)!=s.frames()))
                    throw new IllegalStateException(
                        "EP002_V4_APPROVED_SOURCE_NOT_STORED_SHOT"+(i+1));
                frames+=s.frames();
                digest.append(i).append(':').append(s.id()).append(':')
                    .append(s.frames()).append(':').append(s.bytes()).append('\n');
            }
            if(frames!=23446)
                throw new IllegalStateException("EP002_V4_SOURCE_LENGTH_CHANGED_"+frames);
            String sourceDigest=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(digest.toString().getBytes(StandardCharsets.UTF_8)));

            Map<String,Object> props=new LinkedHashMap<>();
            props.put("durationInFrames",23446);
            props.put("sourceRenderIds",ids);
            props.put("sourceDigest",sourceDigest);
            props.put("shot10RenderId",SHOT10_ID);
            props.put("expectedSourceCommit",pinnedSha);
            props.put("directorPaidCpuConfirmed",true);
            props.put("masterMode",MODE);
            props.put("transitionProfile",TRANSITION);
            props.put("breathingFramesPerSeam",0);
            props.put("breathingSeams",0);
            props.put("retimeSourceFrames",false);
            props.put("authorizationSource",AUTH);
            props.put("renderRequestId",UUID.nameUUIDFromBytes(
                (AUTH+"|"+sourceDigest+"|"+pinnedSha)
                    .getBytes(StandardCharsets.UTF_8)).toString());
            Map<String,Object> result=renders.ensureVerifiedEp002Master(props);
            log.info("EP002_V4_CONTINUITY_MASTER_REQUEST status={} renderId={} sourceCount=11 seams=10 frames=23446",
                result.get("status"),result.get("renderId"));
        }catch(Exception error){
            log.error("EP002_V4_CONTINUITY_MASTER_BLOCKED {}",
                error.toString());
        }
    }

    @GetMapping("/preflight")
    public Map<String,Object> preflight(){
        DirectorIdentity.requireDirector();
        Map<String,Object> response=new LinkedHashMap<>();
        response.put("master",one());
        response.put("expectedFrames",23446);
        response.put("sourceCount",11);
        response.put("seamCount",10);
        response.put("silentFramesPerSeam",0);
        response.put("retimedSourceFrames",0);
        response.put("workerPinned",sourcePinned());
        response.put("cleanShot10RenderId",SHOT10_ID);
        response.put("previousV3MasterId","5288d34f-6203-42e7-aa8a-cca321054091");
        response.put("directorFinalLock",false);
        java.util.ArrayList<Map<String,Object>> seams=new java.util.ArrayList<>();
        try{
            List<String> ids=Ep002V2DirectorProduction.sourceIds(SHOT10_ID);
            int sourceElapsed=0;
            for(int i=0;i<10;i++){
                Source previous=source(ids.get(i));
                if(previous==null||previous.frames()<150)break;
                sourceElapsed+=previous.frames();
                int startFrame=sourceElapsed;
                seams.add(Map.of(
                    "index",i+1,
                    "from","SHOT"+String.format("%02d",i+1),
                    "to","SHOT"+String.format("%02d",i+2),
                    "startSeconds",startFrame/30.0,
                    "endSeconds",startFrame/30.0,
                    "profile","DIRECT_HARD_CUT"));
            }
        }catch(Exception ignored){
            seams.clear();
        }
        response.put("seams",List.copyOf(seams));
        return response;
    }
}
