# EP001 Memory Event — SHOT 01 Login Intent LOCKED

Date: 2026-10-03
Episode: EP001 — What Really Happens When You Click Login?
Status: LOCKED

The creator explicitly approved and LOCKED the revised SHOT 01 narration logic and wording based on the current Spline diagram.

## SHOT 01 — The Human Action / Login Intent

Planned time: `00:00–00:31`

Narration:

`00:00–00:07`
`You enter your email, type your password, and press Login.`

`00:07–00:17`
`At this moment, the app understands your Login Intent: you are asking it to start a sign-in attempt.`

`00:17–00:31`
`That intent includes the Credential Input you just provided, and the Local UI State that controls what happens on your screen next — for example, showing that the login is being submitted while the app prepares to continue.`

## Locked logic

- SHOT 01 stays centered on the Phone/Login object and the `Login Intent` secondary card.
- `Login Intent` is introduced by first explaining its meaning in plain language, then naming the exact diagram term.
- `Credential Input` is described as the information the user just provided.
- `Local UI State` is described as the app state that controls the immediate on-screen reaction, such as submitting/waiting.
- `Validate` and `Submit` are intentionally deferred to SHOT 02, where the story moves into request preparation and sending.
- Do not introduce `Headers`, `Payloads`, or `Request Context` in SHOT 01; those belong to SHOT 02 with Request Assembly.
- Continue using the current Spline diagram as visual source of truth. Do not introduce non-existent objects such as Client Boundary.

This lock supersedes older SHOT 01 narration variants that used broader conceptual abstractions not present in the current Spline map.
