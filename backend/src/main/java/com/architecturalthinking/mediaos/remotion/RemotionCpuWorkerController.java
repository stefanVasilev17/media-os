package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.workflow.Ep002DirectorVoiceCueService;
import com.architecturalthinking.mediaos.workflow.Ep002Shot02EditorialPausePlan;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/remotion/renders/worker")
public class RemotionCpuWorkerController {

    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final int MAX_VIDEO_BYTES = 256 * 1024 * 1024;

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final StorageHealthService storage;
    private final String workerKey;
    private final Ep002DirectorVoiceCueService ep002Cues;

    @Autowired
    public RemotionCpuWorkerController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            StorageHealthService storage,
            @Value("${MEDIA_OS_RENDER_WORKER_KEY:}") String workerKey,
            Ep002DirectorVoiceCueService ep002Cues
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.storage = storage;
        this.workerKey = workerKey == null ? "" : workerKey.trim();
        this.ep002Cues = ep002Cues;
    }

    public RemotionCpuWorkerController(JdbcClient jdbc, ObjectMapper mapper,
                                       StorageHealthService storage, String workerKey) {
        this(jdbc, mapper, storage, workerKey, null);
    }

    public record ProgressRequest(int progress) {}
    public record FailureRequest(String error) {}

    @PostMapping("/claim")
    @Transactional
    public ResponseEntity<Map<String, Object>> claim(
            @RequestHeader(value = "X-Media-OS-Worker-Key", required = false) String key,
            @RequestHeader(value = "X-Media-OS-Worker", required = false) String workerId,
            @RequestHeader(value = "X-Media-OS-Worker-Source-Sha", required = false) String sourceSha,
            @RequestHeader(value = "X-Media-OS-Target-Composition", required = false) String targetComposition
    ) {
        requireWorker(key, workerId);
        String scope=targetComposition==null?"":targetComposition.trim();
        if (!scope.isEmpty() && !"EP002-DIRECTOR-V2-PIPELINE".equals(scope)
                && !"EP002-DIRECTOR-MASTER".equals(scope)
                && !"EP002-SHOT01-DRAFT".equals(scope)
                && !"EP002-SHOT02-CANDIDATE".equals(scope)
                && !"EP002-SHOT03-CANDIDATE".equals(scope)
                && !"EP002-SHOT04-CANDIDATE".equals(scope)
                && !"EP002-SHOT05-CANDIDATE".equals(scope)
                && !"EP002-SHOT06-CANDIDATE".equals(scope)
                && !"EP002-SHOT07-CANDIDATE".equals(scope)
                && !"EP002-SHOT08-CANDIDATE".equals(scope)
                && !"EP002-SHOT09-CANDIDATE".equals(scope)
                && !"EP002-SHOT10-CANDIDATE".equals(scope)
                && !"EP002-SHOT11-CANDIDATE".equals(scope)
                && !"EP002-DIRECTOR-SHOT02-SHOT03".equals(scope)
                && !"EP002-DIRECTOR-SHOT02-SHOT03-SHOT04".equals(scope)
                && !"EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05".equals(scope)
                && !"EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06".equals(scope)
                && !"EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07".equals(scope)
                && !"EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07-SHOT08".equals(scope)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unsupported target composition for scoped CPU claim.");
        }

        // An interrupted EP002 preview is terminal until the Director explicitly
        // requests another render. Never spend CPU repeatedly on stale voice mux failures.
        if (scope.isEmpty()) {
        jdbc.sql("""
                update remotion_render
                set status='FAILED', progress=0,
                    error='EP002 preview interrupted after worker heartbeat timeout. No automatic retry.',
                    finished_at=now(), updated_at=now()
                where project_id=:projectId
                  and composition_id in ('EP002-DIRECTOR-MASTER','EP002-SHOT01-DRAFT','EP002-SHOT02-CANDIDATE','EP002-SHOT03-CANDIDATE','EP002-SHOT04-CANDIDATE','EP002-SHOT05-CANDIDATE','EP002-SHOT06-CANDIDATE','EP002-SHOT07-CANDIDATE','EP002-SHOT08-CANDIDATE','EP002-SHOT09-CANDIDATE','EP002-SHOT10-CANDIDATE','EP002-SHOT11-CANDIDATE')
                  and status='RUNNING'
                  and updated_at < now() - interval '90 seconds'
                """)
                .param("projectId", PROJECT_ID)
                .update();

        jdbc.sql("""
                update remotion_render
                set status='QUEUED', progress=0, worker_id=null,
                    error='Recovered stale CPU render after worker heartbeat timeout.',
                    claimed_at=null, started_at=null, updated_at=now()
                where project_id=:projectId
                  and composition_id not in ('EP002-DIRECTOR-MASTER','EP002-SHOT01-DRAFT','EP002-SHOT02-CANDIDATE','EP002-SHOT03-CANDIDATE','EP002-SHOT04-CANDIDATE','EP002-SHOT05-CANDIDATE','EP002-SHOT06-CANDIDATE','EP002-SHOT07-CANDIDATE','EP002-SHOT08-CANDIDATE','EP002-SHOT09-CANDIDATE','EP002-SHOT10-CANDIDATE','EP002-SHOT11-CANDIDATE')
                  and status='RUNNING'
                  and updated_at < now() - interval '90 seconds'
                """)
                .param("projectId", PROJECT_ID)
                .update();

        }

        Map<String, Object> work = jdbc.sql("""
                select id, episode_id, composition_id, render_key, engine_version, input_props::text as input_props,
                       profile, width, height, fps, duration_in_frames
                from remotion_render
                where project_id=:projectId and status='QUEUED'
                  and (:targetComposition='' or composition_id=:targetComposition
                    or (:targetComposition='EP002-DIRECTOR-V2-PIPELINE'
                      and composition_id in ('EP002-SHOT10-CANDIDATE','EP002-DIRECTOR-MASTER'))
                    or (:targetComposition='EP002-DIRECTOR-SHOT02-SHOT03'
                       and composition_id in ('EP002-SHOT02-CANDIDATE',
                                              'EP002-SHOT03-CANDIDATE'))
                    or (:targetComposition='EP002-DIRECTOR-SHOT02-SHOT03-SHOT04'
                       and composition_id in ('EP002-SHOT02-CANDIDATE',
                                              'EP002-SHOT03-CANDIDATE',
                                              'EP002-SHOT04-CANDIDATE'))
                    or (:targetComposition='EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05'
                       and composition_id in ('EP002-SHOT02-CANDIDATE',
                                              'EP002-SHOT03-CANDIDATE',
                                              'EP002-SHOT04-CANDIDATE',
                                              'EP002-SHOT05-CANDIDATE'))
                    or (:targetComposition='EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06'
                       and composition_id in ('EP002-SHOT02-CANDIDATE',
                                              'EP002-SHOT03-CANDIDATE',
                                              'EP002-SHOT04-CANDIDATE',
                                              'EP002-SHOT05-CANDIDATE',
                                              'EP002-SHOT06-CANDIDATE'))
                    or (:targetComposition='EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07'
                       and composition_id in ('EP002-SHOT02-CANDIDATE',
                                              'EP002-SHOT03-CANDIDATE',
                                              'EP002-SHOT04-CANDIDATE',
                                              'EP002-SHOT05-CANDIDATE',
                                              'EP002-SHOT06-CANDIDATE',
                                              'EP002-SHOT07-CANDIDATE'))
                    or (:targetComposition='EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07-SHOT08'
                       and composition_id in ('EP002-SHOT02-CANDIDATE',
                                              'EP002-SHOT03-CANDIDATE',
                                              'EP002-SHOT04-CANDIDATE',
                                              'EP002-SHOT05-CANDIDATE',
                                              'EP002-SHOT06-CANDIDATE',
                                              'EP002-SHOT07-CANDIDATE',
                                              'EP002-SHOT08-CANDIDATE')))
                  and (composition_id<>'EP002-SHOT03-CANDIDATE'
                    or :targetComposition in ('EP002-SHOT03-CANDIDATE',
                                               'EP002-DIRECTOR-SHOT02-SHOT03',
                                               'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04',
                                                'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05',
                                                'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06',
                                               'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07',
                                               'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07-SHOT08'))
                  and (composition_id<>'EP002-SHOT04-CANDIDATE'
                    or :targetComposition in ('EP002-SHOT04-CANDIDATE',
                                               'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04',
                                                'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05',
                                                'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06',
                                               'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07',
                                               'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07-SHOT08'))
                  and (composition_id<>'EP002-SHOT05-CANDIDATE'
                    or :targetComposition in ('EP002-SHOT05-CANDIDATE',
                                               'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05',
                                                'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06',
                                               'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07',
                                               'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07-SHOT08'))
                  and (composition_id<>'EP002-SHOT06-CANDIDATE'
                    or :targetComposition in ('EP002-SHOT06-CANDIDATE',
                         'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06',
                                               'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07',
                                               'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07-SHOT08'))
                  and (composition_id<>'EP002-SHOT07-CANDIDATE'
                    or :targetComposition in ('EP002-SHOT07-CANDIDATE',
                         'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07',
                                               'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07-SHOT08'))
                  and (composition_id<>'EP002-SHOT08-CANDIDATE'
                    or :targetComposition in ('EP002-SHOT08-CANDIDATE',
                         'EP002-DIRECTOR-SHOT02-SHOT03-SHOT04-SHOT05-SHOT06-SHOT07-SHOT08'))
                  and (composition_id<>'EP002-SHOT09-CANDIDATE'
                    or :targetComposition='EP002-SHOT09-CANDIDATE')
                  and (composition_id<>'EP002-SHOT10-CANDIDATE'
                    or :targetComposition in ('EP002-SHOT10-CANDIDATE','EP002-DIRECTOR-V2-PIPELINE'))
                  and (composition_id<>'EP002-SHOT11-CANDIDATE'
                    or :targetComposition='EP002-SHOT11-CANDIDATE')
                  and (composition_id<>'EP002-DIRECTOR-MASTER'
                       or (:targetComposition in ('EP002-DIRECTOR-MASTER','EP002-DIRECTOR-V2-PIPELINE')
                         and input_props->>'expectedSourceCommit'=:sourceSha
                         and length(:sourceSha)=40
                         and :sourceSha !~ '[^a-f0-9]'
                         and input_props->>'directorPaidCpuConfirmed'='true'
                         and input_props->>'masterMode' in ('EXACT_DIRECTOR_APPROVED_STREAM_COPY',
                                   'DIRECTOR_V2_60_FRAME_BREATHS','DIRECTOR_V3_EXACT_FRAME_MATCHED_SEAMS')))
                  and (composition_id not like 'AT-FACTORY-%'
                    or (input_props->>'expectedSourceCommit' = :sourceSha
                      and exists(select 1 from episode_factory_worker_capability cap
                                  where cap.worker_id=:workerId
                                    and cap.source_commit=:sourceSha
                                    and cap.build_checked=true
                                    and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id not in ('EP002-SHOT02-CANDIDATE','EP002-SHOT03-CANDIDATE','EP002-SHOT04-CANDIDATE','EP002-SHOT05-CANDIDATE','EP002-SHOT06-CANDIDATE','EP002-SHOT07-CANDIDATE','EP002-SHOT08-CANDIDATE','EP002-SHOT09-CANDIDATE','EP002-SHOT10-CANDIDATE','EP002-SHOT11-CANDIDATE')
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and length(:sourceSha)=40
                      and :sourceSha !~ '[^a-f0-9]'))
                order by created_at
                for update skip locked
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .param("workerId",workerId.trim())
                .param("sourceSha",sourceSha==null?"":sourceSha.trim())
                .param("targetComposition",scope)
                .query((rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("renderId", rs.getObject("id", UUID.class));
                    row.put("episodeId", rs.getObject("episode_id", UUID.class));
                    row.put("compositionId", rs.getString("composition_id"));
                    row.put("renderKey", rs.getString("render_key"));
                    row.put("engineVersion", rs.getString("engine_version"));
                    row.put("inputProps", readMap(rs.getString("input_props")));
                    row.put("profile", rs.getString("profile"));
                    row.put("width", rs.getInt("width"));
                    row.put("height", rs.getInt("height"));
                    row.put("fps", rs.getInt("fps"));
                    row.put("durationInFrames", rs.getInt("duration_in_frames"));
                    row.put("durationMs", Math.round(rs.getInt("duration_in_frames") * 1000d / rs.getInt("fps")));
                    return row;
                })
                .optional()
                .orElse(null);

        if (work == null) return ResponseEntity.noContent().build();
        if ("EP002-SHOT02-CANDIDATE".equals(work.get("compositionId"))) {
            Object rawProps = work.get("inputProps");
            Map<?,?> props = rawProps instanceof Map<?,?> map ? map : Map.of();
            Object revision = props.get("scriptRevision");
            int sourceFrames=Ep002Shot02EditorialPausePlan.sourceFramesForRender(
                    props,(int) work.get("durationInFrames"));
            boolean current = sourceFrames>0 && revision instanceof Number number && ep002Cues != null
                    && ep002Cues.matchesCurrentShot02Render(
                        String.valueOf(props.get("inputFingerprint")),
                        String.valueOf(props.get("voiceTakeId")),
                        number.intValue(),sourceFrames);
            if (!current) {
                jdbc.sql("""
                    update remotion_render
                    set status='FAILED',progress=0,
                        error='SHOT02_SOURCE_OR_VOICE_STALE_BEFORE_CPU_CLAIM',
                        finished_at=now(),updated_at=now()
                    where id=:id and project_id=:project and status='QUEUED'
                    """)
                    .param("id",work.get("renderId")).param("project",PROJECT_ID).update();
                return ResponseEntity.noContent().build();
            }
        }

        if ("EP002-SHOT03-CANDIDATE".equals(work.get("compositionId"))) {
            Object rawProps=work.get("inputProps");
            Map<?,?> props=rawProps instanceof Map<?,?> map ? map : Map.of();
            Object revision=props.get("scriptRevision");
            int frames=(int)work.get("durationInFrames");
            boolean current=revision instanceof Number number && ep002Cues!=null
                    &&ep002Cues.matchesCurrentShot03Render(
                        String.valueOf(props.get("inputFingerprint")),
                        String.valueOf(props.get("voiceTakeId")),
                        number.intValue(),frames);
            if(!current){
                jdbc.sql("""
                    update remotion_render
                    set status='FAILED',progress=0,
                        error='SHOT03_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM',
                        finished_at=now(),updated_at=now()
                    where id=:id and project_id=:project and status='QUEUED'
                    """)
                    .param("id",work.get("renderId")).param("project",PROJECT_ID).update();
                return ResponseEntity.noContent().build();
            }
        }

        if ("EP002-SHOT04-CANDIDATE".equals(work.get("compositionId"))) {
            Object rawProps=work.get("inputProps");
            Map<?,?> props=rawProps instanceof Map<?,?> map ? map : Map.of();
            Object revision=props.get("scriptRevision");
            int frames=(int)work.get("durationInFrames");
            boolean current=revision instanceof Number number && ep002Cues!=null
                    &&ep002Cues.matchesCurrentShot04Render(
                        String.valueOf(props.get("inputFingerprint")),
                        String.valueOf(props.get("voiceTakeId")),
                        number.intValue(),frames);
            if(!current){
                jdbc.sql("""
                    update remotion_render
                    set status='FAILED',progress=0,
                        error='SHOT04_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM',
                        finished_at=now(),updated_at=now()
                    where id=:id and project_id=:project and status='QUEUED'
                    """)
                    .param("id",work.get("renderId")).param("project",PROJECT_ID).update();
                return ResponseEntity.noContent().build();
            }
        }

        if ("EP002-SHOT05-CANDIDATE".equals(work.get("compositionId"))) {
            Object rawProps=work.get("inputProps");
            Map<?,?> props=rawProps instanceof Map<?,?> map ? map : Map.of();
            Object revision=props.get("scriptRevision");
            int frames=(int)work.get("durationInFrames");
            boolean current=revision instanceof Number number && ep002Cues!=null
                    &&ep002Cues.matchesCurrentShot05Render(
                        String.valueOf(props.get("inputFingerprint")),
                        String.valueOf(props.get("voiceTakeId")),
                        number.intValue(),frames);
            if(!current){
                jdbc.sql("""
                    update remotion_render
                    set status='FAILED',progress=0,
                        error='SHOT05_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM',
                        finished_at=now(),updated_at=now()
                    where id=:id and project_id=:project and status='QUEUED'
                    """)
                    .param("id",work.get("renderId")).param("project",PROJECT_ID).update();
                return ResponseEntity.noContent().build();
            }
        }

        if ("EP002-SHOT06-CANDIDATE".equals(work.get("compositionId"))) {
            Object rawProps=work.get("inputProps");
            Map<?,?> props=rawProps instanceof Map<?,?> map ? map : Map.of();
            Object revision=props.get("scriptRevision");
            int frames=(int)work.get("durationInFrames");
            boolean current=revision instanceof Number number && ep002Cues!=null
                    &&ep002Cues.matchesCurrentShot06Render(
                        String.valueOf(props.get("inputFingerprint")),
                        String.valueOf(props.get("voiceTakeId")),
                        number.intValue(),frames);
            if(!current){
                jdbc.sql("""
                    update remotion_render
                    set status='FAILED',progress=0,
                        error='SHOT06_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM',
                        finished_at=now(),updated_at=now()
                    where id=:id and project_id=:project and status='QUEUED'
                    """)
                    .param("id",work.get("renderId")).param("project",PROJECT_ID).update();
                return ResponseEntity.noContent().build();
            }
        }

        if ("EP002-SHOT07-CANDIDATE".equals(work.get("compositionId"))) {
            Object rawProps=work.get("inputProps");
            Map<?,?> props=rawProps instanceof Map<?,?> map ? map : Map.of();
            Object revision=props.get("scriptRevision");
            int frames=(int)work.get("durationInFrames");
            boolean current=revision instanceof Number number && ep002Cues!=null
                    &&ep002Cues.matchesCurrentShot07Render(
                        String.valueOf(props.get("inputFingerprint")),
                        String.valueOf(props.get("voiceTakeId")),
                        number.intValue(),frames);
            if(!current){
                jdbc.sql("""
                    update remotion_render
                    set status='FAILED',progress=0,
                        error='SHOT07_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM',
                        finished_at=now(),updated_at=now()
                    where id=:id and project_id=:project and status='QUEUED'
                    """)
                    .param("id",work.get("renderId")).param("project",PROJECT_ID).update();
                return ResponseEntity.noContent().build();
            }
        }

        if ("EP002-SHOT08-CANDIDATE".equals(work.get("compositionId"))) {
            Object rawProps=work.get("inputProps");
            Map<?,?> props=rawProps instanceof Map<?,?> map ? map : Map.of();
            Object revision=props.get("scriptRevision");
            int frames=(int)work.get("durationInFrames");
            boolean current=revision instanceof Number number && ep002Cues!=null
                    &&ep002Cues.matchesCurrentShot08Render(
                        String.valueOf(props.get("inputFingerprint")),
                        String.valueOf(props.get("voiceTakeId")),
                        number.intValue(),frames);
            if(!current){
                jdbc.sql("""
                    update remotion_render
                    set status='FAILED',progress=0,
                        error='SHOT08_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM',
                        finished_at=now(),updated_at=now()
                    where id=:id and project_id=:project and status='QUEUED'
                    """)
                    .param("id",work.get("renderId")).param("project",PROJECT_ID).update();
                return ResponseEntity.noContent().build();
            }
        }

        if ("EP002-SHOT09-CANDIDATE".equals(work.get("compositionId"))) {
            Object rawProps=work.get("inputProps");
            Map<?,?> props=rawProps instanceof Map<?,?> map ? map : Map.of();
            Object revision=props.get("scriptRevision");
            int frames=(int)work.get("durationInFrames");
            boolean current=revision instanceof Number number && ep002Cues!=null
                    &&ep002Cues.matchesCurrentShot09Render(
                        String.valueOf(props.get("inputFingerprint")),
                        String.valueOf(props.get("voiceTakeId")),
                        number.intValue(),frames);
            if(!current){
                jdbc.sql("""
                    update remotion_render
                    set status='FAILED',progress=0,
                        error='SHOT09_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM',
                        finished_at=now(),updated_at=now()
                    where id=:id and project_id=:project and status='QUEUED'
                    """)
                    .param("id",work.get("renderId")).param("project",PROJECT_ID).update();
                return ResponseEntity.noContent().build();
            }
        }

        if ("EP002-SHOT10-CANDIDATE".equals(work.get("compositionId"))) {
            Object rawProps=work.get("inputProps");
            Map<?,?> props=rawProps instanceof Map<?,?> map ? map : Map.of();
            Object revision=props.get("scriptRevision");
            int frames=(int)work.get("durationInFrames");
            boolean current=revision instanceof Number number && ep002Cues!=null
                    &&ep002Cues.matchesCurrentShot10Render(
                        String.valueOf(props.get("inputFingerprint")),
                        String.valueOf(props.get("voiceTakeId")),
                        number.intValue(),frames);
            if(!current){
                jdbc.sql("""
                    update remotion_render
                    set status='FAILED',progress=0,
                        error='SHOT10_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM',
                        finished_at=now(),updated_at=now()
                    where id=:id and project_id=:project and status='QUEUED'
                    """)
                    .param("id",work.get("renderId")).param("project",PROJECT_ID).update();
                return ResponseEntity.noContent().build();
            }
        }

        if ("EP002-SHOT11-CANDIDATE".equals(work.get("compositionId"))) {
            Object rawProps=work.get("inputProps");
            Map<?,?> props=rawProps instanceof Map<?,?> map ? map : Map.of();
            Object revision=props.get("scriptRevision");
            int frames=(int)work.get("durationInFrames");
            boolean current=revision instanceof Number number && ep002Cues!=null
                    &&ep002Cues.matchesCurrentShot11Render(
                        String.valueOf(props.get("inputFingerprint")),
                        String.valueOf(props.get("voiceTakeId")),
                        number.intValue(),frames);
            if(!current){
                jdbc.sql("""
                    update remotion_render
                    set status='FAILED',progress=0,
                        error='SHOT11_SOURCE_VOICE_OR_CUES_STALE_BEFORE_CPU_CLAIM',
                        finished_at=now(),updated_at=now()
                    where id=:id and project_id=:project and status='QUEUED'
                    """)
                    .param("id",work.get("renderId")).param("project",PROJECT_ID).update();
                return ResponseEntity.noContent().build();
            }
        }

        UUID renderId = (UUID) work.get("renderId");
        jdbc.sql("""
                update remotion_render
                set status='RUNNING', progress=5, worker_id=:workerId,
                    claimed_at=now(), started_at=now(), error=null, updated_at=now()
                where id=:id and project_id=:projectId and status='QUEUED'
                """)
                .param("workerId", workerId.trim())
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .update();

        return ResponseEntity.ok(work);
    }

    public ResponseEntity<Map<String, Object>> claim(String key,String workerId,String sourceSha) {
        return claim(key,workerId,sourceSha,null);
    }

    @GetMapping("/{renderId}/ep002-selected-voice")
    public ResponseEntity<byte[]> selectedVoice(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-Worker-Key",required = false) String key,
            @RequestHeader(value = "X-Media-OS-Worker",required = false) String workerId,
            @RequestHeader(value = "X-Media-OS-Worker-Source-Sha",required = false) String sourceSha
    ) {
        requireWorker(key,workerId);
        jdbc.sql("""
                select r.status, r.composition_id, r.duration_in_frames as duration_frames,
                       r.worker_id=:worker as worker_owned,
                       r.input_props->>'inputFingerprint' as fingerprint,
                       r.input_props->>'voiceTakeId' as take_id,
                       r.input_props->>'scriptRevision' as script_rev,
                       r.input_props->>'expectedSourceCommit'=:sourceSha as worker_source_matches,
                       r.input_props->>'shotKey'='EP002_SHOT08' as shot_key_matches,
                       exists(select 1 from ep002_creative_voice_take t
                         where t.id::text=r.input_props->>'voiceTakeId'
                           and t.shot_key='SHOT08'
                           and t.revision::text=r.input_props->>'scriptRevision') as take_revision_matches,
                       exists(select 1 from ep002_creative_voice_take t
                         where t.id::text=r.input_props->>'voiceTakeId'
                           and t.revision=(select max(s.revision)
                             from ep002_creative_script_revision s
                             where s.shot_key='SHOT08')) as latest_script_revision,
                       exists(select 1 from ep002_creative_voice_take t
                         where t.id::text=r.input_props->>'voiceTakeId'
                           and exists(select 1 from ep002_creative_voice_choice choice
                             where choice.shot_key=t.shot_key and choice.revision=t.revision
                               and choice.take_id=t.id
                               and choice.id=(select newest.id
                                 from ep002_creative_voice_choice newest
                                 where newest.shot_key=t.shot_key and newest.revision=t.revision
                                 order by newest.selected_at desc,newest.id desc limit 1))) as newest_chosen_take
                from remotion_render r
                where r.id=:render and r.project_id=:project
                  and r.composition_id='EP002-SHOT08-CANDIDATE'
                """)
                .param("render",renderId).param("project",PROJECT_ID)
                .param("worker",workerId.trim())
                .param("sourceSha",sourceSha==null?"":sourceSha.trim())
                .query((rs,n)->{
                    boolean current=false;
                    try {
                        current=ep002Cues!=null&&ep002Cues.matchesCurrentShot08Render(
                            rs.getString("fingerprint"),rs.getString("take_id"),
                            Integer.parseInt(rs.getString("script_rev")),rs.getInt("duration_frames"));
                    } catch(RuntimeException ignored) {current=false;}
                    org.slf4j.LoggerFactory.getLogger(RemotionCpuWorkerController.class)
                        .warn("SHOT08_AUDIO_GATE_TRACE renderId={} status={} workerOwned={} workerSourceMatched={} shotKeyMatched={} takeRevisionMatched={} latestRevision={} currentChosenTake={} currentSourceMatches={}",
                            renderId,rs.getString("status"),rs.getBoolean("worker_owned"),
                            rs.getBoolean("worker_source_matches"),rs.getBoolean("shot_key_matches"),
                            rs.getBoolean("take_revision_matches"),rs.getBoolean("latest_script_revision"),
                            rs.getBoolean("newest_chosen_take"),current);
                    return true;
                }).optional();
        return jdbc.sql("""
                select t.audio,t.content_type,r.composition_id,
                       r.input_props->>'inputFingerprint' as fingerprint,
                       r.input_props->>'voiceTakeId' as take_id,
                       r.input_props->>'scriptRevision' as script_revision,
                       r.duration_in_frames as duration_frames,
                       r.input_props::text as input_props_json
                from remotion_render r
                join ep002_creative_voice_take t
                  on t.id::text=r.input_props->>'voiceTakeId'
                  and t.shot_key=case when r.composition_id='EP002-SHOT02-CANDIDATE'
                        then 'SHOT02' when r.composition_id='EP002-SHOT03-CANDIDATE'
                        then 'SHOT03' when r.composition_id='EP002-SHOT04-CANDIDATE'
                        then 'SHOT04' when r.composition_id='EP002-SHOT05-CANDIDATE'
                         then 'SHOT05' when r.composition_id='EP002-SHOT06-CANDIDATE'
                          then 'SHOT06' when r.composition_id='EP002-SHOT07-CANDIDATE'
                          then 'SHOT07' when r.composition_id='EP002-SHOT08-CANDIDATE'
                          then 'SHOT08' when r.composition_id='EP002-SHOT09-CANDIDATE'
                          then 'SHOT09' when r.composition_id='EP002-SHOT10-CANDIDATE'
                          then 'SHOT10' when r.composition_id='EP002-SHOT11-CANDIDATE'
                          then 'SHOT11' else 'SHOT01' end
                  and t.revision::text=r.input_props->>'scriptRevision'
                where r.id=:render and r.project_id=:project
                  and r.composition_id in ('EP002-SHOT01-DRAFT','EP002-SHOT02-CANDIDATE',
                                          'EP002-SHOT03-CANDIDATE','EP002-SHOT04-CANDIDATE','EP002-SHOT05-CANDIDATE','EP002-SHOT06-CANDIDATE','EP002-SHOT07-CANDIDATE','EP002-SHOT08-CANDIDATE','EP002-SHOT09-CANDIDATE','EP002-SHOT10-CANDIDATE','EP002-SHOT11-CANDIDATE')
                  and r.status='RUNNING' and r.worker_id=:worker
                  and t.revision=(
                    select max(s.revision) from ep002_creative_script_revision s
                    where s.shot_key=t.shot_key
                  )
                  and exists(
                    select 1 from ep002_creative_voice_choice choice
                    where choice.shot_key=t.shot_key and choice.revision=t.revision
                      and choice.take_id=t.id
                      and choice.id=(
                        select newest.id from ep002_creative_voice_choice newest
                        where newest.shot_key=t.shot_key and newest.revision=t.revision
                        order by newest.selected_at desc,newest.id desc limit 1
                      )
                  )
                  and ((r.composition_id='EP002-SHOT01-DRAFT'
                      and r.input_props->>'visualStylePass'='SHOT01_SHOT02_UNIFIED_V2'
                      and r.input_props->>'expectedSourceCommit'=:sourceSha
                      and length(:sourceSha)=40
                      and :sourceSha !~ '[^a-f0-9]'
                      and r.width=1920 and r.height=1080
                      and r.profile='REVIEW'
                      and r.input_props->>'timingMode'='ELEVENLABS_CHARACTER_TIMESTAMPS')
                    or (r.input_props->>'expectedSourceCommit'=:sourceSha
                      and length(:sourceSha)=40
                      and :sourceSha !~ '[^a-f0-9]'
                      and r.input_props->>'shotKey'=case
                          when r.composition_id='EP002-SHOT03-CANDIDATE'
                          then 'EP002_SHOT03'
                          when r.composition_id='EP002-SHOT04-CANDIDATE'
                          then 'EP002_SHOT04' when r.composition_id='EP002-SHOT05-CANDIDATE'
                           then 'EP002_SHOT05' when r.composition_id='EP002-SHOT06-CANDIDATE'
                            then 'EP002_SHOT06' when r.composition_id='EP002-SHOT07-CANDIDATE'
                            then 'EP002_SHOT07' when r.composition_id='EP002-SHOT08-CANDIDATE'
                            then 'EP002_SHOT08' when r.composition_id='EP002-SHOT09-CANDIDATE'
                            then 'EP002_SHOT09' when r.composition_id='EP002-SHOT10-CANDIDATE'
                            then 'EP002_SHOT10' when r.composition_id='EP002-SHOT11-CANDIDATE'
                            then 'EP002_SHOT11' else 'EP002_SHOT02' end
                      and (r.composition_id in ('EP002-SHOT08-CANDIDATE',
                                             'EP002-SHOT09-CANDIDATE','EP002-SHOT10-CANDIDATE','EP002-SHOT11-CANDIDATE')
                        or exists(
                        select 1 from ep002_director_voice_cue_review review
                        where review.shot_key=case
                            when r.composition_id='EP002-SHOT03-CANDIDATE'
                            then 'SHOT03'
                            when r.composition_id='EP002-SHOT04-CANDIDATE'
                            then 'SHOT04' when r.composition_id='EP002-SHOT05-CANDIDATE'
                             then 'SHOT05' when r.composition_id='EP002-SHOT06-CANDIDATE'
                              then 'SHOT06' when r.composition_id='EP002-SHOT07-CANDIDATE'
                              then 'SHOT07' when r.composition_id='EP002-SHOT08-CANDIDATE'
                              then 'SHOT08' else 'SHOT02' end
                          and review.selected_take_id=t.id
                          and review.script_revision=t.revision
                          and review.narration_sha256=t.narration_sha256
                          and review.episode_fingerprint=r.input_props->>'inputFingerprint'
                      ))))
                """)
                .param("render",renderId).param("project",PROJECT_ID)
                .param("worker",workerId.trim())
                .param("sourceSha",sourceSha==null?"":sourceSha.trim())
                .query((rs,n)->{
                    if ("EP002-SHOT03-CANDIDATE".equals(rs.getString("composition_id"))) {
                        boolean current=ep002Cues!=null
                                &&ep002Cues.matchesCurrentShot03Render(
                                    rs.getString("fingerprint"),rs.getString("take_id"),
                                    Integer.parseInt(rs.getString("script_revision")),
                                    rs.getInt("duration_frames"));
                        if(!current)throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "SHOT03 selected Take or Director voice cues changed during render.");
                    }
                    if ("EP002-SHOT04-CANDIDATE".equals(rs.getString("composition_id"))) {
                        boolean current=ep002Cues!=null
                                &&ep002Cues.matchesCurrentShot04Render(
                                    rs.getString("fingerprint"),rs.getString("take_id"),
                                    Integer.parseInt(rs.getString("script_revision")),
                                    rs.getInt("duration_frames"));
                        if(!current)throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "SHOT04 selected Take or Director voice cues changed during render.");
                    }
                    if ("EP002-SHOT05-CANDIDATE".equals(rs.getString("composition_id"))) {
                        boolean current=ep002Cues!=null
                                &&ep002Cues.matchesCurrentShot05Render(
                                    rs.getString("fingerprint"),rs.getString("take_id"),
                                    Integer.parseInt(rs.getString("script_revision")),
                                    rs.getInt("duration_frames"));
                        if(!current)throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "SHOT05 selected Take or Director voice cues changed during render.");
                    }
                    if ("EP002-SHOT06-CANDIDATE".equals(rs.getString("composition_id"))) {
                        boolean current=ep002Cues!=null
                                &&ep002Cues.matchesCurrentShot06Render(
                                    rs.getString("fingerprint"),rs.getString("take_id"),
                                    Integer.parseInt(rs.getString("script_revision")),
                                    rs.getInt("duration_frames"));
                        if(!current)throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "SHOT06 selected Take or Director voice cues changed during render.");
                    }
                    if ("EP002-SHOT07-CANDIDATE".equals(rs.getString("composition_id"))) {
                        boolean current=ep002Cues!=null
                                &&ep002Cues.matchesCurrentShot07Render(
                                    rs.getString("fingerprint"),rs.getString("take_id"),
                                    Integer.parseInt(rs.getString("script_revision")),
                                    rs.getInt("duration_frames"));
                        if(!current)throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "SHOT07 selected Take or Director voice cues changed during render.");
                    }
                    if ("EP002-SHOT08-CANDIDATE".equals(rs.getString("composition_id"))) {
                        boolean current=ep002Cues!=null
                                &&ep002Cues.matchesCurrentShot08Render(
                                    rs.getString("fingerprint"),rs.getString("take_id"),
                                    Integer.parseInt(rs.getString("script_revision")),
                                    rs.getInt("duration_frames"));
                        if(!current)throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "SHOT08 selected Take or Director voice cues changed during render.");
                    }
                    if ("EP002-SHOT09-CANDIDATE".equals(rs.getString("composition_id"))) {
                        boolean current=ep002Cues!=null
                                &&ep002Cues.matchesCurrentShot09Render(
                                    rs.getString("fingerprint"),rs.getString("take_id"),
                                    Integer.parseInt(rs.getString("script_revision")),
                                    rs.getInt("duration_frames"));
                        if(!current)throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "SHOT09 selected Take or Director voice cues changed during render.");
                    }
                    if ("EP002-SHOT10-CANDIDATE".equals(rs.getString("composition_id"))) {
                        boolean current=ep002Cues!=null
                                &&ep002Cues.matchesCurrentShot10Render(
                                    rs.getString("fingerprint"),rs.getString("take_id"),
                                    Integer.parseInt(rs.getString("script_revision")),
                                    rs.getInt("duration_frames"));
                        if(!current)throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "SHOT10 selected Take or Director voice cues changed during render.");
                    }
                    if ("EP002-SHOT11-CANDIDATE".equals(rs.getString("composition_id"))) {
                        boolean current=ep002Cues!=null
                                &&ep002Cues.matchesCurrentShot11Render(
                                    rs.getString("fingerprint"),rs.getString("take_id"),
                                    Integer.parseInt(rs.getString("script_revision")),
                                    rs.getInt("duration_frames"));
                        if(!current)throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "SHOT11 selected Take or Director voice cues changed during render.");
                    }
                    if ("EP002-SHOT02-CANDIDATE".equals(rs.getString("composition_id"))) {
                        Map<String,Object> input=readMap(rs.getString("input_props_json"));
                        int sourceFrames=Ep002Shot02EditorialPausePlan.sourceFramesForRender(
                                input,rs.getInt("duration_frames"));
                        boolean current=sourceFrames>0 && ep002Cues!=null
                                && ep002Cues.matchesCurrentShot02Render(
                                    rs.getString("fingerprint"),rs.getString("take_id"),
                                    Integer.parseInt(rs.getString("script_revision")),
                                    sourceFrames);
                        if (!current) throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "SHOT02 selected Take or source fingerprint changed during render.");
                    }
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(rs.getString("content_type")))
                            .cacheControl(CacheControl.noStore())
                            .body(rs.getBytes("audio"));
                })
                .optional().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.CONFLICT,"No valid selected voice for this worker-owned EP002 render."));
    }

    @PostMapping("/{renderId}/progress")
    public Map<String, Object> progress(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-Worker-Key", required = false) String key,
            @RequestHeader(value = "X-Media-OS-Worker", required = false) String workerId,
            @RequestBody ProgressRequest request
    ) {
        requireWorker(key, workerId);
        int progress = Math.max(5, Math.min(99, request.progress()));
        int updated = jdbc.sql("""
                update remotion_render
                set progress=:progress, updated_at=now()
                where id=:id and project_id=:projectId and status='RUNNING' and worker_id=:workerId
                """)
                .param("progress", progress)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .param("workerId", workerId.trim())
                .update();
        if (updated == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Render is not owned by this CPU worker.");
        return Map.of("renderId", renderId, "status", "RUNNING", "progress", progress);
    }

    @PutMapping(value = "/{renderId}/complete", consumes = "video/mp4")
    @Transactional
    public Map<String, Object> complete(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-Worker-Key", required = false) String key,
            @RequestHeader(value = "X-Media-OS-Worker", required = false) String workerId,
            @RequestBody byte[] video
    ) {
        requireWorker(key, workerId);
        if (video.length == 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rendered Remotion video is empty.");
        if (video.length > MAX_VIDEO_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Rendered Remotion video is larger than 256 MB.");
        }

        storage.requireUploadHeadroom(video.length);
        int updated = jdbc.sql("""
                update remotion_render
                set status='SUCCEEDED', progress=100, media_type='video/mp4', video_data=:video,
                    size_bytes=:sizeBytes, error=null, finished_at=now(), updated_at=now()
                where id=:id and project_id=:projectId and status='RUNNING' and worker_id=:workerId
                """)
                .param("video", video)
                .param("sizeBytes", video.length)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .param("workerId", workerId.trim())
                .update();
        if (updated == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Render is not owned by this CPU worker.");

        recordFactoryRenderOutput(renderId);
        linkVoiceWorkflowRender(renderId);
        return Map.of("renderId", renderId, "status", "READY", "sizeBytes", video.length);
    }

    @PostMapping("/{renderId}/fail")
    public Map<String, Object> fail(
            @PathVariable UUID renderId,
            @RequestHeader(value = "X-Media-OS-Worker-Key", required = false) String key,
            @RequestHeader(value = "X-Media-OS-Worker", required = false) String workerId,
            @RequestBody FailureRequest failure
    ) {
        requireWorker(key, workerId);
        String error = failure.error() == null || failure.error().isBlank() ? "Remotion CPU render failed." : failure.error().trim();
        if (error.length() > 1800) error = error.substring(0, 1800);

        int updated = jdbc.sql("""
                update remotion_render
                set status='FAILED', progress=0, error=:error, finished_at=now(), updated_at=now()
                where id=:id and project_id=:projectId and status='RUNNING' and worker_id=:workerId
                """)
                .param("error", error)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .param("workerId", workerId.trim())
                .update();
        if (updated != 1) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Failed render callback requires a RUNNING job owned by this worker.");
        return Map.of("renderId", renderId, "status", "FAILED", "error", error);
    }

    private void recordFactoryRenderOutput(UUID renderId) {
        String kind=jdbc.sql("""
                select composition_id from remotion_render
                 where id=:render and status='SUCCEEDED' and project_id=:project
                """).param("render",renderId).param("project",PROJECT_ID)
                .query(String.class).single();
        if("AT-FACTORY-SHOT".equals(kind)){
            int linked=jdbc.sql("""
                    update episode_factory_shot fs
                       set last_successful_render=:render,
                           last_render_input_sha256=fs.source_code_dependency_sha256,
                           director_approved=false
                      from episode_factory_production_run run,remotion_render video
                     where fs.run_id=run.id and fs.last_requested_render=:render
                       and video.id=:render and video.status='SUCCEEDED'
                       and video.input_props->>'expectedSourceCommit'=run.verified_pr_commit
                       and video.input_props->>'sourceDigest'=run.verified_source_digest
                       and video.input_props->>'shotInputSha'=fs.source_code_dependency_sha256
                       and not exists(select 1 from episode_factory_director_feedback f
                                       where f.run_id=run.id and f.state='OPEN_FOR_CODEX')
                       and exists(
                         select 1 from episode_package_shot shot
                          where shot.package_id=run.package_id
                            and shot.shot_key=fs.shot_key
                            and fs.narration_revision=(
                              select max(revision) from episode_package_shot_revision revision
                               where revision.shot_id=shot.id)
                            and fs.selected_take_id=(
                              select c.take_id from episode_package_voice_choice c
                               where c.shot_id=shot.id and c.revision=fs.narration_revision
                               order by c.selected_at desc,c.id desc limit 1))
                    """).param("render",renderId).update();
            if(linked!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Factory MP4 source/voice no longer matches the Director-approved production revision.");
        }
        if("AT-FACTORY-MASTER".equals(kind)||"AT-FACTORY-SHORT".equals(kind)){
            int linked=jdbc.sql("""
                    update episode_factory_output_plan plan
                       set review_state='RENDERED_PENDING_DIRECTOR'
                      from episode_factory_production_run run,remotion_render video
                     where plan.run_id=run.id and plan.render_id=:render
                       and video.id=:render and video.status='SUCCEEDED'
                       and video.input_props->>'expectedSourceCommit'=run.verified_pr_commit
                       and video.input_props->>'sourceDigest'=run.verified_source_digest
                       and not exists(select 1 from episode_factory_director_feedback f
                                       where f.run_id=run.id and f.state='OPEN_FOR_CODEX')
                       and not exists(select 1 from episode_factory_shot s
                                       where s.run_id=run.id and s.director_approved=false)
                    """).param("render",renderId).update();
            if(linked!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Factory master/Short has stale or incomplete Director-reviewed source renders.");
        }
    }

    private void requireWorker(String key, String workerId) {
        if (workerKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "MEDIA_OS_RENDER_WORKER_KEY is not configured.");
        }
        if (key == null || key.isBlank() || !constantTimeEquals(workerKey, key.trim())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Remotion CPU worker key.");
        }
        if (workerId == null || workerId.isBlank() || workerId.length() > 160) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing or invalid Remotion CPU worker id.");
        }
    }

    void linkVoiceWorkflowRender(UUID renderId) {
        jdbc.sql("""
                select episode_id, input_props::text as input_props
                from remotion_render
                where id=:id and project_id=:projectId and status='SUCCEEDED'
                """)
                .param("id", renderId)
                .param("projectId", PROJECT_ID)
                .query((rs, row) -> new RenderLinkSource(
                        rs.getObject("episode_id", UUID.class),
                        rs.getString("input_props")))
                .optional()
                .ifPresent(source -> {
                    if (source.episodeId() == null) return;
                    Map<String, Object> props = readMap(source.inputProps());
                    String shotKey = String.valueOf(props.getOrDefault("shotKey", "")).trim();
                    int scriptRevision = intValue(props.get("scriptRevision"), 0);
                    int generationRevision = intValue(props.get("generationRevision"), 0);
                    if (shotKey.isBlank() || scriptRevision <= 0) return;
                    if (Boolean.TRUE.equals(props.get("technicalRerender"))) return;

                    jdbc.sql("""
                            update voice_shot_workflow
                            set remotion_render_id=:renderId,
                                rendered_generation_revision=:generationRevision,
                                rendered_at=now(),
                                remotion_synced_at=coalesce(remotion_synced_at, now()),
                                updated_at=now()
                            where episode_id=:episodeId
                              and script_revision=:scriptRevision
                              and shot_key=:shotKey
                              and exists (
                                  select 1 from remotion_render r
                                  where r.id=:renderId
                                    and r.project_id=:projectId
                                    and r.episode_id=voice_shot_workflow.episode_id
                                    and r.status='SUCCEEDED'
                              )
                            """)
                            .param("renderId", renderId)
                            .param("projectId", PROJECT_ID)
                            .param("generationRevision", generationRevision)
                            .param("episodeId", source.episodeId())
                            .param("scriptRevision", scriptRevision)
                            .param("shotKey", shotKey)
                            .update();
                });
    }

    private record RenderLinkSource(UUID episodeId, String inputProps) {}

    private int intValue(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private Map<String, Object> readMap(String json) {
        try {
            if (json == null || json.isBlank()) return Map.of();
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Could not parse Remotion render input props.", ex);
        }
    }

    private boolean constantTimeEquals(String left, String right) {
        byte[] a = left.getBytes(StandardCharsets.UTF_8);
        byte[] b = right.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(a, b);
    }
}
