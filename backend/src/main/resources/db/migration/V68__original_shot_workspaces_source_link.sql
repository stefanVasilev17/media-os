alter table studio_shot
    add column if not exists legacy_source_shot_key varchar(40),
    add column if not exists legacy_source_script_revision integer;

create unique index if not exists uq_studio_shot_original_working_copy
    on studio_shot (episode_id, legacy_source_shot_key)
    where legacy_source_shot_key is not null;

comment on column studio_shot.legacy_source_shot_key is
    'Director-created editable working copy only; source remains in original voice_clip_workflow and visual_shot_lock.';
comment on column studio_shot.legacy_source_script_revision is
    'Pinned original source script revision; working copy edits never change this revision or the source clips.';
