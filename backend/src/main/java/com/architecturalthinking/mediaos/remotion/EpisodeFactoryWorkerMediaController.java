package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.workflow.MediaObjectStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/remotion/renders/worker")
public class EpisodeFactoryWorkerMediaController {
    private final JdbcClient jdbc;
    private final String secret;
    private final MediaObjectStore mediaObjects;

    @Autowired
    public EpisodeFactoryWorkerMediaController(JdbcClient jdbc,
            @Value("${MEDIA_OS_RENDER_WORKER_KEY:}") String workerKey,
            MediaObjectStore mediaObjects) {
        this.jdbc=jdbc;this.secret=workerKey==null?"":workerKey.trim();
        this.mediaObjects=mediaObjects;
    }

    public EpisodeFactoryWorkerMediaController(JdbcClient jdbc,String workerKey){
        this(jdbc,workerKey,null);
    }

    record Media(byte[] bytes,String type,String objectKey,String sha256,Long objectBytes) {}

    @GetMapping("/{renderId}/factory-selected-voice")
    public ResponseEntity<byte[]> voice(
            @PathVariable UUID renderId,
            @RequestHeader(value="X-Media-OS-Worker-Key",required=false) String key,
            @RequestHeader(value="X-Media-OS-Worker",required=false) String worker) {
        requireWorker(key,worker);
        var audio=jdbc.sql("""
                select t.audio,t.content_type,t.audio_object_key,t.audio_sha256,t.audio_size_bytes
                  from episode_factory_shot fs
                  join episode_factory_production_run run on run.id=fs.run_id
                  join episode_package_voice_take t
                    on t.id=fs.selected_take_id and t.revision=fs.narration_revision
                  join episode_package_shot s
                    on s.package_id=run.package_id and s.shot_key=fs.shot_key
                   and s.id=t.shot_id
                  join remotion_render r on r.id=fs.last_requested_render
                  join lateral(
                    select c.take_id from episode_package_voice_choice c
                    where c.shot_id=s.id and c.revision=fs.narration_revision
                    order by c.selected_at desc,c.id desc limit 1
                  ) current on current.take_id=t.id
                 where fs.last_requested_render=:render
                   and r.status='RUNNING' and r.worker_id=:worker
                   and r.composition_id='AT-FACTORY-SHOT'
                   and run.verified_pr_commit=r.input_props->>'expectedSourceCommit'
                """).param("render",renderId).param("worker",worker.trim())
                .query((rs,n)->new Media(rs.getBytes("audio"),rs.getString("content_type"),
                        rs.getString("audio_object_key"),rs.getString("audio_sha256"),
                        rs.getObject("audio_size_bytes",Long.class)))
                .optional().orElseThrow(()->
                    new ResponseStatusException(HttpStatus.CONFLICT,
                            "Current Director-approved factory voice is not available for active worker render."));
        byte[] playable=audio.objectKey()!=null
                ?requireStore().downloadVerified(audio.objectKey(),audio.sha256(),audio.objectBytes())
                :audio.bytes();
        if(playable==null||playable.length<100)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Current Director-approved Take audio is missing.");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(audio.type()))
                .cacheControl(CacheControl.noStore())
                .body(playable);
    }

    @GetMapping("/{targetId}/factory-source/{sourceId}")
    public ResponseEntity<byte[]> source(
            @PathVariable UUID targetId,@PathVariable UUID sourceId,
            @RequestHeader(value="X-Media-OS-Worker-Key",required=false) String key,
            @RequestHeader(value="X-Media-OS-Worker",required=false) String worker) {
        requireWorker(key,worker);
        var mp4=jdbc.sql("""
                select source.video_data,source.media_type,source.video_object_key,
                       source.video_sha256,source.video_object_bytes
                  from episode_factory_output_plan plan
                  join episode_factory_production_run run on run.id=plan.run_id
                  join episode_factory_shot shot on shot.run_id=run.id
                   and shot.last_successful_render=:source and shot.director_approved=true
                  join remotion_render target on target.id=plan.render_id
                  join remotion_render source on source.id=shot.last_successful_render
                 where target.id=:target and target.status='RUNNING'
                   and target.worker_id=:worker
                   and target.composition_id in ('AT-FACTORY-MASTER','AT-FACTORY-SHORT')
                   and source.status='SUCCEEDED'
                   and source.composition_id='AT-FACTORY-SHOT'
                   and (source.video_data is not null or source.video_object_key is not null)
                   and run.verified_pr_commit=target.input_props->>'expectedSourceCommit'
                 limit 1
                """).param("source",sourceId).param("target",targetId)
                .param("worker",worker.trim())
                .query((rs,n)->new Media(rs.getBytes("video_data"),
                        rs.getString("media_type"),rs.getString("video_object_key"),
                        rs.getString("video_sha256"),
                        rs.getObject("video_object_bytes",Long.class))).optional().orElseThrow(()->
                    new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Requested MP4 is not an approved SHOT input for the active factory output job."));
        byte[] sourceBytes=mp4.objectKey()!=null
                ?requireStore().downloadVideoVerified(mp4.objectKey(),mp4.sha256(),mp4.objectBytes())
                :mp4.bytes();
        if(sourceBytes==null||sourceBytes.length<1000
                ||!"video/mp4".equals(mp4.type()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Approved MP4 is invalid.");
        return ResponseEntity.ok().contentType(MediaType.valueOf("video/mp4"))
                .cacheControl(CacheControl.noStore()).body(sourceBytes);
    }

    private MediaObjectStore requireStore(){
        if(mediaObjects==null)throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Private media object store is unavailable.");
        return mediaObjects;
    }

    private void requireWorker(String key,String worker) {
        if(secret.isBlank()||key==null||worker==null||worker.isBlank()
                ||worker.length()>160
                ||!MessageDigest.isEqual(secret.getBytes(StandardCharsets.UTF_8),
                        key.trim().getBytes(StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Authenticated Remotion CPU worker key and worker ID required.");
    }
}
