# MediaOS — Director Rule Studio: personal rules formulated by OpenAI

## Director request
Give the creator a dedicated chat-like place in MediaOS to state any production rule in natural Bulgarian or English. The AI should formulate one precise, reusable English instruction, show it in the chat response, and let the Director approve it. The next relevant Voice/Video/Script AI prompt must include the approved rule automatically, without a second reminder prompt.

## Director user journey
1. Open MediaOS Episode Selector → **Rule Studio — Write a rule with AI** (route `#/rule-studio`).
2. Choose **Global** or an existing registered episode, and scope **Voice + Video**, Voice, Video/Remotion, Script, or All.
3. Type the natural-language Director request. Toggle **AI ON** or **AI OFF**.
4. AI ON requires the configured Paid AI switch, OpenAI API, Director capability and explicit zero-token Preview. Only **Confirm & formulate rule** executes one paid model call. No automatic retry.
5. The AI response contains **proposedRule** (one clear English instruction), **explanationBg** (Bulgarian meaning), one positive example and one negative example. It is stored as **DRAFT**, never activated by a model.
6. The creator may refine any pending proposal with a follow-up prompt; the previous rule is retained with a parent proposal ID. The creator may also use manual drafting with zero OpenAI tokens.
7. A separate **Approve & Activate** requires explicit checked comparison, review note, reviewer and safeguarded Director capability. Active duplicate rules are blocked; semantic conflicts remain a human review concern.
8. A successfully activated scoped rule creates an active Production Memory row; the Next First-Pass Prompt Compiler consumes the new rule for appropriate stages. Historical render/script/voice LOCKs are not modified.

## Data
- V92 stores inert rule proposals, target global/episode UUID, exact creator prompt, precise rule text, Bulgarian explanation, positive and negative examples, parent revision, status, and publication mapping.
- Separate decision audit records APPROVE or REJECT, the memory fingerprint and Director review note.
- The active published rule is **CORRECTION / REQUIRED** scoped to ALL, SCRIPT, VOICE, VISUAL, or new VOICE_VISUAL.
- VOICE_VISUAL scope is intentionally not Script-only or Topic. It is included in the First-Pass context for SHOT, SCENE, DIRECTOR and future scoped VOICE/VIDEO planning.
- Import staging from PR #107 is separate; Rule Studio does not activate imported archival rules without their own review.

## Technical design / cost protection
- Backend `DirectorRuleStudioService`, `DirectorRuleStudioAiClient`, `DirectorRuleStudioController`.
- The AI client receives compiled canonical production policy and relevant already approved Production Memory **before** its first output, and cannot choose or expand the selected rule scope.
- Preview authorization binds exact original message, episode, scope, parent draft and live policy/memory fingerprints; it expires and is single use.
- Paid AI ON/OFF and `AiRuntimePolicyService` ledger track usage. Model output is JSON schema constrained. One model call; no paid secondary QA pass.
- Rule activation is serialized with previous Production Memory importer / Episode Learning via project advisory DB lock. Old rules are not edited silently.
- Direct OpenAI client includes mandatory production instructions; `FirstPassCoverageArchitectureTest` must recognize it.
- Scope rules are available on Voice and Video screens in a collapsible **Active Production Rules** list, with link back to Rule Studio.

## Crucial accuracy boundary
- Adding a rule to the next **AI text/planning** prompt does not retroactively edit Director-LOCKED narration, generate or regenerate ElevenLabs recordings, or run Remotion.
- Existing ElevenLabs TTS generates audio from the approved narration; the rule is shown in Voice but does not magically force different performance. A further Voice Agent workflow must translate relevant future rules into reviewable `voiceDirection` / script revisions before generation, with Director approval.
- The current Video Agent is an isolated handoff; its actual revised Remotion generation and media LOCK integration remain pending previous work.
- This Rule Studio calls a backend OpenAI API model, not the ongoing ChatGPT chat session or its private conversation state.

## Security and rollout gates
- All writes remain disabled by default: `mediaos.rule-studio.enabled=false`, `mediaos.episodes.writes-enabled=false`.
- Approval uses the existing interim `mediaos.learning.approval-secret` (at least 32 chars) and a user-supplied reviewer label. This is not real operator identity verification.
- **DO NOT expose this as a public production administrative endpoint** before implementing session-based Director role authorization, CSRF/origin restrictions, rate limiting, paid-action abuse prevention and audit actor identity.
- No production DB migration or live OpenAI call made during draft development.
- This is stacked on Draft PRs #100–#107; review dependencies and run Java 21 tests, Flyway V92, frontend TypeScript/Vite build, staging API and live AI one-shot test in a safe environment.

## QA acceptance cases
1. Global VOICE_VISUAL rule is present for future VOICE and VIDEO prompt contexts, but omitted from a SCRIPT-only context.
2. An EP002-only rule is not present when EP003 loads First-Pass context.
3. A new Rule Studio proposal is DRAFT; active Production Memory row count is unchanged until Director approves.
4. A Director can choose REJECT, which records an immutable audit and creates no new rule.
5. Exact duplicate active rule cannot be published again. Similar text produces a human-readable warning, not an automated conflict verdict.
6. Preview never runs a model. Confirm consumes exactly one authorization. Changing prompt/scope/episode/parent/active memory invalidates the previous token.
7. Missing Paid AI permission or missing Director capability blocks model requests before spending tokens.
8. Refinement creates another DRAFT with parent provenance and does not alter an already approved rule.
9. Activation updates future First-Pass prompts and the Voice/Video active-rule panels; current locked narration or media is unchanged.
10. UI is keyboard accessible on mobile, does not store Director capability in browser storage and does not claim approved semantic correctness from lexical overlap.
