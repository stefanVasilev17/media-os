alter table ai_preview_authorization
    add column actor_issuer varchar(512),
    add column actor_subject varchar(255);

create index ai_preview_authorization_actor_ready_idx
    on ai_preview_authorization (actor_issuer, actor_subject, expires_at)
    where status = 'READY';
