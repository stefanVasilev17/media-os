package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.workflow.MediaObjectStore;
import com.architecturalthinking.mediaos.workflow.Ep004Shot14DirectorRenderService;
import com.architecturalthinking.mediaos.workflow.SlowNaturalVoicePrompt;
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
public final class Ep004Shot14WorkerVoiceController {
    private final JdbcClient jdbc;
    private final MediaObjectStore objects;
    private final String secret;

    public Ep004Shot14WorkerVoiceController(JdbcClient jdbc,MediaObjectStore objects,
            @Value("${MEDIA_OS_RENDER_WORKER_KEY:}") String workerKey) {
        this.jdbc=jdbc;
        this.objects=objects;
        this.secret=workerKey==null?"":workerKey.trim();
    }

    record Take(String type,String key,String sha,Long bytes) {}

    @GetMapping("/{renderId}/ep004-shot14-selected-voice")
    public ResponseEntity<byte[]> approvedTake(@PathVariable UUID renderId,
            @RequestHeader(value="X-Media-OS-Worker-Key",required=false) String key,
            @RequestHeader(value="X-Media-OS-Worker",required=false) String worker,
            @RequestHeader(value="X-Media-OS-Worker-Source-Sha",required=false) String sourceSha){
        requireWorker(key,worker,sourceSha);
        Take take=jdbc.sql("""
                select t.content_type,t.audio_object_key,t.audio_sha256,
                       t.audio_size_bytes
                  from remotion_render render
                  join episode_package_import p on p.id=(render.input_props->>'packageId')::uuid
                  join episode_package_shot shot on shot.package_id=p.id
                    and shot.shot_key='SHOT14'
                  join episode_package_voice_take t
                    on t.id=(render.input_props->>'voiceTakeId')::uuid
                    and t.shot_id=shot.id
                    and t.revision=(render.input_props->>'scriptRevision')::int
                  join episode_package_voice_choice chosen
                    on chosen.shot_id=shot.id and chosen.take_id=t.id
                   and chosen.revision=t.revision
                 where render.id=:renderId and render.project_id=
                       '11111111-1111-1111-1111-111111111111'::uuid
                   and render.status='RUNNING' and render.worker_id=:worker
                   and render.episode_id is null
                   and render.profile='REVIEW' and render.width=1920
                   and render.height=1080 and render.fps=30
                   and render.input_props->>'previewOnly'='false'
                   and render.composition_id=:composition
                   and render.input_props->>'expectedSourceCommit'=:commit
                   and render.input_props->>'directorCpuApproved'='true'
                   and render.input_props->>'sourceSha256'=:sourceSha
                   and p.episode_key='EP004'
                   and p.source_sha256=:sourceSha
                   and t.storage_status='OBJECT_VERIFIED'
                   and t.audio_object_key is not null
                   and t.audio_sha256=render.input_props->>'voiceAudioSha256'
                   and t.audio_size_bytes::text=render.input_props->>'voiceAudioBytes'
                   and t.audio_size_bytes between 512 and 25165824
                   and t.revision=(select max(latest.revision)
                       from episode_package_shot_revision latest where latest.shot_id=shot.id)
                   and render.input_props->>'narrationSha256'=
                       t.generated_alignment->>'mediaos_spoken_script_sha256'
                   and chosen.id=(
                     select newest.id from episode_package_voice_choice newest
                     where newest.shot_id=shot.id and newest.revision=t.revision
                     order by newest.selected_at desc,newest.id desc limit 1)
                   and t.generated_alignment->>'mediaos_delivery_mode'=:delivery
                   and t.duration_seconds>0
                 limit 1
                """).param("renderId",renderId).param("worker",worker.trim())
                .param("composition",Ep004Shot14DirectorRenderService.COMPOSITION)
                .param("commit",sourceSha.trim())
                .param("sourceSha",Ep004Shot14DirectorRenderService.SOURCE_SHA)
                .param("delivery",SlowNaturalVoicePrompt.DELIVERY_MODE)
                .query((rs,n)->new Take(rs.getString("content_type"),
                        rs.getString("audio_object_key"),
                        rs.getString("audio_sha256"),
                        rs.getObject("audio_size_bytes",Long.class)))
                .optional().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Approved current-revision EP004 SHOT14 Take changed or worker source is stale."));
        if(take.key()==null || take.sha()==null || take.bytes()==null
                || !take.key().startsWith(MediaObjectStore.VOICE_PREFIX+"EP004/SHOT14/"))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Approved EP004 voice is not a verified private object.");
        byte[] audio=objects.downloadVerified(take.key(),take.sha(),take.bytes());
        if(audio==null||audio.length<512||audio.length>MediaObjectStore.MAX_VOICE_BYTES)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Selected approved audio is missing or exceeds the voice storage limit.");
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(take.type()))
                .body(audio);
    }

    private void requireWorker(String key,String worker,String sourceSha){
        if(secret.isBlank()||key==null||worker==null||worker.isBlank()
                ||worker.length()>160||sourceSha==null
                ||!sourceSha.matches("[a-f0-9]{40}")
                ||!MessageDigest.isEqual(secret.getBytes(StandardCharsets.UTF_8),
                    key.trim().getBytes(StandardCharsets.UTF_8)))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Worker authentication and compiled source SHA are mandatory.");
    }
}
