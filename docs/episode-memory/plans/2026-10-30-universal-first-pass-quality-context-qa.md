# MediaOS — Universal First-Pass Quality Context (Draft QA)

## Director intent
Creator writes a short natural-language message. Every current OpenAI-backed production agent adds the matching canonical policy and approved Production Memory rules **before the first paid model call**, rather than spending a second call reminding the model of past errors. The creator's own message is preserved verbatim. No model gets to approve its own result.

## Client coverage in this branch
| Agent path | Current integration |
|---|---|
| Shot Revision Agent | Existing first-pass compiled mandatory rules (PR #105); untouched |
| Episode-aware Script Agent | Compiler in episode-scoped zero-token preview and the original CreativeAgentClient |
| Episode-aware Scene Agent | Same compiler, with Script, Voice and Visual required scopes |
| Legacy EP001 Script/Scene Agent | CreativeAgentClient compiles the EP001 rules before every paid model call |
| Director Room (legacy EP001) | DirectorAgentClient compiles current approved all-scope rules before reply |
| Topic Strategy | EpisodeBuildAgentClient compiles global topic policy before candidates |
| Research / Truth Audit | EpisodeBuildAgentClient compiles global and Script truth rules |
| Autonomous Episode Build Script/Scene | Reuses protected CreativeAgentClient at each worker step |
| Future OpenAI clients | FirstPassCoverageArchitectureTest fails CI if a new direct OpenAI client omits production rules |
| ElevenLabs / Remotion | No OpenAI narration prompt here; use approved revisions and generation-specific QA; new generative agents must integrate this contract separately |

## Implemented
- `ShotPromptContextService.prepareForStage` maps global, research, script, scene, director and shot scopes.
- Required rules are never silently discarded. Stage-specific selection avoids injecting unrelated rule types into topic/script work. Max 5 relevant non-required rules and bounded char budget for optional material. Canonical policy and relevant required rules always appear.
- The backend clients add compiled rules in their `instructions` before the OpenAI Responses API call.
- Legacy clients avoid duplicating the same raw Production Memory payload in a JSON context.
- Scoped Episode Script/Scene previews contain rule counts and SHA-256 fingerprint. Authorization binds that fingerprint to episode, revision, upstream lock and creator request.
- `AiSpendGuardAspect` refreshes the authoritative fingerprint before consuming a scoped paid preview; stale memory requires a new preview.
- Legacy Director, Script, Scene and Topic zero-token previews also bind the effective rule fingerprint to their one-use authorization; actual paid call recomputes the fingerprint.
- Existing Output Quality Gate and Director approval remain separate, so rule injection is not falsely treated as guaranteed technical accuracy.

## Safety / limits
- No production deployment or database content updates.
- Existing EP001/EP002 scripts, audio, render histories and Director LOCK rows remain untouched.
- The old Director Room, Topic and Autonomous Episode Build are still **EP001 legacy** workflows. This PR does not claim to make them episode-aware for EP003. They must not be reused across episodes until explicitly migrated.
- The compiler carries *only rules already active in Production Memory*. Rules that exist only in historical conversations or markdown files must first be ingested and approved.
- Compiled rules consume input tokens; the optimization reduces duplicate rules and avoidable regeneration, not the cost of the necessary input.
- Lexical optional-rule selection is not full semantic retrieval; quality still needs Director review. Avoid unsupported 100% first-pass claims.
- If required rules exceed the input budget, fail closed before the model call rather than truncate them silently.
- Old autonomous Episode Build may request extra repair calls only when the separate Paid AI auto-repair configuration is explicitly enabled; this PR does not change that existing opt-in.
- Architecture test detects direct clients using `api.openai.com`; services using other model providers or alternate OpenAI transports require coverage added to the inventory/test.

## Acceptance suite
1. Topic gets only ALL rules; Script gets ALL+SCRIPT; Scene gets ALL+SCRIPT+VOICE+VISUAL; Director gets all.
2. Global Director-reviewed correction updates the first-pass fingerprint, and a stale paid preview cannot be used.
3. Episode-specific correction affects only its own episode, not EP001/EP003.
4. Exact creator message remains in the user transcript, unchanged.
5. Duplicate rules are removed and optional irrelevant rules omitted; mandatory rules never silently dropped.
6. Existing user-approved Script, Voice, Video and locked upstream decisions remain immutable.
7. Every direct OpenAI client is inventoried and includes first-pass instructions; a newly introduced unprotected client fails the architecture test.
8. Java 21 backend tests, frontend TypeScript build and end-to-end preview-to-run tests must pass.
9. No paid calls or production releases during this PR; all prior PR #100–105 dependencies must be reviewed first.
