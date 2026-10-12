do $$
declare
  v_episode uuid := '22222222-2222-2222-2222-222222222222';
  v_stage_id uuid;
  v_old_revision int;
  v_new_revision int;
  v_old_artifact jsonb;
  v_new_artifact jsonb;
  v_old_contract episode_production_contract%rowtype;
  v_new_payload jsonb;
  v_new_timeline jsonb;
  v_handoff jsonb;
  v_c01 text := 'You enter your email, type your password, and press Login. From your perspective, that is the entire action.';
  v_c02 text := 'But the moment you press it, the app turns that action into a Login Intent: first Validate what you entered, then Submit the attempt when the client is ready.';
  v_c03 text := 'Your Credential Input now has two useful parts: the Identifier and the Secret. At the same time, the Local UI State moves from Submitting to Waiting, showing you that the app is actively preparing what happens next.';
begin
  select id, current_revision, artifact
  into v_stage_id, v_old_revision, v_old_artifact
  from production_stage
  where episode_id=v_episode and stage_key='SCRIPT' and status='LOCKED';

  if v_stage_id is null or v_old_artifact is null then
    return;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_old_artifact->'timeline') item
    where item->>'shotKey'='SHOT 01'
      and (item->>'startSecond')::int=0
      and item->>'narration'=v_c01
  ) then
    return;
  end if;

  v_new_revision := v_old_revision + 1;

  select jsonb_agg(
    case
      when item->>'shotKey'='SHOT 01' and (item->>'startSecond')::int=0 and (item->>'endSecond')::int=7
        then jsonb_set(item, '{narration}', to_jsonb(v_c01))
      when item->>'shotKey'='SHOT 01' and (item->>'startSecond')::int=7 and (item->>'endSecond')::int=17
        then jsonb_set(item, '{narration}', to_jsonb(v_c02))
      when item->>'shotKey'='SHOT 01' and (item->>'startSecond')::int=17 and (item->>'endSecond')::int=31
        then jsonb_set(item, '{narration}', to_jsonb(v_c03))
      else item
    end
    order by ord
  )
  into v_new_timeline
  from jsonb_array_elements(v_old_artifact->'timeline') with ordinality as rows(item, ord);

  v_new_artifact := jsonb_set(v_old_artifact, '{timeline}', v_new_timeline);

  update production_stage
  set artifact=v_new_artifact,
      current_revision=v_new_revision,
      summary='FULLY LOCKED EP001 narration · Director pacing revision for SHOT 01.',
      next_action='Regenerate and approve SHOT 01 voice clips, then rerender Visual Agent.',
      locked_at=now(),
      updated_at=now()
  where id=v_stage_id;

  insert into production_stage_revision(
    id, production_stage_id, revision, artifact, summary, change_summary, created_by
  ) values (
    gen_random_uuid(), v_stage_id, v_new_revision, v_new_artifact,
    'FULLY LOCKED EP001 narration · SHOT 01 pacing revision.',
    'Director revision: richer SHOT 01 narration, explicit semantic state names, and no long silent pacing gaps.',
    'DIRECTOR_REVISION'
  );

  v_handoff := jsonb_build_object(
    'sourceStage','SCRIPT',
    'sourceRevision',v_new_revision,
    'summary','Director-approved SHOT 01 narration pacing revision.',
    'artifact',v_new_artifact
  );

  insert into agent_handoff(id, episode_id, source_stage_key, target_stage_key, source_revision, payload)
  values (gen_random_uuid(),v_episode,'SCRIPT','VOICE',v_new_revision,v_handoff)
  on conflict (episode_id, source_stage_key, source_revision, target_stage_key) do nothing;

  select *
  into v_old_contract
  from episode_production_contract
  where episode_id=v_episode
    and script_revision=v_old_revision
    and active=true
  order by created_at desc
  limit 1;

  if found then
    select jsonb_agg(
      case
        when item->>'clipKey'='SHOT 01-C01' then jsonb_set(item, '{hear}', to_jsonb(v_c01))
        when item->>'clipKey'='SHOT 01-C02' then jsonb_set(item, '{hear}', to_jsonb(v_c02))
        when item->>'clipKey'='SHOT 01-C03' then jsonb_set(item, '{hear}', to_jsonb(v_c03))
        else item
      end
      order by ord
    )
    into v_new_timeline
    from jsonb_array_elements(v_old_contract.payload->'timeline') with ordinality as rows(item, ord);

    v_new_payload := jsonb_set(v_old_contract.payload, '{timeline}', v_new_timeline);
    v_new_payload := jsonb_set(v_new_payload, '{scriptRevision}', to_jsonb(v_new_revision));

    update episode_production_contract
    set active=false
    where episode_id=v_episode and active=true;

    insert into episode_production_contract(
      id, episode_id, script_revision, schema_version, source_type, payload, payload_sha256, active
    ) values (
      gen_random_uuid(), v_episode, v_new_revision, v_old_contract.schema_version,
      'DIRECTOR_SHOT_REVISION', v_new_payload,
      encode(sha256(convert_to(v_new_payload::text,'UTF8')),'hex'), true
    );
  end if;

  insert into voice_shot_workflow(
    id, episode_id, script_revision, shot_key, shot_title, start_second, end_second,
    narration, voice_direction, recorded_at, audio_file_name, alignment, aligned_at,
    visual_sync_spec, visual_sync_markdown, visual_sync_ready_at, remotion_synced_at, updated_at,
    generated_audio, generated_audio_content_type, generated_audio_file_name, generated_alignment,
    generated_voice_id, generated_model_id, generation_revision, voice_generated_at, voice_approved_at,
    remotion_render_id, rendered_generation_revision, rendered_at
  )
  select
    gen_random_uuid(), episode_id, v_new_revision, shot_key, shot_title, start_second, end_second,
    narration, voice_direction, recorded_at, audio_file_name, alignment, aligned_at,
    visual_sync_spec, visual_sync_markdown, visual_sync_ready_at, remotion_synced_at, now(),
    generated_audio, generated_audio_content_type, generated_audio_file_name, generated_alignment,
    generated_voice_id, generated_model_id, generation_revision, voice_generated_at, voice_approved_at,
    remotion_render_id, rendered_generation_revision, rendered_at
  from voice_shot_workflow
  where episode_id=v_episode and script_revision=v_old_revision and shot_key<>'SHOT 01'
  on conflict (episode_id, script_revision, shot_key) do nothing;

  insert into voice_clip_workflow(
    id, episode_id, script_revision, shot_key, clip_key, sequence_no, start_second, end_second,
    narration, voice_direction, generated_audio, generated_audio_content_type, generated_audio_file_name,
    generated_alignment, generated_voice_id, generated_model_id, generation_revision,
    voice_generated_at, voice_approved_at, created_at, updated_at
  )
  select
    gen_random_uuid(), episode_id, v_new_revision, shot_key, clip_key, sequence_no, start_second, end_second,
    narration, voice_direction, generated_audio, generated_audio_content_type, generated_audio_file_name,
    generated_alignment, generated_voice_id, generated_model_id, generation_revision,
    voice_generated_at, voice_approved_at, now(), now()
  from voice_clip_workflow
  where episode_id=v_episode and script_revision=v_old_revision and shot_key<>'SHOT 01'
  on conflict (episode_id, script_revision, clip_key) do nothing;

  update production_stage
  set status='ACTIVE',
      summary='LOCKED Script revision ' || v_new_revision || ' is ready for revised SHOT 01 voice production.',
      next_action='Generate and approve revised SHOT 01 voice clips.',
      updated_at=now()
  where episode_id=v_episode and stage_key='VOICE';

  update production_stage
  set status='ACTIVE',
      summary='Visual production is waiting for revised SHOT 01 approved voice timing.',
      next_action='Rerender SHOT 01 after revised voice clips are approved.',
      updated_at=now()
  where episode_id=v_episode and stage_key='VISUAL';

  update episode set current_stage='VOICE_PRODUCTION' where id=v_episode;
end $$;
