# EP002 SHOT11 — Director high-signal large amber final pass (2026-11-11)

## Director decision

Human reviewed current SHOT11 candidate and said:
1. **Remove small fast-changing info panels.** They switch too fast to teach anything.
2. **Keep only the large orange text containers**, optionally adding a few more ONLY when the message is essential to understanding the architecture.
3. **Make the ending compelling and unmissable:** viewers must be certain the next video explores **MORE THAN ONE DATABASE INSTANCE**, not merely an ambiguous "one database may not be enough" question.
4. Deliver real render-ready source without modifying approved SHOT01–10 or running paid voice/render automatically.

## Implemented SHOT11 film language

- Original `Shot07CleanArchitectureWorld` persists: 1 Phone, Gateway, Load Balancer, original 3 Auth instances and **one, single existing User Database**. The end highlights the already-existing DB with amber geometry; **no replica/multi-instance architecture appears in SHOT11**.
- Exact original SHOT10 Director-LOCK first frame `2034d8c6-99b2-46a5-9469-bf3df325d6c0` (worldFrame `10407`) remains as first-frame hold. Its tiny inherited boxes exist *only* as the locked boundary image and dissolve before the new large-card story; they are NOT standalone SHOT11 micro-panels.
- Delete original `ResponsiveCard`, `ResponsiveCaption`, `LastStory` title/footer and all ~18/20px quickly changing text panels from the new SHOT11 overlay. Only `LargeAmberStory` produces new text; it emits **ONE** substantial orange bordered/brown-orange tinted card at any time, with real 30/42px or finale 31/43px text, deterministic content-width sizing and 34-frame size transitions. No tiny explanations, duplicate footers or placeholder cards.
- Only **five essential messages**, each directly on actual spoken term trigger, with no guessed editorial timing:
  1. `ONE_DATABASE`: ONE SHARED BOTTLENECK → THREE AUTH SERVERS. ONE DATABASE.
  2. `REJECT_EXCESS`: NO EXTRA DATABASE CAPACITY → RETRIES LIMITED. EXCESS WORK REJECTED.
  3. `FAST_FAILURE`: THE TRADE-OFF → ONE LOGIN FAILS FAST. ANOTHER FINISHES.
  4. `HEALTHY_NOT_AVAILABLE`: HEALTHY ≠ AVAILABLE → THE WHOLE LOGIN MUST SUCCEED.
  5. `ONE_DB_QUESTION`: ONE DATABASE IS NOT ENOUGH? → **NEXT: MULTIPLE DATABASE INSTANCES.**
- **Final frame guarantee:** the fifth, large orange card starts at the real alignment for `ONE_DB_QUESTION`, receives emphasis at `NEXT_STORY`, NEVER fades or changes text until the LAST video frame. Strict independent Backend voice-readiness, Remotion scene contract and Worker Tier++ preflight all require `durationInFrames - ONE_DB_QUESTION.startFrame >= 120`, i.e. **4.0 whole seconds** visible at 30 fps. No synthetic timestamps, no forced pause, no extra silent video, no unapproved text-to-speech cost. If the current Take does not naturally meet that minimum, render fails closed and the Director sees a specific readiness reason rather than a low-quality outro.
- No change to actual locked English 106-word narration, original v5 five HEAR→SEE beats/19 terms, Remotion resolution 1920x1080@30fps, manually paid CPU render authorization, 10407 frame seam or selected Take validation.

## Tested and release policy

The `shot11-finale-contract.test.mjs` regression suite checks 5 actual meaningful messages, adaptive measured widths, >=30/42px text, no microscopic captions, no database replicas, identical locked world frame, long-lived final card at `NEXT_STORY` and final local frame, and refusal of real voice with less than four seconds for the title. Full Worker Docker focused/full Node suite and real Backend Java/Postgres Docker and main+factory Remotion bundles must PASS before render-ready claim. Backend + Worker MUST be pinned to the exact same SHA, each with separate predeploy guard. No paid CPU render, no new voice, and no SHOT11 LOCK without Director reviewing the new actual MP4.

**Generalizable Director rule:** In final scenes, prioritize fewer meaningful statements, larger actual-viewing typography, and a crystal-clear, persistent next-episode promise over rapid-fire informational panels. Preserve living architectural truth and readable HEAR→SEE.
