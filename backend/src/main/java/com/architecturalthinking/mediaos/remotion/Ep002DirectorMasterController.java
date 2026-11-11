package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.system.DirectorIdentity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@RestController
@RequestMapping("/api/v1/creative/episodes/EP002/master")
public class Ep002DirectorMasterController {
    static final UUID PROJECT_ID=UUID.fromString("11111111-1111-1111-1111-111111111111");
    static final String COMPOSITION="EP002-DIRECTOR-MASTER";
    static final List<String> SOURCE_IDS=List.of(
            "8f46fafd-9613-4375-bce2-ea98854e8b20",
            "59567d1a-6a45-4e48-b390-8ae583f30171",
            "6e8ea02e-1de1-440b-9e2a-dc23d07c466c",
            "b006202f-7587-4f82-931a-fadf5eacbfcb",
            "b2b95685-8e1b-41df-9fe2-c83eefbf86e9",
            "d42fe3a2-3810-4626-ab3a-0456463d4636",
            "b2a335dd-cb71-48f2-bf47-0f8bdcdd969d",
            "3415073a-5906-489d-bb69-6af7446c2c9b",
            "d4b6c8ff-10c5-4181-aa59-fcd16a4470ba",
            "2034d8c6-99b2-46a5-9469-bf3df325d6c0",
            "73ec0e6f-d348-4518-a32b-573bf89a8ab5");
    static final List<Integer> EXPECTED_FRAMES=Arrays.asList(
            1172,null,null,null,null,null,2674,2314,3063,2360,1572);
    private final JdbcClient jdbc;
    private final RemotionRenderController renders;
    private final boolean enabled;
    private final String pinnedSha;

    public Ep002DirectorMasterController(JdbcClient jdbc,RemotionRenderController renders,
            @Value("${MEDIAOS_EP002_MASTER_RENDER_ENABLED:false}") boolean enabled,
            @Value("${MEDIAOS_EP002_MASTER_RELEASE_WORKER_SHA:}") String pinnedSha) {
        this.jdbc=jdbc;this.renders=renders;this.enabled=enabled;
        this.pinnedSha=pinnedSha==null?"":pinnedSha.trim();
    }

    public record RenderRequest(UUID requestId,String expectedSourceDigest,
                                Boolean confirmPaidCpuRender) {}
    private record Source(String id,String composition,String status,int width,
                          int height,int fps,int frames,Long bytes,boolean stored) {}
    private record Snapshot(String digest,int totalFrames,
                            List<Map<String,Object>> shots,List<String> blockers) {}

