alter table voice_shot_workflow
  add column generated_audio bytea,
  add column generated_audio_content_type varchar(120),
  add column generated_audio_file_name varchar(512),
  add column generated_alignment jsonb,
  add column generated_voice_id varchar(160),
  add column generated_model_id varchar(160),
  add column generation_revision int not null default 0,
  add column voice_generated_at timestamptz,
  add column voice_approved_at timestamptz;
