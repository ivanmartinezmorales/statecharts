import { createRenderLoop } from '../../rendering/browser/loop.mjs';
import { all, levels, upcoming, type Level, type Model, type Topic } from './models';
import { PaperCanvas, type Camera } from '../../rendering/origami/browser';
import { dismissWelcome, done, welcomed } from './progress';
import { effort, pips, time } from './effort';
import { esc } from './icons';

export type Filter = { by: 'all' } | { by: 'level'; level: Level } | { by: 'topic'; topic: Topic };

export const topics: readonly { topic: Topic; title: string }[] = [
  { topic: 'animal', title: 'Animals' },
  { topic: 'flower', title: 'Flowers' },
  { topic: 'thing', title: 'Things' },
  { topic: 'technique', title: 'Symbols' },
];

/** A random model you haven't folded yet (any model once you've folded them all), skipping lessons. */
export function surprise(): Model {
  const pool = all.filter((m) => m.topic !== 'technique');
  const fresh = pool.filter((m) => !done.has(m.slug));
  const from = fresh.length ? fresh : pool;
  return from[Math.floor(Math.random() * from.length)]!;
}

/** The first model in teaching order that hasn't been folded yet. */
export function nextUp(): Model {
  return all.find((m) => !done.has(m.slug)) ?? all[all.length - 1]!;
}

/** The same model for everyone on a given local day, stepping through the collection. */
export function foldOfTheDay(date = new Date()): Model {
  const pool = all.filter((m) => m.topic !== 'technique');
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  // Stride through the teaching order by a step coprime with its length, so neighbouring days land
  // on different shelves and every model comes up once per cycle.
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const stride = [7, 11, 13, 1].find((k) => gcd(k, pool.length) === 1)!;
  return pool[(day * stride) % pool.length]!;
}

const folds = (m: Model) => `${m.steps.length} ${m.steps.length === 1 ? 'step' : 'steps'}`;

/** How long each step takes in a tile's time-lapse. */
const LAPSE_MS = 240;

/**
 * Draws a model's finished shape at a three-quarter angle. On hover it folds itself from a flat
 * sheet in a quick time-lapse, then keeps turning.
 */
export function preview(canvas: HTMLCanvasElement, model: Model, featured = false) {
  let finished: PaperCanvas | null = null;
  let whole: PaperCanvas | null = null;
  const last = model.steps.length - 1;
  // Tiles are top-down like a diagram; the featured model tilts and turns slowly on the mat.
  const cam: Camera = featured ? { yaw: -0.3, pitch: 0.5 } : { yaw: 0, pitch: 0 };
  let playing = false;
  let elapsed = 0;
  let lapse = false;
  const rest = () => (finished ??= new PaperCanvas(canvas, model, true)).draw(last, 1, cam, true);
  const tick = (_now: number, dt: number) => {
    if (featured && playing) cam.yaw += dt * 0.0005;
    if (lapse) {
      elapsed += dt;
      const step = Math.floor(elapsed / LAPSE_MS);
      if (step > last) lapse = false;
      else (whole ??= new PaperCanvas(canvas, model)).draw(step, (elapsed % LAPSE_MS) / LAPSE_MS, cam, false);
    }
    if (!lapse) rest();
    return lapse || (featured && playing);
  };
  const loop = createRenderLoop(tick, { element: canvas, continuous: false });
  return {
    play(on: boolean, fold = false) {
      playing = on;
      lapse = on && fold;
      elapsed = 0;
      loop.invalidate();
    },
    destroy() { loop.destroy(); finished?.destroy(); whole?.destroy(); },
  };
}

function tile(m: Model) {
  const folded = done.has(m.slug);
  return `<a class="tile${folded ? ' folded' : ''}" href="#/fold/${m.slug}" data-slug="${m.slug}" style="--paper:${m.color}">
      <canvas aria-hidden="true"></canvas>
      <span class="tile-label">
        <span class="tile-name">${esc(m.name)}</span>
        <span class="tile-meta">${folded ? 'Folded' : `${folds(m)}, ${time(effort(m))}`}${pips(effort(m))}</span>
      </span>
    </a>`;
}

function soon(name: string, about: string) {
  return `<div class="tile soon">
      <div class="soon-art" aria-hidden="true"></div>
      <span class="tile-label">
        <span class="tile-name">${esc(name)}</span>
        <span class="tile-meta">${esc(about)}, coming soon</span>
      </span>
    </div>`;
}

function shelf(level: (typeof levels)[number]): string {
  const models = all.filter((m) => m.level === level.level);
  const count = models.length ? `<span class="shelf-count">${models.filter((m) => done.has(m.slug)).length} of ${models.length} folded</span>` : '';
  const tiles =
    models.map(tile).join('') + (level.level === 'advanced' ? upcoming.map((u) => soon(u.name, u.about)).join('') : '');
  return `<section class="shelf" id="${level.level}">
      <h2>${level.title}${count}</h2>
      <div class="grid">${tiles}</div>
    </section>`;
}

const today = new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' });

