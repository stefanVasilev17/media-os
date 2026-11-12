package com.architecturalthinking.mediaos.remotion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/v1/remotion/renders/worker")
public class Ep002DirectorMasterWorkerMediaController {
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final String workerKey;

    public Ep002DirectorMasterWorkerMediaController(JdbcClient jdbc,ObjectMapper mapper,
            @Value("${MEDIA_OS_RENDER_WORKER_KEY:}") String workerKey) {
        this.jdbc=jdbc;this.mapper=mapper;
        this.workerKey=workerKey==null?"":workerKey.trim();
    }

    private record Source(String props,String sourceComposition,String status,
                          int width,int height,int fps,int frames,
                          Long bytes,String type,byte[] mp4,String sourceProps) {}

    @GetMapping("/{targetId}/ep002-master-source/{sourceId}")
    public ResponseEntity<byte[]> source(@PathVariable UUID targetId,
            @PathVariable UUID sourceId,
            @RequestHeader(value="X-Media-OS-Worker-Key",required=false) String key,
            @RequestHeader(value="X-Media-OS-Worker",required=false) String worker,
            @RequestHeader(value="X-Media-OS-Worker-Source-Sha",required=false) String workerSha) {
        if(workerKey.isBlank()||key==null||worker==null||worker.isBlank()
                ||worker.length()>160||workerSha==null
                ||!workerSha.matches("[a-f0-9]{40}")
                ||!MessageDigest.isEqual(workerKey.getBytes(StandardCharsets.UTF_8),
                        key.trim().getBytes(StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Authenticated pinned CPU worker is required.");

        Source source=jdbc.sql("""
                select target.input_props::text as props,
                       approved.composition_id as composition,
                       approved.status,approved.width,approved.height,approved.fps,
                       approved.duration_in_frames,approved.size_bytes,
                       approved.media_type,approved.video_data,approved.input_props::text as approved_props
                from remotion_render target
                join remotion_render approved on approved.id=:source
                  and approved.project_id=target.project_id
                where target.id=:target and target.project_id=:project
                  and target.status='RUNNING' and target.worker_id=:worker
                  and target.composition_id='EP002-DIRECTOR-MASTER'
                  and target.input_props->>'expectedSourceCommit'=:sha
                  and target.input_props->>'directorPaidCpuConfirmed'='true'
                  and target.input_props->>'masterMode' in (
                    'EXACT_DIRECTOR_APPROVED_STREAM_COPY','DIRECTOR_V2_60_FRAME_BREATHS')
                """)
                .param("source",sourceId).param("target",targetId)
                .param("project",Ep002DirectorMasterController.PROJECT_ID)
                .param("worker",worker.trim()).param("sha",workerSha)
                .query((rs,n)->new Source(rs.getString("props"),
                        rs.getString("composition"),rs.getString("status"),
                        rs.getInt("width"),rs.getInt("height"),rs.getInt("fps"),
                        rs.getInt("duration_in_frames"),(Long)rs.getObject("size_bytes"),
                        rs.getString("media_type"),rs.getBytes("video_data"),
                        rs.getString("approved_props")))
                .optional().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.FORBIDDEN,"Source does not belong to an authorized master job."));

        int index=-1;
        try {
            JsonNode props=mapper.readTree(source.props());
            JsonNode ids=props.path("sourceRenderIds");
            boolean v2=Ep002V2DirectorProduction.MASTER_MODE.equals(
                    props.path("masterMode").asText());
            if(!ids.isArray()||ids.size()!=11
                    ||!props.path("sourceDigest").asText("").matches("[a-f0-9]{64}")
                    ||!props.path("durationInFrames").canConvertToInt()
                    ||props.path("durationInFrames").asInt()<=0
                    ||!props.path("directorPaidCpuConfirmed").asBoolean(false))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Master must contain exactly eleven Director-approved pinned inputs.");
            for(int i=0;i<11;i++){
                String pinned=Ep002DirectorMasterController.SOURCE_IDS.get(i);
                String id=ids.path(i).asText("");
                if(v2 && i==9) {
                    if(!id.equals(props.path("shot10RenderId").asText(""))
                            ||pinned.equals(id))
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                "V2 master must pin a new verified SHOT10 render.");
                }else if(!pinned.equals(id))
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Director-pinned source ordering is immutable.");
                if(sourceId.toString().equals(id))index=i;
            }
            if(index<0)
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Source MP4 is not in the selected Director master.");
            if(v2) {
                if(props.path("breathingFramesPerSeam").asInt()!=60
                        ||props.path("breathingSeams").asInt()!=10)
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "V2 pacing contract does not match 10 x 60 frames.");
                if(index==9) {
                    JsonNode approved=mapper.readTree(source.sourceProps());
                    if(!Ep002V2DirectorProduction.SHOT10_AUTH.equals(
                            approved.path("authorizationSource").asText(""))
                            ||!Ep002V2DirectorProduction.SHOT10_VISUAL_BLOB.equals(
                                    approved.path("visualSourceSha").asText(""))
                            ||!workerSha.equals(approved.path("expectedSourceCommit").asText(""))
                            ||!"EP002_SHOT10".equals(approved.path("shotKey").asText()))
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                "SHOT10 source must be the approved cleaned V2 render.");
                }
            }else if(!"EXACT_DIRECTOR_APPROVED_STREAM_COPY".equals(
                    props.path("masterMode").asText("")))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Unrecognized final master source mode.");
        }catch(ResponseStatusException e){throw e;}
        catch(Exception e){throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Invalid immutable Director source manifest.");}

        if(!Ep002DirectorMasterController.expectedComposition(index)
                    .equals(source.sourceComposition())
                ||!"SUCCEEDED".equals(source.status())||source.width()!=1920
                ||source.height()!=1080||source.fps()!=30
                ||source.frames()<150
                ||(Ep002DirectorMasterController.EXPECTED_FRAMES.get(index)!=null
                    &&Ep002DirectorMasterController.EXPECTED_FRAMES.get(index)!=source.frames())
                ||source.bytes()==null||source.bytes()<1000
                ||source.mp4()==null||source.mp4().length!=source.bytes()
                ||source.mp4().length>256*1024*1024
                ||!"video/mp4".equals(source.type()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Approved exact Full HD master source changed or is invalid.");

        return ResponseEntity.ok().contentType(MediaType.valueOf("video/mp4"))
                .cacheControl(CacheControl.noStore())
                .body(source.mp4());
    }
}
