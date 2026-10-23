-- Director Tier++ visual redesign only: preserve HEAR, original locked voices and existing QA/LOCK records.
-- Update the independent SHOT 07 VISUAL_DRAFT only when it is not yet Director locked.
WITH current_draft AS (
  SELECT c.episode_id,c.script_revision,c.shot_key,c.payload,
         c.voice_pack_sha256
  FROM episode_director_visual_contract c
  WHERE c.shot_key='SHOT 07' AND c.script_revision=3
    AND c.payload->>'status'='VISUAL_DRAFT'
    AND c.payload->>'source'='DIRECTOR_VISUAL_PASS_V2_2026-10-23'
    AND jsonb_array_length(c.payload->'timeline')=5
    AND NOT EXISTS (
      SELECT 1 FROM visual_shot_lock l
      WHERE l.episode_id=c.episode_id AND l.script_revision=3
        AND l.shot_key='SHOT 07'
    )
    AND EXISTS (
      SELECT 1 FROM episode_director_voice_pack vp
      WHERE vp.episode_id=c.episode_id AND vp.script_revision=3
        AND vp.payload_sha256=c.voice_pack_sha256
    )
),
revised AS (
  SELECT d.episode_id,d.script_revision,d.shot_key,
         jsonb_set(
           jsonb_set(d.payload,'{source}',
             to_jsonb('DIRECTOR_TIER2_VISUAL_PASS_V3_2026_10_24'::text)),
           '{timeline}',
           (
             SELECT jsonb_agg(
               jsonb_set(item.segment,'{visual}',refs.new_visual->(item.ordinality::integer-1),true)
               ORDER BY item.ordinality
             )
             FROM jsonb_array_elements(d.payload->'timeline') WITH ORDINALITY item(segment,ordinality)
             CROSS JOIN (SELECT '[{"summary":"Carry the viewer from the exact SHOT06 living map into one unmistakable Auth Service trust boundary: existing green login request arrives from Instance B, but no identity decision has been made. Replace the previous noisy dashboard with a single cinematic hero question rather than a sea of status chips.","objects":["Existing SHOT06 map and selected Instance B","Existing Auth Service node","Single green LOGIN REQUEST (original)","Large Auth trust question mark","One restrained NOT VERIFIED indicator"],"camera":"Start on existing regional architecture, preserve orientation and node positions, glide into Auth Service, reveal one editorial teaching canvas; do not reset perspective.","attentionCue":"The load balancer picked a healthy destination. The Auth Service still has to decide who the caller is.","semanticAnchors":["AUTH_ARRIVAL","INSTANCE_B","ROUTING_NOT_TRUST","AUTH_DEFINITION","PROOF_QUESTION"],"effects":["Maintain inherited SHOT06 map and route with one green request","Use simple spatial handoff to Auth Service","A single large question mark enters at proof question","No password fields or internal detail panels before the voice introduces them"],"notes":"Visual hierarchy: one focal object, one thought per shot. Art direction dark navy, mint request, restrained violet unresolved identity. Do not replay SHOT01 or re-click Login."},{"summary":"Make the invisible request tangible: a smaller but legible phone is shown as a RECAP of the login screen with fictional alex@example.com and masked password; a green transport line shows these two pieces arriving at Auth Service, which expands them as identifier and submitted secret. The phone is an instructional illustration, not a second login attempt.","objects":["Refined mini phone device, email form and masked password","Single green request transport connector","Two large structured request field tiles","Identifier user icon and secret key icon","Persistent unresolved identity cue"],"camera":"Hold in the Auth explanation canvas and favor a composed asymmetrical 30/70 split: crisp phone at left, two big annotated field tiles at right. Avoid unnecessary zooms.","attentionCue":"A claimed email identifies the account; a password is offered as proof. Submitted does not mean verified.","semanticAnchors":["INBOX_OPEN","INPUT_FIELDS","IDENTIFIER_ROLE","SECRET_ROLE","NOT_YET_CORRECT","FORMAT_PREP"],"effects":["Type the fictional email letter by letter as its narration begins","Introduce password bullets only on spoken secret cue, never show plain password","Transfer information visually from phone to exactly two fields","Introduce RECEIVED only after both fields are visible","Keep identity unresolved in violet"],"notes":"Real login example, not a stock dashboard. Lower-third explanation max one sentence. Phone and data tiles must pass 1280x720 legibility check. Preserve original approved narration verbatim."},{"summary":"Make Request Validation teach through three large concrete micro-experiments: both fields physically present; the ''@'' portion of a real address visibly satisfies email structure; an input length gauge indicates within policy, without inventing a maximum. Advance one checkpoint at each approved spoken anchor, then distinguish REQUEST VALID from LOGIN SUCCESS.","objects":["Large pictorial fields-present example","Email structure tile with highlighted @","Illustrative input length gauge without numerical policy","Sequentially illuminated three-step connected rail","REQUEST VALID versus NOT YET LOGIN SUCCESS comparison"],"camera":"Replace the mini phone with three evenly spaced readable validation checks. No scrolling list, no telemetry. Camera stable; visual examples do the teaching.","attentionCue":"Request validation is a syntax/shape screening phase, not password proof.","semanticAnchors":["VALIDATION_NAME","EMPTY_FIELD_EXAMPLE","FORMAT_EXAMPLE","REQUIRED_CHECK","STRUCTURE_CHECK","LIMITS_CHECK","VALID_NOT_LOGIN"],"effects":["Introduce checks in exact narrated sequence, never all at once","Use real glyphs and field shapes to demonstrate presence, email format and size","End with green REQUEST VALID while violet NOT VERIFIED remains","No login failure or red broken-route theatrics"],"notes":"Do not invent specific server validation rules. The email format and size gauge are illustrative examples. Preserve voice clip timing and pauses."},{"summary":"Show the reason for database lookup with two tangible objects: what Auth possesses (fictional email and masked password) and what Auth still lacks (stored account facts). An intervening uncertainty symbol prevents premature identity verification. A distinct cyan magnifier appears only when User Lookup is named.","objects":["Green submitted request facts in one compact card","Violet not-yet-verified proof boundary","Large Account Facts Needed card and search lens icon","Separate cyan outgoing User Lookup concept"],"camera":"Shift emphasis from completed validation rail to dependency card, no hard scene reset. Use thoughtful negative space and one visual comparison.","attentionCue":"The Auth Service cannot prove the password before retrieving stored account-verification information.","semanticAnchors":["CHECKS_PASSED","PASSWORD_UNKNOWN","EMAIL_CLAIM","FIND_ACCOUNT","GET_FACTS","LOOKUP_BORN"],"effects":["Keep original green login request stationary","Magnify missing stored account facts on specific spoken cue","Create a cyan lookup object only at LOOKUP_BORN","No real stored hash or return response until SHOT08"],"notes":"Account lookup should be intuitively necessary, never a floating text sticker. Contrast claim versus stored facts. Password must not be included in lookup payload."},{"summary":"Return continuously to the existing horizontal architecture map. Hold the original mint login request inside Auth and show ONE distinct cyan query moving from a dedicated Auth outgoing port into the preexisting User Database input. The query contains only the account identifier. Give it a clean editorial caption away from the connector rather than a large ugly packet.","objects":["Unmodified green LOGIN REQUEST at Auth","Single cyan query tracer with search lens glyph","Existing horizontal Auth Service to User Database connector","Existing User Database node","One airy lower-right query detail card away from the route"],"camera":"Open the detail explanation smoothly back into the inherited SHOT06 regional map; ease a subtle rightward attention shift, with no node teleportation or replacement architecture.","attentionCue":"Two independent operations: the login request waits for proof, while User Lookup asks the database for stored account facts.","semanticAnchors":["ORIGINAL_STAYS","LOOKUP_TRAVELS","NOT_SECOND_LOGIN","SERVICE_QUESTION","LOOKUP_ACCOUNT","INFORMATION_FOR_VERIFY"],"effects":["Green request remains stationary","Cyan tracer moves once at LOOKUP_TRAVELS","Secondary card shows email = alex@example.com and explicitly no password","End camera near existing User Database input, breathing hold into SHOT08"],"notes":"Preserve SHOT06 node geometry and one green request; cyan service-to-service traffic is visually distinct and restrained. The diagram must not include giant USER LOOKUP text laid across the topology."}]'::jsonb AS new_visual) refs
           ),
           true
         ) AS updated
  FROM current_draft d
)
UPDATE episode_director_visual_contract c
SET payload=r.updated,
    payload_sha256=encode(sha256(convert_to(r.updated::text,'UTF8')),'hex'),
    updated_at=now()
FROM revised r
WHERE c.episode_id=r.episode_id AND c.script_revision=r.script_revision
  AND c.shot_key=r.shot_key;