function featured(m: Model, day: Model) {
  const level = levels.find((l) => l.level === m.level)!.title.toLowerCase();
  const same = m === day;
  const label = same ? 'Up next for you, and today’s fold' : 'Up next for you';
  return `<div class="features${same ? ' single' : ''}">
      <section class="up-next" style="--paper:${m.color}">
        <a class="up-next-art" href="#/fold/${m.slug}" data-slug="${m.slug}" aria-label="Fold ${esc(m.name)}"><canvas></canvas></a>
        <div class="up-next-copy">
          <p class="up-next-label">${label}</p>
          <h2>${esc(m.name)}</h2>
          <p>${esc(m.about)}. ${folds(m)}, about ${time(effort(m))}, ${level}.</p>
          <a class="button primary" href="#/fold/${m.slug}">Start folding</a>
        </div>
      </section>
      ${same ? '' : daily(day)}
    </div>`;
}

function daily(m: Model) {
  const folded = done.has(m.slug);
  return `<a class="today" href="#/fold/${m.slug}" data-slug="${m.slug}" style="--paper:${m.color}">
      <span class="today-label">Fold of the day<span class="today-date">${today.format(new Date())}</span></span>
      <canvas aria-hidden="true"></canvas>
      <span class="today-name">${esc(m.name)}</span>
      <span class="tile-meta">${folded ? 'Already in your drawer, fold it again' : `${folds(m)}, ${time(effort(m))}`}${pips(effort(m))}</span>
    </a>`;
}

function welcome() {
  return `<aside class="welcome" aria-label="Welcome">
      <p><strong>New to origami?</strong> Grab any square of paper. Watch each fold here, then copy it with your own hands. The symbols lessons take about a minute each.</p>
      <button class="welcome-close button secondary" type="button">Got it</button>
    </aside>`;
}

function shelves(filter: Filter) {
  if (filter.by === 'level') return shelf(levels.find((l) => l.level === filter.level)!);
  const only = filter.by === 'topic' ? (m: Model) => m.topic === filter.topic : () => true;
  return levels
    .map((level) => {
      const models = all.filter((m) => m.level === level.level && only(m));
      const soonHere = level.level === 'advanced' && (filter.by === 'all' || filter.topic === 'flower') ? upcoming : [];
      if (!models.length && !soonHere.length) return '';
      const count = `<span class="shelf-count">${models.filter((m) => done.has(m.slug)).length} of ${models.length} folded</span>`;
      return `<section class="shelf" id="${level.level}">
          <h2>${level.title}${models.length ? count : ''}</h2>
          <div class="grid">${models.map(tile).join('')}${soonHere.map((u) => soon(u.name, u.about)).join('')}</div>
        </section>`;
    })
    .join('');
}

/** Renders the model picker and returns a function that stops its animations. */
export function picker(app: HTMLElement, filter: Filter): () => void {
  const isAll = filter.by === 'all';
  const chip = (href: string, label: string, on: boolean, n?: number) =>
    `<a href="${href}" ${on ? 'aria-current="page"' : ''}>${label}${n === undefined ? '' : `<span class="chip-count">${n}</span>`}</a>`;
  const left = all.filter((m) => m.topic !== 'technique' && !done.has(m.slug)).length;

  app.innerHTML = `
    <div class="picker">
      <header class="picker-head">
        <h1>Pick something to fold</h1>
        <p>Every model folds live, one step at a time. Hover a tile to watch it fold itself. New to diagrams? Start with the symbols.</p>
        <div class="picker-tools">
          <nav class="filters" aria-label="Filter by topic">
            ${chip('#/', 'All', isAll)}${topics
              .map((t) => chip(`#/topic/${t.topic}`, t.title, filter.by === 'topic' && filter.topic === t.topic, all.filter((m) => m.topic === t.topic).length))
              .join('')}
          </nav>
          <button class="button surprise" type="button">${left ? 'Surprise me' : 'Fold one again'}</button>
        </div>
      </header>
      ${isAll ? featured(nextUp(), foldOfTheDay()) : ''}
      ${isAll && !done.size && !welcomed() ? welcome() : ''}
      ${shelves(filter)}
    </div>`;

  app.querySelector('.surprise')!.addEventListener('click', () => {
    location.hash = `#/fold/${surprise().slug}`;
  });
  app.querySelector('.welcome-close')?.addEventListener('click', (e) => {
    dismissWelcome();
    (e.currentTarget as HTMLElement).closest('.welcome')!.remove();
  });

  const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const previews = [...app.querySelectorAll<HTMLElement>('[data-slug]')].map((el) => {
    const model = all.find((m) => m.slug === el.dataset.slug)!;
    const p = preview(el.querySelector('canvas')!, model, el.classList.contains('up-next-art'));
    if (el.classList.contains('up-next-art')) p.play(motion, motion);
    else {
      el.addEventListener('pointerenter', () => p.play(true, motion));
      el.addEventListener('pointerleave', () => p.play(false));
      el.addEventListener('focus', () => p.play(true, motion));
      el.addEventListener('blur', () => p.play(false));
    }
    return p;
  });
  return () => previews.forEach((p) => p.destroy());
}
