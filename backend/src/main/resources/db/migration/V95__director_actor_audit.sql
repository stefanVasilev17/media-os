alter table episode_workspace_event
    add column actor_issuer varchar(512),
    add column actor_subject varchar(255);

alter table episode_learning_proposal
    add column actor_issuer varchar(512),
    add column actor_subject varchar(255);
