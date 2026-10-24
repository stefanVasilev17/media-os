# EP001 SHOT 08 — V3 Premium Living Database Rebuild

**Status:** Director-review PROPOSAL, NOT LOCKED. **Purpose:** Replace v1/v2; preserve every SHOT 01–07 native Director LOCK and voice clip. No overwrite of v1/v2 or cumulative 12:18 preview. 2026-10-24 Director rejected v2 and explicitly required real continuity, deep detail, different diagrams and Tier++ quality.

## V2 failure postmortem

- Invented a new map showing four generically styled cards where SHOT07 actually ended in an existing Living Architecture World. Centering a new diagram does not fix continuity; it creates a replacement world.
- A list of users plus rounded information cards looked like a dashboard, not a stored-data mechanism. Its 95 seconds had too little transformation/motion. No distinct component identities.
- Role, Profile, Account Status and Stored Verifier mostly repeated the same visual housing. The user rightly rejected this.
- No intermediate visual proof-of-quality; completing 95 seconds before Director approval wasted rendering and iteration budget.

## New source-of-truth technical rule

**Opening must render the exact SHOT07 v10 terminal visual frame, not redraw it.** Reuse `AuthServiceTier2V10YoutubePreview` inside a Remotion `Freeze`, frame 4881 of 4882, with locked render's exact `anchors` and `clipStarts` from native `dc31f24e-ea31-462a-8398-457f780e7f6a`. Do not edit that locked component. Zero/first shot08 frame must match the SHOT07 terminal graphical state. Zoom the single existing world toward User Database at approximately map coordinate (1733,613); apply transforms around a calculated camera focal point with full-bleed safe background and consistent aspect ratio. A free-standing, newly invented four-card architecture map is explicitly forbidden.

**Teaching identity:** when camera enters User Database, reveal a bounded internal spatial mini-world with layered record geometry, access branches and a shielded verifier. It is a micro-world attached to the external storage node, not a separate disconnected admin screen.

## V3 module grammar: three genuinely different visual structures

**A. Record retrieval — physical stacked-record carousel.** Three thin transparent/ceramic layered storage shelves / slab objects inside a cylindrical cyan storage volume. The incoming **single cyan USER LOOKUP** travels into a retrieval rail; a controlled scanner traverses all records and extracts only `ACCOUNT 042` (`alex@example.com`) as an elevated record prism. Other records retreat and dim. This is NOT a table of three email rows. Labels are brief.

**B. Account identity & rights — hub + radial permissions constellation.** The selected record connects through a fine data fibre to a compact identity glyph: `ALEX MORGAN`, `ID 0042`, `ACTIVE`, `EMAIL VERIFIED`. The existing `ROLE · MEMBER` becomes a hexagonal central hub whose purple/light-blue edges fan out toward three *different glyph-shaped* endpoints: `PROFILE`, `ORDERS`, `SUPPORT`. Use thin spoke arcs; do not surround each with huge rounded card backgrounds. Permissions imply potential access only; they are not a successful credential check.

**C. Credential verifier — protected data prism/cryptographic vault.** The selected account's verifier is a separate stacked transparent blue prism and chained data stripes, not a form. Display meaningful illustrative `Argon2id`, `salt 6f4c…91a2`, `digest b81e…c5d0`; keep explanatory prose OFF the screen, no plaintext password, no bright green authenticated tick, no MATCH/SUCCESS event. This information travels back with the account facts and must be checked by Auth Service later in SHOT09.

**D. Return — same exterior map.** Camera pulls out to exact SHOT07 living map geography. Cyan `ACCOUNT FACTS` travels User Database → Auth Service opposite lookup direction. Original mint Login Request does not move. End without credential verification or Dashboard payoff.

## Strongest 0:00–0:30 vertical slice before full edit

