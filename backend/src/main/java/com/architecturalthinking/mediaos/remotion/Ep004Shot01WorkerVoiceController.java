package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.workflow.MediaObjectStore;
import com.architecturalthinking.mediaos.workflow.Ep004Shot01DirectorRenderService;
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
public final class Ep004Shot01WorkerVoiceController {
    private final JdbcClient jdbc;
    private final MediaObjectStore objects;
    private final String secret;

    public Ep004Shot01WorkerVoiceController(JdbcClient jdbc,MediaObjectStore objects,
            @Value("${MEDIA_OS_RENDER_WORKER_KEY:}") String workerKey) {
        this.jdbc=jdbc;
        this.objects=objects;
        this.secret=workerKey==null?"":workerKey.trim();
    }

    record Take(String type,String key,String sha,Long bytes,byte[] legacy) {}

    @GetMapping("/{renderId}/ep004-shot01-selected-voice")
    public ResponseEntity<byte[]> approvedTake(@PathVariable UUID renderId,
            @RequestHeader(value="X-Media-OS-Worker-Key",required=false) String key,
            @RequestHeader(value="X-Media-OS-Worker",required=false) String worker,
            @RequestHeader(value="X-Media-OS-Worker-Source-Sha",required=false) String sourceSha){
        requireWorker(key,worker,sourceSha);
        Take take=jdbc.sql("""
                select t.content_type,t.audio_object_key,t.audio_sha256,
                       t.audio_size_bytes,t.audio
                  from remotion_render render
                  join episode_package_import p on p.id=(render.input_props->>'packageId')::uuid
                  join episode_package_shot shot on shot.package_id=p.id
                    and shot.shot_key='SHOT01'
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
                   and render.composition_id=:composition
                   and render.input_props->>'expectedSourceCommit'=:commit
                   and render.input_props->>'directorCpuApproved'='true'
                   and render.input_props->>'sourceSha256'=:sourceSha
                   and p.source_sha256=:sourceSha
                   and chosen.selected_at=(
                     select max(c.selected_at) from episode_package_voice_choice c
                     where c.shot_id=shot.id and c.revision=t.revision)
                   and t.generated_alignment->>'mediaos_delivery_mode'='SLOW_NATURAL'
                   and t.duration_seconds>0
                 limit 1
                """).param("renderId",renderId).param("worker",worker.trim())
                .param("composition",Ep004Shot01DirectorRenderService.COMPOSITION)
                .param("commit",sourceSha.trim())
                .param("sourceSha",Ep004Shot01DirectorRenderService.SOURCE_SHA)
                .query((rs,n)->new Take(rs.getString("content_type"),
                        rs.getString("audio_object_key"),
                        rs.getString("audio_sha256"),
                        rs.getObject("audio_size_bytes",Long.class),
                        rs.getBytes("audio")))
                .optional().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Approved current-revision EP004 SHOT01 Take changed or worker source is stale."));
        byte[] audio=take.key()==null?take.legacy():
                objects.downloadVerified(take.key(),take.sha(),take.bytes());
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
