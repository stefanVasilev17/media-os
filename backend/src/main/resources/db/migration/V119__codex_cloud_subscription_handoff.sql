create table episode_codex_cloud_handoff (
    id uuid primary key,
    request_id uuid not null unique,
    package_id uuid not null references episode_package_import(id),
    episode_key varchar(24) not null,
    source_sha256 char(64) not null,
    readiness_fingerprint char(64) not null,
    asset_catalog_sha256 char(64) not null,
    manifest_sha256 char(64) not null,
    manifest_json jsonb not null,
    prompt_text text not null,
    shot_count integer not null check (shot_count between 1 and 40),
    status varchar(28) not null default 'READY_FOR_CODEX_CLOUD'
        check (status in ('READY_FOR_CODEX_CLOUD','PR_LINKED_UNVERIFIED')),
    pr_number integer check (pr_number between 1 and 2147483647),
    pr_url text,
    linked_at timestamptz,
    director_issuer text not null,
    director_subject text not null,
    preflight_audit_id uuid not null,
    created_at timestamptz not null default now(),
    unique(package_id,readiness_fingerprint,asset_catalog_sha256),
    check ((status='PR_LINKED_UNVERIFIED') = (pr_number is not null
          and pr_url is not null and linked_at is not null))
);

create index episode_codex_cloud_handoff_by_package
  on episode_codex_cloud_handoff(package_id,created_at desc);
