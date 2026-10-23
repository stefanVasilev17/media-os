-- Import the exact approved HEAR text and Director Visual Pass v2 SEE directions
-- for SHOT 07 without touching Script, Voice, Visual locks or render records.
WITH vp AS (
 SELECT episode_id,script_revision,payload_sha256,payload
 FROM episode_director_voice_pack
 WHERE script_revision=3
   AND payload->>'version'='v3-explained-2026-10-21'
   AND payload#>>'{shots,0,shotKey}'='SHOT 07'
   AND jsonb_array_length(payload#>'{shots,0,clips}')=5
), proposed AS (
 SELECT vp.episode_id,vp.script_revision,vp.payload_sha256 AS voice_sha,
 jsonb_build_object(
  'schemaVersion','mediaos.director-visual-contract.v1',
  'episodeNumber',vp.payload->>'episodeNumber',
  'scriptRevision',3,
  'shotKey','SHOT 07',
  'status','VISUAL_DRAFT',
  'source','DIRECTOR_VISUAL_PASS_V2_2026-10-23',
  'directorVoicePackVersion',vp.payload->>'version',
  'review',jsonb_build_object(
    'fps',30,'width',1920,'height',1080,
    'initialHoldFrames',24,'gapFrames',jsonb_build_array(36,30,45,36),
    'finalHoldFrames',54,'videoLockRequiresDirectorApproval',true
  ),
  'timeline',(
   SELECT jsonb_agg(jsonb_build_object(
     'segmentId','SHOT07-VISUAL-C'||lpad(ordinality::text,2,'0'),
     'shotKey','SHOT 07',
     'clipKey',clip->>'clipKey',
     'startSecond',(clip->>'startSecond')::integer,
     'endSecond',(clip->>'endSecond')::integer,
     'hear',clip->>'narration',
     'voiceDirection',clip->>'voiceDirection',
     'visual',(CAST('[{"summary":"Continue from SHOT 06 final horizontal living architecture map, selected Instance B and green request entering the pre-existing Auth Service. Reveal that routing to a healthy server is separate from proof of identity. Keep IDENTITY UNVERIFIED visibly unresolved throughout.","objects":["Existing living-map horizontal nodes","Load Balancer Instance B","Single canonical green Login Request","Auth Service existing shell","Unverified decision core","User Database background dim"],"camera":"Open with 0.8 second hold on the inherited SHOT06 map; travel along the already-existing route; ease into one continuous 0.9–1.3s detail push; stabilize; no duplicate node or reset.","attentionCue":"DESTINATION SELECTED differs from IDENTITY UNVERIFIED; no authenticated status or celebratory green check.","semanticAnchors":["AUTH_ARRIVAL","INSTANCE_B","ROUTING_NOT_TRUST","AUTH_DEFINITION","PROOF_QUESTION"],"effects":["Single existing green packet settles exactly at Auth input port","Selected Instance B stays lit then softens","Unverified core enters with restrained violet light","Hold after C01 for 36 frames"],"notes":"Use same dark navy, lines, colors and perspective as SHOT06 v5. Keep all important labels in 1920x1080 safe zone. No clashing bounding boxes. Narration unchanged."},{"summary":"Zoom holds on Auth Service to display that a login request contains an account identifier (fictional email) and a submitted password, which remain unverified. The identifier selects an account; the password is secret offered as proof.","objects":["Original green Login Request inbox","ACCOUNT IDENTIFIER field","Fictional alex@example.com","PASSWORD field masked bullets","RECEIVED status","IDENTITY UNVERIFIED decision"],"camera":"Remain on the same stable Auth Service detail camera, reframing only subtly to the request inbox. Do not cut to another scene.","attentionCue":"An identifier is a claim, not identity evidence. Password always masked; request received does not mean authentication succeeded.","semanticAnchors":["INBOX_OPEN","INPUT_FIELDS","IDENTIFIER_ROLE","SECRET_ROLE","NOT_YET_CORRECT","FORMAT_PREP"],"effects":["Identifier field revealed only when named","Password field revealed and masked without exposing any characters","Fields highlight individually to narration","Decision core stays unverified","Hold after C02 for 30 frames"],"notes":"In left input card use ample space for alex@example.com and stacked ACCOUNT/IDENTIFIER heading. Keep all text inside its card with at least 24px padding."},{"summary":"Explain structurally valid request versus actual identity verification with three separate checks: required fields, expected format, input limits. Show each check in spoken order; then REQUEST VALID beside NOT AUTHENTICATED at once.","objects":["Auth Request Validation panel","Required Fields check","Expected Format check","Input Limits check","REQUEST VALID state","NOT AUTHENTICATED state separate from validation"],"camera":"Stay within existing Auth Service panel. Minor attention/lighting shifts rather than cuts or unrelated zooms.","attentionCue":"Three checks turn on at their exact voice anchors. A valid request still has not proved the password.","semanticAnchors":["VALIDATION_NAME","EMPTY_FIELD_EXAMPLE","FORMAT_EXAMPLE","REQUIRED_CHECK","STRUCTURE_CHECK","LIMITS_CHECK","VALID_NOT_LOGIN"],"effects":["Reveal checks at actual ElevenLabs word timestamps","Do not modify successful email into empty-field hypothetical","Validation checks sequentially receive restrained teal check icons","Hold REQUEST VALID and NOT AUTHENTICATED together for 45 frames after C03"],"notes":"No failed-login animation in the successful-login story. All labels must fit nonoverlapping cards; high text contrast; no microtelemetry."},{"summary":"Clarify why the Auth Service cannot verify the password yet: submitted identifier and secret exist, but stored account facts/verifier are missing. Point to the pre-existing dim User Database to motivate creating User Lookup.","objects":["Original stationary green Login Request","Submitted email/secret facts","Missing Account Data status","Existing User Database dim on the right","New cyan User Lookup envelope staged at distinct output port"],"camera":"Shift emphasis inside current Auth view to decision and then pan right enough to establish User Database relative location. No geometry teleportation.","attentionCue":"Knowing the submitted email does not prove account ownership. ACCOUNT DATA NEEDED. Blue lookup is a different request and is not sent until the narration calls for it.","semanticAnchors":["CHECKS_PASSED","PASSWORD_UNKNOWN","EMAIL_CLAIM","FIND_ACCOUNT","GET_FACTS","LOOKUP_BORN"],"effects":["Request valid remains resolved while IDENTITY UNVERIFIED persists","Account-data dependency lights as requested","Cyan lookup appears at its own outbound port only on LOOKUP_BORN","Hold after C04 for 36 frames"],"notes":"Do not show actual stored hash/verifier until SHOT08; no future session creation or dashboard. Use stacked ACCOUNT DATA / NEEDED to stay inside bounds."},{"summary":"Maintain two distinct concurrent requests: green original Login Request stays inside Auth; cyan User Lookup goes from the Auth output toward User Database. Camera returns to regional living architecture with unbroken horizontal geometry and prepares SHOT08.","objects":["Original green LOGIN REQUEST, stationary at Auth input","Cyan USER LOOKUP packet, unique identity","Dedicated outgoing Auth port","Horizontal Auth Service-to-User Database connector","Existing User Database node, not yet processed"],"camera":"Smoothly open Auth detail panel back to the established regional map; pan with cyan lookup; no black-frame or hard reset; end with 1.8 seconds of breathing room before SHOT08.","attentionCue":"Two separate requests do different jobs: original login waits in Auth while lookup asks database which account matches email and what it needs for verification.","semanticAnchors":["ORIGINAL_STAYS","LOOKUP_TRAVELS","NOT_SECOND_LOGIN","SERVICE_QUESTION","LOOKUP_ACCOUNT","INFORMATION_FOR_VERIFY"],"effects":["Maintain original green request stationary","Move exactly one cyan packet from its own right-hand port","Only account identifier on lookup label, never password","End lookup near existing User Database input port; SHOT08 continues without jump","End hold 54 frames, assigned only once across shot boundary"],"notes":"Verify port centers and paths. Keep 24px clear packet corridor and 28px connector-to-label clearance. SHOT08 inherits same node positions and camera direction."}]' AS jsonb))->(ordinality::integer-1)
   ) ORDER BY ordinality)
   FROM jsonb_array_elements(vp.payload#>'{shots,0,clips}') WITH ORDINALITY AS item(clip,ordinality)
  )
 ) AS visual_payload
 FROM vp
 WHERE EXISTS (
   SELECT 1 FROM production_stage ps
   WHERE ps.episode_id=vp.episode_id AND ps.stage_key='SCRIPT'
     AND ps.status='LOCKED' AND ps.current_revision=3
 )
 AND (SELECT count(*) FROM voice_clip_workflow vc
      WHERE vc.episode_id=vp.episode_id AND vc.script_revision=3
        AND vc.shot_key='SHOT 07'
        AND vc.voice_approved_at IS NOT NULL
        AND vc.generated_audio IS NOT NULL)=5
), hashed AS (
 SELECT episode_id,script_revision,voice_sha,visual_payload,
        encode(sha256(convert_to(visual_payload::text,'UTF8')),'hex') AS visual_sha
 FROM proposed
)
INSERT INTO episode_director_visual_contract(
 episode_id,script_revision,shot_key,voice_pack_sha256,payload_sha256,payload)
SELECT episode_id,script_revision,'SHOT 07',voice_sha,visual_sha,visual_payload FROM hashed
ON CONFLICT (episode_id,script_revision,shot_key) DO NOTHING;