    static String expectedComposition(int index) {
        return index==0?"EP002-SHOT01-DRAFT":
                "EP002-SHOT"+String.format("%02d",index+1)+"-CANDIDATE";
    }
    static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch(Exception e){throw new IllegalStateException("SHA256 unavailable",e);}
    }
    private Source source(String id) {
        return jdbc.sql("""
                select id::text as id,composition_id,status,width,height,fps,
                       duration_in_frames,size_bytes,video_data is not null as stored
                  from remotion_render where id=:id and project_id=:project
                """)
                .param("id",UUID.fromString(id)).param("project",PROJECT_ID)
                .query((rs,n)->new Source(rs.getString("id"),
                        rs.getString("composition_id"),rs.getString("status"),
                        rs.getInt("width"),rs.getInt("height"),rs.getInt("fps"),
                        rs.getInt("duration_in_frames"),(Long)rs.getObject("size_bytes"),
                        rs.getBoolean("stored")))
                .optional().orElse(null);
    }
    private Snapshot snapshot() {
        List<Map<String,Object>> shots=new ArrayList<>();
        List<String> blockers=new ArrayList<>();
        StringBuilder evidence=new StringBuilder("EP002-DIRECTOR-MASTER-EXACT-V1\n");
        int frames=0;
        for(int i=0;i<SOURCE_IDS.size();i++) {
            String shotKey="SHOT"+String.format("%02d",i+1),id=SOURCE_IDS.get(i);
            Source s=source(id);
            boolean valid=s!=null&&expectedComposition(i).equals(s.composition())
                    &&"SUCCEEDED".equals(s.status())&&s.stored()
                    &&s.bytes()!=null&&s.bytes()>1000
                    &&s.width()==1920&&s.height()==1080&&s.fps()==30
                    &&s.frames()>=150
                    &&(EXPECTED_FRAMES.get(i)==null||EXPECTED_FRAMES.get(i)==s.frames());
            Map<String,Object> row=new LinkedHashMap<>();
            row.put("shotKey",shotKey);row.put("renderId",id);
            row.put("ready",valid);row.put("frames",s==null?null:s.frames());
            row.put("sizeBytes",s==null?null:s.bytes());shots.add(row);
            if(!valid)blockers.add(shotKey+" approved MP4 unavailable or metadata incorrect");
            if(valid)frames+=s.frames();
            evidence.append(shotKey).append(':').append(id).append(':')
                    .append(s==null?"MISSING":s.composition()+"/"+s.status()+"/"
                    +s.frames()+"/"+s.bytes()+"/"+s.width()+"/"+s.height()+"/"+s.fps())
                    .append('\n');
        }
        if(frames<=0||frames>108000)blockers.add("TOTAL_DURATION_INVALID");
        return new Snapshot(sha256(evidence.toString()),frames,List.copyOf(shots),List.copyOf(blockers));
    }

    private Map<String,Object> existingMaster(String digest) {
        return jdbc.sql("""
                select id from remotion_render where project_id=:project
                  and composition_id='EP002-DIRECTOR-MASTER'
                  and input_props->>'sourceDigest'=:digest
                  and status in ('QUEUED','RUNNING','SUCCEEDED')
                order by created_at desc,id desc limit 1
                """)
                .param("project",PROJECT_ID).param("digest",digest)
                .query((rs,n)->rs.getObject("id",UUID.class))
                .optional().map(renders::render)
                .orElseGet(()->Map.of("status","NOT_RENDERED"));
    }

    @GetMapping("/preflight")
    @Transactional(readOnly=true)
    public Map<String,Object> preflight() {
        DirectorIdentity.requireDirector();
        Snapshot snap=snapshot();
        Map<String,Object> view=new LinkedHashMap<>();
        view.put("status",snap.blockers().isEmpty()?"ALL_11_MP4S_VERIFIED":"BLOCKED");
        view.put("sourceDigest",snap.digest());
        view.put("totalFrames",snap.totalFrames());
        view.put("totalSeconds",snap.totalFrames()/30d);
        view.put("shots",snap.shots());
        view.put("blockers",snap.blockers());
        view.put("renderEnabled",enabled);
        view.put("workerReleasePinned",pinnedSha.matches("[a-f0-9]{40}"));
        view.put("canRender",enabled&&pinnedSha.matches("[a-f0-9]{40}")
                &&snap.blockers().isEmpty());
        view.put("master",existingMaster(snap.digest()));
        view.put("finalDirectorLock",false);
        return view;
    }

    @PostMapping("/render")
    @Transactional(isolation=Isolation.SERIALIZABLE)
    public Map<String,Object> render(@RequestBody RenderRequest request,HttpServletRequest http) {
        DirectorIdentity.requireDirector();
        if(!(http.getAttribute("MEDIA_OS_CREATION_PREFLIGHT") instanceof Map<?,?> audit)
                ||!(audit.get("auditId") instanceof UUID))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Audited Director production preflight is required.");
        if(!enabled||!pinnedSha.matches("[a-f0-9]{40}"))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Master rendering requires a pinned separately enabled Worker release.");
        if(request==null||request.requestId()==null
                ||request.expectedSourceDigest()==null
                ||!request.expectedSourceDigest().matches("[a-f0-9]{64}")
                ||!Boolean.TRUE.equals(request.confirmPaidCpuRender()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unique request, current input fingerprint and paid CPU consent required.");
        Snapshot snap=snapshot();
        if(!snap.blockers().isEmpty()||!snap.digest().equals(request.expectedSourceDigest()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Some approved source MP4s are missing or changed. Refresh preflight.");
        Map<String,Object> existing=existingMaster(snap.digest());
        if(!"NOT_RENDERED".equals(existing.get("status")))return existing;
        Boolean failed=jdbc.sql("""
                select exists(select 1 from remotion_render
                    where project_id=:project and composition_id='EP002-DIRECTOR-MASTER'
                      and input_props->>'renderRequestId'=:id and status='FAILED')
                """)
                .param("project",PROJECT_ID).param("id",request.requestId().toString())
                .query(Boolean.class).single();
        if(Boolean.TRUE.equals(failed))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Failed Director request cannot be retried automatically.");
        Map<String,Object> props=new LinkedHashMap<>();
        props.put("durationInFrames",snap.totalFrames());
        props.put("sourceRenderIds",SOURCE_IDS);
        props.put("sourceDigest",snap.digest());
        props.put("expectedSourceCommit",pinnedSha);
        props.put("directorPaidCpuConfirmed",true);
        props.put("renderRequestId",request.requestId().toString());
        props.put("masterMode","EXACT_DIRECTOR_APPROVED_STREAM_COPY");
        return renders.ensureVerifiedEp002Master(props);
    }
}
