from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"Pattern not found: {label}")
    return text.replace(old, new, 1)

# 1) Preserve authoring object ids in capability/editor knowledge.
cap_path = Path('backend/src/main/java/com/architecturalthinking/mediaos/spline/SplineCapabilityCatalogService.java')
s = cap_path.read_text()

s = replace_once(s,
'''                editorHierarchy.put("loaded", node.loaded());
                editorHierarchy.put("knownChildCount", node.knownChildCount());''',
'''                editorHierarchy.put("loaded", node.loaded());
                editorHierarchy.put("knownChildCount", node.knownChildCount());
                if (node.objectId() != null) {
                    editorHierarchy.put("objectId", node.objectId());
                }''',
'capability editor object id')

s = replace_once(s,
'''        String path = stringValue(node.get("path"));
        boolean loaded = Boolean.TRUE.equals(node.get("loaded"));

        Object childrenValue = node.get("children");
        int childCount = childrenValue instanceof List<?> children ? children.size() : 0;

        result.add(new EditorNode(name, type, path, parentPath, depth, loaded, childCount));''',
'''        String path = stringValue(node.get("path"));
        String objectId = stringValue(node.get("objectId"));
        if (objectId == null) objectId = stringValue(node.get("id"));
        if (objectId == null) objectId = stringValue(node.get("uuid"));
        boolean loaded = Boolean.TRUE.equals(node.get("loaded"));

        Object childrenValue = node.get("children");
        int childCount = childrenValue instanceof List<?> children ? children.size() : 0;

        result.add(new EditorNode(name, type, path, parentPath, depth, loaded, childCount, objectId));''',
'flatten editor object id')

s = replace_once(s,
'''            int depth,
            boolean loaded,
            int knownChildCount
    ) {}''',
'''            int depth,
            boolean loaded,
            int knownChildCount,
            String objectId
    ) {}''',
'editor node record')
cap_path.write_text(s)

# 2) Resolve slot authoring addresses from base editor node and structural companions.
slot_path = Path('backend/src/main/java/com/architecturalthinking/mediaos/spline/SplineSceneSlotRegistryService.java')
s = slot_path.read_text()

s = replace_once(s,
'''            String editorPath = stringValue(editorHierarchy.get("path"));
            String candidateKind = uniqueEditorGroup && visualFamily''',
'''            String editorPath = stringValue(editorHierarchy.get("path"));

            List<Map<String, Object>> authoringTargets = new ArrayList<>();
            Set<String> seenAuthoringIds = new LinkedHashSet<>();

            String baseAuthoringObjectId = stringValue(editorHierarchy.get("objectId"));
            if (baseAuthoringObjectId != null && seenAuthoringIds.add(baseAuthoringObjectId)) {
                Map<String, Object> target = new LinkedHashMap<>();
                target.put("name", name);
                target.put("objectId", baseAuthoringObjectId);
                target.put("path", editorPath);
                target.put("type", editorHierarchy.get("type"));
                target.put("role", "BASE");
                authoringTargets.add(target);
            }

            for (String companionName : companions) {
                Map<String, Object> companionObject = uniqueByName.get(companionName);
                if (companionObject == null) continue;

                @SuppressWarnings("unchecked")
                Map<String, Object> companionHierarchy = companionObject.get("editorHierarchy") instanceof Map<?, ?> map
                        ? copyMap(map)
                        : Map.of();

                if (!"MATCHED_UNIQUE_NAME".equals(companionHierarchy.get("matchStatus"))) continue;

                String companionAuthoringObjectId = stringValue(companionHierarchy.get("objectId"));
                if (companionAuthoringObjectId == null || !seenAuthoringIds.add(companionAuthoringObjectId)) continue;

                Map<String, Object> target = new LinkedHashMap<>();
                target.put("name", companionName);
                target.put("objectId", companionAuthoringObjectId);
                target.put("path", stringValue(companionHierarchy.get("path")));
                target.put("type", companionHierarchy.get("type"));
                target.put("role", "COMPANION");
                authoringTargets.add(target);
            }

            boolean authoringAddressResolved = editorPath != null || !authoringTargets.isEmpty();

            String candidateKind = uniqueEditorGroup && visualFamily''',
'slot authoring target derivation')

s = replace_once(s,
'''            evidence.put("structuralCompanions", companions);
            evidence.put("directOperations", object.getOrDefault("directOperations", List.of()));''',
'''            evidence.put("structuralCompanions", companions);
            evidence.put("authoringTargets", authoringTargets);
            evidence.put("directOperations", object.getOrDefault("directOperations", List.of()));''',
'slot evidence authoring targets')

