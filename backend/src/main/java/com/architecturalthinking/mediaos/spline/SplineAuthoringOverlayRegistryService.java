package com.architecturalthinking.mediaos.spline;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class SplineAuthoringOverlayRegistryService {

    private static final Logger log = LoggerFactory.getLogger(SplineAuthoringOverlayRegistryService.class);
    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final int MAX_DISCOVERY_BATCH = 8;

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    public SplineAuthoringOverlayRegistryService(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Map<String, Object> syncFromSlots(String sceneFingerprint) {
        List<SlotRow> slots = loadSlots(sceneFingerprint);

        jdbc.sql("""
                delete from spline_authoring_overlay o
                where o.project_id=:projectId
                  and o.scene_fingerprint=:fingerprint
                  and not exists (
                    select 1
                    from spline_scene_slot_registry s
                    where s.id=o.slot_registry_id
                      and s.project_id=o.project_id
                      and s.scene_fingerprint=o.scene_fingerprint
                  )
                """)
                .param("projectId", PROJECT_ID)
                .param("fingerprint", sceneFingerprint)
                .update();

        for (SlotRow slot : slots) {
            String variableName = requestedLabelVariable(slot.objectName(), slot.objectUuid());

            jdbc.sql("""
                    insert into spline_authoring_overlay(
                        id, project_id, scene_fingerprint, slot_registry_id,
                        slot_key, object_uuid, object_name, editor_path,
                        status, semantic_role, requested_label_variable,
                        state_definitions, action_graph, event_bindings,
                        discovery_coverage, updated_at
                    )
                    values (
                        :id, :projectId, :fingerprint, :slotRegistryId,
                        :slotKey, :objectUuid, :objectName, :editorPath,
                        'PENDING_DISCOVERY', 'UNCLASSIFIED', :requestedLabelVariable,
                        '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
                        '{}'::jsonb, now()
                    )
                    on conflict(project_id, scene_fingerprint, slot_key)
                    do update set
                        slot_registry_id=excluded.slot_registry_id,
                        object_uuid=excluded.object_uuid,
                        object_name=excluded.object_name,
                        editor_path=excluded.editor_path,
                        requested_label_variable=excluded.requested_label_variable,
                        updated_at=now()
                    """)
                    .param("id", UUID.randomUUID())
                    .param("projectId", PROJECT_ID)
                    .param("fingerprint", sceneFingerprint)
                    .param("slotRegistryId", slot.id())
                    .param("slotKey", slot.slotKey())
                    .param("objectUuid", slot.objectUuid())
                    .param("objectName", slot.objectName())
                    .param("editorPath", slot.editorPath())
                    .param("requestedLabelVariable", variableName)
                    .update();
        }

        jdbc.sql("""
                update spline_authoring_overlay o
                set status='AUTHORING_ADDRESS_UNRESOLVED',
                    label_target_path=null,
                    label_current_text=null,
                    state_definitions='[]'::jsonb,
                    action_graph='[]'::jsonb,
                    event_bindings='[]'::jsonb,
                    discovery_coverage='{"label":"ADDRESS_UNRESOLVED","states":"ADDRESS_UNRESOLVED","events":"ADDRESS_UNRESOLVED","actions":"ADDRESS_UNRESOLVED"}'::jsonb,
                    discovery_notes='Runtime visual-family slot has no resolved authoring/editor object address.',
                    discovered_by=null,
                    discovered_at=null,
                    updated_at=now()
                from spline_scene_slot_registry s
                where o.slot_registry_id=s.id
                  and o.project_id=:projectId
                  and o.scene_fingerprint=:fingerprint
                  and s.behavior_strategy='AUTHORING_ADDRESS_UNRESOLVED'
                """)
                .param("projectId", PROJECT_ID)
                .param("fingerprint", sceneFingerprint)
                .update();

        jdbc.sql("""
                update spline_authoring_overlay o
                set status='PENDING_DISCOVERY',
                    discovery_coverage='{}'::jsonb,
                    discovery_notes='Authoring/editor object address resolved from the refreshed editor catalog.',
                    updated_at=now()
                from spline_scene_slot_registry s
                where o.slot_registry_id=s.id
                  and o.project_id=:projectId
                  and o.scene_fingerprint=:fingerprint
                  and s.behavior_strategy='AUTHORING_OVERLAY_REQUIRED'
                  and o.status='AUTHORING_ADDRESS_UNRESOLVED'
                """)
                .param("projectId", PROJECT_ID)
                .param("fingerprint", sceneFingerprint)
                .update();

        Map<String, Object> summary = summaryFor(sceneFingerprint);
        log.info(
                "Spline authoring overlay registry synced fingerprint={} overlays={} pending={} ready={} requestedGlobalActiveLabel=AT_ACTIVE_OBJECT_LABEL",
                sceneFingerprint.substring(0, Math.min(12, sceneFingerprint.length())),
                summary.get("overlayCount"),
                summary.get("pendingDiscovery"),
                summary.get("ready")
        );
        return summary;
    }

    @Transactional
    public Map<String, Object> queueDiscoveryBatch(int requestedBatchSize) {
        int batchSize = Math.max(1, Math.min(requestedBatchSize, MAX_DISCOVERY_BATCH));
        Optional<String> fingerprint = latestSceneFingerprint();
        if (fingerprint.isEmpty()) {
            return Map.of("status", "EMPTY");
        }

        var existing = jdbc.sql("""
                select p.id, p.status
                from production_job p
                where p.project_id=:projectId
                  and p.agent_key='SPLINE_AGENT'
                  and p.task_type='AUTHORING_OVERLAY_DISCOVERY_V1'
                  and p.status in ('QUEUED','CLAIMED','RUNNING')
                order by p.created_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> Map.<String, Object>of(
                        "productionJobId", rs.getObject("id", UUID.class),
                        "status", rs.getString("status")
                ))
                .optional();

        if (existing.isPresent()) {
            Map<String, Object> result = new LinkedHashMap<>(existing.orElseThrow());
            result.put("sceneFingerprint", fingerprint.orElseThrow());
            result.put("executionProfile", "AUTHORING_OVERLAY_DISCOVERY_V1");
            result.put("reusedExistingJob", true);
            return result;
        }

        List<DiscoveryTarget> targets = jdbc.sql("""
                select o.slot_key, o.object_uuid, o.object_name, o.editor_path,
                       o.requested_label_variable, s.candidate_kind, s.evidence::text as slot_evidence
                from spline_authoring_overlay o
                join spline_scene_slot_registry s on s.id=o.slot_registry_id
                where o.project_id=:projectId
                  and o.scene_fingerprint=:fingerprint
                  and o.status='PENDING_DISCOVERY'
                  and s.behavior_strategy='AUTHORING_OVERLAY_REQUIRED'
                order by
                  case
                    when s.candidate_kind='EDITOR_GROUP_AND_VISUAL_FAMILY' then 0
                    when s.candidate_kind='EDITOR_GROUP' then 1
                    else 2
                  end,
                  o.object_name
                limit :batchSize
                """)
                .param("projectId", PROJECT_ID)
                .param("fingerprint", fingerprint.orElseThrow())
                .param("batchSize", batchSize)
                .query((rs, rowNum) -> new DiscoveryTarget(
                        rs.getString("slot_key"),
                        rs.getString("object_uuid"),
                        rs.getString("object_name"),
                        rs.getString("editor_path"),
                        rs.getString("requested_label_variable"),
                        rs.getString("candidate_kind"),
                        authoringObjectIds(readJson(rs.getString("slot_evidence")))
                ))
                .list();

        if (targets.isEmpty()) {
            return Map.of(
                    "status", "NO_ELIGIBLE_PENDING",
                    "sceneFingerprint", fingerprint.orElseThrow(),
                    "batchSize", batchSize
            );
        }

        List<Map<String, Object>> targetPayload = targets.stream().map(target -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("slotKey", target.slotKey());
            item.put("objectUuid", target.objectUuid());
            item.put("objectName", target.objectName());
            item.put("editorPath", target.editorPath());
            item.put("requestedLabelVariable", target.requestedLabelVariable());
            item.put("candidateKind", target.candidateKind());
            item.put("authoringObjectIds", target.authoringObjectIds());
            return item;
        }).toList();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("executionProfile", "AUTHORING_OVERLAY_DISCOVERY_V1");
        payload.put("readOnly", true);
        payload.put("sceneFingerprint", fingerprint.orElseThrow());
        payload.put("batchSize", targets.size());
        payload.put("overlays", targetPayload);

        UUID orchestrationJobId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID productionJobId = UUID.randomUUID();

        jdbc.sql("""
                insert into job(id, project_id, name, job_type, status, progress)
                values (:id, :projectId, 'Spline authoring overlay discovery', 'SPLINE_AUTHORING_OVERLAY_DISCOVERY', 'QUEUED', 20)
                """)
                .param("id", orchestrationJobId)
                .param("projectId", PROJECT_ID)
                .update();

        jdbc.sql("""
                insert into task(id, job_id, name, task_type, status, sequence_no)
                values (:id, :jobId, 'Read authoring metadata batch', 'AUTHORING_OVERLAY_DISCOVERY_V1', 'PENDING', 1)
                """)
                .param("id", taskId)
                .param("jobId", orchestrationJobId)
                .update();

        jdbc.sql("""
                insert into production_job(
                    id, project_id, task_id, agent_key, task_type, target, instructions,
                    permissions, protected_objects, payload, status
                )
                values (
                    :id, :projectId, :taskId, 'SPLINE_AGENT', 'AUTHORING_OVERLAY_DISCOVERY_V1',
                    'FOCUSED_SPLINE_3D_TAB',
                    'Read only the exact authoring metadata targets supplied by Media OS. Do not modify anything and do not enumerate unrelated scene objects.',
                    '["READ_AUTHORING_OVERLAY"]'::jsonb,
                    '["ALL_OBJECTS"]'::jsonb,
                    cast(:payload as jsonb),
                    'QUEUED'
                )
                """)
                .param("id", productionJobId)
                .param("projectId", PROJECT_ID)
                .param("taskId", taskId)
                .param("payload", writeJson(payload))
                .update();

        for (DiscoveryTarget target : targets) {
            jdbc.sql("""
                    update spline_authoring_overlay
                    set status='DISCOVERY_QUEUED',
                        discovery_notes=null,
                        updated_at=now()
                    where project_id=:projectId
                      and scene_fingerprint=:fingerprint
                      and slot_key=:slotKey
                      and status='PENDING_DISCOVERY'
                    """)
                    .param("projectId", PROJECT_ID)
                    .param("fingerprint", fingerprint.orElseThrow())
                    .param("slotKey", target.slotKey())
                    .update();
        }

        writeEvent(
                orchestrationJobId,
                taskId,
                "SPLINE_AUTHORING_OVERLAY_DISCOVERY_QUEUED",
                "Read-only batched authoring overlay discovery queued.",
                Map.of(
                        "productionJobId", productionJobId,
                        "sceneFingerprint", fingerprint.orElseThrow(),
                        "batchSize", targets.size(),
                        "slotKeys", targets.stream().map(DiscoveryTarget::slotKey).toList()
                )
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "QUEUED");
        result.put("productionJobId", productionJobId);
        result.put("jobId", orchestrationJobId);
        result.put("taskId", taskId);
        result.put("sceneFingerprint", fingerprint.orElseThrow());
        result.put("executionProfile", "AUTHORING_OVERLAY_DISCOVERY_V1");
        result.put("batchSize", targets.size());
        result.put("targets", targetPayload);
        return result;
    }

    @Transactional
    public Map<String, Object> applyDiscovery(
            Map<String, Object> jobPayload,
            Map<String, Object> discovery,
            String workerId
    ) {
        String expectedFingerprint = stringValue(jobPayload.get("sceneFingerprint"));
        String resultFingerprint = stringValue(discovery == null ? null : discovery.get("sceneFingerprint"));

        if (expectedFingerprint == null || expectedFingerprint.isBlank()) {
            throw new IllegalArgumentException("Authoring discovery job has no scene fingerprint.");
        }
        if (resultFingerprint == null || !expectedFingerprint.equals(resultFingerprint)) {
            throw new IllegalArgumentException("Authoring discovery result scene fingerprint does not match the queued job.");
        }

        Set<String> expectedSlotKeys = discoverySlotKeys(jobPayload);
        if (expectedSlotKeys.isEmpty()) {
            throw new IllegalArgumentException("Authoring discovery job has no target slot keys.");
        }

        Object rawItems = discovery.get("items");
        if (!(rawItems instanceof List<?> items)) {
            throw new IllegalArgumentException("Authoring discovery result is missing items.");
        }

        Set<String> returnedSlotKeys = new HashSet<>();
        int ready = 0;
        int partial = 0;

        for (Object value : items) {
            if (!(value instanceof Map<?, ?> rawItem)) continue;
            Map<String, Object> item = copyMap(rawItem);
            String slotKey = stringValue(item.get("slotKey"));
            if (slotKey == null || !expectedSlotKeys.contains(slotKey) || !returnedSlotKeys.add(slotKey)) {
                continue;
            }

            Map<String, Object> label = item.get("label") instanceof Map<?, ?> rawLabel
                    ? copyMap(rawLabel)
                    : Map.of();
            Map<String, Object> coverage = item.get("coverage") instanceof Map<?, ?> rawCoverage
                    ? copyMap(rawCoverage)
                    : Map.of();

            String labelTargetPath = stringValue(label.get("targetPath"));
            String labelCurrentText = stringValue(label.get("currentText"));
            List<Object> states = safeList(item.get("states"));
            List<Object> actionGraph = safeList(item.get("actionGraph"));
            List<Object> eventBindings = safeList(item.get("eventBindings"));
            String notes = stringValue(item.get("notes"));

            boolean coverageDeclared = coverage.containsKey("label")
                    && coverage.containsKey("states")
                    && coverage.containsKey("events")
                    && coverage.containsKey("actions");
            boolean coverageTerminal = coverageDeclared
                    && Set.of("EXPOSED", "NOT_FOUND", "NOT_EXPOSED").contains(stringValue(coverage.get("label")))
                    && Set.of("EXPOSED", "CONFIRMED_EMPTY", "NOT_EXPOSED").contains(stringValue(coverage.get("states")))
                    && Set.of("EXPOSED", "CONFIRMED_EMPTY", "NOT_EXPOSED").contains(stringValue(coverage.get("events")))
                    && Set.of("EXPOSED", "CONFIRMED_EMPTY", "NOT_EXPOSED").contains(stringValue(coverage.get("actions")));
            String status = coverageTerminal
                    ? "READY"
                    : "DISCOVERED_PARTIAL";

            int updated = jdbc.sql("""
                    update spline_authoring_overlay
                    set status=:status,
                        label_target_path=:labelTargetPath,
                        label_current_text=:labelCurrentText,
                        state_definitions=cast(:states as jsonb),
                        action_graph=cast(:actionGraph as jsonb),
                        event_bindings=cast(:eventBindings as jsonb),
                        discovery_coverage=cast(:coverage as jsonb),
                        discovery_notes=:notes,
                        discovered_by=:workerId,
                        discovered_at=now(),
                        updated_at=now()
                    where project_id=:projectId
                      and scene_fingerprint=:fingerprint
                      and slot_key=:slotKey
                      and status in ('DISCOVERY_QUEUED','PENDING_DISCOVERY','DISCOVERED_PARTIAL')
                    """)
                    .param("status", status)
                    .param("labelTargetPath", labelTargetPath)
                    .param("labelCurrentText", labelCurrentText)
                    .param("states", writeJson(states))
                    .param("actionGraph", writeJson(actionGraph))
                    .param("eventBindings", writeJson(eventBindings))
                    .param("coverage", writeJson(coverage))
                    .param("notes", truncate(notes, 1500))
                    .param("workerId", workerId)
                    .param("projectId", PROJECT_ID)
                    .param("fingerprint", expectedFingerprint)
                    .param("slotKey", slotKey)
                    .update();

            if (updated > 0) {
                if ("READY".equals(status)) ready++;
                else partial++;
            }
        }

        int retryPending = 0;
        for (String slotKey : expectedSlotKeys) {
            if (returnedSlotKeys.contains(slotKey)) continue;
            retryPending += jdbc.sql("""
                    update spline_authoring_overlay
                    set status='PENDING_DISCOVERY',
                        discovery_notes='Discovery result omitted this slot; retry remains pending.',
                        updated_at=now()
                    where project_id=:projectId
                      and scene_fingerprint=:fingerprint
                      and slot_key=:slotKey
                      and status='DISCOVERY_QUEUED'
                    """)
                    .param("projectId", PROJECT_ID)
                    .param("fingerprint", expectedFingerprint)
                    .param("slotKey", slotKey)
                    .update();
        }

        log.info(
                "Spline authoring overlay discovery applied fingerprint={} worker={} targets={} ready={} partial={} retryPending={}",
                expectedFingerprint.substring(0, Math.min(12, expectedFingerprint.length())),
                workerId,
                expectedSlotKeys.size(),
                ready,
                partial,
                retryPending
        );

        return Map.of(
                "status", "APPLIED",
                "targetCount", expectedSlotKeys.size(),
                "ready", ready,
                "partial", partial,
                "retryPending", retryPending
        );
    }

    @Transactional
    public void markDiscoveryFailed(Map<String, Object> jobPayload, String error) {
        String fingerprint = stringValue(jobPayload.get("sceneFingerprint"));
        if (fingerprint == null) return;

        for (String slotKey : discoverySlotKeys(jobPayload)) {
            jdbc.sql("""
                    update spline_authoring_overlay
                    set status='PENDING_DISCOVERY',
                        discovery_notes=:notes,
                        updated_at=now()
                    where project_id=:projectId
                      and scene_fingerprint=:fingerprint
                      and slot_key=:slotKey
                      and status='DISCOVERY_QUEUED'
                    """)
                    .param("notes", truncate("Discovery job failed: " + Objects.toString(error, "unknown error"), 1500))
                    .param("projectId", PROJECT_ID)
                    .param("fingerprint", fingerprint)
                    .param("slotKey", slotKey)
                    .update();
        }
    }

    public Map<String, Object> latestSummary() {
        var fingerprint = latestSceneFingerprint();
        return fingerprint.map(this::summaryFor).orElseGet(() -> Map.of("status", "EMPTY"));
    }

    public Map<String, Object> latest() {
        var fingerprint = latestSceneFingerprint();
        if (fingerprint.isEmpty()) {
            return Map.of("status", "EMPTY", "overlays", List.of());
        }

        List<Map<String, Object>> overlays = loadOverlayRows(fingerprint.orElseThrow(), null, 500);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "READY");
        result.put("sceneFingerprint", fingerprint.orElseThrow());
        result.put("globalActiveObjectLabelVariable", "AT_ACTIVE_OBJECT_LABEL");
        result.put("overlayCount", overlays.size());
        result.put("overlays", overlays);
        return result;
    }

    public Map<String, Object> pending(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        var fingerprint = latestSceneFingerprint();
        if (fingerprint.isEmpty()) {
            return Map.of("status", "EMPTY", "overlays", List.of());
        }

        List<Map<String, Object>> overlays = loadOverlayRows(
                fingerprint.orElseThrow(),
                "PENDING_DISCOVERY",
                safeLimit
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "READY");
        result.put("sceneFingerprint", fingerprint.orElseThrow());
        result.put("count", overlays.size());
        result.put("overlays", overlays);
        return result;
    }

    String requestedLabelVariable(String objectName, String objectUuid) {
        String slug = objectName == null ? "" : objectName.toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        if (slug.isBlank()) slug = "OBJECT";
        if (slug.length() > 62) slug = slug.substring(0, 62);

        String uuid = objectUuid == null ? "" : objectUuid.replaceAll("[^A-Za-z0-9]", "");
        if (uuid.length() > 8) uuid = uuid.substring(0, 8);
        if (uuid.isBlank()) uuid = "UNKNOWN";

        return "AT_" + slug + "_LABEL_" + uuid.toUpperCase(Locale.ROOT);
    }

    private Map<String, Object> summaryFor(String fingerprint) {
        return jdbc.sql("""
                select count(*) as overlay_count,
                       count(*) filter (where status='PENDING_DISCOVERY') as pending_count,
                       count(*) filter (where status='DISCOVERY_QUEUED') as queued_count,
                       count(*) filter (where status='DISCOVERED_PARTIAL') as partial_count,
                       count(*) filter (where status='AUTHORING_ADDRESS_UNRESOLVED') as address_unresolved_count,
                       count(*) filter (where status='READY') as ready_count,
                       count(*) filter (where semantic_role='UNCLASSIFIED') as unclassified_count,
                       count(*) filter (where label_target_path is null) as labels_unbound
                from spline_authoring_overlay
                where project_id=:projectId and scene_fingerprint=:fingerprint
                """)
                .param("projectId", PROJECT_ID)
                .param("fingerprint", fingerprint)
                .query((rs, rowNum) -> {
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("status", "READY");
                    result.put("sceneFingerprint", fingerprint);
                    result.put("overlayCount", rs.getLong("overlay_count"));
                    result.put("pendingDiscovery", rs.getLong("pending_count"));
                    result.put("discoveryQueued", rs.getLong("queued_count"));
                    result.put("discoveredPartial", rs.getLong("partial_count"));
                    result.put("authoringAddressUnresolved", rs.getLong("address_unresolved_count"));
                    result.put("ready", rs.getLong("ready_count"));
                    result.put("semanticRoleUnclassified", rs.getLong("unclassified_count"));
                    result.put("labelsUnbound", rs.getLong("labels_unbound"));
                    result.put("globalActiveObjectLabelVariable", "AT_ACTIVE_OBJECT_LABEL");
                    return result;
                })
                .single();
    }

    private Optional<String> latestSceneFingerprint() {
        return jdbc.sql("""
                select scene_fingerprint
                from spline_scene_slot_registry
                where project_id=:projectId
                order by updated_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query(String.class)
                .optional();
    }

    private List<SlotRow> loadSlots(String fingerprint) {
        return jdbc.sql("""
                select id, slot_key, object_uuid, object_name, editor_path
                from spline_scene_slot_registry
                where project_id=:projectId and scene_fingerprint=:fingerprint
                order by object_name
                """)
                .param("projectId", PROJECT_ID)
                .param("fingerprint", fingerprint)
                .query((rs, rowNum) -> new SlotRow(
                        rs.getObject("id", UUID.class),
                        rs.getString("slot_key"),
                        rs.getString("object_uuid"),
                        rs.getString("object_name"),
                        rs.getString("editor_path")
                ))
                .list();
    }

    private List<String> authoringObjectIds(Object evidenceValue) {
        if (!(evidenceValue instanceof Map<?, ?> rawEvidence)) return List.of();
        Object rawTargets = rawEvidence.get("authoringTargets");
        if (!(rawTargets instanceof List<?> targets)) return List.of();

        LinkedHashSet<String> ids = new LinkedHashSet<>();
        for (Object value : targets) {
            if (!(value instanceof Map<?, ?> target)) continue;
            String objectId = stringValue(target.get("objectId"));
            if (objectId != null) ids.add(objectId);
        }
        return List.copyOf(ids);
    }

    private Set<String> discoverySlotKeys(Map<String, Object> payload) {
        Object raw = payload.get("overlays");
        if (!(raw instanceof List<?> overlays)) return Set.of();

        Set<String> keys = new LinkedHashSet<>();
        for (Object value : overlays) {
            if (!(value instanceof Map<?, ?> item)) continue;
            String slotKey = stringValue(item.get("slotKey"));
            if (slotKey != null && !slotKey.isBlank()) keys.add(slotKey);
        }
        return keys;
    }

    private List<Map<String, Object>> loadOverlayRows(String fingerprint, String status, int limit) {
        String sql = status == null
                ? """
                  select slot_key, object_uuid, object_name, editor_path, status,
                         semantic_role, requested_label_variable, label_target_path,
                         label_current_text, state_definitions::text, action_graph::text,
                         event_bindings::text, discovery_coverage::text, discovery_notes,
                         discovered_by, discovered_at, updated_at
                  from spline_authoring_overlay
                  where project_id=:projectId and scene_fingerprint=:fingerprint
                  order by object_name
                  limit :limit
                  """
                : """
                  select slot_key, object_uuid, object_name, editor_path, status,
                         semantic_role, requested_label_variable, label_target_path,
                         label_current_text, state_definitions::text, action_graph::text,
                         event_bindings::text, discovery_coverage::text, discovery_notes,
                         discovered_by, discovered_at, updated_at
                  from spline_authoring_overlay
                  where project_id=:projectId and scene_fingerprint=:fingerprint
                    and status=:status
                  order by object_name
                  limit :limit
                  """;

        var spec = jdbc.sql(sql)
                .param("projectId", PROJECT_ID)
                .param("fingerprint", fingerprint)
                .param("limit", limit);

        if (status != null) spec = spec.param("status", status);

        return spec.query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("slotKey", rs.getString("slot_key"));
                    item.put("objectUuid", rs.getString("object_uuid"));
                    item.put("objectName", rs.getString("object_name"));
                    item.put("editorPath", rs.getString("editor_path"));
                    item.put("status", rs.getString("status"));
                    item.put("semanticRole", rs.getString("semantic_role"));
                    item.put("requestedLabelVariable", rs.getString("requested_label_variable"));
                    item.put("labelTargetPath", rs.getString("label_target_path"));
                    item.put("labelCurrentText", rs.getString("label_current_text"));
                    item.put("stateDefinitions", readJson(rs.getString("state_definitions")));
                    item.put("actionGraph", readJson(rs.getString("action_graph")));
                    item.put("eventBindings", readJson(rs.getString("event_bindings")));
                    item.put("discoveryCoverage", readJson(rs.getString("discovery_coverage")));
                    item.put("discoveryNotes", rs.getString("discovery_notes"));
                    item.put("discoveredBy", rs.getString("discovered_by"));
                    item.put("discoveredAt", rs.getObject("discovered_at", OffsetDateTime.class));
                    item.put("updatedAt", rs.getObject("updated_at", OffsetDateTime.class));
                    return item;
                })
                .list();
    }

    private void writeEvent(
            UUID orchestrationJobId,
            UUID taskId,
            String type,
            String message,
            Map<String, Object> payload
    ) {
        jdbc.sql("""
                insert into event(id, project_id, job_id, task_id, event_type, message, payload)
                values (:id, :projectId, :jobId, :taskId, :type, :message, cast(:payload as jsonb))
                """)
                .param("id", UUID.randomUUID())
                .param("projectId", PROJECT_ID)
                .param("jobId", orchestrationJobId)
                .param("taskId", taskId)
                .param("type", type)
                .param("message", message)
                .param("payload", writeJson(payload))
                .update();
    }

    private List<Object> safeList(Object value) {
        if (value instanceof List<?> list) {
            return new ArrayList<>(list);
        }
        return List.of();
    }

    private Map<String, Object> copyMap(Map<?, ?> raw) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (var entry : raw.entrySet()) {
            result.put(String.valueOf(entry.getKey()), entry.getValue());
        }
        return result;
    }

    private String stringValue(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        return text.isBlank() || "null".equalsIgnoreCase(text) ? null : text;
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) return value;
        return value.substring(0, maxLength);
    }

    private Object readJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Invalid Spline authoring overlay JSON.", e);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialize Spline authoring overlay JSON.", e);
        }
    }

    private record SlotRow(
            UUID id,
            String slotKey,
            String objectUuid,
            String objectName,
            String editorPath
    ) {}

    private record DiscoveryTarget(
            String slotKey,
            String objectUuid,
            String objectName,
            String editorPath,
            String requestedLabelVariable,
            String candidateKind,
            List<String> authoringObjectIds
    ) {}
}
