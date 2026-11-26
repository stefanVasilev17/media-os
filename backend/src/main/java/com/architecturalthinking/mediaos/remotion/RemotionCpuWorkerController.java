package com.architecturalthinking.mediaos.remotion;

import com.architecturalthinking.mediaos.workflow.MediaObjectStore;
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
    private final MediaObjectStore mediaObjects;

    @Autowired
    public RemotionCpuWorkerController(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            StorageHealthService storage,
            @Value("${MEDIA_OS_RENDER_WORKER_KEY:}") String workerKey,
            Ep002DirectorVoiceCueService ep002Cues,
            MediaObjectStore mediaObjects
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.storage = storage;
        this.workerKey = workerKey == null ? "" : workerKey.trim();
        this.ep002Cues = ep002Cues;
        this.mediaObjects = mediaObjects;
    }

    public RemotionCpuWorkerController(JdbcClient jdbc, ObjectMapper mapper,
            StorageHealthService storage, String workerKey,
            Ep002DirectorVoiceCueService ep002Cues) {
        this(jdbc, mapper, storage, workerKey, ep002Cues, null);
    }

    public RemotionCpuWorkerController(JdbcClient jdbc, ObjectMapper mapper,
                                       StorageHealthService storage, String workerKey) {
        this(jdbc, mapper, storage, workerKey, null, null);
    }

    static boolean isEp004Shot03Target(String scope) {
        return "EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL".equals(scope);
    }
    static boolean isEp004Shot04Target(String scope) {
        return "EP004-SHOT04-CONTINUOUS-GATEWAYS-V1-VISUAL".equals(scope);
    }
    static boolean isEp004Shot05Target(String scope) {
        return "EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL".equals(scope);
    }

    static boolean isEp004Shot06Target(String scope) {
        return "EP004-SHOT06-SERVER-FLEET-V1-VISUAL".equals(scope);
    }
    static boolean isEp004Shot07Target(String scope) {
        return "EP004-SHOT07-CASCADING-FAILURE-V1-VISUAL".equals(scope);
    }

    static boolean isEp004Shot08Target(String scope) {
        return "EP004-SHOT08-REGIONAL-CONTAINMENT-V1-VISUAL".equals(scope);
    }
    static boolean isEp004Shot09Target(String scope) {
        return "EP004-SHOT09-HEALTH-VS-READINESS-V1-VISUAL".equals(scope);
    }
    static boolean isEp004Shot10Target(String scope) {
        return "EP004-SHOT10-CONTROLLED-RECOVERY-V1-VISUAL".equals(scope);
    }
    static boolean isEp004Shot11Target(String scope) {
        return "EP004-SHOT11-INCIDENT-CLOCK-V1-VISUAL".equals(scope);
    }
    static boolean isEp004Shot12Target(String scope) {
        return "EP004-SHOT12-CONTROLLED-RESTORATION-V1-VISUAL".equals(scope);
    }
    static boolean isEp004Shot13Target(String scope) {
        return "EP004-SHOT13-RESILIENT-DESIGN-V1-VISUAL".equals(scope);
    }
    static boolean isEp004Shot14Target(String scope) {
        return "EP004-SHOT14-ARCHITECTURE-PARADOX-V1-VISUAL".equals(scope);
    }
    static boolean isEp004Shot15Target(String scope) {
        return "EP004-SHOT15-HUMAN-CONSEQUENCE-V1-VISUAL".equals(scope);
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
        if(mediaObjects!=null)mediaObjects.requireWritable();
        String scope=targetComposition==null?"":targetComposition.trim();
        if (!scope.isEmpty() && !"EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL".equals(scope)
                && !"EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL".equals(scope)
                && !isEp004Shot03Target(scope)
                && !isEp004Shot04Target(scope)
                && !isEp004Shot05Target(scope)
                && !isEp004Shot06Target(scope)
                && !isEp004Shot07Target(scope)
                 && !isEp004Shot08Target(scope)
                 && !isEp004Shot09Target(scope)
                 && !isEp004Shot10Target(scope)
                 && !isEp004Shot11Target(scope)
                 && !isEp004Shot12Target(scope)
                 && !isEp004Shot13Target(scope)
                 && !isEp004Shot14Target(scope)
                 && !isEp004Shot15Target(scope)
                && !"EP002-DIRECTOR-V2-PIPELINE".equals(scope)
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
                                   'DIRECTOR_V2_60_FRAME_BREATHS','DIRECTOR_V3_EXACT_FRAME_MATCHED_SEAMS',
                                   'DIRECTOR_V4_CLEAN_CUT_NO_BRIDGE')))
                  and (composition_id<>'EP004-SHOT01-ORDINARY-WORKDAY-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'sourceSha256'=
                          'a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT01%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT02-TWO-GATEWAYS-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'shotKey'='SHOT02'
                      and input_props->>'sourceSha256'=
                          'a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues') between 2 and 40
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT02%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT03-LIVING-GATEWAYS-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'episodeKey'='EP004'
                      and input_props->>'shotKey'='SHOT03'
                      and input_props->>'previousRenderId'='20758da0-46f9-4973-9ef8-ec93eb437a5a'
                      and input_props->>'previousSourceCommit'='714d7c31affb84793780eee42bc5062387b069a7'
                      and input_props->>'previousFrameCount'='2124'
                      and input_props->>'previousLastEncodedFrame'='2123'
                      and input_props->>'worldStartFrame'='4123'
                      and input_props->>'sourceSha256'
                          ='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and length(input_props->>'previousVideoSha256')=64
                      and jsonb_typeof(input_props->'previousShot02Props')='object'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues') between 2 and 40
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT03%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and :targetComposition='EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL'
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'episodeKey'='EP004'
                      and input_props->>'shotKey'='SHOT05'
                      and input_props->>'breathFrames'='72'
                      and input_props->>'sourceSha256'
                          ='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and length(input_props->>'previousVideoSha256')=64
                      and jsonb_typeof(input_props->'previousShot04Props')='object'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues') between 2 and 40
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT05%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT06-SERVER-FLEET-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and :targetComposition='EP004-SHOT06-SERVER-FLEET-V1-VISUAL'
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'episodeKey'='EP004'
                      and input_props->>'shotKey'='SHOT06'
                      and input_props->>'breathFrames'='72'
                      and input_props->>'sourceSha256'
                          ='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and input_props->>'previousRenderId'='38162e2a-3bc2-4c07-80d8-fa445cdc5e8d'
                      and input_props->>'previousSourceCommit'='1766ff8391b81c928acae0578cfebcae73d7a1b1'
                      and input_props->>'previousFrameCount'='2573'
                      and input_props->>'previousLastEncodedFrame'='2572'
                      and length(input_props->>'voiceAudioSha256')=64
                      and length(input_props->>'previousVideoSha256')=64
                      and exists(select 1 from episode_director_shot_lock l join remotion_render prev on prev.id=l.render_id
                        where l.package_id=(remotion_render.input_props->>'packageId')::uuid and l.shot_key='SHOT05'
                          and prev.id::text=remotion_render.input_props->>'previousRenderId' and prev.video_sha256=remotion_render.input_props->>'previousVideoSha256'
                          and prev.status='SUCCEEDED' and prev.composition_id='EP004-SHOT05-LIVING-ROUTE-CAUSALITY-V1-VISUAL')
                      and jsonb_typeof(input_props->'previousShot05Props')='object'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues')=10
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT06%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT07-CASCADING-FAILURE-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and :targetComposition='EP004-SHOT07-CASCADING-FAILURE-V1-VISUAL'
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'episodeKey'='EP004'
                      and input_props->>'shotKey'='SHOT07'
                      and input_props->>'breathFrames'='72'
                      and input_props->>'sourceSha256'
                          ='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and input_props->>'previousRenderId'='2b68bda7-8f0d-471f-a2d5-78e5765ac63e'
                      and input_props->>'previousSourceCommit'='cf0945e58f4e420c744d0006b665d9bc7edff97d'
                      and input_props->>'previousFrameCount'='2373'
                      and input_props->>'previousLastEncodedFrame'='2372'
                      and length(input_props->>'voiceAudioSha256')=64
                      and length(input_props->>'previousVideoSha256')=64
                      and exists(select 1 from episode_director_shot_lock l join remotion_render prev on prev.id=l.render_id
                        where l.package_id=(remotion_render.input_props->>'packageId')::uuid and l.shot_key='SHOT06'
                          and prev.id::text=remotion_render.input_props->>'previousRenderId' and prev.video_sha256=remotion_render.input_props->>'previousVideoSha256'
                          and prev.status='SUCCEEDED' and prev.composition_id='EP004-SHOT06-SERVER-FLEET-V1-VISUAL')
                      and jsonb_typeof(input_props->'previousShot06Props')='object'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues')=8
                      and jsonb_typeof(input_props->'eventFrames')='object'
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT07%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT08-REGIONAL-CONTAINMENT-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and :targetComposition='EP004-SHOT08-REGIONAL-CONTAINMENT-V1-VISUAL'
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'episodeKey'='EP004'
                      and input_props->>'shotKey'='SHOT08'
                      and input_props->>'breathFrames'='72'
                      and input_props->>'sourceSha256'
                          ='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and input_props->>'previousRenderId'='c51cbbda-f832-4c46-8a37-cc3116f50e1f'
                      and input_props->>'previousSourceCommit'='232fb7ef9dbcfa2e2d8c3d9e326660ea2a17be56'
                      and input_props->>'previousFrameCount'='2606'
                      and input_props->>'previousLastEncodedFrame'='2605'
                      and length(input_props->>'voiceAudioSha256')=64
                      and length(input_props->>'previousVideoSha256')=64
                      and exists(select 1 from episode_director_shot_lock l join remotion_render prev on prev.id=l.render_id
                        where l.package_id=(remotion_render.input_props->>'packageId')::uuid and l.shot_key='SHOT07'
                          and prev.id::text=remotion_render.input_props->>'previousRenderId' and prev.video_sha256=remotion_render.input_props->>'previousVideoSha256'
                          and prev.status='SUCCEEDED' and prev.composition_id='EP004-SHOT07-CASCADING-FAILURE-V1-VISUAL')
                      and jsonb_typeof(input_props->'previousShot07Props')='object'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues')=10
                      and jsonb_typeof(input_props->'eventFrames')='object'
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT08%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT09-HEALTH-VS-READINESS-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and :targetComposition='EP004-SHOT09-HEALTH-VS-READINESS-V1-VISUAL'
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'episodeKey'='EP004'
                      and input_props->>'shotKey'='SHOT09'
                      and input_props->>'breathFrames'='72'
                      and input_props->>'sourceSha256'
                          ='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and input_props->>'previousRenderId'='a6625262-8567-4d14-993e-6d83816b2272'
                      and input_props->>'previousSourceCommit'='702da20aeaac0b60b12048395d61287d57796bda'
                      and input_props->>'previousFrameCount'='2719'
                      and input_props->>'previousLastEncodedFrame'='2718'
                      and length(input_props->>'voiceAudioSha256')=64
                      and length(input_props->>'previousVideoSha256')=64
                      and exists(select 1 from episode_director_shot_lock l join remotion_render prev on prev.id=l.render_id
                        where l.package_id=(remotion_render.input_props->>'packageId')::uuid and l.shot_key='SHOT08'
                          and prev.id::text=remotion_render.input_props->>'previousRenderId' and prev.video_sha256=remotion_render.input_props->>'previousVideoSha256'
                          and prev.status='SUCCEEDED' and prev.composition_id='EP004-SHOT08-REGIONAL-CONTAINMENT-V1-VISUAL')
                      and jsonb_typeof(input_props->'previousShot08Props')='object'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues')=11
                      and jsonb_typeof(input_props->'eventFrames')='object'
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT09%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT10-CONTROLLED-RECOVERY-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and :targetComposition='EP004-SHOT10-CONTROLLED-RECOVERY-V1-VISUAL'
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'episodeKey'='EP004'
                      and input_props->>'shotKey'='SHOT10'
                      and input_props->>'breathFrames'='72'
                      and input_props->>'sourceSha256'
                          ='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and input_props->>'previousRenderId'='e9a8aa58-61e3-4739-a4c1-32efd13d5426'
                      and input_props->>'previousSourceCommit'='85efc3127dc9e40accbee0bea44e9309395e64bb'
                      and input_props->>'previousFrameCount'='2457'
                      and input_props->>'previousLastEncodedFrame'='2456'
                      and length(input_props->>'voiceAudioSha256')=64
                      and length(input_props->>'previousVideoSha256')=64
                      and exists(select 1 from episode_director_shot_lock l join remotion_render prev on prev.id=l.render_id
                        where l.package_id=(remotion_render.input_props->>'packageId')::uuid and l.shot_key='SHOT09'
                          and prev.id::text=remotion_render.input_props->>'previousRenderId' and prev.video_sha256=remotion_render.input_props->>'previousVideoSha256'
                          and prev.status='SUCCEEDED' and prev.composition_id='EP004-SHOT09-HEALTH-VS-READINESS-V1-VISUAL')
                      and jsonb_typeof(input_props->'previousShot09Props')='object'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues')=6
                      and jsonb_typeof(input_props->'eventFrames')='object'
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT10%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT11-INCIDENT-CLOCK-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and :targetComposition='EP004-SHOT11-INCIDENT-CLOCK-V1-VISUAL'
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'episodeKey'='EP004'
                      and input_props->>'shotKey'='SHOT11'
                      and input_props->>'breathFrames'='72'
                      and input_props->>'sourceSha256'
                          ='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and input_props->>'previousRenderId'='bc8ff415-a943-447c-a883-25751462d8a9'
                      and input_props->>'previousSourceCommit'='636e13f05dd26184c88ad13e15e827aa3dc31aff'
                      and input_props->>'previousFrameCount'='2059'
                      and input_props->>'previousLastEncodedFrame'='2058'
                      and length(input_props->>'voiceAudioSha256')=64
                      and length(input_props->>'previousVideoSha256')=64
                      and exists(select 1 from episode_director_shot_lock l join remotion_render prev on prev.id=l.render_id
                        where l.package_id=(remotion_render.input_props->>'packageId')::uuid and l.shot_key='SHOT10'
                          and prev.id::text=remotion_render.input_props->>'previousRenderId' and prev.video_sha256=remotion_render.input_props->>'previousVideoSha256'
                          and prev.status='SUCCEEDED' and prev.composition_id='EP004-SHOT10-CONTROLLED-RECOVERY-V1-VISUAL')
                      and jsonb_typeof(input_props->'previousShot10Props')='object'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues')=8
                      and jsonb_typeof(input_props->'eventFrames')='object'
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT11%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT12-CONTROLLED-RESTORATION-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and :targetComposition='EP004-SHOT12-CONTROLLED-RESTORATION-V1-VISUAL'
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'episodeKey'='EP004'
                      and input_props->>'shotKey'='SHOT12'
                      and input_props->>'breathFrames'='72'
                      and input_props->>'sourceSha256'
                          ='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and input_props->>'previousRenderId'='a20700eb-ed28-4136-a26c-d25554e53cd5'
                      and input_props->>'previousSourceCommit'='61bc9e27b686201fdd8102b009d7cc33ed89ef16'
                      and input_props->>'previousFrameCount'='2637'
                      and input_props->>'previousLastEncodedFrame'='2636'
                      and length(input_props->>'voiceAudioSha256')=64
                      and length(input_props->>'previousVideoSha256')=64
                      and exists(select 1 from episode_director_shot_lock l join remotion_render prev on prev.id=l.render_id
                        where l.package_id=(remotion_render.input_props->>'packageId')::uuid and l.shot_key='SHOT11'
                          and prev.id::text=remotion_render.input_props->>'previousRenderId' and prev.video_sha256=remotion_render.input_props->>'previousVideoSha256'
                          and prev.status='SUCCEEDED' and prev.composition_id='EP004-SHOT11-INCIDENT-CLOCK-V1-VISUAL')
                      and jsonb_typeof(input_props->'previousShot11Props')='object'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues')=10
                      and jsonb_typeof(input_props->'eventFrames')='object'
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT12%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT13-RESILIENT-DESIGN-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and :targetComposition='EP004-SHOT13-RESILIENT-DESIGN-V1-VISUAL'
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'episodeKey'='EP004'
                      and input_props->>'shotKey'='SHOT13'
                      and input_props->>'breathFrames'='72'
                      and input_props->>'sourceSha256'
                          ='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and input_props->>'previousRenderId'='9728581f-632b-421f-b004-f96281b00569'
                      and input_props->>'previousSourceCommit'='00d06593da7c6d8893618f2d90daaba0a3de725f'
                      and input_props->>'previousFrameCount'='2613'
                      and input_props->>'previousLastEncodedFrame'='2612'
                      and length(input_props->>'voiceAudioSha256')=64
                      and length(input_props->>'previousVideoSha256')=64
                      and exists(select 1 from episode_director_shot_lock l join remotion_render prev on prev.id=l.render_id
                        where l.package_id=(remotion_render.input_props->>'packageId')::uuid and l.shot_key='SHOT12'
                          and prev.id::text=remotion_render.input_props->>'previousRenderId' and prev.video_sha256=remotion_render.input_props->>'previousVideoSha256'
                          and prev.status='SUCCEEDED' and prev.composition_id='EP004-SHOT12-CONTROLLED-RESTORATION-V1-VISUAL')
                      and jsonb_typeof(input_props->'previousShot12Props')='object'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues')=5
                      and jsonb_typeof(input_props->'eventFrames')='object'
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT13%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT14-ARCHITECTURE-PARADOX-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and :targetComposition='EP004-SHOT14-ARCHITECTURE-PARADOX-V1-VISUAL'
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'episodeKey'='EP004'
                      and input_props->>'shotKey'='SHOT14'
                      and input_props->>'breathFrames'='72'
                      and input_props->>'sourceSha256'
                          ='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and input_props->>'previousRenderId'='c9eb0abc-ef56-42c7-8733-b47be4122384'
                      and input_props->>'previousSourceCommit'='c97825b00ccdfec07a41737999def2e4c87feb24'
                      and input_props->>'previousFrameCount'='2078'
                      and input_props->>'previousLastEncodedFrame'='2077'
                      and length(input_props->>'voiceAudioSha256')=64
                      and length(input_props->>'previousVideoSha256')=64
                      and exists(select 1 from episode_director_shot_lock l join remotion_render prev on prev.id=l.render_id
                        where l.package_id=(remotion_render.input_props->>'packageId')::uuid and l.shot_key='SHOT13'
                          and prev.id::text=remotion_render.input_props->>'previousRenderId' and prev.video_sha256=remotion_render.input_props->>'previousVideoSha256'
                          and prev.status='SUCCEEDED' and prev.composition_id='EP004-SHOT13-RESILIENT-DESIGN-V1-VISUAL')
                      and jsonb_typeof(input_props->'previousShot13Props')='object'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues')=9
                      and jsonb_typeof(input_props->'eventFrames')='object'
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT14%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
                  and (composition_id<>'EP004-SHOT15-HUMAN-CONSEQUENCE-V1-VISUAL'
                    or (input_props->>'expectedSourceCommit'=:sourceSha
                      and :targetComposition='EP004-SHOT15-HUMAN-CONSEQUENCE-V1-VISUAL'
                      and input_props->>'directorCpuApproved'='true'
                      and input_props->>'previewOnly'='false'
                      and input_props->>'episodeKey'='EP004'
                      and input_props->>'shotKey'='SHOT15'
                      and input_props->>'breathFrames'='72'
                      and input_props->>'sourceSha256'
                          ='a47b5d2af200014828089bcfb0812017970a8ecfe623cefc67456359af4fe365'
                      and input_props->>'previousRenderId'='404832c1-0b7d-4de7-a95b-1971445d9a4d'
                      and input_props->>'previousSourceCommit'='e1158d874c63205bffb55e4ea6e0e011e667ea75'
                      and input_props->>'previousFrameCount'='2018'
                      and input_props->>'previousLastEncodedFrame'='2017'
                      and length(input_props->>'voiceAudioSha256')=64
                      and length(input_props->>'previousVideoSha256')=64
                      and exists(select 1 from episode_director_shot_lock l join remotion_render prev on prev.id=l.render_id
                        where l.package_id=(remotion_render.input_props->>'packageId')::uuid and l.shot_key='SHOT14'
                          and prev.id::text=remotion_render.input_props->>'previousRenderId' and prev.video_sha256=remotion_render.input_props->>'previousVideoSha256'
                          and prev.status='SUCCEEDED' and prev.composition_id='EP004-SHOT14-ARCHITECTURE-PARADOX-V1-VISUAL')
                      and jsonb_typeof(input_props->'previousShot14Props')='object'
                      and jsonb_typeof(input_props->'verifiedCues')='array'
                      and jsonb_array_length(input_props->'verifiedCues')=6
                      and jsonb_typeof(input_props->'eventFrames')='object'
                      and exists(select 1 from episode_factory_worker_capability cap
                        where cap.worker_id=:workerId and cap.source_commit=:sourceSha
                          and cap.build_checked=true
                          and cap.bundled_scenes::text like '%EP004-SHOT15%'
                          and cap.last_heartbeat_at>now()-interval '120 seconds')))
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

        if(mediaObjects==null)throw new ResponseStatusException(HttpStatus.CONFLICT,
                "P0_VIDEO_STORAGE_NOT_READY: no external MP4 storage adapter.");
        mediaObjects.requireWritable();
        storage.requireUploadHeadroom(video.length);
        UUID owned=jdbc.sql("""
                select id from remotion_render
                 where id=:id and project_id=:projectId
                   and status='RUNNING' and worker_id=:workerId
                 for update
                """).param("id",renderId).param("projectId",PROJECT_ID)
                .param("workerId",workerId.trim())
                .query(UUID.class).optional().orElseThrow(()->new ResponseStatusException(
                        HttpStatus.CONFLICT,"Render is no longer owned by the active CPU worker."));
        MediaObjectStore.Stored uploaded=null;
        try {
            uploaded=mediaObjects.uploadVideoVerified(owned,video);
            int updated=jdbc.sql("""
                    update remotion_render
                       set status='SUCCEEDED',progress=100,media_type='video/mp4',
                           video_data=null,video_object_key=:objectKey,
                           video_sha256=:sha256,video_object_bytes=:sizeBytes,
                           video_storage_verified_at=now(),
                           video_retention_class='DIRECTOR_REVIEW_PROTECTED',
                           video_expires_at=null,
                           size_bytes=:sizeBytes,error=null,
                           finished_at=now(),updated_at=now()
                     where id=:id and project_id=:projectId
                       and status='RUNNING' and worker_id=:workerId
                    """).param("objectKey",uploaded.key())
                    .param("sha256",uploaded.sha256()).param("sizeBytes",uploaded.byteCount())
                    .param("id",renderId).param("projectId",PROJECT_ID)
                    .param("workerId",workerId.trim()).update();
            if(updated!=1)throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "S3-verified MP4 could not be committed to render metadata.");
            recordFactoryRenderOutput(renderId);
            linkVoiceWorkflowRender(renderId);
            return Map.of("renderId",renderId,"status","READY","sizeBytes",uploaded.byteCount(),
                    "sha256",uploaded.sha256(),"storage","PRIVATE_OBJECT_VERIFIED");
        }catch(RuntimeException failure){
            if(uploaded!=null){
                try{mediaObjects.discardUncommittedVideo(uploaded.key(),
                        uploaded.sha256(),uploaded.byteCount());}
                catch(RuntimeException cleanup){
                    failure.addSuppressed(cleanup);
                    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "MP4 metadata transaction failed and S3 cleanup needs operator audit.",failure);
                }
            }
            throw failure;
        }
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
