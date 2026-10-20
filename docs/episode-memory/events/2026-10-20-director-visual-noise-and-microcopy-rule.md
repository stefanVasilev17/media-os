# Architectural Thinking — Director visual rule: no decorative microcopy

**Director decision:** 2026-10-20. Applies to EP001 SHOT 05 and to every new or revised scene in Architectural Thinking unless explicitly overridden by the Director.

## Rule — show only what helps viewers understand the architecture

Do not add visually noisy, small-font meta labels or boilerplate disclaimers to the rendered video. The viewer should see the architecture, behavior, failure or state transition — not the production system talking about itself. This applies to animated overlays, diagnostic panels, footers, headers and tiny status strips.

Forbidden defaults include:
- `LIVE EXAMPLE 03/05`, `GATEWAY CHECKS 4/7`, `INSIDE THE SYSTEM`, production step counters and similar scene bookkeeping.
- `ONE CANONICAL REQUEST · FAILED SAMPLES ARE SEPARATE` and other implementation explanations.
- `Illustrative example policy, not a universal gateway default.` and `This configured example is not a universal WAF behavior.` as persistent on-screen micro-disclaimers.
- Unrequested tiny explanatory captions such as `Next: choose a healthy server. Password validation has not started.`, unless the Director specifically asks to make that fact a central visual moment.

Keep the technically relevant information in the script, voice-over and production notes; retain technical truth and configuration-dependence. The rule removes clutter, not accuracy. Show meaningful error statuses and causes, service names, routes, counts, traffic behavior and essential labels large enough to read. Preserve the existing clean main title and meaningful centered teaching content when the viewer needs it.

## SHOT 05 implementation and review contract

Remove decorative microcopy only. Preserve all 7 approved audio recordings, the original living map, persistent left navigation and focus transitions, the 404/405/429/403/400 demonstrations, the first-gate stop, five-gate pass and final Load Balancer handoff. SHOT 01–04 remain LOCKED. The cleaned SHOT 05 video requires Director review; do not mark it LOCKED automatically.

**Future production criterion:** each visible text string must justify its screen space by answering what happened, why it happened, or what state the current object is in. If it merely labels the editing process, reassures about implementation, repeats the narration without adding meaning, or reads like a tiny technical disclaimer, remove it before Director Review.