s = replace_once(s,
'''                    editorPath == null ? "RUNTIME_UNIQUE_NAME" : "EDITOR_PATH_AND_RUNTIME_NAME",
                    transform ? "RUNTIME_DIRECT" : "UNAVAILABLE",
                    visibility ? "RUNTIME_DIRECT" : "UNAVAILABLE",
                    runtimeText
                            ? "RUNTIME_DIRECT"
                            : editorPath != null ? "AUTHORING_VARIABLE_REQUIRED" : "AUTHORING_ADDRESS_UNRESOLVED",
                    editorPath != null ? "AUTHORING_OVERLAY_REQUIRED" : "AUTHORING_ADDRESS_UNRESOLVED",''',
'''                    !authoringTargets.isEmpty()
                            ? "AUTHORING_OBJECT_IDS_AND_RUNTIME_NAME"
                            : editorPath == null ? "RUNTIME_UNIQUE_NAME" : "EDITOR_PATH_AND_RUNTIME_NAME",
                    transform ? "RUNTIME_DIRECT" : "UNAVAILABLE",
                    visibility ? "RUNTIME_DIRECT" : "UNAVAILABLE",
                    runtimeText
                            ? "RUNTIME_DIRECT"
                            : authoringAddressResolved ? "AUTHORING_VARIABLE_REQUIRED" : "AUTHORING_ADDRESS_UNRESOLVED",
                    authoringAddressResolved ? "AUTHORING_OVERLAY_REQUIRED" : "AUTHORING_ADDRESS_UNRESOLVED",''',
'slot strategies')
slot_path.write_text(s)

# 3) Queue resolved authoring ids and reactivate newly resolved slots.
overlay_path = Path('backend/src/main/java/com/architecturalthinking/mediaos/spline/SplineAuthoringOverlayRegistryService.java')
s = overlay_path.read_text()

unresolved_block = '''                .param("projectId", PROJECT_ID)
                .param("fingerprint", sceneFingerprint)
                .update();

        Map<String, Object> summary = summaryFor(sceneFingerprint);'''
resolved_block = '''                .param("projectId", PROJECT_ID)
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

        Map<String, Object> summary = summaryFor(sceneFingerprint);'''
s = replace_once(s, unresolved_block, resolved_block, 'reactivate resolved overlays')

s = replace_once(s,
'''                select o.slot_key, o.object_uuid, o.object_name, o.editor_path,
                       o.requested_label_variable, s.candidate_kind''',
'''                select o.slot_key, o.object_uuid, o.object_name, o.editor_path,
                       o.requested_label_variable, s.candidate_kind, s.evidence::text as slot_evidence''',
'queue evidence select')

s = replace_once(s,
'''                        rs.getString("editor_path"),
                        rs.getString("requested_label_variable"),
                        rs.getString("candidate_kind")
                ))''',
'''                        rs.getString("editor_path"),
                        rs.getString("requested_label_variable"),
                        rs.getString("candidate_kind"),
                        authoringObjectIds(readJson(rs.getString("slot_evidence")))
                ))''',
'queue target authoring ids')

s = replace_once(s,
'''            item.put("candidateKind", target.candidateKind());
            return item;''',
'''            item.put("candidateKind", target.candidateKind());
            item.put("authoringObjectIds", target.authoringObjectIds());
            return item;''',
'target payload authoring ids')

insert_before = '''    private Set<String> discoverySlotKeys(Map<String, Object> payload) {'''
helper = '''    private List<String> authoringObjectIds(Object evidenceValue) {
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

'''
if insert_before not in s:
    raise SystemExit('Pattern not found: authoringObjectIds insertion point')
s = s.replace(insert_before, helper + insert_before, 1)

s = replace_once(s,
'''            String requestedLabelVariable,
            String candidateKind
    ) {}''',
'''            String requestedLabelVariable,
            String candidateKind,
            List<String> authoringObjectIds
    ) {}''',
'discovery target record')
overlay_path.write_text(s)

# 4) Catalog prompts must preserve real Spline ids from get_scene_mcp/get_objects.
worker_path = Path('worker/spline-worker.ps1')
s = worker_path.read_text()

s = replace_once(s,
'''{"sceneName":"exact scene name or Focused Spline 3D Scene","objectCount":771,"sections":[{"name":"exact root name","type":"concise type","path":"exact root name","loaded":false,"children":[]}]}''',
'''{"sceneName":"exact scene name or Focused Spline 3D Scene","objectCount":771,"sections":[{"name":"exact root name","objectId":"exact Spline object id or null","type":"concise type","path":"exact root name","loaded":false,"children":[]}]}''',
'root catalog objectId schema')

s = replace_once(s,
'''- Preserve exact names.
- Never invent root entries.''',
'''- Preserve exact names and exact Spline object ids when the tool exposes them.
- Use objectId:null when an id is genuinely not exposed. Never infer or invent ids.
- Never invent root entries.''',
'root catalog id rules')

s = replace_once(s,
'''{"sceneName":"Focused Spline 3D Scene","sectionPath":"$($job.payload.sectionPath)","section":{"name":"$($job.payload.sectionName)","type":"Group","path":"$($job.payload.sectionPath)","loaded":true,"children":[...]}}''',
'''{"sceneName":"Focused Spline 3D Scene","sectionPath":"$($job.payload.sectionPath)","section":{"name":"$($job.payload.sectionName)","objectId":"exact Spline object id or null","type":"Group","path":"$($job.payload.sectionPath)","loaded":true,"children":[...]}}''',
'section catalog objectId schema')