| Time | Engineering and visual choreography |
| --- | --- |
| 00–05 s | EXACT terminal frame from SHOT07 v10: existing service outlines, original request waiting, cyan DB scan. No new floating text. Full-bleed navy and unchanged composition scale. |
| 05–12 s | Controlled dolly/push-in on the actual User Database node while neighbouring Auth Service recedes. Animate focus target on the real storage component; no jump cut to imaginary gateway boxes. |
| 12–18 s | Camera passes into cyan cylindrical storage: concentric structure/three layered record slabs appear *anchored to the database*, no all-screen admin table. |
| 18–24 s | One blue query beam traverses shelves, highlights the account match, corresponding slab lifts out. Other slabs remain dim behind. |
| 24–30 s | Extracted record becomes a floating, layered identity artifact with no login success. Scene holds long enough for comprehension before the next mini-world. |

**Full SHOT08 continuation, not rendered at first:** 30–44s account facts / status on record prism; 44–56s radial role/permissions; 56–74s verifier vault; 74–87s return to exterior map; 87–95s cyan response arrives at Auth and waiting green Login Request persists. Actual voice-aligned timing will follow approved narration; do not claim production duration lock.

## Director visual QA gates

- Direct continuity test: visual first frame vs approved SHOT07 last frame, same source JSX, exact props, immutable file.
- No clipping, hard edges, geometric center drift, offscreen labels, text collision or excessive empty canvas.
- Typography: premium technical 1920×1080 layout, readable at 1280×720; labels only when necessary. No explanatory sentence footers.
- Distinct shapes: external architecture world, cylindrical database, floating layered records, spokes/hex role, cryptographic vault.
- Semantic motion: one original green request WAITING; one cyan lookup OUT; one cyan account facts IN. Never pre-approve account as AUTHENTICATED.
- 5–10s meaningful visual transformation; purposeful camera; 0.5–2s settles/holds at key reveals.
- Review **30s high-quality visual-only vertical slice first**. Only expand full SHOT08 after Director approves style and camera; then record voice/sync/QA/LOCK.

## V3 implementation checkpoint

- `remotion-engine/src/episodes/ep001/live-diagram/Shot08V3PremiumSlice.tsx` is a new independent production preview component. It includes a `Freeze` of the **exact terminal frame 4881 / 4882** of locked `AuthServiceTier2V10YoutubePreview` using the production database's exact 29+ key voice-alignment anchor values and clip starts `[24,952,1821,2940,3915]`. Neither the original SHOT07 code nor its voice clips were edited.
- The v3 opening camera formula was corrected to make initial camera translation **exactly zero**; focus moves from original DB map coordinate `(1733,613)` toward viewport center `(960,540)`, with bounded scale from 1.0 to 2.56. The interior mini-world fades in only after the camera pushes toward the node.
- The **first 30-second 900-frame slice** includes actual existing map → camera push → three-dimensional-looking layered storage cylinder → isolated record prisms `ACCOUNT 041, 042, 043` → animated extraction of selected account 042, with meaningful labels but **no GUI dashboard cards**.
- Remotion composition registered independently as `EP001-Shot08-PremiumSlice-V3` at 1920×1080/30 fps, render profile `EP001_SHOT08_PREMIUM_SLICE_V3` supporting 1280×720 FAST_PREVIEW. Neither SHOT08 v1/v2 nor native SHOT01–07 masters are overwritten.
- Isolated Bun TSX compiler test passed: `V3_30S_TSX_PARSE_PASS`. This confirms syntax, **not** visual quality, browser execution, first-frame pixel identity or runtime MP4.
- Native backend and worker deployments were requested; transient Docker Hub `502 Bad Gateway` affected the first pre-fix commit's image build, then later builds proceeded. The render must only be submitted after compatible backend and worker deployments and all seven native locks remain unchanged.
- Next review gate: **30-second silent preview MP4**, comparing source continuity, camera framing, legibility and actual spatial-archive execution. The scope of v3 remains Director DRAFT/NOT LOCKED; role/permissions and verifier redesign should be completed only after the director approves these first 30 seconds.
