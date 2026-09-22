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
                        state_definitions, action_graph, event_bindings, updated_at
                    )
                    values (
                        :id, :projectId, :fingerprint, :slotRegistryId,
                        :slotKey, :objectUuid, :objectName, :editorPath,
                        'PENDING_DISCOVERY', 'UNCLASSIFIED', :requestedLabelVariable,
                        '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, now()
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

    private List<Map<String, Object>> loadOverlayRows(String fingerprint, String status, int limit) {
        String sql = status == null
                ? """
                  select slot_key, object_uuid, object_name, editor_path, status,
                         semantic_role, requested_label_variable, label_target_path,
                         label_current_text, state_definitions::text, action_graph::text,
                         event_bindings::text, discovered_by, discovered_at, updated_at
                  from spline_authoring_overlay
                  where project_id=:projectId and scene_fingerprint=:fingerprint
                  order by object_name
                  limit :limit
                  """
                : """
                  select slot_key, object_uuid, object_name, editor_path, status,
                         semantic_role, requested_label_variable, label_target_path,
                         label_current_text, state_definitions::text, action_graph::text,
                         event_bindings::text, discovered_by, discovered_at, updated_at
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
                    item.put("discoveredBy", rs.getString("discovered_by"));
                    item.put("discoveredAt", rs.getObject("discovered_at", OffsetDateTime.class));
                    item.put("updatedAt", rs.getObject("updated_at", OffsetDateTime.class));
                    return item;
                })
                .list();
    }

    private Object readJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Invalid Spline authoring overlay JSON.", e);
        }
    }

    private record SlotRow(
            UUID id,
            String slotKey,
            String objectUuid,
            String objectName,
            String editorPath
    ) {}
}
