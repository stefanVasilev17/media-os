-- Visual-DRAFT polish v5 only. Immutable Director voice C01-C05 and script revision 3 untouched.
WITH eligible AS (
 SELECT v.episode_id,v.script_revision,v.shot_key,v.payload
 FROM episode_director_visual_contract v
 WHERE v.shot_key='SHOT 07' AND v.script_revision=3
 AND v.payload->>'status'='VISUAL_DRAFT'
 AND v.payload->>'source'='DIRECTOR_TIER_PLUS_PLUS_V4_2026_10_24'
 AND jsonb_array_length(v.payload->'timeline')=5
 AND EXISTS (SELECT 1 FROM episode_director_voice_pack voice
 WHERE voice.episode_id=v.episode_id AND voice.script_revision=v.script_revision
 AND voice.payload_sha256=v.voice_pack_sha256)
 AND NOT EXISTS (SELECT 1 FROM visual_shot_lock l
 WHERE l.episode_id=v.episode_id AND l.script_revision=3 AND l.shot_key='SHOT 07')
), revised AS (
 SELECT e.episode_id,e.script_revision,e.shot_key,
 jsonb_set(
   jsonb_set(e.payload,'{source}',to_jsonb('DIRECTOR_TIER_PLUS_PLUS_V5_2026_10_24'::text)),
   '{timeline}',(
     SELECT jsonb_agg(jsonb_set(t.item,'{visual,summary}',
       to_jsonb((CASE t.ord
              WHEN 1 THEN 'Premium Auth Service v5 keeps approved centered mint Login Request and violet Who is this? educational hero with upright question icon. Opaque cinematic backdrop eliminates underlying living-map bleed and black-blue seam artefacts.'
              WHEN 2 THEN 'Recognizable fictional mini phone submits identifier alex@example.com and masked password into separate clear information tiles. Replace malformed submitted-secret icon with one geometric padlock; keep letter-by-letter reveal and original voice sync.'
              WHEN 3 THEN 'Three high-contrast Request Validation tiles appear sequentially on EMPTY_FIELD_EXAMPLE, FORMAT_EXAMPLE and LIMITS_CHECK spoken anchors. Each entry eases upward. Use an unbroken coherent navy backdrop, no map translucency or ghost panels.'
              WHEN 4 THEN 'Submitted and Account Facts Needed cards remain aligned on one deliberate grid. Center the upright question mark exactly. Create a clean cyan User Lookup badge with no overlapping icon/text. Stored facts are still required; there is no login success.'
              WHEN 5 THEN 'After exiting Auth detail, preserve original horizontal living map, animate mint waiting pulse at Auth Service and cyan lookup tracer toward existing User Database. Per narrated anchor introduce: original waits, internal request moves, not another login, database question, account lookup by identifier, stored facts requested. Keep no password in lookup and no static map-only narration.'
              ELSE 'Keep already approved visual without altering HEAR and voice timing.'
              END)::text),true) ORDER BY t.ord)
     FROM jsonb_array_elements(e.payload->'timeline') WITH ORDINALITY t(item,ord)
   ),true
 ) AS payload
 FROM eligible e
)
UPDATE episode_director_visual_contract v
SET payload=revised.payload,
    payload_sha256=encode(sha256(convert_to(revised.payload::text,'UTF8')),'hex'),
    updated_at=now()
FROM revised
WHERE v.episode_id=revised.episode_id AND v.script_revision=revised.script_revision
AND v.shot_key=revised.shot_key;
