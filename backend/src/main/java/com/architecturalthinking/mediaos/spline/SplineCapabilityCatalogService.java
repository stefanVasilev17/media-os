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
public class SplineCapabilityCatalogService {

    private static final Logger log = LoggerFactory.getLogger(SplineCapabilityCatalogService.class);
    private static final UUID PROJECT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final int SCHEMA_VERSION = 2;

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;

    public SplineCapabilityCatalogService(JdbcClient jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Map<String, Object> rebuildLatest() {
        var latest = jdbc.sql("""
                select id, scene_fingerprint, blueprint::text
                from spline_scene_blueprint
                where project_id=:projectId
                order by captured_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> new LatestBlueprint(
                        rs.getObject("id", UUID.class),
                        rs.getString("scene_fingerprint"),
                        readMap(rs.getString("blueprint"))
                ))
                .optional();

        if (latest.isEmpty()) {
            return Map.of("status", "EMPTY");
        }

        LatestBlueprint blueprint = latest.orElseThrow();
        return rebuild(blueprint.id(), blueprint.fingerprint(), blueprint.blueprint());
    }

    @Transactional
    public Map<String, Object> rebuild(UUID blueprintId, String sceneFingerprint, Map<String, Object> blueprint) {
        Map<String, Object> editorCatalog = loadLatestEditorCatalog().orElse(null);
        Map<String, Object> catalog = buildCatalogDocument(sceneFingerprint, blueprint, editorCatalog);

        @SuppressWarnings("unchecked")
        Map<String, Object> summary = (Map<String, Object>) catalog.get("summary");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> objects = (List<Map<String, Object>>) catalog.get("objects");

        UUID id = jdbc.sql("""
                insert into spline_capability_catalog(
                    id, project_id, scene_blueprint_id, schema_version,
                    scene_fingerprint, object_count, summary, catalog, built_at
                )
                values (
                    :id, :projectId, :blueprintId, :schemaVersion,
                    :fingerprint, :objectCount, cast(:summary as jsonb), cast(:catalog as jsonb), now()
                )
                on conflict(project_id, scene_fingerprint)
                do update set
                    scene_blueprint_id=excluded.scene_blueprint_id,
                    schema_version=excluded.schema_version,
                    object_count=excluded.object_count,
                    summary=excluded.summary,
                    catalog=excluded.catalog,
                    built_at=now()
                returning id
                """)
                .param("id", UUID.randomUUID())
                .param("projectId", PROJECT_ID)
                .param("blueprintId", blueprintId)
                .param("schemaVersion", SCHEMA_VERSION)
                .param("fingerprint", sceneFingerprint)
                .param("objectCount", objects.size())
                .param("summary", writeJson(summary))
                .param("catalog", writeJson(catalog))
                .query(UUID.class)
                .single();

        logSummary(sceneFingerprint, summary);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "READY");
        result.put("id", id);
        result.put("sceneFingerprint", sceneFingerprint);
        result.put("objectCount", objects.size());
        result.put("summary", summary);
        return result;
    }

    public Map<String, Object> latestSummary() {
        return jdbc.sql("""
                select id, schema_version, scene_fingerprint, object_count,
                       summary::text, built_at
                from spline_capability_catalog
                where project_id=:projectId
                order by built_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query((rs, rowNum) -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("status", "READY");
                    item.put("id", rs.getObject("id", UUID.class));
                    item.put("schemaVersion", rs.getInt("schema_version"));
                    item.put("sceneFingerprint", rs.getString("scene_fingerprint"));
                    item.put("objectCount", rs.getInt("object_count"));
                    item.put("summary", readMap(rs.getString("summary")));
                    item.put("builtAt", rs.getObject("built_at", OffsetDateTime.class));
                    return item;
                })
                .optional()
                .orElseGet(() -> Map.of("status", "EMPTY"));
    }

    public Map<String, Object> latestObject(String objectName) {
        if (objectName == null || objectName.isBlank()) {
            return Map.of("status", "INVALID");
        }

        var catalog = jdbc.sql("""
                select catalog::text
                from spline_capability_catalog
                where project_id=:projectId
                order by built_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query(String.class)
                .optional();

        if (catalog.isEmpty()) {
            return Map.of("status", "EMPTY");
        }

        Map<String, Object> document = readMap(catalog.orElseThrow());
        Object rawObjects = document.get("objects");
        if (!(rawObjects instanceof List<?> items)) {
            return Map.of("status", "EMPTY");
        }

        List<Object> matches = items.stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .filter(item -> objectName.equalsIgnoreCase(String.valueOf(item.getOrDefault("name", ""))))
                .map(item -> (Object) item)
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", matches.isEmpty() ? "NOT_FOUND" : "READY");
        result.put("name", objectName);
        result.put("matches", matches);
        return result;
    }

    Map<String, Object> buildCatalogDocument(String sceneFingerprint, Map<String, Object> blueprint) {
        return buildCatalogDocument(sceneFingerprint, blueprint, null);
    }

    Map<String, Object> buildCatalogDocument(
            String sceneFingerprint,
            Map<String, Object> blueprint,
            Map<String, Object> editorCatalog
    ) {
        List<RawObject> rawObjects = readObjects(blueprint);

        Map<String, Integer> runtimeNameCounts = new HashMap<>();
        int runtimeHierarchyEdges = 0;
        for (RawObject object : rawObjects) {
            runtimeNameCounts.merge(object.name(), 1, Integer::sum);
            if (object.parentUuid() != null && !object.parentUuid().isBlank()) {
                runtimeHierarchyEdges++;
            }
        }
        boolean runtimeHierarchyAvailable = runtimeHierarchyEdges > 0;

        List<EditorNode> editorNodes = flattenEditorCatalog(editorCatalog);
        Map<String, List<EditorNode>> editorByName = new LinkedHashMap<>();
        for (EditorNode node : editorNodes) {
            editorByName.computeIfAbsent(node.name(), ignored -> new ArrayList<>()).add(node);
        }

        List<Map<String, Object>> objects = new ArrayList<>();
        int transforms = 0;
        int visibility = 0;
        int currentState = 0;
        int color = 0;
        int runtimeText = 0;
        int material = 0;
        int eventBound = 0;
        int editorMatchedUnique = 0;
        int editorAmbiguous = 0;
        int editorUnmatched = 0;

        for (RawObject raw : rawObjects) {
            boolean transform = booleanCapability(raw.capabilities(), "transform");
            boolean canVisibility = booleanCapability(raw.capabilities(), "visibility");
            boolean canCurrentState = booleanCapability(raw.capabilities(), "stateCurrentExposed");
            boolean canColor = booleanCapability(raw.capabilities(), "color");
            boolean canRuntimeText = booleanCapability(raw.capabilities(), "runtimeText");
            boolean canMaterial = booleanCapability(raw.capabilities(), "material");

            if (transform) transforms++;
            if (canVisibility) visibility++;
            if (canCurrentState) currentState++;
            if (canColor) color++;
            if (canRuntimeText) runtimeText++;
            if (canMaterial) material++;
            if (raw.authoredEventRefCount() > 0) eventBound++;

            List<EditorNode> editorMatches = editorByName.getOrDefault(raw.name(), List.of());
            String editorMatchStatus;
            Map<String, Object> editorHierarchy = new LinkedHashMap<>();

            boolean runtimeNameUnique = runtimeNameCounts.getOrDefault(raw.name(), 0) == 1;

            if (editorCatalog == null || editorCatalog.isEmpty()) {
                editorMatchStatus = "CATALOG_UNAVAILABLE";
            } else if (runtimeNameUnique && editorMatches.size() == 1) {
                editorMatchStatus = "MATCHED_UNIQUE_NAME";
                editorMatchedUnique++;
                EditorNode node = editorMatches.get(0);
                editorHierarchy.put("path", node.path());
                editorHierarchy.put("parentPath", node.parentPath());
                editorHierarchy.put("type", node.type());
                editorHierarchy.put("depth", node.depth());
                editorHierarchy.put("loaded", node.loaded());
                editorHierarchy.put("knownChildCount", node.knownChildCount());
            } else if (!editorMatches.isEmpty()) {
                editorMatchStatus = "AMBIGUOUS_NAME";
                editorAmbiguous++;
                editorHierarchy.put(
                        "candidatePaths",
                        editorMatches.stream()
                                .map(EditorNode::path)
                                .filter(Objects::nonNull)
                                .limit(12)
                                .toList()
                );
            } else {
                editorMatchStatus = "NOT_FOUND";
                editorUnmatched++;
            }
            editorHierarchy.put("matchStatus", editorMatchStatus);

            List<String> directOperations = new ArrayList<>();
            directOperations.add("CLONE_VISUAL");
            if (transform) directOperations.addAll(List.of("MOVE", "ROTATE", "SCALE"));
            if (canVisibility) directOperations.add("SET_VISIBLE");
            if (canColor) directOperations.add("SET_COLOR");
            if (canMaterial) directOperations.add("SET_MATERIAL");

            List<String> overlayOperations = new ArrayList<>();
            if (!canRuntimeText) overlayOperations.add("SET_DISPLAY_LABEL");
            overlayOperations.add("ENUMERATE_AUTHORED_STATES");
            overlayOperations.add("REPLAY_AUTHORED_ACTION_GRAPH");

            Map<String, Object> object = new LinkedHashMap<>();
            object.put("uuid", raw.uuid());
            object.put("name", raw.name());
            object.put("runtimeType", raw.type());
            object.put("runtimeParentUuid", raw.parentUuid());
            object.put("runtimeHierarchyStatus", runtimeHierarchyAvailable ? "PARTIAL_EXPOSED" : "NOT_EXPOSED_BY_RUNTIME");
            object.put("nameOccurrenceCount", runtimeNameCounts.getOrDefault(raw.name(), 0));
            object.put("stableUniqueName", runtimeNameCounts.getOrDefault(raw.name(), 0) == 1);
            object.put("authoredEventRefCount", raw.authoredEventRefCount());
            object.put("runtimeCapabilities", Map.of(
                    "cloneVisual", true,
                    "transform", transform,
                    "visibility", canVisibility,
                    "currentStateExposed", canCurrentState,
                    "color", canColor,
                    "runtimeText", canRuntimeText,
                    "material", canMaterial
            ));
            object.put("editorHierarchy", editorHierarchy);
            object.put("directOperations", directOperations);
            object.put("authoringOverlayRequiredFor", overlayOperations);
            object.put("knowledge", Map.of(
                    "fullStateDefinitions", "NOT_EXPOSED_BY_RUNTIME",
                    "authoredActionGraph", "NOT_EXPOSED_BY_RUNTIME",
                    "semanticRole", "UNCLASSIFIED",
                    "labelParameterization", canRuntimeText ? "RUNTIME_DIRECT" : "UNMAPPED"
            ));
            objects.add(object);
        }

        objects.sort(Comparator
                .comparing((Map<String, Object> item) -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> hierarchy = (Map<String, Object>) item.get("editorHierarchy");
                    return !"MATCHED_UNIQUE_NAME".equals(hierarchy.get("matchStatus"));
                })
                .thenComparing(item -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> hierarchy = (Map<String, Object>) item.get("editorHierarchy");
                    return String.valueOf(hierarchy.getOrDefault("path", "~"));
                }, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(item -> String.valueOf(item.get("name")), String.CASE_INSENSITIVE_ORDER));

        List<Map<String, Object>> editorRoots = readEditorRootSummaries(editorCatalog);

        long loadedEditorNodes = editorNodes.stream().filter(EditorNode::loaded).count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("objectCount", rawObjects.size());
        summary.put("uniqueNameCount", runtimeNameCounts.size());
        summary.put("duplicateNameCount", runtimeNameCounts.values().stream().filter(count -> count > 1).count());
        summary.put("runtimeHierarchyEdges", runtimeHierarchyEdges);
        summary.put("runtimeHierarchyAvailable", runtimeHierarchyAvailable);
        summary.put("runtimeCloneVisual", rawObjects.size());
        summary.put("runtimeTransform", transforms);
        summary.put("runtimeVisibility", visibility);
        summary.put("runtimeCurrentStateExposed", currentState);
        summary.put("runtimeColor", color);
        summary.put("runtimeText", runtimeText);
        summary.put("runtimeMaterial", material);
        summary.put("authoredEventReferencedObjects", eventBound);
        summary.put("editorCatalogAvailable", editorCatalog != null && !editorCatalog.isEmpty());
        summary.put("editorCatalogNodeCount", editorNodes.size());
        summary.put("editorCatalogLoadedNodeCount", loadedEditorNodes);
        summary.put("editorRootSectionCount", editorRoots.size());
        summary.put("editorHierarchyMatchedUnique", editorMatchedUnique);
        summary.put("editorHierarchyAmbiguous", editorAmbiguous);
        summary.put("editorHierarchyUnmatched", editorUnmatched);
        summary.put("editorRoots", editorRoots);
        summary.put("knowledgeGaps", List.of(
                "FULL_STATE_DEFINITIONS",
                "AUTHORED_ACTION_GRAPH",
                "SEMANTIC_ROLES",
                "LABEL_PARAMETERIZATION_MAP",
                "DUPLICATE_NAME_PATH_BINDINGS"
        ));

        Map<String, Object> document = new LinkedHashMap<>();
        document.put("schemaVersion", SCHEMA_VERSION);
        document.put("sceneFingerprint", sceneFingerprint);
        document.put("summary", summary);
        document.put("objects", objects);
        return document;
    }

    private Optional<Map<String, Object>> loadLatestEditorCatalog() {
        return jdbc.sql("""
                select catalog::text
                from spline_scene_catalog
                where project_id=:projectId
                order by synced_at desc
                limit 1
                """)
                .param("projectId", PROJECT_ID)
                .query(String.class)
                .optional()
                .map(this::readMap);
    }

    private List<EditorNode> flattenEditorCatalog(Map<String, Object> editorCatalog) {
        if (editorCatalog == null || editorCatalog.isEmpty()) return List.of();
        Object sections = editorCatalog.get("sections");
        if (!(sections instanceof List<?> roots)) return List.of();

        List<EditorNode> result = new ArrayList<>();
        for (Object root : roots) {
            flattenEditorNode(root, null, 0, result);
        }
        return result;
    }

    private void flattenEditorNode(Object value, String parentPath, int depth, List<EditorNode> result) {
        if (!(value instanceof Map<?, ?> node)) return;

        String name = stringValue(node.get("name"));
        if (name == null) name = "";
        String type = stringValue(node.get("type"));
        String path = stringValue(node.get("path"));
        boolean loaded = Boolean.TRUE.equals(node.get("loaded"));

        Object childrenValue = node.get("children");
        int childCount = childrenValue instanceof List<?> children ? children.size() : 0;

        result.add(new EditorNode(name, type, path, parentPath, depth, loaded, childCount));

        if (childrenValue instanceof List<?> children) {
            for (Object child : children) {
                flattenEditorNode(child, path, depth + 1, result);
            }
        }
    }

    private List<Map<String, Object>> readEditorRootSummaries(Map<String, Object> editorCatalog) {
        if (editorCatalog == null || editorCatalog.isEmpty()) return List.of();
        Object sections = editorCatalog.get("sections");
        if (!(sections instanceof List<?> roots)) return List.of();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object value : roots) {
            if (!(value instanceof Map<?, ?> node)) continue;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", stringValue(node.get("name")));
            item.put("type", stringValue(node.get("type")));
            item.put("path", stringValue(node.get("path")));
            item.put("loaded", Boolean.TRUE.equals(node.get("loaded")));
            item.put("knownNodeCount", countEditorNode(value));
            result.add(item);
        }
        return result;
    }

    private int countEditorNode(Object value) {
        if (!(value instanceof Map<?, ?> node)) return 0;
        int count = 1;
        Object childrenValue = node.get("children");
        if (childrenValue instanceof List<?> children) {
            for (Object child : children) {
                count += countEditorNode(child);
            }
        }
        return count;
    }

    private void logSummary(String fingerprint, Map<String, Object> summary) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> roots = (List<Map<String, Object>>) summary.getOrDefault("editorRoots", List.of());

        String rootPreview = roots.stream()
                .limit(15)
                .map(item -> String.valueOf(item.get("name")) + "(" + item.get("knownNodeCount") + (Boolean.TRUE.equals(item.get("loaded")) ? ",loaded" : ",folded") + ")")
                .reduce((left, right) -> left + ", " + right)
                .orElse("none");

        log.info(
                "Spline master knowledge built fingerprint={} objects={} runtimeHierarchyEdges={} editorNodes={} editorRoots={} matchedUnique={} ambiguous={} unmatched={} transform={} visibility={} currentState={} runtimeText={} material={} eventBound={} editorRootPreview=[{}]",
                fingerprint.substring(0, Math.min(12, fingerprint.length())),
                summary.get("objectCount"),
                summary.get("runtimeHierarchyEdges"),
                summary.get("editorCatalogNodeCount"),
                summary.get("editorRootSectionCount"),
                summary.get("editorHierarchyMatchedUnique"),
                summary.get("editorHierarchyAmbiguous"),
                summary.get("editorHierarchyUnmatched"),
                summary.get("runtimeTransform"),
                summary.get("runtimeVisibility"),
                summary.get("runtimeCurrentStateExposed"),
                summary.get("runtimeText"),
                summary.get("runtimeMaterial"),
                summary.get("authoredEventReferencedObjects"),
                rootPreview
        );
    }

    private boolean booleanCapability(Map<String, Object> capabilities, String key) {
        return Boolean.TRUE.equals(capabilities.get(key));
    }

    private List<RawObject> readObjects(Map<String, Object> blueprint) {
        Object raw = blueprint.get("objects");
        if (!(raw instanceof List<?> items)) return List.of();

        List<RawObject> result = new ArrayList<>();
        for (Object item : items) {
            if (!(item instanceof Map<?, ?> map)) continue;
            String uuid = stringValue(map.get("uuid"));
            if (uuid == null || uuid.isBlank()) continue;

            String name = Optional.ofNullable(stringValue(map.get("name"))).orElse("");
            String type = stringValue(map.get("type"));
            String parentUuid = stringValue(map.get("parentUuid"));
            int eventRefs = intValue(map.get("authoredEventRefCount"));

            Map<String, Object> capabilities = new LinkedHashMap<>();
            Object caps = map.get("capabilities");
            if (caps instanceof Map<?, ?> capMap) {
                for (var entry : capMap.entrySet()) {
                    capabilities.put(String.valueOf(entry.getKey()), entry.getValue());
                }
            }

            result.add(new RawObject(uuid, name, type, parentUuid, eventRefs, capabilities));
        }
        return result;
    }

    private String stringValue(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value);
        return "null".equalsIgnoreCase(text) ? null : text;
    }

    private int intValue(Object value) {
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }

    private Map<String, Object> readMap(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Invalid Spline master knowledge JSON.", e);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialize Spline master knowledge JSON.", e);
        }
    }

    private record LatestBlueprint(UUID id, String fingerprint, Map<String, Object> blueprint) {}

    private record RawObject(
            String uuid,
            String name,
            String type,
            String parentUuid,
            int authoredEventRefCount,
            Map<String, Object> capabilities
    ) {}

    private record EditorNode(
            String name,
            String type,
            String path,
            String parentPath,
            int depth,
            boolean loaded,
            int knownChildCount
    ) {}
}
