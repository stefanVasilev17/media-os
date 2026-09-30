create table if not exists ai_runtime_policy (
    id smallint primary key,
    paid_ai_enabled boolean not null default false,
    auto_repair_enabled boolean not null default false,
    updated_at timestamptz not null default now(),
    constraint ai_runtime_policy_singleton check (id = 1)
);

insert into ai_runtime_policy(id, paid_ai_enabled, auto_repair_enabled)
values (1, false, false)
on conflict (id) do nothing;

create table if not exists ai_call_ledger (
    id uuid primary key,
    agent_key varchar(80) not null,
    operation varchar(120) not null,
    model varchar(120),
    requested_output_token_limit integer,
    status varchar(24) not null,
    blocked_reason text,
    failure_message text,
    input_tokens integer,
    output_tokens integer,
    total_tokens integer,
    started_at timestamptz not null default now(),
    completed_at timestamptz
);

create index if not exists idx_ai_call_ledger_started_at
    on ai_call_ledger(started_at desc);

create index if not exists idx_ai_call_ledger_status
    on ai_call_ledger(status, started_at desc);
