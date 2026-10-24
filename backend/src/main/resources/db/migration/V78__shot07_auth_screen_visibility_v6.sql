-- Non-locking visual-only correction to restore SHOT07 Auth Service detail screen.
-- Original five Director-LOCKED voices, HEAR transcript, script r3 and older renders stay immutable.
WITH eligible AS (
 SELECT v.episode_id,v.script_revision,v.shot_key,v.payload
 FROM episode_director_visual_contract v
 WHERE v.shot_key='SHOT 07' AND v.script_revision=3
 AND v.payload->>'status'='VISUAL_DRAFT'
 AND v.payload->>'source'='DIRECTOR_TIER_PLUS_PLUS_V5_2026_10_24'
 AND jsonb_array_length(v.payload->'timeline')=5
 AND EXISTS (
   SELECT 1 FROM episode_director_voice_pack vp
   WHERE vp.episode_id=v.episode_id AND vp.script_revision=3
   AND vp.payload_sha256=v.voice_pack_sha256
 )
 AND NOT EXISTS (
   SELECT 1 FROM visual_shot_lock l
   WHERE l.episode_id=v.episode_id AND l.script_revision=3
   AND l.shot_key='SHOT 07'
 )
), revised AS (
 SELECT e.episode_id,e.script_revision,e.shot_key,
   jsonb_set(
     jsonb_set(e.payload,'{source}',
       to_jsonb('DIRECTOR_AUTH_SCREEN_VISIBLE_V6_2026_10_24'::text)),
     '{review,visibilityGuard}',
     to_jsonb('AUTH_PANEL_OPAQUE_OVER_MAP__MAP_RETURNS_ONLY_C05'::text),
     true
   ) AS payload
 FROM eligible e
)
UPDATE episode_director_visual_contract v
SET payload=r.payload,
    payload_sha256=encode(sha256(convert_to(r.payload::text,'UTF8')),'hex'),
    updated_at=now()
FROM revised r
WHERE v.episode_id=r.episode_id AND v.script_revision=r.script_revision
AND v.shot_key=r.shot_key;
