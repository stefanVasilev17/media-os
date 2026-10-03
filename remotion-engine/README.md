# Architectural Thinking Visual Engine v0.1

This directory contains the first implementation scaffold for the Remotion-first Architectural Thinking production engine.

## Scope

It implements only the approved EP001 vertical slice proving the core grammar:

**User Database Response → Slow Database → Healthy Auth Service Waiting → Phone Waiting**

Approximate narrative source range: **09:09–10:13**. Timing is provisional and intentionally isolated so ElevenLabs Forced Alignment can replace it later without changing scene/component logic.

## What v0.1 proves

- one persistent React Three Fiber world;
- separate AttentionState and OperationalState;
- Auth Service and User Database component identity;
- stateful dependency path;
- Lookup vs Response story tokens;
- WAITING/SLOW grammar;
- deterministic orthographic camera choreography;
- Phone as human consequence;
- Remotion composition at 30 FPS.

## Current composition

`EP001-VerticalSlice`

- 1920×1080 review resolution
- 30 FPS
- 64 seconds / 1920 frames

## Install and preview

```bash
npm install
npm run dev
```

## Render

```bash
npm run render:slice
```

## Production status

This is **engine v0.1 scaffold**, not final visual polish. The next production pass should refine component geometry, lighting, typography and path motion based on rendered review rather than expanding to all 16 shots.
