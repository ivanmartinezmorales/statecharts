import { area, bounds, centroid, foldFrame, reflect, v, type Face, type Stage, type Vec2 } from './paper';

type Vec3 = Vec2 & { z: number };
type Drawn = { pts: Vec3[]; face: Face; order: number };

export interface View {
  readonly minX: number;
  readonly minY: number;
  readonly size: number;
}

/** A square viewBox that fits every state of the model, so it never jumps between steps. */
export function fitView(stages: readonly Stage[]): View {
  const b = bounds(stages.flatMap((s) => [...s.faces, ...s.after]));
  const size = Math.max(b.maxX - b.minX, b.maxY - b.minY) * 1.22;
  return { minX: (b.minX + b.maxX - size) / 2, minY: (b.minY + b.maxY - size) / 2, size };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const flat = (p: Vec2): Vec3 => ({ ...p, z: 0 });

function posed(stage: Stage, t: number): Drawn[] {
  const { step, faces, moving } = stage;
  const byLayer = (a: Drawn, b: Drawn) => a.order - b.order;

  if (step.kind === 'rotate') {
    const r = ((step.deg * Math.PI) / 180) * ease(t);
    const b = bounds(faces);
    const c = v((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2);
    return faces
      .map((face) => ({
        face,
        order: face.layer,
        pts: face.pts.map((p) =>
          flat(v(c.x + (p.x - c.x) * Math.cos(r) - (p.y - c.y) * Math.sin(r), c.y + (p.x - c.x) * Math.sin(r) + (p.y - c.y) * Math.cos(r))),
        ),
      }))
      .sort(byLayer);
  }

  if (step.kind === 'flip') {
    const b = bounds(faces);
    const cx = (b.minX + b.maxX) / 2;
    const phi = Math.PI * ease(t);
    return faces
      .map((face) => ({
        face,
        order: phi < Math.PI / 2 ? face.layer : -face.layer,
        pts: face.pts.map((p) => ({ x: cx + (p.x - cx) * Math.cos(phi), y: p.y, z: (p.x - cx) * Math.sin(phi) })),
      }))
      .sort(byLayer);
  }

  const { a, u, n } = foldFrame(step.line, step.move);
  const e = ease(t);
  const theta = Math.PI * (step.kind === 'crease' ? Math.sin(Math.PI * e) * 0.97 : e);
  const up = step.kind === 'mountain' ? -1 : 1;
  const turn = (p: Vec2): Vec3 => {
    const along = (p.x - a.x) * u.x + (p.y - a.y) * u.y;
    const r = (p.x - a.x) * n.x + (p.y - a.y) * n.y;
    const rc = r * Math.cos(theta);
    return { x: a.x + u.x * along + n.x * rc, y: a.y + u.y * along + n.y * rc, z: up * r * Math.sin(theta) };
  };
  const pastVertical = theta > Math.PI / 2;
  const still: Drawn[] = [];
  const movers: Drawn[] = [];
  faces.forEach((face, i) => {
    if (moving.has(i)) movers.push({ face, order: pastVertical ? -face.layer : face.layer, pts: face.pts.map(turn) });
    else still.push({ face, order: face.layer, pts: face.pts.map(flat) });
  });
  still.sort(byLayer);
  movers.sort(byLayer);
  return up > 0 ? [...still, ...movers] : [...movers, ...still];
}

const svgPts = (pts: readonly Vec2[]) => pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

function project(view: View, p: Vec3): Vec2 {
  const cx = view.minX + view.size / 2;
  const cy = view.minY + view.size / 2;
  const s = (view.size * 3) / (view.size * 3 - p.z);
  return v(cx + (p.x - cx) * s, cy + (p.y - cy) * s);
}

function notation(stage: Stage, view: View): string {
  const { step } = stage;
  const w = view.size / 220;
  if (step.kind === 'flip') {
    const b = bounds(stage.faces);
    const x = b.maxX + view.size * 0.06;
    const y = b.minY + view.size * 0.04;
    const r = view.size * 0.045;
    return `<g class="note" stroke-width="${w * 1.4}">
      <path d="M ${x - r} ${y} A ${r} ${r} 0 1 1 ${x + r * 0.7} ${y + r * 0.7}" fill="none" marker-end="url(#head)"/>
      <text x="${x}" y="${y + r * 2.6}" font-size="${view.size * 0.032}" text-anchor="middle">turn over</text></g>`;
  }
  if (step.kind === 'rotate') {
    const c = centroid(stage.faces.flatMap((f) => f.pts));
    const r = view.size * 0.38;
    const sweep = step.deg > 0 ? 1 : 0;
    const a0 = -Math.PI / 2 - 0.5;
    const a1 = -Math.PI / 2 + 0.5;
    const p0 = v(c.x + r * Math.cos(sweep ? a0 : a1), c.y + r * Math.sin(sweep ? a0 : a1));
    const p1 = v(c.x + r * Math.cos(sweep ? a1 : a0), c.y + r * Math.sin(sweep ? a1 : a0));
    return `<g class="note" stroke-width="${w * 1.4}"><path d="M ${p0.x} ${p0.y} A ${r} ${r} 0 0 ${sweep} ${p1.x} ${p1.y}" fill="none" marker-end="url(#head)"/></g>`;
  }
  const [a, b] = step.line;
  const { u } = foldFrame(step.line, step.move);
  const ext = view.size * 0.04;
  const l0 = v(a.x - u.x * ext, a.y - u.y * ext);
  const l1 = v(b.x + u.x * ext, b.y + u.y * ext);
  const dash = step.kind === 'mountain' ? `${w * 6} ${w * 2.5} ${w * 1.2} ${w * 2.5}` : `${w * 4.5} ${w * 3}`;
  const movers = stage.faces.filter((_, i) => stage.moving.has(i));
  const from = movers.length ? centroid(movers.flatMap((f) => f.pts)) : step.move;
  const to = reflect(from, step.line);
  const span = Math.hypot(to.x - from.x, to.y - from.y);
  const ctrl = v((from.x + to.x) / 2 + u.x * span * 0.45, (from.y + to.y) / 2 + u.y * span * 0.45);
  const marker = step.kind === 'mountain' ? 'head-open' : 'head';
  const start = step.kind === 'crease' ? `marker-start="url(#${marker}-back)"` : '';
  return `<g class="note">
    <line class="fold-line ${step.kind}" x1="${l0.x}" y1="${l0.y}" x2="${l1.x}" y2="${l1.y}" stroke-width="${w * 1.5}" stroke-dasharray="${dash}"/>
    <path d="M ${from.x} ${from.y} Q ${ctrl.x} ${ctrl.y} ${to.x} ${to.y}" fill="none" stroke-width="${w * 1.3}" marker-end="url(#${marker})" ${start}/>
  </g>`;
}

export function renderStage(stage: Stage, t: number, view: View, whiteUp: boolean, extras = ''): string {
  const drawn = posed(stage, t);
  const polys = drawn
    .map(({ pts, face }) => {
      const scr = pts.map((p) => project(view, p));
      const a = area(scr);
      const a0 = area(face.orig);
      const colorUp = Math.sign(a) === Math.sign(a0) !== whiteUp;
      const light = Math.min(1, Math.abs(a / a0));
      const shade = Math.round(60 + 40 * light);
      const fill = colorUp ? 'var(--paper)' : 'var(--paper-back)';
      return `<polygon points="${svgPts(scr)}" style="fill: color-mix(in srgb, ${fill} ${shade}%, #000)"/>`;
    })
    .join('');
  const showNote = t < 0.999;
  const { minX, minY, size } = view;
  return `<svg viewBox="${minX} ${minY} ${size} ${size}" role="img" aria-label="${stage.step.text}">
    <defs>
      <marker id="head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="head"/></marker>
      <marker id="head-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="head"/></marker>
      <marker id="head-open" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10" class="head-open"/></marker>
      <marker id="head-open-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10" class="head-open"/></marker>
    </defs>
    <g class="paper" stroke-width="${size / 700}">${polys}</g>
    ${showNote ? `<g style="opacity:${Math.max(0, 1 - t * 3)}">${notation(stage, view)}</g>` : ''}
    ${extras}
  </svg>`;
}
