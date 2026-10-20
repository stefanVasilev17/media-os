# SHOT 06 — Load Balancer — Visual Director Previz v1

**Status:** VISUAL PREVIEW READY, NOT LOCKED. The locked script for SHOT 06 remains unchanged; the seven planned voice clips are currently ungenerated/unapproved. This 80-second previz is silent.

**MediaOS video render:** `2beadc4d-2a72-4f04-8f69-ce9136adf205`
**Video:** https://media-os-backend-production.up.railway.app/api/v1/remotion/renders/2beadc4d-2a72-4f04-8f69-ce9136adf205/video
**Composition:** `EP001-LoadBalancer-Youtube`
**Format:** 1280×720, 30fps, 2400 frames, 80.0 seconds.
**Render QA:** https://github.com/stefanVasilev17/media-os/actions/runs/39444664477

## Seven cinematic beats

1. Arrival from SHOT 05: same original map, same green request parked at Load Balancer entry, three candidate Auth Service instances shown.
2. Traffic Distribution: light-blue diagnostic packets spread across eligible routes.
3. Route Mode: explicitly configured Round Robin example on three sample requests.
4. Hash Key: two samples using the same stable key direct to Instance B.
5. Health Checks: Instance C times out and becomes ineligible; canonical green request is unchanged.
6. Target Choice: eligible Instance B in Zone B selected; green request follows exactly that destination.
7. Original world reveal and green handoff to Auth Service. Authentication is not claimed complete.

Persistent left navigation and center-only focus transitions follow the SHOT 05 Director-approved pattern. No decorative microcopy or metadata in the rendered scene. All map extensions are opt-in, preserving locked SHOT 01–05.

**Important:** This is intentionally a first visual pass, not a Director-approved finished shot. Do not add it to the cumulative locked episode preview or set Visual LOCK until voice approval, new QA and explicit Director review.
