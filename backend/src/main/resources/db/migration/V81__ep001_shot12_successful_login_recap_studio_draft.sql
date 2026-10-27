-- EP001 successful-login recap: isolated SHOT 12 Studio working copy.
-- Never update existing studio_shot/studio_clip rows. Preserve LOCKED SHOT01–11 masters.
-- The legacy original 16-shot script is not the live 2026-10-21 editorial plan.
-- Idempotent choice: if SHOT 12 number is taken, leave it untouched; QA reports the collision.

INSERT INTO studio_shot (id, episode_id, shot_number, title, visual_prompt)
VALUES (
  '55650012-2701-4d30-8f01-012000000000',
  '22222222-2222-2222-2222-222222222222',
  12,
  'The Complete Login Journey — From One Click to Trusted Access',
  'EP001 successful-login recap; C01 fully populated Dashboard -> Request Assembly -> Network; C02 API Gateway -> Load Balancer -> Auth Service <-> User Database; C03 create authentication state -> response -> Phone, then separate GET /account with proof -> Protected API authenticates and checks permission -> permitted data. Follow SHOT11 Presentation V5 visual language. Preview is not LOCKED.'
)
ON CONFLICT (episode_id, shot_number) DO NOTHING;

INSERT INTO studio_clip (id, shot_id, sequence, narration, voice_direction)
SELECT '55650012-2701-4d30-8f01-012000000001', '55650012-2701-4d30-8f01-012000000000', 1, 'Look at the Dashboard. To you, the whole journey was a tap, a spinner, and a screen that finally opened.

But the system never saw a button. It saw a message: credentials, headers, and context — assembled on your device and sent across the network to find the service responsible for authentication.', 'Warmly observational and composed. Open with a small sense of arrival on Dashboard, then curious precision for the invisible request. Neutral international English. Clear natural pauses between paragraphs; never rushed.'
FROM studio_shot
WHERE id='55650012-2701-4d30-8f01-012000000000' AND episode_id='22222222-2222-2222-2222-222222222222' AND shot_number=12
ON CONFLICT (shot_id, sequence) DO NOTHING;

INSERT INTO studio_clip (id, shot_id, sequence, narration, voice_direction)
SELECT '55650012-2701-4d30-8f01-012000000002', '55650012-2701-4d30-8f01-012000000000', 2, 'The gateway handled the entry. The load balancer selected a destination. The Auth Service then asked the database for the account information it couldn’t safely guess.

It compared your password against the stored credential representation, without needing to retrieve the original password.

Every step answered a different question, and none of them could replace the others.', 'Calm, analytic, assured. Crisp, distinct emphasis on gateway, load balancer, Auth Service, and database. Explain the stored credential representation without dramatic stress. Neutral international English. Give the final line room to land.'
FROM studio_shot
WHERE id='55650012-2701-4d30-8f01-012000000000' AND episode_id='22222222-2222-2222-2222-222222222222' AND shot_number=12
ON CONFLICT (shot_id, sequence) DO NOTHING;

INSERT INTO studio_clip (id, shot_id, sequence, narration, voice_direction)
SELECT '55650012-2701-4d30-8f01-012000000003', '55650012-2701-4d30-8f01-012000000000', 3, 'Then came the part the spinner could never show you.

A successful password check became reusable authentication state. The response returned to the phone, the app opened the Dashboard, and a new request proved who you were before private data appeared.

That’s what really happens when you click Login.

Not just a password check. Not simply a new screen.

A distributed system takes a claim about who you are, verifies it, remembers the result, and uses it to decide what you can access next.', 'Reflective confidence growing into a satisfying conclusion. Aha moment on reusable authentication state and the separate protected-data request. Warm but technically precise, never trailer-like. Neutral international English. Deliberate, unhurried pauses before each final short line.'
FROM studio_shot
WHERE id='55650012-2701-4d30-8f01-012000000000' AND episode_id='22222222-2222-2222-2222-222222222222' AND shot_number=12
ON CONFLICT (shot_id, sequence) DO NOTHING;

