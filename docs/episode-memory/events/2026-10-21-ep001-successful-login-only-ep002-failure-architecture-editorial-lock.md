# Architectural Thinking — EP001 Editorial Scope LOCK: Complete Successful Login

**Director explicit approval: 2026-10-21.**

> "да,да това имах предвид. Да завършим с успешен Login."

This approves a **re-scoping of the EDITORIAL STORY for EP001**, not any visual or voice change to previously locked shots. The previous ~20-minute, 16-shot screenplay remains an immutable historical source. Create a separately versioned revised story/script/shot plan from this editorial decision; do not silently overwrite the existing locked script revision 3 or preapproved SHOT 01–06 masters.

## EP001: "What Really Happens When You Click Login?"

**Editorial status: DIRECTOR APPROVED — SCOPE LOCKED.** The episode must deliver on its title by following the **complete successful (happy-path) Login**, all the way to a **visible logged-in Dashboard**. Avoid leaving the story at mere User Lookup or at the User Database response. The core end-to-end arc is:

> Login Phone → Login Intent / Request Assembly → Network / Transit → API Gateway → Load Balancer → Auth Service / Validation Steps → User Lookup ↔ User Database → Credential Verification (stored credential representation; never plaintext) → Authenticated Decision → Authentication State / Session Creation → Success Response / Route Decision → Logged-in Phone / Dashboard.

- SHOT 01–06: all Director-LOCKED visuals and original voices are immutable. SHOT 06 v5 with 7.5–9.5s map-to-balancer entry and seven original C01–C07 voices is protected, with a separate Railway deployment handoff in issue #89.
- NEW SHOT work begins after the already produced and locked SHOT 06, currently at Auth Service / Validation Steps and User Lookup; then User Database / User Data.
- Use the existing historical script's SHOT 07 and SHOT 08 as story references, subject to editorial fit and revised timestamps. **Historical SHOT 09 (slow DB / locally healthy Auth Service) and SHOT 10 (trust breakdown / denial) are DEFERRED**, not destroyed.
- Bring the historical successful-journey SHOT 11 (verify credentials), SHOT 12 (authentication state / session proof) and SHOT 13 (Dashboard return) *forward* directly after the User Database. A concise successful path is more important than maintaining the original shot numbers or timing.
- Close with a concise original ending / system-wide recap in the Living Architecture World, then the Dashboard shown visibly. Historical SHOT 15 recap can be adapted, omitting the failure branch. An optional single-line bridge to VIDEO 02 is fine; it must not replace the actual Dashboard payoff. Historical SHOT 14 Session Restore Flow is deferred to a later suitable video; historical SHOT 16 next-request teaser can be shortened and used at the appropriate future bridge, rather than introducing a full session-persistence lesson here.
- No detailed retry storms, circuit breakers, disaster recovery, failed login case studies, timeout budgets, or session refresh/restore explanations in EP001. SHOT 06 already contains an APPROVED simple Load Balancer health-probe/unhealthy-instance demo that remains locked; **do not remove or re-edit it**. This is basic routing/eligibility, not a mandate to develop a whole failures segment.
- Preserve the original software-system nuance: Session ID and Cookie/JWT are possible architectural variants, not universal claims; the authentication proof and account credential representation are not plaintext passwords.
- Keep the Living Architecture World visual continuity, Remotion-first implementation, voice-aligned camera choreography and three short-form extractable moments.
- **Do not assert a finalized revised duration**: original timeline is obsolete once the standalone failures are moved; estimate only after revised script + voice timings are produced.

## VIDEO 02: failure / resilience companion episode — NEW INSERTION

**Provisional title:** "Why Login Fails Even When the Server Is Healthy" — *working title, not Director-title-LOCKED.*

This follows VIDEO 01 as an additional episode before returning to the prior Identity & Trust roadmap. Reuse the established Living Architecture World, its Auth Service, User Database, Gateway and Load Balancer, and teach *a different architectural question*: how healthy components plus a slow or unavailable dependency create end-to-end Login failure; extend into appropriate, accurately scoped timeouts, retries, overload, partial failures, degradation, protective limits and recovery paths as justified by a new expert-level script. Previously deferred failure portions of the original script are **source material for the new episode**, not pre-approved final narration for VIDEO 02. Avoid cramming all disaster topics into one video without a coherent viewer question.

**After VIDEO 02**, resume the original Identity & Trust content plan; the previously planned "How Does a Website Remember You're Logged In?" becomes the next candidate in sequence (renumber editorially when creating the release calendar). The plan may adjust further only by Director approval.

## Production invariants and safe change management

1. This is an **editorial-scoping decision**, not approval for an automatic script mutation or an edit of previously LOCKED video/voice.
2. Retain prior script revision and detailed HEAR/SEE shot materials for provenance and reuse. Author a new **versioned editorial script/shot list**, with full new chronological timing, against this decision before implementing SHOT 07 onward.
3. Existing Railway deployment blocker and issue #89 are independent and remain open until native deployment, QA and sync of SHOT 06 v5.
4. Keep automation/agent research and future topic recommendations aware of new **VIDEO 01 happy-path → VIDEO 02 failure-engineering → original Identity & Trust sequence**. Separate each video's audience promise; never describe VIDEO 01 as an exhaustive production-failure tutorial.
5. The goal remains technical accuracy, senior-level insight, broad-accessible narration, high retention, natural Aha moments, and reusable objects without filler.
