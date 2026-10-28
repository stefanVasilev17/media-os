-- V40 predates the Remotion-first Director corrections. Replace only the
-- explicitly superseded channel-level guidance, never an EP001 source snapshot
-- or any Director-LOCKED production artifact.
update project_creative_policy
set payload = jsonb_set(payload,'{cameraSystem,tool}','"Remotion-first"'::jsonb,true),
    updated_at=now()
where project_id='11111111-1111-1111-1111-111111111111'
  and payload->'creationPreflight'->>'contract'='GLOBAL_CREATION_PREFLIGHT';

update project_creative_policy
set payload = jsonb_set(payload,'{productionPipeline,canonical}',
  '["Research","Truth Map","Scope Lock","Script","Episode-Level Visual Pass","Shot-Level Visual Pass","Component Consistency Pass","Reusable Asset Resolution","Approved Voice Clips + Semantic Alignment","Remotion Vertical Slice","Remotion Shot Production","Cumulative Review","Technical & Editorial QA","Audio + Captions","Director LOCK","Release QA","Publish"]'::jsonb,true),
    updated_at=now()
where project_id='11111111-1111-1111-1111-111111111111'
  and payload->'creationPreflight'->>'contract'='GLOBAL_CREATION_PREFLIGHT';

update project_creative_policy
set payload = jsonb_set(payload,'{assetRules,splinePaths}',
  '"Use existing approved Remotion paths, state variants and motion components. Spline is optional and requires explicit episode-specific justification."'::jsonb,true),
    updated_at=now()
where project_id='11111111-1111-1111-1111-111111111111'
  and payload->'creationPreflight'->>'contract'='GLOBAL_CREATION_PREFLIGHT';

update project_creative_policy
set payload = jsonb_set(payload,'{splineShotWorkflow}',
  '{"status":"LEGACY_ONLY","replacement":"Deterministic Remotion shot compositions, word-synced visual events, approved reusable components and cumulative episode review.","preservation":"Keep historical Spline work available but do not initiate new Spline-first production without an explicit Director decision."}'::jsonb,true),
    updated_at=now()
where project_id='11111111-1111-1111-1111-111111111111'
  and payload->'creationPreflight'->>'contract'='GLOBAL_CREATION_PREFLIGHT';

update project_creative_policy
set payload = jsonb_set(payload,'{mediaOsExecution,reviewOrder}',
  '["Truth Map","Script","Voice","Remotion Episode-Level Visual Pass","Shot-Level Visual Pass","Component Consistency Pass","QA","Director LOCK"]'::jsonb,true),
    updated_at=now()
where project_id='11111111-1111-1111-1111-111111111111'
  and payload->'creationPreflight'->>'contract'='GLOBAL_CREATION_PREFLIGHT';

update project_creative_policy
set payload = jsonb_set(payload,'{source,role}',
  '"Historical foundation for channel policy. Current canonicalCreationRules and Director LOCKs supersede conflicting old Spline instructions."'::jsonb,true),
    updated_at=now()
where project_id='11111111-1111-1111-1111-111111111111'
  and payload->'creationPreflight'->>'contract'='GLOBAL_CREATION_PREFLIGHT';
