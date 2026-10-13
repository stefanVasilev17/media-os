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
  v_delta int := 39;
  v_c01 text := 'You enter your email, type your password, and press Login. That action becomes a Login Intent. Validate checks that the information needed to start is present and usable. If it is, Submit commits the attempt and hands it forward inside the app. That handoff still does not mean anything has reached the network.';
  v_c02 text := 'The Credential Input has two parts. The Identifier tells the system which account you mean, for example your email. The Secret is the password you provided. It is not trusted yet; it is simply the value that will be checked later.';
  v_c03 text := 'Meanwhile, the Local UI State controls what you see. Submitting means the app has accepted your action and is preparing the attempt. Waiting means the screen is holding for the next result. You see a spinner, but the architecture behind it is still hidden from you.';
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
    where (item->>'startSecond')::int=0
      and (item->>'endSecond')::int=24
      and item->>'narration'=v_c01
  ) then
    return;
  end if;

  v_new_revision := v_old_revision + 1;

  select jsonb_agg(
    case
      when (item->>'startSecond')::int=0 and (item->>'endSecond')::int=7 then
        jsonb_set(
          jsonb_set(
            jsonb_set(item,'{startSecond}',to_jsonb(0),false),
            '{endSecond}',to_jsonb(24),false
          ),
          '{narration}',to_jsonb(v_c01),false
        )
      when (item->>'startSecond')::int=7 and (item->>'endSecond')::int=17 then
        jsonb_set(
          jsonb_set(
            jsonb_set(item,'{startSecond}',to_jsonb(24),false),
            '{endSecond}',to_jsonb(47),false
          ),
          '{narration}',to_jsonb(v_c02),false
        )
      when (item->>'startSecond')::int=17 and (item->>'endSecond')::int=31 then
        jsonb_set(
          jsonb_set(
            jsonb_set(item,'{startSecond}',to_jsonb(47),false),
            '{endSecond}',to_jsonb(70),false
          ),
          '{narration}',to_jsonb(v_c03),false
        )
      when (item->>'startSecond')::int>=31 then
        jsonb_set(
          jsonb_set(
            item,
            '{startSecond}',to_jsonb((item->>'startSecond')::int+v_delta),false
          ),
          '{endSecond}',to_jsonb((item->>'endSecond')::int+v_delta),false
        )
      else item
    end
    order by ord
  )
  into v_new_timeline
  from jsonb_array_elements(v_old_artifact->'timeline') with ordinality as rows(item, ord);

  v_new_artifact := jsonb_set(v_old_artifact, '{timeline}', v_new_timeline, false);
  v_new_artifact := jsonb_set(v_new_artifact, '{targetDurationSeconds}', to_jsonb(1239), false);

  update production_stage
  set artifact=v_new_artifact,
      current_revision=v_new_revision,
      summary='FULLY LOCKED EP001 narration · Director comprehension revision for SHOT 01.',
      next_action='Regenerate and approve the expanded SHOT 01 voice clips, then rerender Visual Agent.',
      locked_at=now(),
      updated_at=now()
  where id=v_stage_id;

  insert into production_stage_revision(
    id, production_stage_id, revision, artifact, summary, change_summary, created_by
  ) values (
    gen_random_uuid(), v_stage_id, v_new_revision, v_new_artifact,
    'FULLY LOCKED EP001 narration · SHOT 01 comprehension revision.',
    'Director revision: every ACTIVE green semantic object in SHOT 01 now receives a real explanation; teaching pace expanded from 31s to 70s and all later working timestamps shifted by 39s.',
    'DIRECTOR_REVISION'
  );

  v_handoff := jsonb_build_object(
    'sourceStage','SCRIPT',
    'sourceRevision',v_new_revision,
    'summary','Director-approved SHOT 01 comprehension and pacing revision.',
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
        when item->>'clipKey'='SHOT 01-C01' then
          jsonb_set(
            jsonb_set(
              jsonb_set(item,'{startSecond}',to_jsonb(0),false),
              '{endSecond}',to_jsonb(24),false
            ),
            '{hear}',to_jsonb(v_c01),false
          )
        when item->>'clipKey'='SHOT 01-C02' then
          jsonb_set(
            jsonb_set(
              jsonb_set(item,'{startSecond}',to_jsonb(24),false),
              '{endSecond}',to_jsonb(47),false
            ),
            '{hear}',to_jsonb(v_c02),false
          )
        when item->>'clipKey'='SHOT 01-C03' then
          jsonb_set(
            jsonb_set(
              jsonb_set(item,'{startSecond}',to_jsonb(47),false),
              '{endSecond}',to_jsonb(70),false
            ),
            '{hear}',to_jsonb(v_c03),false
          )
        when (item->>'startSecond')::int>=31 then
          jsonb_set(
            jsonb_set(
              item,
              '{startSecond}',to_jsonb((item->>'startSecond')::int+v_delta),false
            ),
            '{endSecond}',to_jsonb((item->>'endSecond')::int+v_delta),false
          )
        else item
      end
      order by ord
    )
    into v_new_timeline
    from jsonb_array_elements(v_old_contract.payload->'timeline') with ordinality as rows(item, ord);

    v_new_payload := jsonb_set(v_old_contract.payload, '{timeline}', v_new_timeline, false);
    v_new_payload := jsonb_set(v_new_payload, '{scriptRevision}', to_jsonb(v_new_revision), true);

    update episode_production_contract
    set active=false
    where episode_id=v_episode and active=true;

    insert into episode_production_contract(
      id, episode_id, script_revision, schema_version, source_type, payload, payload_sha256, active
    ) values (
      gen_random_uuid(), v_episode, v_new_revision, v_old_contract.schema_version,
      'DIRECTOR_COMPREHENSION_REVISION', v_new_payload,
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
    gen_random_uuid(), episode_id, v_new_revision, shot_key, shot_title,
    start_second+v_delta, end_second+v_delta,
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
    narration, director_narration_override, voice_direction,
    generated_audio, generated_audio_content_type, generated_audio_file_name,
    generated_alignment, generated_voice_id, generated_model_id, generation_revision,
    voice_generated_at, voice_approved_at, created_at, updated_at
  )
  select
    gen_random_uuid(), episode_id, v_new_revision, shot_key, clip_key, sequence_no,
    start_second+v_delta, end_second+v_delta,
    narration, director_narration_override, voice_direction,
    generated_audio, generated_audio_content_type, generated_audio_file_name,
    generated_alignment, generated_voice_id, generated_model_id, generation_revision,
    voice_generated_at, voice_approved_at, now(), now()
  from voice_clip_workflow
  where episode_id=v_episode and script_revision=v_old_revision and shot_key<>'SHOT 01'
  on conflict (episode_id, script_revision, clip_key) do nothing;

  insert into production_memory_rule(
    id, project_id, episode_id, scope, rule_type, severity, content, source
  )
  values
    (
      '90000000-0000-4000-8000-000000000015',
      '11111111-1111-1111-1111-111111111111',
      null,
      'SCRIPT',
      'TEACHING',
      'REQUIRED',
      'Every green semantic secondary object that becomes ACTIVE must receive at least one clear explanatory sentence while it is in focus. Naming the label alone is insufficient. Give two sentences when the concept is new, easy to misunderstand, or architecturally important.',
      'Creator correction · 2026-10-13'
    ),
    (
      '90000000-0000-4000-8000-000000000016',
      '11111111-1111-1111-1111-111111111111',
      null,
      'VOICE',
      'PACING',
      'REQUIRED',
      'For unfamiliar architecture concepts, prefer a measured educational delivery around 125–135 spoken words per minute. Achieve this primarily through concise sentences, punctuation, and natural sentence breaks while keeping silent gaps below 1 second. Do not rush terminology to preserve a nominal shot duration.',
      'Creator correction · 2026-10-13'
    )
  on conflict (id) do update
  set content=excluded.content,
      severity=excluded.severity,
      source=excluded.source,
      active=true,
      updated_at=now();

  update production_stage
  set status='ACTIVE',
      summary='LOCKED Script revision ' || v_new_revision || ' is ready for expanded SHOT 01 voice production.',
      next_action='Generate and approve the three revised SHOT 01 voice clips.',
      updated_at=now()
  where episode_id=v_episode and stage_key='VOICE';

  update production_stage
  set status='ACTIVE',
      summary='Visual production is waiting for the expanded SHOT 01 approved voice timing.',
      next_action='Rerender SHOT 01 after the revised voice clips are approved.',
      updated_at=now()
  where episode_id=v_episode and stage_key='VISUAL';

  update episode set current_stage='VOICE_PRODUCTION' where id=v_episode;
end $$;
