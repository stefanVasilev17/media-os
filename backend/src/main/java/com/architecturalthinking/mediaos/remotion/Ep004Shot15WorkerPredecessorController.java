package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.workflow.Ep004Shot15DirectorRenderService;
import com.architecturalthinking.mediaos.workflow.Ep004Shot14DirectorRenderService;
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
public final class Ep004Shot15WorkerPredecessorController {
    private static final String PROJECT_ID="11111111-1111-1111-1111-111111111111";
    private final JdbcClient jdbc;
    private final MediaObjectStore objects;
    private final String secret;
    public Ep004Shot15WorkerPredecessorController(JdbcClient jdbc,
            MediaObjectStore objects,
            @Value("${MEDIA_OS_RENDER_WORKER_KEY:}") String workerKey){
        this.jdbc=jdbc;this.objects=objects;
        secret=workerKey==null?"":workerKey.trim();
    }
    record Previous(String key,String sha,long bytes,int frames){}

    @GetMapping("/{renderId}/ep004-shot15-previous-video")
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
                "Worker identity and compiled source commit are required.");
        Previous previous=jdbc.sql("""
              select previous.video_object_key as k,
                     previous.video_sha256 as sha,
                     previous.video_object_bytes as bytes,
                     previous.duration_in_frames as frames
                from remotion_render r
                join episode_director_shot_lock locked on locked.package_id=
                     (r.input_props->>'packageId')::uuid and locked.shot_key='SHOT14'
                join remotion_render previous on previous.id=locked.render_id
               where r.id=:id and r.project_id=:project::uuid
                 and r.episode_id is null
                 and r.composition_id=:shot15
                 and r.profile='REVIEW' and r.status='RUNNING'
                 and r.worker_id=:worker
                 and r.width=1920 and r.height=1080 and r.fps=30
                 and r.input_props->>'episodeKey'='EP004'
                 and r.input_props->>'shotKey'='SHOT15'
                 and r.input_props->>'sourceSha256'=:source
                 and r.input_props->>'directorCpuApproved'='true'
                 and r.input_props->>'previewOnly'='false'
                 and r.input_props->>'expectedSourceCommit'=:commit
                 and r.input_props->>'previousRenderId'=previous.id::text
                 and r.input_props->>'previousFrameCount'=previous.duration_in_frames::text
                 and (r.input_props->>'previousLastEncodedFrame')::integer=
                     previous.duration_in_frames-1
                 and (r.input_props->>'worldStartFrame')::integer=
                     (previous.input_props->>'worldStartFrame')::integer+previous.duration_in_frames-1
                 and r.input_props->>'previousWorldStartFrame'=previous.input_props->>'worldStartFrame'
                 and jsonb_typeof(r.input_props->'previousShot14Props')='object'
                 and r.input_props->>'previousSourceCommit'=
                     previous.input_props->>'expectedSourceCommit'
                 and r.input_props->>'previousVideoSha256'=previous.video_sha256
                 and previous.project_id=:project::uuid
                 and previous.composition_id=:shot14
                 and previous.profile='REVIEW' and previous.status='SUCCEEDED'
                 and previous.width=1920 and previous.height=1080
                 and previous.fps=30
                 and previous.duration_in_frames between 600 and 9000
                 and previous.input_props->>'packageId'=r.input_props->>'packageId'
                 and previous.input_props->>'sourceSha256'=:source
                 and previous.id=:lockedId and previous.duration_in_frames=2018
                 and previous.input_props->>'expectedSourceCommit'=:lockedCommit
                 and previous.video_object_key is not null
                 and previous.video_sha256 ~ '^[a-f0-9]{64}$'
                 and previous.video_object_bytes between 1024 and 134217728
               limit 1
            """).param("id",renderId).param("project",PROJECT_ID)
            .param("worker",worker.trim()).param("commit",sourceSha)
            .param("source",Ep004Shot15DirectorRenderService.SOURCE_SHA)
            .param("shot15",Ep004Shot15DirectorRenderService.COMPOSITION)
            .param("shot14",Ep004Shot14DirectorRenderService.COMPOSITION)
            .param("lockedId",Ep004Shot15DirectorRenderService.PREDECESSOR_ID)
            .param("lockedCommit",Ep004Shot15DirectorRenderService.PREDECESSOR_COMMIT)
            .query((rs,n)->new Previous(rs.getString("k"),rs.getString("sha"),
                rs.getLong("bytes"),rs.getInt("frames")))
            .optional().orElseThrow(()->new ResponseStatusException(HttpStatus.CONFLICT,
                "Exact latest Director-LOCKED SHOT14 predecessor was not found."));
        if(previous.key()==null||
                !previous.key().startsWith(MediaObjectStore.VIDEO_PREFIX))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Only verified private original MP4 may be used for seam.");
        byte[] bytes=objects.downloadVideoVerified(previous.key(),
                previous.sha(),previous.bytes());
        if(bytes.length<1024||bytes.length>134217728)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Previous SHOT14 MP4 exceeded the bounded 128 MiB source.");
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .contentType(MediaType.valueOf("video/mp4")).body(bytes);
    }
}
