create table ai_preview_authorization (
    id uuid primary key,
    operation varchar(96) not null,
    payload_hash varchar(64) not null,
    status varchar(24) not null default 'READY',
    created_at timestamptz not null default now(),
    expires_at timestamptz not null,
    consumed_at timestamptz,
    constraint ai_preview_authorization_status_chk check (status in ('READY', 'CONSUMED', 'EXPIRED'))
);

create index ai_preview_authorization_ready_idx
    on ai_preview_authorization(status, expires_at);
