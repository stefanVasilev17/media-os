-- Seed a mandatory project-wide creation policy. Director LOCKs remain immutable.
insert into production_memory_rule (id,project_id,episode_id,scope,rule_type,severity,content,source) values
('90000000-0000-4000-8000-000000009111','11111111-1111-1111-1111-111111111111',null,'ALL','LOCK','REQUIRED','GLOBAL_CREATION_PREFLIGHT: Before any production write or agent generation, load canonical rules, applicable Production Memory, Director LOCKs, reusable assets, and approved truth/scope; block missing context; audit the operation. A DRAFT never overrides a LOCK.','Director instruction 2026-10-28'),
('90000000-0000-4000-8000-000000009112','11111111-1111-1111-1111-111111111111',null,'ALL','CORRECTION','REQUIRED','All agents must load applicable Production Memory and director corrections, check reusable approved assets before creating anything new, and preserve locked artifacts.','Director instruction 2026-10-28')
on conflict (id) do nothing;

-- Canonical overlay explicitly supersedes contradictory legacy v2.1 instructions.
-- Preserve historical fields rather than misrepresenting an incomplete v2.3 migration.
update project_creative_policy
set version=case when version like 'bible-v2.1-%' then 'at-canonical-creation-overlay-v1-2026-10-28' else version end,
    payload=payload || '{
      "creationPreflight":{"contract":"GLOBAL_CREATION_PREFLIGHT","version":1,"required":true,"failClosed":true,"authorityOrder":["Explicit Director LOCK and episode Truth","Canonical creation rules","Required Production Memory","Approved reusable assets","DRAFT proposals"],"interpretation":"Context-ready means required knowledge was loaded. It is NOT semantic approval of a generated artifact."},
      "canonicalCreationRules":{"supersedesConflictingLegacyPolicy":true,"engine":"Remotion-first; Spline only by explicit approval","story":"Human action then causal architecture then precise technical explanation and a complete payoff; repeat the world not the lesson","safety":"Preserve all locked work. DRAFTs do not become binding rules without Director approval.","reuse":"Check approved components, source shots, voice, camera and paths before introducing replacements.","research":"Truth Map and approved scope before script or scenes; separate facts and illustrative system assumptions.","voice":"Approved voice-word timing governs motion.","qa":"Technical and editorial QA, then explicit Director LOCK","durationDirection":"Director requested shorter future episodes and interview-grade engineering storytelling; detailed duration policy is DRAFT and must not retroactively change locked EP001."}
    }'::jsonb, updated_at=now()
where project_id='11111111-1111-1111-1111-111111111111';
