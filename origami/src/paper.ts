// Flat-fold paper simulator. The paper is a set of convex faces lying in the
// z=0 plane; a fold splits faces along a line and rotates one side 180° about it.

export type Vec2 = { x: number; y: number };
export type Line = readonly [Vec2, Vec2];

export interface Face {
  readonly pts: readonly Vec2[];
  readonly orig: readonly Vec2[];
  readonly layer: number;
  readonly moved: readonly string[];
}

export interface FaceInfo {
  /** Centroid of the face on the unfolded sheet. */
  readonly c: Vec2;
  movedIn(stepId: string): boolean;
}

type FoldKind = 'valley' | 'mountain' | 'crease';

export type Step =
  | {
      readonly kind: FoldKind;
      readonly id?: string;
      readonly line: Line;
      /** Any point on the side of the line that moves. */
      readonly move: Vec2;
      readonly only?: (f: FaceInfo) => boolean;
      readonly text: string;
    }
  | { readonly kind: 'flip'; readonly id?: string; readonly text: string }
  | { readonly kind: 'rotate'; readonly id?: string; readonly deg: number; readonly text: string };

export type FoldStep = Extract<Step, { kind: FoldKind }>;

/** A step resolved against the paper it acts on, ready to animate. */
export interface Stage {
  readonly step: Step;
  /** Faces after splitting along the fold line, before anything moves. */
  readonly faces: readonly Face[];
  readonly moving: ReadonlySet<number>;
  readonly after: readonly Face[];
}

const EPS = 1e-6;

export const v = (x: number, y: number): Vec2 => ({ x, y });
const sub = (a: Vec2, b: Vec2): Vec2 => v(a.x - b.x, a.y - b.y);
const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y;
const cross = (a: Vec2, b: Vec2) => a.x * b.y - a.y * b.x;
const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => v(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);

export function area(pts: readonly Vec2[]): number {
  let s = 0;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length]!;
    s += p.x * q.y - q.x * p.y;
  });
  return s / 2;
}

export function centroid(pts: readonly Vec2[]): Vec2 {
  const n = pts.length;
  return v(pts.reduce((s, p) => s + p.x, 0) / n, pts.reduce((s, p) => s + p.y, 0) / n);
}

export function bounds(faces: readonly Face[]) {
  const pts = faces.flatMap((f) => f.pts);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

function boundsCenter(faces: readonly Face[]): Vec2 {
  const b = bounds(faces);
  return v((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2);
}

/** Frame of a fold line: origin, unit direction, and unit normal pointing at the moving side. */
export function foldFrame(line: Line, move: Vec2) {
  const [a, b] = line;
  const d = sub(b, a);
  const len = Math.hypot(d.x, d.y);
  const u = v(d.x / len, d.y / len);
  const side = Math.sign(cross(u, sub(move, a)));
  const n = v(-u.y * side, u.x * side);
  return { a, u, n, dist: (p: Vec2) => dot(sub(p, a), n) };
}

export function reflect(p: Vec2, line: Line): Vec2 {
  const [a, b] = line;
  const d = sub(b, a);
  const t = dot(sub(p, a), d) / dot(d, d);
  const foot = lerp(a, b, t);
  return v(2 * foot.x - p.x, 2 * foot.y - p.y);
}

/** Splits a convex face by a signed distance function into (positive, negative) halves. */
function split(face: Face, dist: (p: Vec2) => number): [Face | null, Face | null] {
  const pos: { p: Vec2; o: Vec2 }[] = [];
  const neg: { p: Vec2; o: Vec2 }[] = [];
  const n = face.pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const p = face.pts[i]!;
    const q = face.pts[j]!;
    const dp = dist(p);
    const dq = dist(q);
    const here = { p, o: face.orig[i]! };
    if (dp >= -EPS) pos.push(here);
    if (dp <= EPS) neg.push(here);
    if ((dp > EPS && dq < -EPS) || (dp < -EPS && dq > EPS)) {
      const t = dp / (dp - dq);
      const cut = { p: lerp(p, q, t), o: lerp(face.orig[i]!, face.orig[j]!, t) };
      pos.push(cut);
      neg.push(cut);
    }
  }
  const make = (vs: { p: Vec2; o: Vec2 }[]): Face | null => {
    const pts = vs.map((x) => x.p);
    return vs.length >= 3 && Math.abs(area(pts)) > 1e-4 ? { ...face, pts, orig: vs.map((x) => x.o) } : null;
  };
  return [make(pos), make(neg)];
}

function info(face: Face): FaceInfo {
  return { c: centroid(face.orig), movedIn: (id) => face.moved.includes(id) };
}

function resolveFold(faces: readonly Face[], step: FoldStep, stepId: string): Stage {
  const { dist } = foldFrame(step.line, step.move);
  const out: Face[] = [];
  const moving = new Set<number>();
  for (const face of faces) {
    const [pos, neg] = split(face, dist);
    if (!pos || (step.only && !step.only(info(pos)))) {
      out.push(face);
      continue;
    }
    if (neg) out.push(neg);
    moving.add(out.length);
    out.push(pos);
  }
  if (step.kind === 'crease') return { step, faces: out, moving, after: out };

  const movers = out.filter((_, i) => moving.has(i)).map((f) => f.layer);
  const all = out.map((f) => f.layer);
  const relayer =
    step.kind === 'valley'
      ? (l: number) => Math.max(...all) + 1 + (Math.max(...movers) - l)
      : (l: number) => Math.min(...all) - 1 - (l - Math.min(...movers));
  const after = out.map((f, i) =>
    moving.has(i)
      ? { ...f, pts: f.pts.map((p) => reflect(p, step.line)), layer: relayer(f.layer), moved: [...f.moved, stepId] }
      : f,
  );
  return { step, faces: out, moving, after };
}

function resolve(faces: readonly Face[], step: Step, stepId: string): Stage {
  const all = new Set(faces.map((_, i) => i));
  if (step.kind === 'flip') {
    const c = boundsCenter(faces);
    const after = faces.map((f) => ({ ...f, pts: f.pts.map((p) => v(2 * c.x - p.x, p.y)), layer: -f.layer }));
    return { step, faces, moving: all, after };
  }
  if (step.kind === 'rotate') {
    const c = boundsCenter(faces);
    const r = (step.deg * Math.PI) / 180;
    const rot = (p: Vec2) =>
      v(c.x + (p.x - c.x) * Math.cos(r) - (p.y - c.y) * Math.sin(r), c.y + (p.x - c.x) * Math.sin(r) + (p.y - c.y) * Math.cos(r));
    return { step, faces, moving: all, after: faces.map((f) => ({ ...f, pts: f.pts.map(rot) })) };
  }
  return resolveFold(faces, step, stepId);
}

export function sheet(pts: readonly Vec2[]): Face[] {
  return [{ pts, orig: pts, layer: 0, moved: [] }];
}

export function buildStages(start: readonly Face[], steps: readonly Step[]): Stage[] {
  const stages: Stage[] = [];
  let faces = start;
  steps.forEach((step, i) => {
    const stage = resolve(faces, step, step.id ?? `#${i}`);
    stages.push(stage);
    faces = stage.after;
  });
  return stages;
}
