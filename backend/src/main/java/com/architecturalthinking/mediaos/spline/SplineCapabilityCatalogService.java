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
    private static final int SCHEMA_VERSION = 1;

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

        return rebuild(latest.orElseThrow().id(), latest.orElseThrow().fingerprint(), latest.orElseThrow().blueprint());
    }

    @Transactional
    public Map<String, Object> rebuild(UUID blueprintId, String sceneFingerprint, Map<String, Object> blueprint) {
        Map<String, Object> catalog = buildCatalogDocument(sceneFingerprint, blueprint);
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

        logSummary(sceneFingerprint, summary, objects);

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
        List<RawObject> rawObjects = readObjects(blueprint);
        Map<String, RawObject> byUuid = new LinkedHashMap<>();
        for (RawObject object : rawObjects) {
            byUuid.put(object.uuid(), object);
        }

        Map<String, List<String>> childrenByParent = new HashMap<>();
        for (RawObject object : rawObjects) {
            if (object.parentUuid() != null && byUuid.containsKey(object.parentUuid())) {
                childrenByParent.computeIfAbsent(object.parentUuid(), ignored -> new ArrayList<>()).add(object.uuid());
            }
        }

        Map<String, Integer> nameCounts = new HashMap<>();
        for (RawObject object : rawObjects) {
            nameCounts.merge(object.name(), 1, Integer::sum);
        }

        Map<String, Integer> subtreeMemo = new HashMap<>();
        List<Map<String, Object>> objects = new ArrayList<>();
        int transforms = 0;
        int visibility = 0;
        int currentState = 0;
        int color = 0;
        int runtimeText = 0;
        int material = 0;
        int eventBound = 0;
        int roots = 0;

        for (RawObject raw : rawObjects) {
            boolean transform = booleanCapability(raw.capabilities(), "transform");
            boolean canVisibility = booleanCapability(raw.capabilities(), "visibility");
            boolean canCurrentState = booleanCapability(raw.capabilities(), "stateCurrentExposed");
            boolean canColor = booleanCapability(raw.capabilities(), "color");
            boolean canRuntimeText = booleanCapability(raw.capabilities(), "runtimeText");
            boolean canMaterial = booleanCapability(raw.capabilities(), "material");
            boolean root = raw.parentUuid() == null || !byUuid.containsKey(raw.parentUuid());

            if (transform) transforms++;
            if (canVisibility) visibility++;
            if (canCurrentState) currentState++;
            if (canColor) color++;
            if (canRuntimeText) runtimeText++;
            if (canMaterial) material++;
            if (raw.authoredEventRefCount() > 0) eventBound++;
            if (root) roots++;

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
            object.put("type", raw.type());
            object.put("parentUuid", raw.parentUuid());
            object.put("root", root);
            object.put("subtreeSize", subtreeSize(raw.uuid(), childrenByParent, subtreeMemo, new HashSet<>()));
            object.put("nameOccurrenceCount", nameCounts.getOrDefault(raw.name(), 0));
            object.put("stableUniqueName", nameCounts.getOrDefault(raw.name(), 0) == 1);
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
                .comparing((Map<String, Object> item) -> !(Boolean) item.get("root"))
                .thenComparing(item -> -(Integer) item.get("subtreeSize"))
                .thenComparing(item -> String.valueOf(item.get("name")), String.CASE_INSENSITIVE_ORDER));

        List<Map<String, Object>> largestRoots = objects.stream()
                .filter(item -> Boolean.TRUE.equals(item.get("root")))
                .limit(30)
                .map(item -> {
                    Map<String, Object> root = new LinkedHashMap<>();
                    root.put("uuid", item.get("uuid"));
                    root.put("name", item.get("name"));
                    root.put("type", item.get("type"));
                    root.put("subtreeSize", item.get("subtreeSize"));
                    root.put("authoredEventRefCount", item.get("authoredEventRefCount"));
                    return root;
                })
                .toList();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("objectCount", rawObjects.size());
        summary.put("rootCount", roots);
        summary.put("uniqueNameCount", nameCounts.size());
        summary.put("duplicateNameCount", nameCounts.values().stream().filter(count -> count > 1).count());
        summary.put("runtimeCloneVisual", rawObjects.size());
        summary.put("runtimeTransform", transforms);
        summary.put("runtimeVisibility", visibility);
        summary.put("runtimeCurrentStateExposed", currentState);
        summary.put("runtimeColor", color);
        summary.put("runtimeText", runtimeText);
        summary.put("runtimeMaterial", material);
        summary.put("authoredEventReferencedObjects", eventBound);
        summary.put("largestRoots", largestRoots);
        summary.put("knowledgeGaps", List.of(
                "FULL_STATE_DEFINITIONS",
                "AUTHORED_ACTION_GRAPH",
                "SEMANTIC_ROLES",
                "LABEL_PARAMETERIZATION_MAP"
        ));

        Map<String, Object> document = new LinkedHashMap<>();
        document.put("schemaVersion", SCHEMA_VERSION);
        document.put("sceneFingerprint", sceneFingerprint);
        document.put("summary", summary);
        document.put("objects", objects);
        return document;
    }

    private void logSummary(
            String fingerprint,
            Map<String, Object> summary,
            List<Map<String, Object>> objects
    ) {
        String rootPreview = objects.stream()
                .filter(item -> Boolean.TRUE.equals(item.get("root")))
                .limit(15)
                .map(item -> item.get("name") + "(" + item.get("subtreeSize") + ")")
                .reduce((left, right) -> left + ", " + right)
                .orElse("none");

        log.info(
                "Spline capability catalog built fingerprint={} objects={} roots={} uniqueNames={} duplicates={} transform={} visibility={} currentState={} runtimeText={} material={} eventBound={} topRoots=[{}]",
                fingerprint.substring(0, Math.min(12, fingerprint.length())),
                summary.get("objectCount"),
                summary.get("rootCount"),
                summary.get("uniqueNameCount"),
                summary.get("duplicateNameCount"),
                summary.get("runtimeTransform"),
                summary.get("runtimeVisibility"),
                summary.get("runtimeCurrentStateExposed"),
                summary.get("runtimeText"),
                summary.get("runtimeMaterial"),
                summary.get("authoredEventReferencedObjects"),
                rootPreview
        );
    }

    private int subtreeSize(
            String uuid,
            Map<String, List<String>> childrenByParent,
            Map<String, Integer> memo,
            Set<String> visiting
    ) {
        Integer cached = memo.get(uuid);
        if (cached != null) return cached;
        if (!visiting.add(uuid)) return 1;

        int size = 1;
        for (String child : childrenByParent.getOrDefault(uuid, List.of())) {
            size += subtreeSize(child, childrenByParent, memo, visiting);
        }
        visiting.remove(uuid);
        memo.put(uuid, size);
        return size;
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
            throw new IllegalStateException("Invalid Spline capability catalog JSON.", e);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialize Spline capability catalog JSON.", e);
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
}
