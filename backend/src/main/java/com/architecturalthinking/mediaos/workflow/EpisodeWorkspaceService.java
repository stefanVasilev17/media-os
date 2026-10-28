package com.architecturalthinking.mediaos.workflow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * New episode-aware workspace; legacy EP001 editor/render routes are untouched.
 * No automated Director LOCKs and no writes to global reusable asset binaries.
 */
@Service
public class EpisodeWorkspaceService {
    private static final UUID PROJECT_ID = ProductionOverviewService.PROJECT_ID;
    private static final UUID LEGACY_EPISODE_ID = ProductionOverviewService.EPISODE_ID;
    private final JdbcClient jdbc;
    private final ObjectMapper mapper;
    private final ProductionMemoryService memory;
    private final CreativePolicyService policy;
    private final boolean creationEnabled;

    public EpisodeWorkspaceService(JdbcClient jdbc, ObjectMapper mapper,
                                   ProductionMemoryService memory, CreativePolicyService policy,
                                   @Value("${mediaos.episodes.creation-enabled:false}") boolean creationEnabled) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.memory = memory;
        this.policy = policy;
        this.creationEnabled = creationEnabled;
    }

    public List<Map<String, Object>> episodes() {
        return jdbc.sql("""
                select id, episode_number, title, status, current_stage, source_of_truth_version
                from episode where project_id=:projectId order by episode_number
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, n) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("episodeNumber", rs.getString("episode_number"));
                    row.put("title", rs.getString("title"));
                    row.put("status", rs.getString("status"));
                    row.put("currentStage", rs.getString("current_stage"));
                    row.put("sourceVersion", rs.getString("source_of_truth_version"));
                    return row;
                }).list();
    }

    public Map<String, Object> episode(UUID id) {
        return jdbc.sql("""
                select id, episode_number, title, status, current_stage, source_of_truth_version
                from episode where project_id=:projectId and id=:id
                """)
                .param("projectId", PROJECT_ID).param("id", id)
                .query((rs, n) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", rs.getObject("id", UUID.class));
                    row.put("episodeNumber", rs.getString("episode_number"));
                    row.put("title", rs.getString("title"));
                    row.put("status", rs.getString("status"));
                    row.put("currentStage", rs.getString("current_stage"));
                    row.put("sourceVersion", rs.getString("source_of_truth_version"));
                    return row;
                }).optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown episode."));
    }

    public List<Map<String, Object>> stages(UUID id) {
        episode(id);
        return jdbc.sql("""
                select stage_key, display_name, sequence_no, status, current_revision,
                       summary, next_action, artifact::text, locked_at, updated_at
                from production_stage where episode_id=:episodeId order by sequence_no
                """)
                .param("episodeId", id)
                .query((rs, n) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("stageKey", rs.getString("stage_key"));
                    row.put("displayName", rs.getString("display_name"));
                    row.put("sequence", rs.getInt("sequence_no"));
                    row.put("status", rs.getString("status"));
                    row.put("revision", rs.getInt("current_revision"));
                    row.put("summary", rs.getString("summary"));
                    row.put("nextAction", rs.getString("next_action"));
                    row.put("artifact", readJson(rs.getString("artifact")));
                    row.put("lockedAt", rs.getObject("locked_at", OffsetDateTime.class));
                    row.put("updatedAt", rs.getObject("updated_at", OffsetDateTime.class));
                    return row;
                }).list();
    }

    public Map<String, Object> context(UUID id, String scope) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("episode", episode(id));
        result.put("policy", policy.current());
        result.put("rules", memory.rulesFor(scope, id));
        result.put("stages", stages(id));
        result.put("assetsAvailable", memory.approvedAssets());
        result.put("assetsReferenced", assets(id));
        result.put("directorLockedShots", memory.directorLockedShots(id));
        result.put("semanticApproval", false);
        result.put("scope", scope);
        return result;
    }

    public List<Map<String, Object>> assets(UUID id) {
        episode(id);
        return jdbc.sql("""
                select r.asset_key, r.reference_type, r.notes, a.source_path, r.created_at
                from episode_asset_reference r
                join production_asset_catalog a
                  on a.project_id=r.project_id and a.asset_key=r.asset_key
                where r.episode_id=:episodeId and r.project_id=:projectId
                order by r.asset_key
                """)
                .param("episodeId", id).param("projectId", PROJECT_ID)
                .query((rs, n) -> Map.<String, Object>of(
                        "assetKey", rs.getString("asset_key"),
                        "type", rs.getString("reference_type"),
                        "notes", rs.getString("notes"),
                        "sourcePath", rs.getString("source_path"),
                        "createdAt", rs.getObject("created_at", OffsetDateTime.class)
                )).list();
    }

    @Transactional
    public Map<String, Object> create(String episodeNumber, String title, UUID auditId) {
        if (!creationEnabled) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Episode creation is disabled until legacy EP001 routing and preview authorization have been reviewed.");
        String number = episodeNumber == null ? "" : episodeNumber.trim().toUpperCase(Locale.ROOT);
        String name = title == null ? "" : title.trim();
        if (!number.matches("EP\\d{3}") || number.equals("EP001") || name.isBlank() || name.length() > 260)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A new EP002+ episode number and title are required.");
        boolean exists = jdbc.sql("select exists(select 1 from episode where project_id=:projectId and episode_number=:number)")
                .param("projectId", PROJECT_ID).param("number", number)
                .query(Boolean.class).single();
        if (exists) throw new ResponseStatusException(HttpStatus.CONFLICT, "Episode number already exists.");
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                insert into episode(id, project_id, episode_number, title, current_stage, status)
                values (:id,:projectId,:number,:title,'RESEARCH','DRAFT')
                """)
                .param("id", id).param("projectId", PROJECT_ID)
                .param("number", number).param("title", name).update();

        seedStage(id, "RESEARCH", null, "Research / Truth Map", 10, "DRAFT");
        seedStage(id, "SCRIPT", "SCRIPT_AGENT", "Script", 20, "WAITING");
        seedStage(id, "SCENE", "SCENE_AGENT", "Episode-Level Visual Plan", 30, "WAITING");
        seedStage(id, "VOICE", null, "Voice", 40, "WAITING");
        seedStage(id, "VISUAL", null, "Remotion Visual Production", 50, "WAITING");
        seedStage(id, "QA", null, "Technical and Editorial QA", 60, "WAITING");
        seedStage(id, "PUBLISH", null, "Release", 70, "WAITING");
        jdbc.sql("""
                insert into agent_thread(id, episode_id, agent_profile_id, status)
                select gen_random_uuid(), :episodeId, id, 'WAITING'
                from agent_profile
                where agent_key in ('DIRECTOR_AGENT','SCRIPT_AGENT','SCENE_AGENT')
                """).param("episodeId", id).update();
        event(id, null, "EPISODE_CREATED", null, "New isolated DRAFT workspace. No Director approvals inherited.", auditId);
        return episode(id);
    }

    @Transactional
    public Map<String, Object> referenceAsset(UUID episodeId, String assetKey, String notes, UUID auditId) {
        episode(episodeId);
        if (LEGACY_EPISODE_ID.equals(episodeId))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EP001 uses the locked legacy asset workflow.");
        boolean available = jdbc.sql("""
                select exists(select 1 from production_asset_catalog
                              where project_id=:projectId and asset_key=:assetKey and status='LOCKED')
                """).param("projectId", PROJECT_ID).param("assetKey", assetKey)
                .query(Boolean.class).single();
        if (!available) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Asset is not approved in the canonical Remotion registry.");
        jdbc.sql("""
                insert into episode_asset_reference(episode_id, project_id, asset_key, notes)
                values (:id,:projectId,:assetKey,:notes)
                on conflict (episode_id,asset_key) do nothing
                """)
                .param("id", episodeId).param("projectId", PROJECT_ID)
                .param("assetKey", assetKey).param("notes", notes == null ? "" : notes)
                .update();
        event(episodeId, null, "APPROVED_ASSET_REUSED", null, assetKey, auditId);
        return context(episodeId, "VISUAL");
    }

    @Transactional
    public Map<String, Object> draft(UUID id, String rawStage, Map<String, Object> artifact,
                                     String summary, int expectedRevision, UUID auditId) {
        episode(id);
        if (LEGACY_EPISODE_ID.equals(id))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "EP001 locked production uses legacy routes.");
        String stage = editableStage(rawStage);
        if (artifact == null || artifact.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Draft artifact cannot be empty.");
        if (summary == null || summary.trim().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Draft summary is required.");
        if (expectedRevision < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An expected nonnegative revision is required.");
        if (!"RESEARCH".equals(stage)) requireLocked(id, "RESEARCH");
        if ("SCENE".equals(stage)) requireLocked(id, "SCRIPT");

        int updated = jdbc.sql("""
                update production_stage set current_revision=current_revision+1,
                    artifact=cast(:artifact as jsonb), summary=:summary, status='READY_FOR_REVIEW',
                    readiness='{"ready":false,"remainingTasks":["Requires technical QA and explicit Director review."]}'::jsonb,
                    next_action='Review draft against Truth Map and Production Memory.',
                    updated_at=now()
                where episode_id=:episodeId and stage_key=:stage
                  and current_revision=:expected and status <> 'LOCKED'
                """)
                .param("episodeId", id).param("stage", stage)
                .param("expected", expectedRevision).param("artifact", writeJson(artifact))
                .param("summary", summary.trim()).update();
        if (updated != 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Locked, missing or stale stage. Refresh before editing.");
        jdbc.sql("""
                insert into production_stage_revision(id,production_stage_id,revision,
                                                      artifact,summary,change_summary,created_by)
                select :id, s.id, s.current_revision,cast(:artifact as jsonb),:summary,
                       'Episode-aware reviewed draft','DIRECTOR_SUBMITTED'
                from production_stage s where s.episode_id=:episodeId and s.stage_key=:stage
                """)
                .param("id", UUID.randomUUID()).param("episodeId", id)
                .param("stage", stage).param("artifact", writeJson(artifact))
                .param("summary", summary.trim()).update();
        event(id, stage, "DRAFT_SAVED", expectedRevision + 1, summary.trim(), auditId);
        return context(id, "ALL");
    }

    @Transactional
    public Map<String, Object> directorLock(UUID id, String rawStage, int expectedRevision,
                                            String decision, String directorNote, UUID auditId) {
        episode(id);
        if (LEGACY_EPISODE_ID.equals(id))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot relock EP001 through episode workspace.");
        String stage = editableStage(rawStage);
        EpisodeWorkspaceRules.validateDirectorDecision(decision, directorNote);
        Map<String, Object> row = jdbc.sql("""
                select current_revision, status, artifact::text
                from production_stage where episode_id=:episodeId and stage_key=:stage for update
                """)
                .param("episodeId", id).param("stage", stage)
                .query((rs, n) -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("revision", rs.getInt("current_revision"));
                    m.put("status", rs.getString("status"));
                    m.put("artifact", readJson(rs.getString("artifact")));
                    return m;
                }).optional().orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown stage."));
        if (!"READY_FOR_REVIEW".equals(row.get("status")) ||
                ((Number) row.get("revision")).intValue() != expectedRevision || expectedRevision < 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Stage is locked, unreviewed or revision changed.");
        if (!"RESEARCH".equals(stage)) requireLocked(id, "RESEARCH");
        if ("SCENE".equals(stage)) requireLocked(id, "SCRIPT");
        EpisodeWorkspaceRules.validateArtifactForLock(stage, castMap(row.get("artifact")));

        int affected = jdbc.sql("""
                update production_stage set status='LOCKED', locked_at=now(), updated_at=now(),
                    next_action='Director locked. Downstream stage may proceed.'
                where episode_id=:episodeId and stage_key=:stage and status='READY_FOR_REVIEW'
                  and current_revision=:revision
                """)
                .param("episodeId", id).param("stage", stage)
                .param("revision", expectedRevision).update();
        if (affected != 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Concurrent stage update.");
        event(id, stage, "DIRECTOR_LOCKED", expectedRevision, directorNote.trim(), auditId);
        jdbc.sql("update episode set current_stage=:stage where id=:id")
                .param("id", id).param("stage", stage).update();
        return context(id, "ALL");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castMap(Object o) {
        return o instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
    }

    private void requireLocked(UUID episodeId, String stage) {
        boolean locked = jdbc.sql("""
                select exists(select 1 from production_stage
                              where episode_id=:id and stage_key=:stage and status='LOCKED')
                """).param("id", episodeId).param("stage", stage)
                .query(Boolean.class).single();
        if (!locked) throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Upstream " + stage + " must be explicitly Director LOCKED.");
    }

    private String editableStage(String stage) {
        return EpisodeWorkspaceRules.editableStage(stage);
    }

    private void seedStage(UUID episodeId, String key, String agent, String label, int seq, String status) {
        jdbc.sql("""
                insert into production_stage(id,episode_id,stage_key,agent_key,display_name,
                                             sequence_no,route,status,summary,next_action)
                values (:id,:episodeId,:key,:agent,:label,:seq,:route,:status,'',
                        'Complete the approved upstream stage and production memory preflight.')
                """).param("id", UUID.randomUUID()).param("episodeId", episodeId)
                .param("key", key).param("agent", agent)
                .param("label", label).param("seq", seq)
                .param("route", "#/episodes/" + episodeId + "/stages/" + key.toLowerCase(Locale.ROOT))
                .param("status", status).update();
    }

    private void event(UUID episodeId, String stage, String type, Integer revision, String note, UUID auditId) {
        jdbc.sql("""
                insert into episode_workspace_event(id,episode_id,stage_key,event_type,revision,note,preflight_audit_id)
                values (:id,:episodeId,:stage,:event,:revision,:note,:audit)
                """).param("id", UUID.randomUUID()).param("episodeId", episodeId)
                .param("stage", stage).param("event", type).param("revision", revision)
                .param("note", note == null ? "" : note).param("audit", auditId).update();
    }

    private Map<String, Object> readJson(String source) {
        if (source == null || source.isBlank()) return Map.of();
        try {
            return mapper.readValue(source, new com.fasterxml.jackson.core.type.TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (Exception ex) { throw new IllegalStateException("Stored episode artifact is not valid JSON.", ex); }
    }

    private String writeJson(Object value) {
        try { return mapper.writeValueAsString(value); }
        catch (JsonProcessingException ex) { throw new IllegalArgumentException("Cannot serialize episode artifact.", ex); }
    }
}
