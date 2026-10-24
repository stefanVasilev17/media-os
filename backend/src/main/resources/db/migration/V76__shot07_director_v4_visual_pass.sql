-- Director-approved visual aesthetics only; original Script r3 and five voice clips are immutable.
WITH eligible AS (
  SELECT v.episode_id,v.script_revision,v.shot_key,v.payload
  FROM episode_director_visual_contract v
  WHERE v.shot_key='SHOT 07' AND v.script_revision=3
    AND v.payload->>'status'='VISUAL_DRAFT'
    AND v.payload->>'source'='DIRECTOR_TIER2_VISUAL_PASS_V3_2026_10_24'
    AND jsonb_array_length(v.payload->'timeline')=5
    AND EXISTS (SELECT 1 FROM episode_director_voice_pack voice
      WHERE voice.episode_id=v.episode_id AND voice.script_revision=v.script_revision
      AND voice.payload_sha256=v.voice_pack_sha256)
    AND NOT EXISTS (SELECT 1 FROM visual_shot_lock lock
      WHERE lock.episode_id=v.episode_id AND lock.script_revision=3
      AND lock.shot_key=v.shot_key)
), revised AS (
 SELECT e.episode_id,e.script_revision,e.shot_key,
   jsonb_set(
     jsonb_set(e.payload,'{source}',to_jsonb('DIRECTOR_TIER_PLUS_PLUS_V4_2026_10_24'::text)),
     '{timeline}',(
       SELECT jsonb_agg(jsonb_set(t.item,'{visual,summary}',
                to_jsonb((CASE t.ord
                 WHEN 1 THEN 'Premium Auth Service hero: centered title, two large teal/violet cards and one luminous arrow. Left Login request, right Who is this? with upright centered question icon. Remove chapter label and NOT VERIFIED pill.'
                 WHEN 2 THEN 'Premium mini phone illustrates alex@example.com and masked password arriving as Account Identifier and Submitted Secret. Clear large cards, no telemetry UI.'
                 WHEN 3 THEN 'Visual validation lesson: three premium cards appear one by one on EMPTY_FIELD_EXAMPLE, FORMAT_EXAMPLE and LIMITS_CHECK. Strong card borders, no ghosted previous state; bottom: The request may be valid in form, while the password is still unproven.'
                 WHEN 4 THEN 'Premium Submitted / Account facts needed two-card composition with upright centered question mark on dotted connector. Explain stored verifier dependency before any identity success.'
                 WHEN 5 THEN 'Return to existing horizontal living map. Original green login remains at Auth; single subtle cyan User Lookup with identifier only travels to original User Database. No oversized packet.'
                 ELSE 'Preserve the original approved voice-aligned visual content.'
                 END)::text),true) ORDER BY t.ord)
       FROM jsonb_array_elements(e.payload->'timeline') WITH ORDINALITY t(item,ord)
     ),true) AS payload
 FROM eligible e
)
UPDATE episode_director_visual_contract v
SET payload=revised.payload,
    payload_sha256=encode(sha256(convert_to(revised.payload::text,'UTF8')),'hex'),
    updated_at=now()
FROM revised
WHERE v.episode_id=revised.episode_id AND v.script_revision=revised.script_revision
 AND v.shot_key=revised.shot_key;
