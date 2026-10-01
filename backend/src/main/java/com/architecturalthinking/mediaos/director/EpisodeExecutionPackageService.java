package com.architecturalthinking.mediaos.director;

import com.architecturalthinking.mediaos.workflow.ProductionOverviewService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class EpisodeExecutionPackageService {

    public static final String SCHEMA_VERSION = "mediaos.episode-package.v1";
    private static final int MAX_CONTENT_CHARS = 2_000_000;
    private static final UUID EPISODE_ID = ProductionOverviewService.EPISODE_ID;
    private static final UUID PROJECT_ID = ProductionOverviewService.PROJECT_ID;
    private static final String SHOT_AGENT_KEY = "SPLINE_SHOT_AGENT";
    private static final String SHOT_TASK_TYPE = "CREATE_RUNTIME_SHOT_V1";

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    public EpisodeExecutionPackageService(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> preview(String filename, String content) {
        ParsedPackage parsed = parse(filename, content);
        List<String> blockers = validate(parsed.payload());
        Map<String, Object> result = previewResult(parsed, blockers);
        if (!blockers.isEmpty()) return result;

        UUID packageId = upsertPreview(parsed);
        boolean alreadyApplied = "APPLIED".equals(packageStatus(packageId));
        result.put("packageId", packageId);
        result.put("alreadyApplied", alreadyApplied);
        result.put("canApply", !alreadyApplied);
        result.put("previewExpiresInMinutes", alreadyApplied ? 0 : 30);
        return result;
    }

    @Transactional
    public Map<String, Object> apply(UUID packageId) {
        PackageRow row = loadPreview(packageId);
        Map<String, Object> payload = row.payload();
        List<String> blockers = validate(payload);
        if (!blockers.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Package is no longer valid: " + String.join(" ", blockers));
        }

        Map<String, Object> episode = asMap(payload.get("episode"));
        Map<String, Object> topic = asMap(payload.get("topicContract"));
        Map<String, Object> truth = asMap(payload.get("truthContract"));
        Map<String, Object> script = asMap(payload.get("scriptArtifact"));
        Map<String, Object> scene = asMap(payload.get("sceneArtifact"));
        Map<String, Object> execution = asMap(payload.get("executionPlan"));
        List<Object> lockedDecisions = asList(payload.get("lockedDecisions"));

        String sourceVersion = "pkg-" + row.contentHash().substring(0, 12);
        Map<String, Object> researchArtifact = new LinkedHashMap<>();
        researchArtifact.put("sourceVersion", sourceVersion);
        researchArtifact.put("truthLocked", true);
        researchArtifact.put("packageId", packageId);
        researchArtifact.put("contentHash", row.contentHash());
        researchArtifact.put("topicContract", topic);
        researchArtifact.put("truthContract", truth);
        researchArtifact.put("lockedDecisions", lockedDecisions);
        researchArtifact.put("handoffPrompt", "Use the approved package exactly. Script and Scene are already creator-approved; do not call AI to reinterpret them.");

        jdbc.sql("update episode_source_snapshot set is_current=false where episode_id=:episodeId")
                .param("episodeId", EPISODE_ID)
                .update();
        jdbc.sql("""
                insert into episode_source_snapshot(id, episode_id, version, source_type, payload, is_current)
                values (:id,:episodeId,:version,'APPROVED_EPISODE_PACKAGE',cast(:payload as jsonb),true)
                on conflict (episode_id, version) do update
                set source_type=excluded.source_type, payload=excluded.payload, is_current=true
                """)
                .param("id", UUID.randomUUID())
                .param("episodeId", EPISODE_ID)
                .param("version", sourceVersion)
                .param("payload", writeJson(payload))
                .update();

        jdbc.sql("""
                update episode
                set title=:title, source_of_truth_version=:sourceVersion, current_stage='SPLINE_BUILD', updated_at=now()
                where id=:episodeId
                """)
                .param("title", clean(episode.get("title")))
                .param("sourceVersion", sourceVersion)
                .param("episodeId", EPISODE_ID)
                .update();

        StageRevision researchRevision = lockStage(
                "RESEARCH",
                researchArtifact,
                "Approved episode package is the locked research, scope, and truth contract.",
                "No creative inference is required. Execute the creator-approved package."
        );
        StageRevision scriptRevision = lockStage(
                "SCRIPT",
                script,
                "Creator-approved Script imported from the episode execution package.",
                "Script is locked. Use its exact narration and timing for downstream execution."
        );
        StageRevision sceneRevision = lockStage(
                "SCENE",
                scene,
                "Creator-approved Scene and shot plan imported from the episode execution package.",
                "Scene is locked. Execute the deterministic Spline shot instructions."
        );

        saveHandoff("RESEARCH", "SCRIPT", researchRevision.revision(), researchArtifact,
                "Approved truth package. No AI generation required.");
        saveHandoff("SCRIPT", "SCENE", scriptRevision.revision(), script,
                clean(script.get("handoffPrompt")));
        saveHandoff("SCENE", "SPLINE", sceneRevision.revision(), scene,
                clean(scene.get("handoffPrompt")));

        lockCreativeThreads();
        activateSpline(packageId, row.contentHash(), scene, execution);

        List<Map<String, Object>> shots = mapList(scene.get("shots"));
        int queuedShotPlans = queueShotPlans(packageId, row.contentHash(), shots);

        jdbc.sql("update episode_execution_package set status='SUPERSEDED' where episode_id=:episodeId and status='APPLIED' and id<>:id")
                .param("episodeId", EPISODE_ID)
                .param("id", packageId)
                .update();
        jdbc.sql("""
                update episode_execution_package
                set status='APPLIED', applied_at=now(), preview_expires_at=null
                where id=:id and episode_id=:episodeId
                """)
                .param("id", packageId)
                .param("episodeId", EPISODE_ID)
                .update();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("applied", true);
        result.put("packageId", packageId);
        result.put("filename", row.filename());
        result.put("contentHash", row.contentHash());
        result.put("sourceVersion", sourceVersion);
        result.put("episodeNumber", episode.get("episodeNumber"));
        result.put("title", episode.get("title"));
        result.put("scriptRevision", scriptRevision.revision());
        result.put("sceneRevision", sceneRevision.revision());
        result.put("shotPlansQueued", queuedShotPlans);
        result.put("paidAiCalls", 0);
        result.put("windowsRequired", false);
        result.put("gpuRendersQueued", 0);
        result.put("nextAction", "Review deterministic Spline shot planning results. GPU rendering remains a separate explicit step.");
        return result;
    }

    public Map<String, Object> current() {
        return jdbc.sql("""
                select id, schema_version, package_version, filename, content_hash, payload::text, applied_at, created_at
                from episode_execution_package
                where episode_id=:episodeId and status='APPLIED'
                limit 1
                """)
                .param("episodeId", EPISODE_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> payload = readMap(rs.getString("payload"));
                    Map<String, Object> episode = asMap(payload.get("episode"));
                    Map<String, Object> script = asMap(payload.get("scriptArtifact"));
                    Map<String, Object> scene = asMap(payload.get("sceneArtifact"));
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("id", rs.getObject("id", UUID.class));
                    result.put("schemaVersion", rs.getString("schema_version"));
                    result.put("packageVersion", rs.getString("package_version"));
                    result.put("filename", rs.getString("filename"));
                    result.put("contentHash", rs.getString("content_hash"));
                    result.put("appliedAt", rs.getObject("applied_at", OffsetDateTime.class));
                    result.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    result.put("episodeNumber", episode.get("episodeNumber"));
                    result.put("title", episode.get("title"));
                    result.put("durationSeconds", script.get("targetDurationSeconds"));
                    result.put("scriptBlocks", mapList(script.get("timeline")).size());
                    result.put("sceneBlocks", mapList(scene.get("timeline")).size());
                    result.put("shots", mapList(scene.get("shots")).size());
                    result.put("paidAiCalls", 0);
                    return result;
                })
                .optional()
                .orElseGet(() -> Map.of("status", "NONE"));
    }

    private Map<String, Object> previewResult(ParsedPackage parsed, List<String> blockers) {
        Map<String, Object> payload = parsed.payload();
        Map<String, Object> episode = asMap(payload.get("episode"));
        Map<String, Object> script = asMap(payload.get("scriptArtifact"));
        Map<String, Object> scene = asMap(payload.get("sceneArtifact"));
        List<Map<String, Object>> shots = mapList(scene.get("shots"));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("zeroTokenPreview", true);
        result.put("schemaVersion", payload.get("schemaVersion"));
        result.put("packageVersion", payload.get("packageVersion"));
        result.put("filename", parsed.filename());
        result.put("contentHash", parsed.contentHash());
        result.put("episodeNumber", episode.get("episodeNumber"));
        result.put("title", episode.get("title"));
        result.put("durationSeconds", script.get("targetDurationSeconds"));
        result.put("scriptBlocks", mapList(script.get("timeline")).size());
        result.put("sceneBlocks", mapList(scene.get("timeline")).size());
        result.put("shots", shots.size());
        result.put("agentTasks", asList(asMap(payload.get("executionPlan")).get("agentTasks")).size());
        result.put("blockers", blockers);
        result.put("valid", blockers.isEmpty());
        result.put("canApply", false);
        result.put("paidAiCalls", 0);
        result.put("windowsRequired", false);
        result.put("gpuRendersQueued", 0);
        result.put("willLock", List.of("Research & Truth", "Script", "Scenes"));
        result.put("willQueue", shots.size() + " deterministic read-only Spline shot planning job(s)");
        result.put("willNotDo", List.of(
                "No OpenAI or other paid model call.",
                "No Windows machine dependency.",
                "No GPU render starts automatically.",
                "No creative rewriting of the approved package."
        ));
        return result;
    }

    private UUID upsertPreview(ParsedPackage parsed) {
        UUID existing = jdbc.sql("""
                select id from episode_execution_package
                where episode_id=:episodeId and content_hash=:contentHash
                """)
                .param("episodeId", EPISODE_ID)
                .param("contentHash", parsed.contentHash())
                .query(UUID.class)
                .optional()
                .orElse(null);
        if (existing != null) {
            jdbc.sql("""
                    update episode_execution_package
                    set filename=:filename, payload=cast(:payload as jsonb),
                        preview_expires_at=case when status='APPLIED' then null else now() + interval '30 minutes' end
                    where id=:id
                    """)
                    .param("filename", parsed.filename())
                    .param("payload", writeJson(parsed.payload()))
                    .param("id", existing)
                    .update();
            return existing;
        }

        UUID id = UUID.randomUUID();
        jdbc.sql("""
                insert into episode_execution_package(
                  id, episode_id, schema_version, package_version, filename, content_hash,
                  payload, status, preview_expires_at
                ) values (
                  :id,:episodeId,:schemaVersion,:packageVersion,:filename,:contentHash,
                  cast(:payload as jsonb),'PREVIEWED',now() + interval '30 minutes'
                )
                """)
                .param("id", id)
                .param("episodeId", EPISODE_ID)
                .param("schemaVersion", clean(parsed.payload().get("schemaVersion")))
                .param("packageVersion", clean(parsed.payload().get("packageVersion")))
                .param("filename", parsed.filename())
                .param("contentHash", parsed.contentHash())
                .param("payload", writeJson(parsed.payload()))
                .update();
        return id;
    }

    private PackageRow loadPreview(UUID packageId) {
        return jdbc.sql("""
                select filename, content_hash, payload::text, status, preview_expires_at
                from episode_execution_package
                where id=:id and episode_id=:episodeId
                """)
                .param("id", packageId)
                .param("episodeId", EPISODE_ID)
                .query((rs, rowNum) -> new PackageRow(
                        packageId,
                        rs.getString("filename"),
                        rs.getString("content_hash"),
                        readMap(rs.getString("payload")),
                        rs.getString("status"),
                        rs.getObject("preview_expires_at", OffsetDateTime.class)
                ))
                .optional()
                .map(row -> {
                    if ("APPLIED".equals(row.status())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "This exact package is already applied.");
                    }
                    if (!"PREVIEWED".equals(row.status()) || row.previewExpiresAt() == null || row.previewExpiresAt().isBefore(OffsetDateTime.now())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Package preview expired. Upload and preview the file again before applying it.");
                    }
                    return row;
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Package preview was not found."));
    }

    private String packageStatus(UUID packageId) {
        return jdbc.sql("select status from episode_execution_package where id=:id")
                .param("id", packageId)
                .query(String.class)
                .single();
    }

    private StageRevision lockStage(String stageKey, Map<String, Object> artifact, String summary, String nextAction) {
        Map<String, Object> stage = jdbc.sql("""
                select id, current_revision
                from production_stage
                where episode_id=:episodeId and stage_key=:stageKey
                """)
                .param("episodeId", EPISODE_ID)
                .param("stageKey", stageKey)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "id", rs.getObject("id", UUID.class),
                        "revision", rs.getInt("current_revision")
                ))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Production stage is missing: " + stageKey));

        int revision = ((Number) stage.get("revision")).intValue() + 1;
        UUID revisionId = UUID.randomUUID();
        jdbc.sql("""
                update production_stage
                set artifact=cast(:artifact as jsonb), artifact_schema_version=:schemaVersion,
                    current_revision=:revision, status='LOCKED', summary=:summary, next_action=:nextAction,
                    readiness='{"ready":true,"remainingTasks":[]}'::jsonb, locked_at=now(), updated_at=now()
                where episode_id=:episodeId and stage_key=:stageKey
                """)
                .param("artifact", writeJson(artifact))
                .param("schemaVersion", SCHEMA_VERSION)
                .param("revision", revision)
                .param("summary", summary)
                .param("nextAction", nextAction)
                .param("episodeId", EPISODE_ID)
                .param("stageKey", stageKey)
                .update();

        jdbc.sql("""
                insert into production_stage_revision(
                  id, production_stage_id, revision, artifact, summary, change_summary, created_by
                ) values (
                  :id,:stageId,:revision,cast(:artifact as jsonb),:summary,
                  'Imported from creator-approved episode execution package','PACKAGE_IMPORT'
                )
                """)
                .param("id", revisionId)
                .param("stageId", stage.get("id"))
                .param("revision", revision)
                .param("artifact", writeJson(artifact))
                .param("summary", summary)
                .update();
        return new StageRevision((UUID) stage.get("id"), revision, revisionId);
    }

    private void saveHandoff(String source, String target, int revision, Map<String, Object> artifact, String nextPrompt) {
        Map<String, Object> handoff = new LinkedHashMap<>();
        handoff.put("sourceStage", source);
        handoff.put("sourceRevision", revision);
        handoff.put("summary", "Locked by approved episode execution package.");
        handoff.put("nextAgentPrompt", nextPrompt);
        handoff.put("artifact", artifact);
        handoff.put("executionMode", "LOCKED_PACKAGE_NO_AI");

        jdbc.sql("""
                insert into agent_handoff(id, episode_id, source_stage_key, target_stage_key, source_revision, payload)
                values (:id,:episodeId,:source,:target,:revision,cast(:payload as jsonb))
                on conflict (episode_id, source_stage_key, source_revision, target_stage_key) do nothing
                """)
                .param("id", UUID.randomUUID())
                .param("episodeId", EPISODE_ID)
                .param("source", source)
                .param("target", target)
                .param("revision", revision)
                .param("payload", writeJson(handoff))
                .update();
    }

    private void lockCreativeThreads() {
        jdbc.sql("""
                update agent_thread t
                set status='LOCKED', updated_at=now()
                from agent_profile ap
                where t.agent_profile_id=ap.id
                  and t.episode_id=:episodeId
                  and ap.agent_key in ('SCRIPT_AGENT','SCENE_AGENT')
                """)
                .param("episodeId", EPISODE_ID)
                .update();
    }

    private void activateSpline(UUID packageId, String contentHash, Map<String, Object> scene, Map<String, Object> execution) {
        Map<String, Object> artifact = new LinkedHashMap<>();
        artifact.put("packageId", packageId);
        artifact.put("contentHash", contentHash);
        artifact.put("executionMode", "LOCKED_PACKAGE_NO_AI");
        artifact.put("shotCount", mapList(scene.get("shots")).size());
        artifact.put("executionPlan", execution);
        jdbc.sql("""
                update production_stage
                set status='ACTIVE', artifact=cast(:artifact as jsonb), artifact_schema_version=:schemaVersion,
                    summary='Approved package compiled. Deterministic Spline shot planning can run without AI.',
                    next_action='Review the generated runtime shot specifications, then explicitly start rendering when the render path is ready.',
                    readiness='{"ready":true,"remainingTasks":[]}'::jsonb, updated_at=now()
                where episode_id=:episodeId and stage_key='SPLINE'
                """)
                .param("artifact", writeJson(artifact))
                .param("schemaVersion", SCHEMA_VERSION)
                .param("episodeId", EPISODE_ID)
                .update();
    }

    private int queueShotPlans(UUID packageId, String contentHash, List<Map<String, Object>> shots) {
        int queued = 0;
        for (int i = 0; i < shots.size(); i++) {
            Map<String, Object> shot = shots.get(i);
            String shotKey = clean(shot.get("shotKey"));
            String prompt = clean(shot.get("promptForSpline"));
            int start = number(shot.get("startSecond"));
            int end = number(shot.get("endSecond"));
            int duration = Math.max(1, end - start);
            int revision = nextShotRevision(shotKey);
            String message = duration + " seconds. " + prompt
                    + " Camera: " + clean(shot.get("camera")) + ". Visual goal: " + clean(shot.get("visualGoal")) + ".";
            createReadOnlyShotPlan(packageId, contentHash, shotKey, i + 1, revision, message, shot);
            queued++;
        }
        return queued;
    }

    private int nextShotRevision(String shotKey) {
        return jdbc.sql("""
                select coalesce(max(case when payload->>'revision' ~ '^[0-9]+$' then (payload->>'revision')::int else 0 end),0) + 1
                from production_job
                where project_id=:projectId and agent_key=:agentKey and task_type=:taskType
                  and payload->>'shotKey'=:shotKey
                """)
                .param("projectId", PROJECT_ID)
                .param("agentKey", SHOT_AGENT_KEY)
                .param("taskType", SHOT_TASK_TYPE)
                .param("shotKey", shotKey)
                .query(Integer.class)
                .single();
    }

    private void createReadOnlyShotPlan(
            UUID packageId,
            String contentHash,
            String shotKey,
            int sequence,
            int revision,
            String message,
            Map<String, Object> shot
    ) {
        UUID orchestrationJobId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID productionJobId = UUID.randomUUID();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("executionProfile", "SHOT_DIRECTOR_V1");
        payload.put("creatorMessage", message);
        payload.put("shotKey", shotKey);
        payload.put("shotSequence", sequence);
        payload.put("revision", revision);
        payload.put("previousShotId", null);
        payload.put("previousShotSpec", null);
        payload.put("directorMemory", List.of());
        payload.put("productionCamera", "MEDIA_OS_CAMERA");
        payload.put("readOnlySplinePlanning", true);
        payload.put("sourcePackageId", packageId);
        payload.put("sourcePackageHash", contentHash);
        payload.put("lockedShot", shot);

        String instructions = "Create exactly one temporary browser-runtime shot specification from the creator-approved package command. This is a read-only Spline planning task. Inspect exact existing Spline objects, camera references, states, events, and registered runtime flows as needed, but do not mutate the Spline scene. Never invent an object, camera, state, event, or flow. If a required reference cannot be verified, fail clearly instead of guessing.";

        jdbc.sql("""
                insert into job(id, project_id, name, job_type, status, progress)
                values (:id,:projectId,:name,'SPLINE_EXECUTION','QUEUED',20)
                """)
                .param("id", orchestrationJobId)
                .param("projectId", PROJECT_ID)
                .param("name", "Approved package shot · " + shotKey + " r" + revision)
                .update();
        jdbc.sql("""
                insert into task(id, job_id, name, task_type, status, sequence_no)
                values (:id,:jobId,:name,:taskType,'PENDING',1)
                """)
                .param("id", taskId)
                .param("jobId", orchestrationJobId)
                .param("name", "Runtime shot · " + shotKey + " r" + revision)
                .param("taskType", SHOT_TASK_TYPE)
                .update();
        jdbc.sql("""
                insert into production_job(
                  id, project_id, task_id, agent_key, task_type, target, instructions,
                  permissions, protected_objects, payload, status
                ) values (
                  :id,:projectId,:taskId,:agentKey,:taskType,'FOCUSED_SPLINE_3D_TAB',:instructions,
                  cast(:permissions as jsonb),cast(:protectedObjects as jsonb),cast(:payload as jsonb),'QUEUED'
                )
                """)
                .param("id", productionJobId)
                .param("projectId", PROJECT_ID)
                .param("taskId", taskId)
                .param("agentKey", SHOT_AGENT_KEY)
                .param("taskType", SHOT_TASK_TYPE)
                .param("instructions", instructions)
                .param("permissions", writeJson(List.of(
                        "READ_SCENE_REFERENCES",
                        "READ_EXACT_CREATOR_NAMED_OBJECTS",
                        "READ_CAMERA_REFERENCES",
                        "READ_AUTHORED_STATES_AND_EVENTS",
                        "READ_REGISTERED_RUNTIME_FLOWS",
                        "CREATE_RUNTIME_SHOT_SPEC"
                )))
                .param("protectedObjects", writeJson(List.of("ALL_SPLINE_OBJECTS_READ_ONLY")))
                .param("payload", writeJson(payload))
                .update();
        jdbc.sql("""
                insert into spline_agent_message(id, project_id, production_job_id, role, content)
                values (:id,:projectId,:productionJobId,'USER',:content)
                """)
                .param("id", UUID.randomUUID())
                .param("projectId", PROJECT_ID)
                .param("productionJobId", productionJobId)
                .param("content", message)
                .update();
    }

    private List<String> validate(Map<String, Object> payload) {
        List<String> blockers = new ArrayList<>();
        if (!SCHEMA_VERSION.equals(clean(payload.get("schemaVersion")))) {
            blockers.add("schemaVersion must be exactly '" + SCHEMA_VERSION + "'.");
        }
        if (clean(payload.get("packageVersion")).isBlank()) blockers.add("packageVersion is required.");

        Map<String, Object> approval = asMap(payload.get("approval"));
        if (!"LOCKED".equals(clean(approval.get("status")).toUpperCase(Locale.ROOT))) {
            blockers.add("approval.status must be LOCKED before MediaOS can treat the file as executable truth.");
        }
        if (clean(approval.get("approvedBy")).isBlank()) blockers.add("approval.approvedBy is required.");

        Map<String, Object> episode = asMap(payload.get("episode"));
        String currentEpisodeNumber = jdbc.sql("select episode_number from episode where id=:episodeId")
                .param("episodeId", EPISODE_ID)
                .query(String.class)
                .single();
        if (!currentEpisodeNumber.equals(clean(episode.get("episodeNumber")))) {
            blockers.add("Package episodeNumber must match the current MediaOS episode: " + currentEpisodeNumber + ".");
        }
        if (clean(episode.get("title")).isBlank()) blockers.add("episode.title is required.");
        if (asMap(payload.get("topicContract")).isEmpty()) blockers.add("topicContract is required.");
        if (asMap(payload.get("truthContract")).isEmpty()) blockers.add("truthContract is required.");
        if (asList(payload.get("lockedDecisions")).isEmpty()) blockers.add("lockedDecisions must contain the creator-approved decisions.");

        Map<String, Object> script = asMap(payload.get("scriptArtifact"));
        Map<String, Object> scene = asMap(payload.get("sceneArtifact"));
        blockers.addAll(validateScript(script));
        blockers.addAll(validateScene(scene, number(script.get("targetDurationSeconds"))));

        Map<String, Object> execution = asMap(payload.get("executionPlan"));
        if (execution.isEmpty()) blockers.add("executionPlan is required.");
        if (asList(execution.get("agentTasks")).isEmpty()) blockers.add("executionPlan.agentTasks must describe deterministic downstream responsibilities.");
        if (asMap(execution.get("editPlan")).isEmpty()) blockers.add("executionPlan.editPlan is required so editing does not need creative inference later.");
        if (asMap(execution.get("qaPlan")).isEmpty()) blockers.add("executionPlan.qaPlan is required so final checks are deterministic.");
        return dedupe(blockers);
    }

    private List<String> validateScript(Map<String, Object> artifact) {
        List<String> failures = new ArrayList<>();
        if (artifact.isEmpty()) return List.of("scriptArtifact is required.");
        int duration = number(artifact.get("targetDurationSeconds"));
        if (duration < 1140 || duration > 1260) failures.add("Script working duration must be 1140–1260 seconds.");
        List<Map<String, Object>> timeline = mapList(artifact.get("timeline"));
        if (timeline.size() < 24) failures.add("Script timeline needs at least 24 controlled blocks.");
        int expected = 0;
        int aha = 0;
        int reels = 0;
        int listPassages = 0;
        int pauses = 0;
        int words = 0;
        for (Map<String, Object> block : timeline) {
            int start = number(block.get("startSecond"));
            int end = number(block.get("endSecond"));
            if (start != expected || end <= start || end - start > 60) {
                failures.add("Script timeline must be contiguous and each block must be 60 seconds or less.");
                break;
            }
            expected = end;
            String narration = clean(block.get("narration"));
            words += wordCount(narration);
            pauses += occurrences(narration.toLowerCase(Locale.ROOT), "(pause)");
            if (narration.isBlank() || clean(block.get("voiceDirection")).isBlank()
                    || clean(block.get("purpose")).isBlank() || clean(block.get("handoffNotes")).isBlank()) {
                failures.add("Every Script block needs narration, voice direction, purpose, and handoffNotes.");
                break;
            }
            if (Boolean.TRUE.equals(block.get("ahaMoment"))) aha++;
            if (Boolean.TRUE.equals(block.get("reelCandidate"))) reels++;
            if (Boolean.TRUE.equals(block.get("listPassage"))) listPassages++;
        }
        if (expected != duration) failures.add("Final Script timestamp must equal targetDurationSeconds.");
        if (aha < 3) failures.add("Script needs at least three Aha moments.");
        if (reels < 3) failures.add("Script needs at least three reel-ready passages.");
        if (listPassages > 2) failures.add("Script may use at most two list-style passages.");
        if (words < 2200 || words > 3300) failures.add("Script narration must contain about 2200–3300 words.");
        if (pauses < 3) failures.add("Script needs at least three deliberate '(pause)' markers.");
        if (clean(artifact.get("handoffPrompt")).isBlank()) failures.add("Script handoffPrompt is required.");
        return failures;
    }

    private List<String> validateScene(Map<String, Object> artifact, int duration) {
        List<String> failures = new ArrayList<>();
        if (artifact.isEmpty()) return List.of("sceneArtifact is required.");
        if (duration <= 0) return List.of("A valid Script duration is required before Scene validation.");
        List<Map<String, Object>> timeline = mapList(artifact.get("timeline"));
        List<Map<String, Object>> shots = mapList(artifact.get("shots"));
        if (timeline.size() < 8) failures.add("Scene timeline needs at least eight blocks.");
        if (shots.size() < 8) failures.add("Scene shot plan needs at least eight shots.");
        int expected = 0;
        Set<String> shotKeys = new LinkedHashSet<>();
        for (Map<String, Object> shot : shots) {
            int start = number(shot.get("startSecond"));
            int end = number(shot.get("endSecond"));
            if (start != expected || end <= start) {
                failures.add("Scene shots must cover the episode contiguously with no gaps or overlaps.");
                break;
            }
            expected = end;
            String shotKey = clean(shot.get("shotKey"));
            if (shotKey.isBlank() || !shotKeys.add(shotKey)) failures.add("Every Scene shot needs a unique non-empty shotKey.");
            if (clean(shot.get("script")).isBlank() || clean(shot.get("voiceDirection")).isBlank()
                    || clean(shot.get("camera")).isBlank() || clean(shot.get("visualGoal")).isBlank()
                    || clean(shot.get("promptForSpline")).isBlank() || asList(shot.get("moves")).isEmpty()) {
                failures.add("Every Scene shot needs script, voice direction, moves, camera, visualGoal, and promptForSpline.");
                break;
            }
        }
        if (expected != duration) failures.add("Final Scene shot must end at the Script duration.");
        if (clean(artifact.get("handoffPrompt")).isBlank()) failures.add("Scene handoffPrompt is required.");
        return failures;
    }

    private ParsedPackage parse(String filename, String content) {
        String cleanFilename = filename == null ? "" : filename.trim();
        if (cleanFilename.isBlank() || cleanFilename.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a valid episode package filename.");
        }
        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Episode package file is empty.");
        }
        if (content.length() > MAX_CONTENT_CHARS) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Episode package is larger than the 2,000,000 character safety limit.");
        }
        try {
            Map<String, Object> payload = objectMapper.readValue(content, new TypeReference<LinkedHashMap<String, Object>>() {});
            return new ParsedPackage(cleanFilename, hash(content), payload);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Episode package must be valid UTF-8 JSON: " + ex.getOriginalMessage());
        }
    }

    private String hash(String content) {
        try {
            byte[] bytes = MessageDigest.getInstance("SHA-256").digest(content.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable.", ex);
        }
    }

    private Map<String, Object> readMap(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Stored episode package JSON is invalid.", ex);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize episode package data.", ex);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : new LinkedHashMap<>();
    }

    @SuppressWarnings("unchecked")
    private List<Object> asList(Object value) {
        return value instanceof List<?> list ? (List<Object>) list : List.of();
    }

    private List<Map<String, Object>> mapList(Object value) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : asList(value)) {
            if (item instanceof Map<?, ?> map) {
                @SuppressWarnings("unchecked") Map<String, Object> typed = (Map<String, Object>) map;
                result.add(typed);
            }
        }
        return result;
    }

    private List<String> dedupe(List<String> values) {
        return new ArrayList<>(new LinkedHashSet<>(values));
    }

    private int number(Object value) {
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }

    private int wordCount(String value) {
        if (value == null || value.isBlank()) return 0;
        return value.trim().split("\\s+").length;
    }

    private int occurrences(String value, String needle) {
        if (value == null || needle == null || needle.isEmpty()) return 0;
        int count = 0;
        int index = 0;
        while ((index = value.indexOf(needle, index)) >= 0) {
            count++;
            index += needle.length();
        }
        return count;
    }

    private String clean(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private record ParsedPackage(String filename, String contentHash, Map<String, Object> payload) {}
    private record PackageRow(UUID id, String filename, String contentHash, Map<String, Object> payload, String status, OffsetDateTime previewExpiresAt) {}
    private record StageRevision(UUID stageId, int revision, UUID revisionId) {}
}
