create table mediaos_local_director (
    id uuid primary key,
    username varchar(80) not null unique,
    password_hash varchar(255) not null,
    totp_secret_encrypted text not null,
    role varchar(16) not null default 'DIRECTOR' check (role = 'DIRECTOR'),
    active boolean not null default false,
    failed_attempts integer not null default 0 check (failed_attempts >= 0),
    locked_until timestamptz,
    last_totp_step bigint not null default -1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
