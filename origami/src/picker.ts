import { all, levels, upcoming, type Level, type Model } from './models';
import { buildStages, sheet } from './paper';
import { fitView, PixelStage, type Camera } from './render';
import { done } from './progress';
import { esc } from './icons';

export type Filter = Level | 'all';

/** The first model in teaching order that hasn't been folded yet. */
export function nextUp(): Model {
  return all.find((m) => !done.has(m.slug)) ?? all[all.length - 1]!;
}

const folds = (m: Model) => `${m.steps.length} ${m.steps.length === 1 ? 'step' : 'steps'}`;

/** Draws a model's finished shape at a three-quarter angle, and can turn it slowly. */
function preview(canvas: HTMLCanvasElement, model: Model) {
  const stages = buildStages(sheet(model.paper), model.steps);
  const last = stages[stages.length - 1]!;
  const view = fitView([last]);
  const pixels = new PixelStage(canvas);
  const cam: Camera = { yaw: -0.45, pitch: 0.5 };
  let raf = 0;
  let then = 0;
  const draw = () => pixels.draw(last, 1, view, model.whiteUp, cam, model.dots);
  const tick = (now: number) => {
    cam.yaw += Math.min(50, now - then) * 0.0008;
    then = now;
    draw();
    raf = requestAnimationFrame(tick);
  };
  draw();
  return {
    spin(on: boolean) {
      cancelAnimationFrame(raf);
      raf = 0;
      if (!on) return;
      then = performance.now();
      raf = requestAnimationFrame(tick);
    },
  };
}

function tile(m: Model) {
  const folded = done.has(m.slug);
  return `<a class="tile${folded ? ' folded' : ''}" href="#/fold/${m.slug}" data-slug="${m.slug}" style="--paper:${m.color}">
      <canvas aria-hidden="true"></canvas>
      <span class="tile-label">
        <span class="tile-name">${esc(m.name)}</span>
        <span class="tile-meta">${folded ? 'Folded' : folds(m)}</span>
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

function shelf(level: (typeof levels)[number]) {
  const models = all.filter((m) => m.level === level.level);
  const count = models.length ? `<span class="shelf-count">${models.filter((m) => done.has(m.slug)).length} of ${models.length} folded</span>` : '';
  const tiles =
    level.level === 'advanced' ? upcoming.map((u) => soon(u.name, u.about)).join('') : models.map(tile).join('');
  return `<section class="shelf" id="${level.level}">
      <h2>${level.title}${count}</h2>
      <div class="grid">${tiles}</div>
    </section>`;
}

function featured(m: Model) {
  const level = levels.find((l) => l.level === m.level)!.title.toLowerCase();
  return `<section class="up-next" style="--paper:${m.color}">
      <a class="up-next-art" href="#/fold/${m.slug}" data-slug="${m.slug}" aria-label="Fold ${esc(m.name)}"><canvas></canvas></a>
      <div class="up-next-copy">
        <p class="up-next-label">Up next for you</p>
        <h2>${esc(m.name)}</h2>
        <p>${esc(m.about)}. ${folds(m)}, ${level}.</p>
        <a class="button primary" href="#/fold/${m.slug}">Start folding</a>
      </div>
    </section>`;
}

/** Renders the model picker and returns a function that stops its animations. */
export function picker(app: HTMLElement, filter: Filter): () => void {
  const shown = filter === 'all' ? levels : levels.filter((l) => l.level === filter);
  const chip = (f: Filter, label: string) =>
    `<a href="${f === 'all' ? '#/' : `#/level/${f}`}" ${f === filter ? 'aria-current="page"' : ''}>${label}</a>`;

  app.innerHTML = `
    <div class="picker">
      <header class="picker-head">
        <h1>Pick something to fold</h1>
        <p>Every model is folded live, one step at a time. New to origami diagrams? Start with the symbols.</p>
        <nav class="filters" aria-label="Filter by level">
          ${chip('all', 'All')}${levels.map((l) => chip(l.level, l.title)).join('')}
        </nav>
      </header>
      ${filter === 'all' ? featured(nextUp()) : ''}
      ${shown.map(shelf).join('')}
    </div>`;

  const previews = [...app.querySelectorAll<HTMLElement>('[data-slug]')].map((el) => {
    const model = all.find((m) => m.slug === el.dataset.slug)!;
    const p = preview(el.querySelector('canvas')!, model);
    const featuredArt = el.classList.contains('up-next-art');
    if (featuredArt) p.spin(!matchMedia('(prefers-reduced-motion: reduce)').matches);
    else {
      el.addEventListener('pointerenter', () => p.spin(true));
      el.addEventListener('pointerleave', () => p.spin(false));
      el.addEventListener('focus', () => p.spin(true));
      el.addEventListener('blur', () => p.spin(false));
    }
    return p;
  });
  return () => previews.forEach((p) => p.spin(false));
}
