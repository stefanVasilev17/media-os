from pathlib import Path

path = Path('backend/src/main/java/com/architecturalthinking/mediaos/spline/SplineSceneSlotRegistryService.java')
text = path.read_text(encoding='utf-8')

old_delete = '''        jdbc.sql("""
                delete from spline_scene_slot_registry
                where project_id=:projectId and scene_fingerprint=:fingerprint
                """)
                .param("projectId", PROJECT_ID)
                .param("fingerprint", sceneFingerprint)
                .update();

        for (SlotCandidate candidate : candidates) {'''

new_delete = '''        Set<String> existingSlotKeys = new LinkedHashSet<>(jdbc.sql("""
                select slot_key
                from spline_scene_slot_registry
                where project_id=:projectId and scene_fingerprint=:fingerprint
                """)
                .param("projectId", PROJECT_ID)
                .param("fingerprint", sceneFingerprint)
                .query(String.class)
                .list());

        Set<String> currentSlotKeys = new LinkedHashSet<>();

        for (SlotCandidate candidate : candidates) {
            currentSlotKeys.add(candidate.slotKey());'''

old_insert_tail = '''                    )
                    """)
                    .param("id", UUID.randomUUID())'''

new_insert_tail = '''                    )
                    on conflict(project_id, scene_fingerprint, slot_key)
                    do update set
                        capability_catalog_id=excluded.capability_catalog_id,
                        object_uuid=excluded.object_uuid,
                        object_name=excluded.object_name,
                        editor_path=excluded.editor_path,
                        candidate_kind=excluded.candidate_kind,
                        status=excluded.status,
                        address_strategy=excluded.address_strategy,
                        placement_strategy=excluded.placement_strategy,
                        visibility_strategy=excluded.visibility_strategy,
                        label_strategy=excluded.label_strategy,
                        behavior_strategy=excluded.behavior_strategy,
                        clone_strategy=excluded.clone_strategy,
                        evidence=excluded.evidence,
                        updated_at=now()
                    """)
                    .param("id", UUID.randomUUID())'''

old_after_loop = '''                    .param("evidence", writeJson(candidate.evidence()))
                    .update();
        }

        Map<String, Object> summary = summarize(sceneFingerprint, candidates);'''

new_after_loop = '''                    .param("evidence", writeJson(candidate.evidence()))
                    .update();
        }

        for (String existingSlotKey : existingSlotKeys) {
            if (currentSlotKeys.contains(existingSlotKey)) continue;

            jdbc.sql("""
                    delete from spline_scene_slot_registry
                    where project_id=:projectId
                      and scene_fingerprint=:fingerprint
                      and slot_key=:slotKey
                    """)
                    .param("projectId", PROJECT_ID)
                    .param("fingerprint", sceneFingerprint)
                    .param("slotKey", existingSlotKey)
                    .update();
        }

        Map<String, Object> summary = summarize(sceneFingerprint, candidates);'''

for old, new, label in [
    (old_delete, new_delete, 'delete-all replacement'),
    (old_insert_tail, new_insert_tail, 'slot upsert'),
    (old_after_loop, new_after_loop, 'stale slot cleanup'),
]:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'Expected exactly one {label}, found {count}')
    text = text.replace(old, new)

path.write_text(text, encoding='utf-8')
