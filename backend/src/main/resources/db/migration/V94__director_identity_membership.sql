create table mediaos_director_membership (
    project_id uuid not null,
    issuer varchar(512) not null,
    subject varchar(255) not null,
    role varchar(16) not null,
    active boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint mediaos_director_membership_pk primary key (project_id, issuer, subject),
    constraint mediaos_director_membership_role_check check (role in ('VIEWER', 'EDITOR', 'DIRECTOR'))
);

create index mediaos_director_membership_active_lookup
    on mediaos_director_membership(project_id, issuer, subject)
    where active = true;
