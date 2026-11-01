# MediaOS — First-Pass Rules in Every Shot Revision Prompt (Draft QA)

## Goal
The creator should write only the desired correction, e.g.:
> "Частта за P95 е прекалено обща. Дай я с по-силен пример, но не променяй останалото."

MediaOS automatically constructs the first OpenAI request with:
1. The established core Shot Revision Agent contract.
2. The **current canonical Production Bible policy overlay** and every active **REQUIRED** Production Memory rule applicable to the shot (project-global and current-episode).
3. Up to five topical non-required rule/preferences selected cheaply by matching the current Director request and locked narration.
4. The exact current shot source (approved/DRAFT narration, voice direction, visual direction, story title, revision IDs).
5. A bounded small recent-chat excerpt and compact executable regression assertions.
6. The **unmodified Director message**, verbatim, as the actual user task.

This avoids needing a second "remember our rules" prompt merely because the first one omitted known constraints.

## Implementation
- `ShotPromptContextService` compiles a backend-only production instruction appendix from `ProductionMemoryService.rulesFor("ALL", episodeId)` and `CreativePolicyService.current()`.
- Mandatory rules are never silently truncated. Duplicated `scope+content` is sent once. If canonical policy or REQUIRED rules are missing, or required material is over budget, preview/run is BLOCKED before the paid model call.
- Nonrequired rules are selected on topic (naive transparent lexical matching only, not a full semantic relevance engine) and bounded to five matches and 2,200 characters.
- `/ai/preview` requires the episode/shot script revision, original message and **compiled rules fingerprint** to issue a short-lived paid authorization. The UI displays the number of required and relevant supplemental rules without exposing the entire request.
- `/ai/run` reassembles the same instruction pack, checks the fingerprint and consumes the preview token. If a Director promotion, correction, or canonical policy revision changes between preview and generate, the token cannot be reused for an outdated prompt.
- `ShotRevisionAiClient` supplies the instructions appendix in the OpenAI Responses `instructions` field, **before the model generates anything**. The creator's message remains unmodified in the input; the full shot context is supplied separately as data.
- Only **one** OpenAI generation is performed. Existing zero-token Java Quality Gate checks run after the response and before DRAFT persistence/Director LOCK. There is no automatic second model pass.
- A result is a DRAFT until explicit Director Approve. Approved existing texts, audio and video remain versioned and untouched.

## Important safety and quality boundaries
- This applies to the current **Shot Revision Agent** endpoint; broad cross-agent Script/Scene/Director prompt compilation is a next integration, not implemented here.
- This is the backend OpenAI API invoked by MediaOS, **not a direct connection to the user's current ChatGPT session** or its private memory.
- Rule loading and deterministic QA cost zero **additional model calls**; injected rule text still consumes input tokens. Deduplication, relevance selection and prompt budgets reduce *unnecessary* token use, not eliminate the cost of reading relevant context.
- A compiler cannot guarantee 100% correct answers or resolve semantically contradictory old memory by itself. The canonical policy and Director LOCK have higher authority; conflicts still need Director review.
- Global Production Memory updates require the existing Episode Learning Director review. AI does not promote private shot corrections into global policy automatically.
- Optional-rule relevance selection is lexical and tested, not a semantic retrieval system. QA should monitor omissions and review high-risk outputs separately.
- No identical-request response cache, embedding-based retrieval, or additional semantic-model evaluator is included in this PR. They remain separately scoped improvements.

## Acceptance checks
- Original Director input is **identical** to what gets sent to the model, with automatic instructions prepended as a separate higher-priority instruction block.
- Existing global and episode REQUIRED corrections appear in the first request; newly Director-approved correction changes the rule pack fingerprint and is in subsequent prompts.
- Duplicate required rule is injected only once; irrelevant optional preferences are omitted.
- Preview displays rule count and current canonical policy version; it never sends a paid request.
- Changing any injected rule between preview and run invalidates the one-use paid token.
- Missing canonical policy, no REQUIRED rules or oversized required rule pack -> stop before OpenAI; do not omit mandatory constraints without informing the user.
- Rule failures after response are shown in Revision Chat without automatic paid retry.
- Verify Java 21 tests and the TypeScript build, replay denial, and no unintended EP001/EP002/EP003 cross-data.
- Feature-gated writes remain disabled in production until stacked PRs #100–#104 and this PR pass security/QA.

## Suggested future metrics
- First-pass Director acceptance rate.
- Corrections reused in future episodes.
- Repeated ERROR_BY_RULE rate.
- Input tokens per accepted revision.
- Number of model calls per approved shot (target: close to one, never promised).
- Rule conflicts / duplicate counts / prompt budget failures.
