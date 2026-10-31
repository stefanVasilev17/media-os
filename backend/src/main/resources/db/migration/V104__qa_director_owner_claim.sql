-- QA-only Director owner claim. The one-time link is sent privately to a verified inbox.
-- Only SHA-256 of the 256-bit token is stored, never the token itself.
create table mediaos_director_claim_invite (
    token_hash char(64) primary key,
    email varchar(254) not null,
    username varchar(80) not null,
    director_id uuid not null references mediaos_local_director(id),
    expires_at timestamptz not null,
    consumed_at timestamptz,
    created_at timestamptz not null default now(),
    constraint mediaos_director_claim_invite_email_format check (position('@' in email) > 1),
    constraint mediaos_director_claim_invite_username_format check (username ~ '^[A-Za-z0-9._-]{3,80}$')
);
create index mediaos_director_claim_invite_expiry_idx on mediaos_director_claim_invite (expires_at);
