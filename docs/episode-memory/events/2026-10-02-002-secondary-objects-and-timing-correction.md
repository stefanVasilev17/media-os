# EP001 Creator Correction — Secondary Objects + Exact Script Timing

Date: 2026-10-02
Status: ACTIVE / OVERRIDES SCRIPT PRESENTATION RULES WHERE CONFLICTING

## Creator correction

The creator approved the simpler, low-jargon narration direction and added two requirements:

1. Secondary Spline objects must be represented in the script/story when relevant. Their exact technical labels may remain visible on screen, but narration should explain them through plain-language examples of what they mean or why they exist rather than through dense technical terminology.
2. Every script block must be presented with the exact planned speaking window in seconds (start, end, and expected spoken duration). These are planned timings before ElevenLabs generation; final approved voice alignment remains authoritative.

## Narration rule

- Senior-level value comes from reasoning, not jargon density.
- Technical labels can exist visually while narration explains responsibility in plain language.
- Secondary objects should be introduced only when they help the story; do not turn them into a catalog.
- When introducing a secondary object, explain it through a concrete human/system example, e.g. `Rate Limiter` as "something that can slow or stop repeated attempts", `Risk` as "a check for behavior that looks unusual", `MFA` as "asking for one more proof before continuing", `Audit/Logging` as "leaving a record of what happened", and similar plain-language explanations.
- No more than three consecutive rhetorical/structural repetitions; prefer two when a third adds no value.

## Timing rule

Each script block must include:
- planned start timestamp;
- planned end timestamp;
- exact planned spoken duration in seconds;
- final timing note that ElevenLabs/word-level alignment may later shift absolute boundaries.

## Current script status

`EP001 SCRIPT PASS 1 v0.2` remains a draft and is not locked. Next revision should be `v0.3` and incorporate these rules.
