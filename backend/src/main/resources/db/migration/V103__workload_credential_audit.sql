create table mediaos_worker_credential_audit (
    id uuid primary key,
    credential_id uuid not null,
    operation varchar(24) not null check (operation in ('ISSUED','REVOKED')),
    change_ticket varchar(96) not null,
    created_at timestamptz not null default now()
);
create index mediaos_worker_credential_audit_lookup_idx
    on mediaos_worker_credential_audit (credential_id,created_at);
