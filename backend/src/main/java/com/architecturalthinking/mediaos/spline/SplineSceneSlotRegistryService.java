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
public class SplineSceneSlotRegistryService {

    private static final Logger log = LoggerFactory.getLogger(SplineSceneSlotRegistryService.class);
    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final Set<String> STRUCTURAL_SUFFIXES = Set.of(
            "BODY", "BORDER", "TEXT", "TITLE", "ICON", "LABEL",
            "BG", "BACKGROUND", "OUTLINE", "GLOW", "SHADOW"
    );

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final SplineAuthoringOverlayRegistryService overlayRegistryService;

    public SplineSceneSlotRegistryService(
            JdbcClient jdbc,
            ObjectMapper objectMapper,
            SplineAuthoringOverlayRegistryService overlayRegistryService
    ) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.overlayRegistryService = overlayRegistryService;
    }

    @Transactional
    public Map<String, Object> rebuild(
            UUID capabilityCatalogId,
            String sceneFingerprint,
            Map<String, Object> capabilityCatalog
    ) {
        List<SlotCandidate> candidates = deriveCandidates(capabilityCatalog);

        jdbc.sql("""
                delete from spline_scene_slot_registry
                where project_id=:projectId and scene_fingerprint=:fingerprint
                """)
                .param("projectId", PROJECT_ID)
                .param("fingerprint", sceneFingerprint)
                .update();

        for (SlotCandidate candidate : candidates) {
            jdbc.sql("""
                    insert into spline_scene_slot_registry(
                        id, project_id, scene_fingerprint, capability_catalog_id,
                        slot_key, object_uuid, object_name, editor_path,
                        candidate_kind, status, semantic_role, address_strategy,
                        placement_strategy, visibility_strategy, label_strategy,
                        behavior_strategy, clone_strategy, evidence, updated_at
                    )
                    values (
                        :id, :projectId, :fingerprint, :catalogId,
                        :slotKey, :objectUuid, :objectName, :editorPath,
                        :candidateKind, :status, 'UNCLASSIFIED', :addressStrategy,
                        :placementStrategy, :visibilityStrategy, :labelStrategy,
                        :behaviorStrategy, :cloneStrategy, cast(:evidence as jsonb), now()
                    )
                    """)
                    .param("id", UUID.randomUUID())
                    .param("projectId", PROJECT_ID)
                    .param("fingerprint", sceneFingerprint)
                    .param("catalogId", capabilityCatalogId)
                    .param("slotKey", candidate.slotKey())
                    .param("objectUuid", candidate.objectUuid())
                    .param("objectName", candidate.objectName())
                    .param("editorPath", candidate.editorPath())
                    .param("candidateKind", candidate.candidateKind())
                    .param("status", candidate.status())
                    .param("addressStrategy", candidate.addressStrategy())
                    .param("placementStrategy", candidate.placementStrategy())
                    .param("visibilityStrategy", candidate.visibilityStrategy())
                    .param("labelStrategy", candidate.labelStrategy())
                    .param("behaviorStrategy", candidate.behaviorStrategy())
                    .param("cloneStrategy", candidate.cloneStrategy())
                    .param("evidence", writeJson(candidate.evidence()))
                    .update();
        }

        Map<String, Object> summary = summarize(sceneFingerprint, candidates);
        logSummary(sceneFingerprint, candidates, summary);

        if (overlayRegistryService != null) {
            try {
                overlayRegistryService.syncFromSlots(sceneFingerprint);
            } catch (RuntimeException ex) {
                log.warn("Spline authoring overlay sync failed without failing the scene slot registry: {}", ex.getMessage());
            }
        }

        return summary;
    }

    public Map<String, Object> latestSummary() {
        List<Map<String, Object>> slots = latestSlotRows();
        if (slots.isEmpty()) {
            return Map.of("status", "EMPTY");
        }

        String fingerprint = String.valueOf(slots.get(0).get("sceneFingerprint"));
        List<SlotCandidate> candidates = slots.stream()
                .map(this::rowToCandidate)
                .toList();

        return summarize(fingerprint, candidates);
    }

    public Map<String, Object> latest() {
        List<Map<String, Object>> slots = latestSlotRows();
        if (slots.isEmpty()) {
            return Map.of("status", "EMPTY", "slots", List.of());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "READY");
        result.put("sceneFingerprint", slots.get(0).get("sceneFingerprint"));
        result.put("slotCount", slots.size());
        result.put("slots", slots);
        return result;
    }

    List<SlotCandidate> deriveCandidates(Map<String, Object> capabilityCatalog) {
        Object rawObjects = capabilityCatalog.get("objects");
        if (!(rawObjects instanceof List<?> items)) {
            return List.of();
        }

        List<Map<String, Object>> objects = new ArrayList<>();
        Map<String, Map<String, Object>> uniqueByName = new LinkedHashMap<>();

        for (Object value : items) {
            if (!(value instanceof Map<?, ?> raw)) continue;
            Map<String, Object> object = new LinkedHashMap<>();
            for (var entry : raw.entrySet()) {
                object.put(String.valueOf(entry.getKey()), entry.getValue());
            }
            objects.add(object);

            if (Boolean.TRUE.equals(object.get("stableUniqueName"))) {
                String name = String.valueOf(object.getOrDefault("name", ""));
                if (!name.isBlank()) uniqueByName.put(name, object);
            }
        }

        Map<String, List<String>> companionsByBase = new LinkedHashMap<>();
        for (Map<String, Object> object : objects) {
            String name = String.valueOf(object.getOrDefault("name", ""));
            String base = structuralBaseName(name);
            if (base != null) {
                companionsByBase.computeIfAbsent(base, ignored -> new ArrayList<>()).add(name);
            }
        }

        List<SlotCandidate> candidates = new ArrayList<>();

        for (var entry : uniqueByName.entrySet()) {
            String name = entry.getKey();
            Map<String, Object> object = entry.getValue();

            if (!isCandidateName(name)) continue;

            @SuppressWarnings("unchecked")
            Map<String, Object> editorHierarchy = object.get("editorHierarchy") instanceof Map<?, ?> map
                    ? copyMap(map)
                    : Map.of();

            boolean uniqueEditorGroup =
                    "MATCHED_UNIQUE_NAME".equals(editorHierarchy.get("matchStatus"))
                            && intValue(editorHierarchy.get("knownChildCount")) > 0;

            List<String> companions = companionsByBase.getOrDefault(name, List.of()).stream()
                    .distinct()
                    .sorted(String.CASE_INSENSITIVE_ORDER)
                    .toList();
            boolean visualFamily = companions.size() >= 2;

            if (!uniqueEditorGroup && !visualFamily) continue;

            @SuppressWarnings("unchecked")
            Map<String, Object> runtimeCapabilities = object.get("runtimeCapabilities") instanceof Map<?, ?> map
                    ? copyMap(map)
                    : Map.of();

            boolean transform = Boolean.TRUE.equals(runtimeCapabilities.get("transform"));
            boolean visibility = Boolean.TRUE.equals(runtimeCapabilities.get("visibility"));
            boolean runtimeText = Boolean.TRUE.equals(runtimeCapabilities.get("runtimeText"));

            String editorPath = stringValue(editorHierarchy.get("path"));
            String candidateKind = uniqueEditorGroup && visualFamily
                    ? "EDITOR_GROUP_AND_VISUAL_FAMILY"
                    : uniqueEditorGroup ? "EDITOR_GROUP" : "VISUAL_FAMILY";

            List<String> reasons = new ArrayList<>();
            if (uniqueEditorGroup) reasons.add("UNIQUE_EDITOR_GROUP_WITH_CHILDREN");
            if (visualFamily) reasons.add("STRUCTURAL_COMPANION_FAMILY");

            Map<String, Object> evidence = new LinkedHashMap<>();
            evidence.put("reasons", reasons);
            evidence.put("editorHierarchy", editorHierarchy);
            evidence.put("structuralCompanions", companions);
            evidence.put("directOperations", object.getOrDefault("directOperations", List.of()));
            evidence.put("authoredEventRefCount", object.getOrDefault("authoredEventRefCount", 0));
            evidence.put("stableUniqueName", true);

            candidates.add(new SlotCandidate(
                    slotKey(name, String.valueOf(object.get("uuid"))),
                    String.valueOf(object.get("uuid")),
                    name,
                    editorPath,
                    candidateKind,
                    "CANDIDATE_NEEDS_AUTHORING_OVERLAY",
                    editorPath == null ? "RUNTIME_UNIQUE_NAME" : "EDITOR_PATH_AND_RUNTIME_NAME",
                    transform ? "RUNTIME_DIRECT" : "UNAVAILABLE",
                    visibility ? "RUNTIME_DIRECT" : "UNAVAILABLE",
                    runtimeText ? "RUNTIME_DIRECT" : "AUTHORING_VARIABLE_REQUIRED",
                    "AUTHORING_OVERLAY_REQUIRED",
                    "RUNTIME_DIRECT",
                    evidence
            ));
        }

        candidates.sort(Comparator
                .comparing(SlotCandidate::candidateKind)
                .thenComparing(SlotCandidate::objectName, String.CASE_INSENSITIVE_ORDER));

        return candidates;
    }

    private Map<String, Object> summarize(String fingerprint, List<SlotCandidate> candidates) {
        long runtimePlacement = candidates.stream().filter(c -> "RUNTIME_DIRECT".equals(c.placementStrategy())).count();
        long runtimeVisibility = candidates.stream().filter(c -> "RUNTIME_DIRECT".equals(c.visibilityStrategy())).count();
        long variableLabels = candidates.stream().filter(c -> "AUTHORING_VARIABLE_REQUIRED".equals(c.labelStrategy())).count();
        long editorGroups = candidates.stream().filter(c -> c.candidateKind().contains("EDITOR_GROUP")).count();
        long visualFamilies = candidates.stream().filter(c -> c.candidateKind().contains("VISUAL_FAMILY")).count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("status", "READY");
        summary.put("sceneFingerprint", fingerprint);
        summary.put("slotCandidateCount", candidates.size());
        summary.put("runtimePlacementReady", runtimePlacement);
        summary.put("runtimeVisibilityReady", runtimeVisibility);
        summary.put("labelVariableAuthoringRequired", variableLabels);
        summary.put("behaviorOverlayRequired", candidates.size());
        summary.put("semanticRoleUnclassified", candidates.size());
        summary.put("editorGroupCandidates", editorGroups);
        summary.put("visualFamilyCandidates", visualFamilies);
        summary.put("preferredEpisodeReuseMode", "FIXED_SLOT_AFTER_PARAMETERIZATION");
        return summary;
    }

    private void logSummary(
            String fingerprint,
            List<SlotCandidate> candidates,
            Map<String, Object> summary
    ) {
        String preview = candidates.stream()
                .limit(25)
                .map(candidate -> candidate.objectName() + "[" + candidate.candidateKind() + "]")
                .reduce((left, right) -> left + ", " + right)
                .orElse("none");

        log.info(
                "Spline scene slot registry built fingerprint={} candidates={} placementReady={} visibilityReady={} labelsNeedVariable={} editorGroups={} visualFamilies={} preview=[{}]",
                fingerprint.substring(0, Math.min(12, fingerprint.length())),
                summary.get("slotCandidateCount"),
                summary.get("runtimePlacementReady"),
                summary.get("runtimeVisibilityReady"),
                summary.get("labelVariableAuthoringRequired"),
                summary.get("editorGroupCandidates"),
                summary.get("visualFamilyCandidates"),
                preview
        );
    }

    private List<Map<String, Object>> latestSlotRows() {
        var fingerprint = jdbc.sql("""
                select scene_fingerprint
                from spline_capability_catalog
                where project_id=:projectId
                order by built_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query(String.class)
                .optional();

        if (fingerprint.isEmpty()) return List.of();

        return jdbc.sql("""
                select slot_key, object_uuid, object_name, editor_path,
                       candidate_kind, status, semantic_role, address_strategy,
                       placement_strategy, visibility_strategy, label_strategy,
                       behavior_strategy, clone_strategy, evidence::text, updated_at
                from spline_scene_slot_registry
                where project_id=:projectId and scene_fingerprint=:fingerprint
                order by candidate_kind, object_name
                """)
                .param("projectId", PROJECT_ID)
                .param("fingerprint", fingerprint.orElseThrow())
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("sceneFingerprint", fingerprint.orElseThrow());
                    item.put("slotKey", rs.getString("slot_key"));
                    item.put("objectUuid", rs.getString("object_uuid"));
                    item.put("objectName", rs.getString("object_name"));
                    item.put("editorPath", rs.getString("editor_path"));
                    item.put("candidateKind", rs.getString("candidate_kind"));
                    item.put("status", rs.getString("status"));
                    item.put("semanticRole", rs.getString("semantic_role"));
                    item.put("addressStrategy", rs.getString("address_strategy"));
                    item.put("placementStrategy", rs.getString("placement_strategy"));
                    item.put("visibilityStrategy", rs.getString("visibility_strategy"));
                    item.put("labelStrategy", rs.getString("label_strategy"));
                    item.put("behaviorStrategy", rs.getString("behavior_strategy"));
                    item.put("cloneStrategy", rs.getString("clone_strategy"));
                    item.put("evidence", readMap(rs.getString("evidence")));
                    item.put("updatedAt", rs.getObject("updated_at", OffsetDateTime.class));
                    return item;
                })
                .list();
    }

    private SlotCandidate rowToCandidate(Map<String, Object> row) {
        @SuppressWarnings("unchecked")
        Map<String, Object> evidence = row.get("evidence") instanceof Map<?, ?> map ? copyMap(map) : Map.of();

        return new SlotCandidate(
                String.valueOf(row.get("slotKey")),
                String.valueOf(row.get("objectUuid")),
                String.valueOf(row.get("objectName")),
                stringValue(row.get("editorPath")),
                String.valueOf(row.get("candidateKind")),
                String.valueOf(row.get("status")),
                String.valueOf(row.get("addressStrategy")),
                String.valueOf(row.get("placementStrategy")),
                String.valueOf(row.get("visibilityStrategy")),
                String.valueOf(row.get("labelStrategy")),
                String.valueOf(row.get("behaviorStrategy")),
                String.valueOf(row.get("cloneStrategy")),
                evidence
        );
    }

    private String structuralBaseName(String name) {
        if (name == null || name.isBlank()) return null;
        String upper = name.toUpperCase(Locale.ROOT);
        for (String suffix : STRUCTURAL_SUFFIXES) {
            String ending = "_" + suffix;
            if (upper.endsWith(ending) && name.length() > ending.length()) {
                return name.substring(0, name.length() - ending.length());
            }
        }
        return null;
    }

    private boolean isCandidateName(String name) {
        if (name == null || name.isBlank()) return false;
        String upper = name.toUpperCase(Locale.ROOT);
        return !upper.startsWith("CAM_")
                && !upper.startsWith("CAM_TRG_")
                && !upper.startsWith("MEDIA_OS_")
                && !"ICONS".equals(upper);
    }

    private String slotKey(String name, String uuid) {
        String slug = name.toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        if (slug.length() > 110) slug = slug.substring(0, 110);

        String safeUuid = uuid == null ? "UNKNOWN" : uuid.replaceAll("[^A-Za-z0-9]", "");
        if (safeUuid.length() > 8) safeUuid = safeUuid.substring(0, 8);
        if (safeUuid.isBlank()) safeUuid = "UNKNOWN";

        return "AT_SLOT_" + slug + "_" + safeUuid.toUpperCase(Locale.ROOT);
    }

    private int intValue(Object value) {
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }

    private String stringValue(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value);
        if (text.isBlank() || "null".equalsIgnoreCase(text)) return null;
        return text;
    }

    private Map<String, Object> copyMap(Map<?, ?> raw) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (var entry : raw.entrySet()) {
            result.put(String.valueOf(entry.getKey()), entry.getValue());
        }
        return result;
    }

    private Map<String, Object> readMap(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Invalid Spline scene slot registry JSON.", e);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialize Spline scene slot registry JSON.", e);
        }
    }

    record SlotCandidate(
            String slotKey,
            String objectUuid,
            String objectName,
            String editorPath,
            String candidateKind,
            String status,
            String addressStrategy,
            String placementStrategy,
            String visibilityStrategy,
            String labelStrategy,
            String behaviorStrategy,
            String cloneStrategy,
            Map<String, Object> evidence
    ) {}
}
