alter table episode
    add column if not exists updated_at timestamptz not null default now();

alter table agent_thread
    add column if not exists updated_at timestamptz not null default now();
