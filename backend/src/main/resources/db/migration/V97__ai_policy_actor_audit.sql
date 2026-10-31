create table ai_runtime_policy_change_audit (
    id uuid primary key,
    actor_issuer varchar(512) not null,
    actor_subject varchar(255) not null,
    previous_paid_ai_enabled boolean not null,
    next_paid_ai_enabled boolean not null,
    previous_auto_repair_enabled boolean not null,
    next_auto_repair_enabled boolean not null,
    created_at timestamptz not null default now()
);
