update episode_source_snapshot
set is_current=false
where episode_id='22222222-2222-2222-2222-222222222222'
  and is_current=true;

insert into episode_source_snapshot(id, episode_id, version, source_type, payload, is_current)
values (
  '77777777-aaaa-4444-8888-111111111112',
  '22222222-2222-2222-2222-222222222222',
  'v2.6',
  'CORE_PRODUCTION_BIBLE',
  $$
  {
    "title":"What Really Happens When You Click Login?",
    "centralQuestion":"How does a system turn submitted credentials into trusted, remembered authentication state?",
    "finalLesson":"Login is not a password check. It is a distributed journey that turns a human claim into trusted system state.",
    "workingScriptDurationSeconds":{"target":1200,"min":1140,"max":1260},
    "expectedFinalEditDurationSeconds":{"min":960,"max":1080},
    "narration":{
      "language":"English",
      "wordsPerMinute":{"min":130,"max":145},
      "style":["clear","simple","professional","causal","human-focused","senior reasoning","no hype","minimal jargon"],
      "maxListStylePassages":2,
      "oneNewConceptAtATime":true
    },
    "retentionContract":{
      "meaningfulNewValueSeconds":{"targetMin":45,"targetMax":60,"hardMax":65},
      "microTensionSeconds":{"targetMin":60,"targetMax":90,"hardMax":105},
      "cognitiveReliefSeconds":{"targetMin":180,"targetMax":240,"hardMax":300},
      "minimumAhaMoments":3,
      "minimumReelReadyPassages":3,
      "minimumDeliberatePauses":3
    },
    "storyGrammar":["Cold Open / Human Hook","Question and Promise","Entry into the System","Journey Through Major Layers","Central Deep Dive","Failure / Trade-off Branch","Resolution / Return Path","Final Zoom-out / Architectural Lesson","Natural Forward Connection"],
    "truthPath":["User / Phone","Client Boundary","Network / Transit","API Gateway","Load Balancer","Auth Service","User Database","Authentication State / Session-Token Boundary","Response","Client","Logged-in UI"],
    "ahaMoments":[
      "The user clicked Login, but the meaningful backend request may still not have left the client.",
      "The Auth Service can be locally healthy while login is broken because a dependency such as the User Database is slow.",
      "Correct credentials are not enough. The system must create or issue authentication state that future requests can use as proof."
    ],
    "reelMoments":[
      "Your login request may still be inside the client.",
      "This service is healthy. Login is still broken.",
      "A correct password does not log you in."
    ],
    "failureBranch":"Auth Service is locally operational, but User Database is slow. User Lookup waits, the dependency response is delayed, the time budget falls, and the human still sees a spinner or timeout. Local health is not end-to-end health.",
    "dataTruth":"Do not imply the User Database returns the original plaintext password. Use a conceptual account record with identity, stored credential representation, account status, and relevant security metadata.",
    "visualRules":[
      "One world. One living map. Many engineering stories.",
      "Phone is the human anchor; client/browser context stays compact.",
      "Backend services and dependencies become visually dominant after the request leaves the client.",
      "Move the camera when focus changes and hold still during reasoning.",
      "Use controlled shot segments rather than one uninterrupted episode animation.",
      "On-screen text is orientation only; narration carries reasoning."
    ],
    "outOfScope":["TLS internals","OAuth","OIDC","SAML","social login","passkeys","MFA implementation","password reset","refresh token internals","JWT internals","hashing algorithm deep dive","replication deep dive","authorization deep dive","Redis deep dive"]
  }
  $$::jsonb,
  true
)
on conflict (episode_id, version) do update
set payload=excluded.payload,
    source_type=excluded.source_type,
    is_current=true;

update episode
set source_of_truth_version='v2.6'
where id='22222222-2222-2222-2222-222222222222';

update agent_profile
set instructions_version='2.0'
where agent_key='SCRIPT_AGENT';

update production_stage
set artifact=null,
    artifact_schema_version='SCRIPT_CONTRACT_V2',
    summary='The Script Agent will automatically create the complete timecoded working narration from the locked episode truth.',
    next_action='Review the automatic ~20-minute working script, correct it in chat, then LOCK it for Scene Agent.',
    readiness='{"ready":false,"remainingTasks":["Generate and review the complete timecoded working script contract."]}'::jsonb,
    updated_at=now()
where episode_id='22222222-2222-2222-2222-222222222222'
  and stage_key='SCRIPT'
  and status <> 'LOCKED';
