package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.workflow.Ep004Shot03DirectorRenderService;
import com.architecturalthinking.mediaos.workflow.MediaObjectStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/remotion/renders/worker")
public final class Ep004Shot03WorkerPredecessorController {
    private final JdbcClient jdbc;
    private final MediaObjectStore objects;
    private final String secret;
    private static final String PROJECT_ID="11111111-1111-1111-1111-111111111111";
    private static final String SHOT02_COMPOSITION="EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL";

    public Ep004Shot03WorkerPredecessorController(JdbcClient jdbc,
            MediaObjectStore objects,
            @Value("${MEDIA_OS_RENDER_WORKER_KEY:}") String workerKey){
        this.jdbc=jdbc;this.objects=objects;
        secret=workerKey==null?"":workerKey.trim();
    }

    record Previous(String key,String sha,Long bytes) {}

    @GetMapping("/{renderId}/ep004-shot03-previous-video")
    public ResponseEntity<byte[]> predecessor(@PathVariable UUID renderId,
            @RequestHeader(value="X-Media-OS-Worker-Key",required=false) String key,
            @RequestHeader(value="X-Media-OS-Worker",required=false) String worker,
            @RequestHeader(value="X-Media-OS-Worker-Source-Sha",required=false) String sourceSha){
        if(secret.isBlank()||key==null||worker==null||worker.isBlank()
              ||worker.length()>160||sourceSha==null
              ||!sourceSha.matches("[a-f0-9]{40}")
              ||!MessageDigest.isEqual(secret.getBytes(StandardCharsets.UTF_8),
                  key.trim().getBytes(StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Worker identity and source SHA are required.");
        Previous previous=jdbc.sql("""
               select previous.video_object_key as k,previous.video_sha256 as sha,
                      previous.video_object_bytes as bytes
                 from remotion_render r
                 join remotion_render previous on previous.id=
                      (r.input_props->>'previousRenderId')::uuid
                where r.id=:id
                  and r.project_id=:project::uuid
                  and r.episode_id is null
                  and r.composition_id=:shot03
                  and r.profile='REVIEW' and r.status='RUNNING'
                  and r.worker_id=:worker
                  and r.width=1920 and r.height=1080 and r.fps=30
                  and r.input_props->>'episodeKey'='EP004'
                  and r.input_props->>'shotKey'='SHOT03'
                  and r.input_props->>'directorCpuApproved'='true'
                  and r.input_props->>'previewOnly'='false'
                  and r.input_props->>'expectedSourceCommit'=:commit
                  and r.input_props->>'sourceSha256'=:sourceSha
                  and r.input_props->>'previousSourceCommit'=:previousCommit
                  and r.input_props->>'previousFrameCount'='2124'
                  and r.input_props->>'previousLastEncodedFrame'='2123'
                  and previous.project_id=:project::uuid
                  and previous.composition_id=:shot02
                  and previous.profile='REVIEW'
                  and previous.status='SUCCEEDED'
                  and previous.fps=30 and previous.width=1920 and previous.height=1080
                  and previous.duration_in_frames=2124
                  and previous.input_props->>'expectedSourceCommit'=:previousCommit
                  and previous.input_props->>'sourceSha256'=:sourceSha
                  and previous.video_sha256=r.input_props->>'previousVideoSha256'
                  and previous.video_object_key is not null
                  and previous.video_object_bytes between 1024 and 33554432
                  and previous.video_sha256 ~ '^[a-f0-9]{64}$'
                limit 1
                """).param("id",renderId).param("project",PROJECT_ID)
                .param("worker",worker.trim())
                .param("shot03",Ep004Shot03DirectorRenderService.COMPOSITION)
                .param("shot02",SHOT02_COMPOSITION)
                .param("commit",sourceSha)
                .param("previousCommit",Ep004Shot03DirectorRenderService.SHOT02_SOURCE_COMMIT)
                .param("sourceSha",Ep004Shot03DirectorRenderService.SOURCE_SHA)
                .query((rs,n)->new Previous(rs.getString("k"),rs.getString("sha"),
                        rs.getObject("bytes",Long.class)))
                .optional().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Authentic verified SHOT02 predecessor is not available to this render."));
        if(!previous.key().startsWith(MediaObjectStore.VIDEO_PREFIX))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Predecessor must be stored in private object storage.");
        byte[] bytes=objects.downloadVideoVerified(previous.key(),
                previous.sha(),previous.bytes());
        if(bytes.length<1024||bytes.length>33554432)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Predecessor MP4 exceeded the strict 32 MB shot boundary.");
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .contentType(MediaType.valueOf("video/mp4")).body(bytes);
    }
}
