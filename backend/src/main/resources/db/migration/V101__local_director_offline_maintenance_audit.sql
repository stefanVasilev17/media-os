create table mediaos_local_director_maintenance_audit (
    id uuid primary key,
    account_id uuid not null,
    operation varchar(40) not null check (
        operation in ('CREDENTIALS_RECOVERED', 'TOTP_KEY_ROTATED')),
    ticket varchar(96) not null,
    created_at timestamptz not null default now()
);
create index mediaos_local_director_maintenance_audit_account_idx
    on mediaos_local_director_maintenance_audit (account_id, created_at);
