insert into visual_shot_lock(
  id, episode_id, script_revision, shot_key, render_id, locked_at, source
)
select
  gen_random_uuid(),
  v.episode_id,
  v.script_revision,
  v.shot_key,
  v.remotion_render_id,
  now(),
  'Director approval · current approved Shot 01'
from voice_shot_workflow v
where v.episode_id='22222222-2222-2222-2222-222222222222'
  and v.shot_key='SHOT 01'
  and v.remotion_render_id is not null
  and exists(
    select 1
    from visual_shot_qa q
    where q.episode_id=v.episode_id
      and q.script_revision=v.script_revision
      and q.shot_key=v.shot_key
      and q.render_id=v.remotion_render_id
      and q.phase='POST_RENDER'
      and q.status='PASS'
  )
on conflict (episode_id, script_revision, shot_key) do update
set render_id=excluded.render_id,
    locked_at=excluded.locked_at,
    source=excluded.source;
