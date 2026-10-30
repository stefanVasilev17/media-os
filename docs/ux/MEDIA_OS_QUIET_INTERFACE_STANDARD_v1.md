# MediaOS — Quiet Interface Standard v1

## Director decision (2026-10-30)
**No UI noise. No tiny explanatory texts. No decorative pills, badges, metadata cards or generic AI-generated dashboard patterns.**

MediaOS is a focused production workstation. Its main job is to help the Director choose an episode, review the current work, revise one shot, generate a Voice/Video take and approve it. The interface is not an AI capability showcase and should never read like a tutorial full of decorations.

## Non-negotiable visual rules

1. **One primary action at a time.** Each screen clearly shows the next decision: Open Episode, Generate Rule, Approve Text, Generate Voice, Approve Voice, Render Video or Approve Video. Secondary choices are plain text links.
2. **No microcopy as decoration.** Do not place 10–12px helper paragraphs, provenance tags, scope pills, uppercased breadcrumbs, AI-model labels, success boxes, decorative icons, KPI tiles, or repeated explanations in the default viewport. User-facing ordinary content is 16px minimum; primary proposed text is 18–23px. Headings have clear hierarchy.
3. **Use whitespace and typography.** Prefer one wide clean surface, clear text hierarchy, light separators and sensible spacing. Avoid nested rounded cards within cards, over-colored panels, dashed empty-state containers and repeated backgrounds.
4. **Director-approved meaning is visible, not miniaturized.** Statuses relevant to decisions (LOCKED, PENDING, ERROR) remain available and legible as plain words with restrained green/orange/red text. Do not bury essential state behind color alone. Do not use small colored pill badges.
5. **Progressive disclosure for everything else.** History, advanced settings, cost breakdown, QA evidence, technical fingerprints, provenance and example pairs are available on demand via an explicit text action/disclosure. Do not delete auditing or validation just to achieve visual simplicity.
6. **Large, readable editing.** The main textarea is prominent, with no auxiliary boxes competing for focus. In Rule Studio the main flow is: type your rule → Prepare → Generate → read rewritten rule → Approve. Required authentication/review details appear only when required.
7. **Episode-first navigation remains central.** The landing page shows just EP number, episode title and an open affordance. Rule Studio and Import belong in minimal secondary navigation, not equal-sized promotional cards.
8. **No auto-generated looking UI.** Do not add collections of colorful feature cards, generic metric strips, trendy badges, icon-on-every-heading decoration, emoji-heavy headings, or instructions describing obvious controls.
9. **Preserve accessibility.** Inputs must have proper labels (they may be visually integrated into the form rather than tiny metadata), keyboard focus, sufficient contrast, readable status text and keyboard-operable secondary disclosures.
10. **Maintain true functionality.** Hide technical details, not safeguards. Paid AI preview, user approval, conflict review, source versioning and Director LOCK remain enforced server-side, regardless of whether they are shown permanently.

## Scope
This standard applies to the **entire MediaOS UI**, including Episode Selector, Director Overview, Script, Rule Studio, Voice, Video/Remotion, Production Memory, Review and future agents. Existing complicated screens should be progressively refactored, not declared compliant merely because this document exists.

## Acceptance checks
- No new 10/11/12px explanatory fragments, decorative badges or stacked micro-status labels in first-use screens.
- Each screen has a single clearly identifiable primary action and minimal secondary navigation.
- Director's selected episode, selected shot, locked/pending state and the exact target of approval remain clear.
- AI output shows the substantive rule/script as prominent readable text, with optional details hidden until requested.
- Approval, write authorization, rollback, preflight, quality and audit behaviors are still enforced by the backend.
- On narrow screens the input, output, review and navigation remain readable and functional without horizontal scroll.
- The UI must be inspected visually in a browser before merge; a source diff alone cannot certify visual quality.
