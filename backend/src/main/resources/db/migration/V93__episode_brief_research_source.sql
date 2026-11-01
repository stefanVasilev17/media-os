create table episode_brief (
  episode_id uuid primary key references episode(id),
  project_id uuid not null references project(id),
  brief_text text not null check(length(btrim(brief_text)) between 20 and 10000),
  source_notes text not null default '',
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_episode_brief_project on episode_brief(project_id,updated_at desc);
