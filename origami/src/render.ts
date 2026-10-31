import { area, bounds, centroid, foldFrame, reflect, v, type Face, type Stage, type Vec2 } from './paper';

type Vec3 = Vec2 & { z: number };

export interface View {
  readonly minX: number;
  readonly minY: number;
  readonly size: number;
}

/** Orbit angles in radians; 0,0 looks straight down at the table like a diagram. */
export interface Camera {
  yaw: number;
  pitch: number;
}

export interface Dot {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

/** Canvas resolution. The canvas is scaled up with nearest-neighbour sampling for the pixel look. */
const PIXELS = 112;

/** A square viewBox that fits every state of the model, so it never jumps between steps. */
export function fitView(stages: readonly Stage[]): View {
  const b = bounds(stages.flatMap((s) => [...s.faces, ...s.after]));
  const size = Math.max(b.maxX - b.minX, b.maxY - b.minY) * 1.3;
  return { minX: (b.minX + b.maxX - size) / 2, minY: (b.minY + b.maxY - size) / 2, size };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const flat = (p: Vec2): Vec3 => ({ ...p, z: 0 });
const UP: Vec3 = { x: 0, y: 0, z: 1 };

/** Faces that share one plane; their stacking order is their layer order, seen from the plane's front. */
interface Sheet {
  readonly normal: Vec3;
  readonly faces: { face: Face; pts: Vec3[] }[];
}

interface Pose {
  readonly still: Sheet;
  /** The flap being folded and which side of the table plane it swings through (1 = toward you). */
  readonly flap?: Sheet & { side: number };
}

function pose(stage: Stage, t: number): Pose {
  const { step, faces, moving } = stage;
  const e = ease(t);

  if (step.kind === 'rotate') {
    const r = ((step.deg * Math.PI) / 180) * e;
    const b = bounds(faces);
    const c = v((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2);
    const spin = (p: Vec2) =>
      flat(v(c.x + (p.x - c.x) * Math.cos(r) - (p.y - c.y) * Math.sin(r), c.y + (p.x - c.x) * Math.sin(r) + (p.y - c.y) * Math.cos(r)));
    return { still: { normal: UP, faces: faces.map((face) => ({ face, pts: face.pts.map(spin) })) } };
  }

  if (step.kind === 'flip') {
    const b = bounds(faces);
    const cx = (b.minX + b.maxX) / 2;
    const phi = Math.PI * e;
    const turn = (p: Vec2): Vec3 => ({ x: cx + (p.x - cx) * Math.cos(phi), y: p.y, z: (p.x - cx) * Math.sin(phi) });
    return {
      still: { normal: { x: -Math.sin(phi), y: 0, z: Math.cos(phi) }, faces: faces.map((face) => ({ face, pts: face.pts.map(turn) })) },
    };
  }

  const { a, u, n } = foldFrame(step.line, step.move);
  const theta = Math.PI * (step.kind === 'crease' ? Math.sin(Math.PI * e) * 0.97 : e);
  const side = step.kind === 'mountain' ? -1 : 1;
  const turn = (p: Vec2): Vec3 => {
    const along = (p.x - a.x) * u.x + (p.y - a.y) * u.y;
    const r = (p.x - a.x) * n.x + (p.y - a.y) * n.y;
    const rc = r * Math.cos(theta);
    return { x: a.x + u.x * along + n.x * rc, y: a.y + u.y * along + n.y * rc, z: side * r * Math.sin(theta) };
  };
  const still: Sheet['faces'] = [];
  const flap: Sheet['faces'] = [];
  faces.forEach((face, i) => {
    if (moving.has(i)) flap.push({ face, pts: face.pts.map(turn) });
    else still.push({ face, pts: face.pts.map(flat) });
  });
  const s = Math.sin(theta) * side;
  return {
    still: { normal: UP, faces: still },
    flap: { normal: { x: -n.x * s, y: -n.y * s, z: Math.cos(theta) }, faces: flap, side },
  };
}

function orbit(d: Vec3, cam: Camera): Vec3 {
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  const x = d.x * cy + d.z * sy;
  const z = -d.x * sy + d.z * cy;
  return { x, y: d.y * cp - z * sp, z: d.y * sp + z * cp };
}

/**
 * Painter's order. Within a sheet, layers stack bottom-up when you see its front and top-down from
 * behind. The flap sits entirely on one side of the table plane, so it is either fully in front of
 * or fully behind the still paper depending on which side of that plane the camera is on.
 */
function paintOrder(p: Pose, cam: Camera) {
  const facing = (sheet: Sheet) => orbit(sheet.normal, cam).z >= 0;
  const stack = (sheet: Sheet) =>
    [...sheet.faces].sort((x, y) => (facing(sheet) ? x.face.layer - y.face.layer : y.face.layer - x.face.layer));
  const still = stack(p.still);
  if (!p.flap) return still;
  const flap = stack(p.flap);
  return p.flap.side > 0 === facing(p.still) ? [...still, ...flap] : [...flap, ...still];
}

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** Snap anti-aliased edges to hard pixels, optionally adding a paper grain. */
function crisp(ctx: CanvasRenderingContext2D, grain: boolean) {
  const img = ctx.getImageData(0, 0, PIXELS, PIXELS);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3]! < 110) {
      d[i + 3] = 0;
      continue;
    }
    d[i + 3] = 255;
    if (grain) {
      const p = i / 4;
      const k = 0.95 + 0.06 * hash(p % PIXELS, Math.floor(p / PIXELS));
      d[i] = d[i]! * k;
      d[i + 1] = d[i + 1]! * k;
      d[i + 2] = d[i + 2]! * k;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function layer() {
  const c = document.createElement('canvas');
  c.width = c.height = PIXELS;
  return c.getContext('2d', { willReadFrequently: true })!;
}

export class PixelStage {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly paper = layer();
  private readonly ink = layer();
  private backdrop: { key: string; img: ImageData } | null = null;

  constructor(readonly canvas: HTMLCanvasElement) {
    canvas.width = canvas.height = PIXELS;
    this.ctx = canvas.getContext('2d')!;
  }

  draw(stage: Stage, t: number, view: View, whiteUp: boolean, cam: Camera, dots: readonly Dot[] = []) {
    // Read from the canvas so a tile or workspace can set its own --paper.
    const css = getComputedStyle(this.canvas);
    const color = (name: string) => css.getPropertyValue(name).trim();
    const scale = PIXELS / view.size;
    // Orbit around the paper itself, so it spins in place instead of swinging around the frame.
    const b = bounds(stage.faces);
    const pivot = v((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2);
    const project = (p: Vec3): Vec2 => {
      const r = orbit({ x: p.x - pivot.x, y: p.y - pivot.y, z: p.z }, cam);
      const s = (view.size * 3) / (view.size * 3 - r.z);
      return v((pivot.x + r.x * s - view.minX) * scale, (pivot.y + r.y * s - view.minY) * scale);
    };

    this.ctx.putImageData(this.background(color('--stage'), color('--stage-dot')), 0, 0);

    const p = pose(stage, t);
    const g = this.paper;
    g.clearRect(0, 0, PIXELS, PIXELS);
    g.lineWidth = 0.7;
    g.lineJoin = 'round';
    for (const { face, pts } of paintOrder(p, cam)) {
      const scr = pts.map(project);
      const a = area(scr);
      const colorUp = Math.sign(a) === Math.sign(area(face.orig)) !== whiteUp;
      const light = Math.min(1, Math.abs(a / (area(face.orig) * scale * scale)));
      g.fillStyle = `color-mix(in srgb, ${color(colorUp ? '--paper' : '--paper-back')} ${Math.round(58 + 42 * light)}%, #000)`;
      g.strokeStyle = 'rgba(0,0,0,0.45)';
      g.beginPath();
      scr.forEach((q, k) => (k ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)));
      g.closePath();
      g.fill();
      g.stroke();
    }
    if (dots.length && orbit(p.still.normal, cam).z > 0) {
      g.fillStyle = '#161616';
      for (const dot of dots) {
        const c = project(flat(dot));
        g.beginPath();
        g.arc(c.x, c.y, Math.max(1.2, dot.r * scale), 0, Math.PI * 2);
        g.fill();
      }
    }
    crisp(g, true);
    this.ctx.drawImage(g.canvas, 0, 0);

    if (t < 0.34) {
      const k = this.ink;
      k.clearRect(0, 0, PIXELS, PIXELS);
      k.strokeStyle = k.fillStyle = color('--ink');
      k.lineWidth = 1;
      notation(k, stage, view, project);
      crisp(k, false);
      this.ctx.globalAlpha = 1 - t * 3;
      this.ctx.drawImage(k.canvas, 0, 0);
      this.ctx.globalAlpha = 1;
    }
  }

  /** A folding mat: dot grid every 8 pixels over a faint grain, cached per color pair. */
  private background(stage: string, dot: string): ImageData {
    const key = stage + dot;
    if (this.backdrop?.key === key) return this.backdrop.img;
    const img = this.ctx.createImageData(PIXELS, PIXELS);
    const [sr, sg, sb] = rgb(stage);
    const [dr, dg, db] = rgb(dot);
    for (let y = 0; y < PIXELS; y++) {
      for (let x = 0; x < PIXELS; x++) {
        const m = x % 8 === 4 && y % 8 === 4 ? 1 : hash(x, y) * 0.12;
        const i = (y * PIXELS + x) * 4;
        img.data[i] = sr + (dr - sr) * m;
        img.data[i + 1] = sg + (dg - sg) * m;
        img.data[i + 2] = sb + (db - sb) * m;
        img.data[i + 3] = 255;
      }
    }
    this.backdrop = { key, img };
    return img;
  }
}

function head(g: CanvasRenderingContext2D, tip: Vec2, from: Vec2, open: boolean) {
  const d = Math.hypot(tip.x - from.x, tip.y - from.y) || 1;
  const ux = (tip.x - from.x) / d;
  const uy = (tip.y - from.y) / d;
  const size = 4;
  const l = v(tip.x - ux * size - uy * size * 0.6, tip.y - uy * size + ux * size * 0.6);
  const r = v(tip.x - ux * size + uy * size * 0.6, tip.y - uy * size - ux * size * 0.6);
  g.setLineDash([]);
  g.beginPath();
  g.moveTo(l.x, l.y);
  g.lineTo(tip.x, tip.y);
  g.lineTo(r.x, r.y);
  if (open) g.stroke();
  else {
    g.closePath();
    g.fill();
  }
}

function notation(g: CanvasRenderingContext2D, stage: Stage, view: View, project: (p: Vec3) => Vec2) {
  const { step } = stage;
  const arc = (pts: Vec3[], open: boolean, both = false) => {
    const s = pts.map(project);
    g.setLineDash([]);
    g.beginPath();
    s.forEach((q, k) => (k ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)));
    g.stroke();
    head(g, s[s.length - 1]!, s[s.length - 3] ?? s[0]!, open);
    if (both) head(g, s[0]!, s[2] ?? s[1]!, open);
  };
  const curve = (from: Vec3, ctrl: Vec3, to: Vec3) =>
    Array.from({ length: 17 }, (_, k) => {
      const t = k / 16;
      const m = (a: number, b: number, c: number) => (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t * t * c;
      return { x: m(from.x, ctrl.x, to.x), y: m(from.y, ctrl.y, to.y), z: m(from.z, ctrl.z, to.z) };
    });

  if (step.kind === 'flip' || step.kind === 'rotate') {
    const b = bounds(stage.faces);
    const c = centroid([v(b.minX, b.minY), v(b.maxX, b.maxY)]);
    const r = step.kind === 'flip' ? view.size * 0.08 : view.size * 0.4;
    const at = step.kind === 'flip' ? v(b.maxX + r * 0.4, b.minY) : c;
    const [a0, a1] = step.kind === 'flip' ? [Math.PI * 0.9, Math.PI * 2.4] : [-Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5];
    const dir = step.kind === 'rotate' && step.deg < 0 ? -1 : 1;
    const pts = Array.from({ length: 21 }, (_, k) => {
      const ang = dir > 0 ? a0 + ((a1 - a0) * k) / 20 : a1 - ((a1 - a0) * k) / 20;
      return flat(v(at.x + r * Math.cos(ang), at.y + r * Math.sin(ang)));
    });
    arc(pts, false);
    return;
  }

  const [a, b] = step.line;
  const { u } = foldFrame(step.line, step.move);
  const ext = view.size * 0.04;
  const l0 = project(flat(v(a.x - u.x * ext, a.y - u.y * ext)));
  const l1 = project(flat(v(b.x + u.x * ext, b.y + u.y * ext)));
  g.setLineDash(step.kind === 'mountain' ? [4, 2, 1, 2] : [3, 2]);
  g.beginPath();
  g.moveTo(l0.x, l0.y);
  g.lineTo(l1.x, l1.y);
  g.stroke();

  const movers = stage.faces.filter((_, i) => stage.moving.has(i));
  const from = movers.length ? centroid(movers.flatMap((f) => f.pts)) : step.move;
  const to = reflect(from, step.line);
  const span = Math.hypot(to.x - from.x, to.y - from.y);
  const side = step.kind === 'mountain' ? -1 : 1;
  const ctrl = { x: (from.x + to.x) / 2 + u.x * span * 0.3, y: (from.y + to.y) / 2 + u.y * span * 0.3, z: side * span * 0.6 };
  arc(curve(flat(from), ctrl, flat(to)), step.kind === 'mountain', step.kind === 'crease');
}
