alter table studio_shot
    add column if not exists preview_render_id uuid,
    add column if not exists preview_visual_revision integer,
    add column if not exists preview_created_at timestamptz;

comment on column studio_shot.preview_render_id is
    'New Studio-owned preview only. Never updates the canonical video lock, voice_shot_workflow, or cumulative EP001 rendered footage.';
