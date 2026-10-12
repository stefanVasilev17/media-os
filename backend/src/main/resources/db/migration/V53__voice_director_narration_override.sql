alter table voice_clip_workflow
  add column if not exists director_narration_override text;

update voice_clip_workflow
set director_narration_override =
      'But the moment you press it, the app turns that action into a Login Intent: first Validate the information you entered, then Submit the login attempt.',
    generated_audio=null,
    generated_audio_content_type=null,
    generated_audio_file_name=null,
    generated_alignment=null,
    voice_generated_at=null,
    voice_approved_at=null,
    updated_at=now()
where episode_id='22222222-2222-2222-2222-222222222222'
  and script_revision=(
    select current_revision
    from production_stage
    where episode_id='22222222-2222-2222-2222-222222222222'
      and stage_key='SCRIPT'
  )
  and clip_key='SHOT 01-C02'
  and coalesce(director_narration_override,narration) <>
      'But the moment you press it, the app turns that action into a Login Intent: first Validate the information you entered, then Submit the login attempt.';

update voice_shot_workflow s
set narration=(
      select string_agg(coalesce(c.director_narration_override,c.narration), E'\n\n' order by c.sequence_no)
      from voice_clip_workflow c
      where c.episode_id=s.episode_id
        and c.script_revision=s.script_revision
        and c.shot_key=s.shot_key
    ),
    voice_approved_at=null,
    recorded_at=null,
    alignment=null,
    aligned_at=null,
    visual_sync_spec=null,
    visual_sync_markdown=null,
    visual_sync_ready_at=null,
    remotion_synced_at=null,
    remotion_render_id=null,
    rendered_generation_revision=null,
    rendered_at=null,
    updated_at=now()
where s.episode_id='22222222-2222-2222-2222-222222222222'
  and s.script_revision=(
    select current_revision
    from production_stage
    where episode_id='22222222-2222-2222-2222-222222222222'
      and stage_key='SCRIPT'
  )
  and s.shot_key='SHOT 01';

insert into production_memory_rule(
  id, project_id, episode_id, scope, rule_type, severity, content, source
)
values (
  '90000000-0000-4000-8000-000000000014',
  '11111111-1111-1111-1111-111111111111',
  null,
  'VOICE',
  'UX',
  'REQUIRED',
  'Voice Agent should prioritize the director workflow: editable spoken text, Generate, Listen/Continuity, Approve. Keep provider payloads, performance settings, contract notes, and correction metadata secondary or collapsed by default.',
  'Creator correction · 2026-10-13'
)
on conflict (id) do update
set content=excluded.content,
    severity=excluded.severity,
    source=excluded.source,
    active=true,
    updated_at=now();
