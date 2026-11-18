/**
 * EP004 deterministic route geometry. Use ONE Curve for BOTH visible connector and
 * RequestPacket motion. Rendering and camera-transformed particles must be in the
 * SAME transformed coordinate space. There are no actual Microsoft topology claims.
 */
export type Ep004Point = Readonly<{x: number; y: number}>;
export type Ep004CubicPath = Readonly<{
  id: string;
  from: Ep004Point;
  control1: Ep004Point;
  control2: Ep004Point;
  to: Ep004Point;
}>;
export type Ep004PacketSample = Readonly<{
  position: Ep004Point;
  tangentRadians: number;
  distanceFromStart: number;
  totalLength: number;
}>;

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error("EP004_NONFINITE_GEOMETRY:" + label);
  return value;
}

function coordinate(point: Ep004Point, label: string): void {
  finite(point.x, label + ".x");
  finite(point.y, label + ".y");
}

/** The line renderer and particles must use the exact same path object. */
export function ep004SvgPathData(path: Ep004CubicPath): string {
  for (const [label, point] of [["from", path.from], ["control1", path.control1], ["control2", path.control2], ["to", path.to]] as const) coordinate(point, path.id + "." + label);
  return "M " + path.from.x + " " + path.from.y +
    " C " + path.control1.x + " " + path.control1.y +
    ", " + path.control2.x + " " + path.control2.y +
    ", " + path.to.x + " " + path.to.y;
}

/** Cubic Bezier evaluator in the same world coordinates as the drawn connector. */
export function ep004PointAtParameter(path: Ep004CubicPath, t: number): Ep004Point {
  if (!Number.isFinite(t) || t < 0 || t > 1) throw new Error("EP004_PATH_PARAMETER_RANGE:" + path.id);
  const a = 1 - t;
  return {
    x: a*a*a*path.from.x + 3*a*a*t*path.control1.x + 3*a*t*t*path.control2.x + t*t*t*path.to.x,
    y: a*a*a*path.from.y + 3*a*a*t*path.control1.y + 3*a*t*t*path.control2.y + t*t*t*path.to.y
  };
}

function derivative(path: Ep004CubicPath, t: number): Ep004Point {
  const a = 1 - t;
  return {
    x: 3*a*a*(path.control1.x-path.from.x) + 6*a*t*(path.control2.x-path.control1.x) + 3*t*t*(path.to.x-path.control2.x),
    y: 3*a*a*(path.control1.y-path.from.y) + 6*a*t*(path.control2.y-path.control1.y) + 3*t*t*(path.to.y-path.control2.y)
  };
}

function length(a: Ep004Point, b: Ep004Point): number {
  return Math.hypot(b.x-a.x, b.y-a.y);
}

/**
 * Converts normalized travelled DISTANCE into an actual point on a cubic Bezier.
 * A fixed deterministic arc-length LUT avoids speeding up unintentionally on bends.
 * The same LUT inputs must be used at any future cross-SHOT seam.
 */
export function ep004PacketOnPath(path: Ep004CubicPath, distanceProgress: number, samples = 128): Ep004PacketSample {
  ep004SvgPathData(path);
  if (!Number.isFinite(distanceProgress) || distanceProgress < 0 || distanceProgress > 1) throw new Error("EP004_PACKET_PROGRESS_RANGE:" + path.id);
  if (!Number.isInteger(samples) || samples < 16 || samples > 2048) throw new Error("EP004_ARC_LENGTH_SAMPLES");
  const totals: number[] = [0];
  let previous = path.from;
  for (let i = 1; i <= samples; i++) {
    const next = ep004PointAtParameter(path, i/samples);
    totals.push(totals[i-1] + length(previous, next));
    previous = next;
  }
  const totalLength = totals[samples];
  if (totalLength < 0.000001) throw new Error("EP004_DEGENERATE_PATH:" + path.id);
  const distanceFromStart = totalLength * distanceProgress;
  let low = 0;
  let high = samples;
  while (high - low > 1) {
    const mid = Math.floor((low + high)/2);
    if (totals[mid] < distanceFromStart) low = mid; else high = mid;
  }
  const segmentLength = totals[high] - totals[low];
  const fraction = segmentLength > 0 ? (distanceFromStart - totals[low]) / segmentLength : 0;
  const t = (low + Math.max(0, Math.min(1, fraction))) / samples;
  const position = ep004PointAtParameter(path, t);
  const d = derivative(path, t);
  const tangentRadians = Math.atan2(d.y, d.x);
  return {position, tangentRadians, distanceFromStart, totalLength};
}

/** Render a response on the same path in reverse, never on an invented shortcut. */
export function ep004ResponseOnPath(path: Ep004CubicPath, distanceProgress: number): Ep004PacketSample {
  const forward = ep004PacketOnPath(path, 1 - distanceProgress);
  return {...forward, tangentRadians: forward.tangentRadians + Math.PI};
}

export type Ep004WorldSeam = Readonly<{
  previousApprovedRenderId: string;
  previousApprovedMp4Sha256: string;
  previousDecodedLastFrameIndex: number;
  previousCameraFingerprint: string;
  previousWorldFingerprint: string;
  nextFirstFrameCameraFingerprint: string;
  nextFirstFrameWorldFingerprint: string;
  previousInFlightPackets: ReadonlyArray<Readonly<{id: string; routeId: string; distanceProgress: number}>>;
  nextFirstFrameInFlightPackets: ReadonlyArray<Readonly<{id: string; routeId: string; distanceProgress: number}>>;
}>;

/** Source-state seam check, supplemental to REQUIRED decoded MP4 pixel and motion QA. */
export function ep004SeamBlockers(seam: Ep004WorldSeam): string[] {
  const failures: string[] = [];
  if (!seam.previousApprovedRenderId || !/^[a-f0-9]{64}$/i.test(seam.previousApprovedMp4Sha256)) failures.push("UNPINNED_APPROVED_RENDER");
  if (!Number.isInteger(seam.previousDecodedLastFrameIndex) || seam.previousDecodedLastFrameIndex < 0) failures.push("INVALID_LAST_DECODED_FRAME");
  if (!seam.previousCameraFingerprint || seam.previousCameraFingerprint !== seam.nextFirstFrameCameraFingerprint) failures.push("CAMERA_SEAM_MISMATCH");
  if (!seam.previousWorldFingerprint || seam.previousWorldFingerprint !== seam.nextFirstFrameWorldFingerprint) failures.push("WORLD_SEAM_MISMATCH");
  const prev = new Map(seam.previousInFlightPackets.map(p => [p.id, p] as const));
  const next = new Map(seam.nextFirstFrameInFlightPackets.map(p => [p.id, p] as const));
  if (prev.size !== seam.previousInFlightPackets.length || next.size !== seam.nextFirstFrameInFlightPackets.length) failures.push("DUPLICATE_PACKET_IDS");
  if (prev.size !== next.size) failures.push("PACKET_COUNT_SEAM_MISMATCH");
  for (const [id, p] of prev) {
    const n = next.get(id);
    if (!n || n.routeId !== p.routeId || n.distanceProgress !== p.distanceProgress) failures.push("PACKET_TELEPORT:" + id);
  }
  return failures;
}
