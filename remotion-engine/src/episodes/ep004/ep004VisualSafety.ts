/**
 * EP004 scene-level preflight, not a substitute for inspection of encoded MP4 frames.
 * All input rectangles must be measured in the FINAL camera-transformed 1920x1080 frame.
 */
export type Ep004Rect = Readonly<{left: number; top: number; width: number; height: number}>;
export type Ep004VisibleText = Readonly<{
  id: string;
  kind: "ARCHITECTURE_LABEL" | "GLOSSARY" | "FACT_CALLOUT";
  text: string;
  outerRect: Ep004Rect;
  measuredContentRect: Ep004Rect;
  fontPx: number;
  level: "primary" | "secondary";
  visibleSeconds: number;
  fullOpacitySeconds: number;
  isSpokenAndExplainedTerm: boolean;
  hasGenuineAlignedAnchor: boolean;
  pairedTermComparison: boolean;
}>;
export type Ep004FramePreflight = Readonly<{
  outputWidth: number;
  outputHeight: number;
  safeMarginPx: number;
  texts: readonly Ep004VisibleText[];
  /** Architecture rects measured after the camera transform, not world coords. */
  protectedArchitectureRects: readonly Readonly<{id: string; rect: Ep004Rect}>[];
  /** Connectors represented by conservative screen-space corridor rectangles. */
  protectedActiveRouteCorridors: readonly Readonly<{id: string; rect: Ep004Rect}>[];
}>;

const finiteRect = (r: Ep004Rect): boolean =>
  [r.left, r.top, r.width, r.height].every(Number.isFinite) && r.width >= 0 && r.height >= 0;

export function ep004RectOverlaps(a: Ep004Rect, b: Ep004Rect): boolean {
  return a.left < b.left + b.width && a.left + a.width > b.left &&
    a.top < b.top + b.height && a.top + a.height > b.top;
}

export function ep004RectContains(outer: Ep004Rect, content: Ep004Rect): boolean {
  return content.left >= outer.left && content.top >= outer.top &&
    content.left + content.width <= outer.left + outer.width &&
    content.top + content.height <= outer.top + outer.height;
}

export function ep004FramePreflightBlockers(frame: Ep004FramePreflight): string[] {
  const errors: string[] = [];
  if (frame.outputWidth !== 1920 || frame.outputHeight !== 1080 || !Number.isFinite(frame.safeMarginPx) || frame.safeMarginPx < 0) return ["FRAME_DIMENSIONS_INVALID"];
  const inner: Ep004Rect = {
    left: frame.safeMarginPx, top: frame.safeMarginPx,
    width: frame.outputWidth - 2*frame.safeMarginPx,
    height: frame.outputHeight - 2*frame.safeMarginPx
  };
  if (inner.width <= 0 || inner.height <= 0) return ["INVALID_SAFE_MARGINS"];
  const glossary = frame.texts.filter(t => t.kind === "GLOSSARY");
  if (glossary.length > 2) errors.push("GLOSSARY_CARD_SPAM");
  if (glossary.length === 2 && glossary.some(t => !t.pairedTermComparison)) errors.push("UNAPPROVED_TWO_CARD_COMPARISON");
  for (const text of frame.texts) {
    if (!finiteRect(text.outerRect) || !finiteRect(text.measuredContentRect)) {
      errors.push("NONFINITE_TEXT_RECT:" + text.id); continue;
    }
    if (!ep004RectContains(inner, text.outerRect)) errors.push("OUTSIDE_VIDEO_SAFE_ZONE:" + text.id);
    if (!ep004RectContains(text.outerRect, text.measuredContentRect)) errors.push("TEXT_OVERFLOW:" + text.id);
    if (text.fontPx < (text.level === "primary" ? 20 : 18)) errors.push("UNREADABLE_FONT:" + text.id);
    if (!Number.isFinite(text.visibleSeconds) || !Number.isFinite(text.fullOpacitySeconds)) errors.push("MISSING_DWELL:" + text.id);
    if (text.text.includes(";")) errors.push("EXPLANATORY_SEMICOLON:" + text.id);
    if (text.kind === "GLOSSARY") {
      if (!text.isSpokenAndExplainedTerm || !text.hasGenuineAlignedAnchor) errors.push("UNSPOKEN_TERM_CARD:" + text.id);
      if (text.visibleSeconds < 5.5 || text.fullOpacitySeconds < 4) errors.push("GLOSSARY_TOO_FAST_OMIT:" + text.id);
    }
    if (text.kind !== "ARCHITECTURE_LABEL") {
      for (const a of frame.protectedArchitectureRects) {
        if (!finiteRect(a.rect)) errors.push("NONFINITE_PROTECTED_RECT:" + a.id);
        else if (ep004RectOverlaps(text.outerRect, a.rect)) errors.push("PANEL_NODE_COLLISION:" + text.id + ":" + a.id);
      }
      for (const r of frame.protectedActiveRouteCorridors) {
        if (!finiteRect(r.rect)) errors.push("NONFINITE_ROUTE_RECT:" + r.id);
        else if (ep004RectOverlaps(text.outerRect, r.rect)) errors.push("PANEL_PATH_COLLISION:" + text.id + ":" + r.id);
      }
    }
  }
  for (let i = 0; i < frame.texts.length; i++) for (let j = i+1; j < frame.texts.length; j++) {
    if (frame.texts[i].kind !== "ARCHITECTURE_LABEL" && frame.texts[j].kind !== "ARCHITECTURE_LABEL" && ep004RectOverlaps(frame.texts[i].outerRect, frame.texts[j].outerRect))
      errors.push("PANEL_PANEL_OVERLAP:" + frame.texts[i].id + ":" + frame.texts[j].id);
  }
  return errors;
}
