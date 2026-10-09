alter table voice_shot_workflow
  add column remotion_render_id uuid references remotion_render(id) on delete set null,
  add column rendered_generation_revision int,
  add column rendered_at timestamptz;

create index idx_voice_shot_workflow_render
  on voice_shot_workflow(remotion_render_id);