s = replace_once(s,
'''Every child node must contain:
- name: exact Spline name
- type: concise type''',
'''Every child node must contain:
- name: exact Spline name
- objectId: exact Spline object id returned by the read tool, or null only when genuinely not exposed
- type: concise type''',
'section child objectId requirement')

s = replace_once(s,
'''- Never include objects outside the requested target section.
- Preserve exact names.''',
'''- Never include objects outside the requested target section.
- Preserve exact names and exact object ids; never infer or synthesize an id.''',
'section id rules')
worker_path.write_text(s)

# 5) Direct overlay helper uses resolved one-to-many authoring ids.
helper_path = Path('worker/spline-direct-overlay.js')
s = helper_path.read_text()

s = replace_once(s,
'''function callGetObjects() {
  objectCallAttempts += 1;
  callId = sequence++;
  send({
    jsonrpc: "2.0",
    id: callId,
    method: "tools/call",
    params: {
      name: "3d_get_objects",
      arguments: {
        ids: targets.map((target) => String(target.objectUuid))
      }
    }
  });
}''',
'''function targetIds(target) {
  const resolved = Array.isArray(target && target.authoringObjectIds)
    ? target.authoringObjectIds.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  if (resolved.length > 0) return [...new Set(resolved)];
  const fallback = String((target && target.objectUuid) || "").trim();
  return fallback ? [fallback] : [];
}

function callGetObjects() {
  objectCallAttempts += 1;
  callId = sequence++;
  const ids = [...new Set(targets.flatMap(targetIds))];
  if (ids.length === 0) {
    fail("Direct overlay discovery has no resolved authoring object ids.");
    return;
  }
  send({
    jsonrpc: "2.0",
    id: callId,
    method: "tools/call",
    params: {
      name: "3d_get_objects",
      arguments: { ids }
    }
  });
}''',
'helper target ids')

insert_before = '''function emitOverlay(result) {'''
merge_helpers = '''function sourceTagged(value, sourceObjectId) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...value, sourceObjectId };
  }
  return { value, sourceObjectId };
}

function mergeCoverage(results, key) {
  const values = results.map((item) => item.coverage[key]);
  if (values.includes("PARTIAL")) return "PARTIAL";
  const unique = new Set(values);
  if (unique.size === 1) return values[0];
  if (unique.has("EXPOSED") && unique.has("NOT_EXPOSED")) return "PARTIAL";
  if (unique.has("EXPOSED")) return "EXPOSED";
  if (unique.has("NOT_EXPOSED")) return "NOT_EXPOSED";
  return "CONFIRMED_EMPTY";
}

function mergeTargetResults(target, normalized) {
  if (normalized.length === 1) return normalized[0].result;

  const states = normalized.flatMap(({ id, result }) =>
    result.states.map((value) => sourceTagged(value, id))
  );
  const eventBindings = normalized.flatMap(({ id, result }) =>
    result.eventBindings.map((value) => sourceTagged(value, id))
  );
  const actionGraph = normalized.flatMap(({ id, result }) =>
    result.actionGraph.map((value) => sourceTagged(value, id))
  );

  return {
    slotKey: target.slotKey,
    objectName: target.objectName,
    editorPath: target.editorPath ?? null,
    label: {
      status: "NOT_EXPOSED",
      targetPath: null,
      currentText: null
    },
    states,
    eventBindings,
    actionGraph,
    coverage: {
      label: "NOT_EXPOSED",
      states: mergeCoverage(normalized.map((item) => item.result), "states"),
      events: mergeCoverage(normalized.map((item) => item.result), "events"),
      actions: mergeCoverage(normalized.map((item) => item.result), "actions")
    },
    notes:
      `Direct 3d_get_objects family read: ${normalized.length} authoring object(s), ` +
      `${states.length} state(s), ${eventBindings.length} event(s), ${actionGraph.length} action group(s); ` +
      `subtree label text is not inferred.`
  };
}

'''
if insert_before not in s:
    raise SystemExit('Pattern not found: helper merge insertion point')
s = s.replace(insert_before, merge_helpers + insert_before, 1)

s = replace_once(s,
'''  for (const target of targets) {
    const objectId = String(target.objectUuid || "");
    let object = null;

    for (const root of roots) {
      object = findById(root, objectId);
      if (object) break;
    }

    if (!object) {
      throw new Error(`Direct 3d_get_objects response omitted target ${objectId}.`);
    }

    items.push(normalizeTarget(target, object));
  }''',
'''  for (const target of targets) {
    const ids = targetIds(target);
    if (ids.length === 0) {
      throw new Error(`No authoring object ids resolved for ${target.slotKey || target.objectName}.`);
    }

    const normalized = [];
    for (const objectId of ids) {
      let object = null;
      for (const root of roots) {
        object = findById(root, objectId);
        if (object) break;
      }

      if (!object) {
        throw new Error(`Direct 3d_get_objects response omitted authoring target ${objectId}.`);
      }

      normalized.push({ id: objectId, result: normalizeTarget(target, object) });
    }

    items.push(mergeTargetResults(target, normalized));
  }''',
'helper multi target aggregation')
helper_path.write_text(s)
