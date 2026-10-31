import './style.css';
import { all, levels, upcoming, type Model } from './models';
import { buildStages, sheet } from './paper';
import { fitView, PixelStage, type Camera } from './render';
import { applyTheme, drawBanner, themes, currentTheme } from './theme';

const app = document.querySelector<HTMLElement>('#app')!;
const bar = document.querySelector<HTMLElement>('#bar')!;

const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode: progress just isn't remembered */
    }
  },
};

const done = new Set<string>(JSON.parse(store.get('origami:done') ?? '[]') as string[]);
function markDone(slug: string) {
  if (done.has(slug)) return;
  done.add(slug);
  store.set('origami:done', JSON.stringify([...done]));
  renderBar();
}

// lucide paths, drawn at one size and stroke
const icon = (d: string) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const icons = {
  check: icon('<path d="M20 6 9 17l-5-5"/>'),
  left: icon('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>'),
  right: icon('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&${({ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' } as const)[c as '&']};`);

function renderBar() {
  const route = location.hash.split('/')[1] ?? '';
  const basics = all.filter((m) => m.level === 'basics');
  const learned = basics.filter((m) => done.has(m.slug)).length;
  const folded = all.filter((m) => done.has(m.slug)).length;
  bar.innerHTML = `
    <div class="bar-row">
      <a class="logo" href="#/">折 origami</a>
      <nav>
        <a href="#/learn" class="${route === 'learn' ? 'on' : ''}">learn <span class="count">${learned}/${basics.length}</span></a>
        <a href="#/models" class="${route === 'models' ? 'on' : ''}">models</a>
      </nav>
      <div class="themes" role="radiogroup" aria-label="paper color">
        ${themes
          .map(
            (t) =>
              `<button role="radio" aria-checked="${t.name === currentTheme()}" aria-label="${t.name}" title="${t.name}" data-theme="${t.name}" style="--swatch:${t.paper}"></button>`,
          )
          .join('')}
      </div>
    </div>
    <div class="progress-row">
      <div class="progress" role="progressbar" aria-label="models folded" aria-valuenow="${folded}" aria-valuemin="0" aria-valuemax="${all.length}">
        <div class="fill" style="transform:scaleX(${folded / all.length})"></div>
      </div>
      <span class="progress-label">${folded}/${all.length} folded</span>
    </div>`;
  bar.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach((b) =>
    b.addEventListener('click', () => {
      applyTheme(b.dataset.theme!);
      renderBar();
      const banner = document.querySelector<HTMLCanvasElement>('canvas.banner');
      if (banner) drawBanner(banner);
    }),
  );
}

function row(m: Model) {
  const check = done.has(m.slug) ? `<span class="done" title="folded">${icons.check}</span>` : '';
  return `<li><a href="#/fold/${m.slug}"><span class="name">${m.name}${check}</span><span class="meta">${m.blurb}</span></a></li>`;
}

function section(title: string, body: string) {
  return `<section><h2>${title}</h2><ul class="list">${body}</ul></section>`;
}

function levelSection(level: (typeof levels)[number]) {
  if (level.level === 'advanced') {
    return section(
      level.title,
      upcoming.map((u) => `<li class="soon"><span class="name">${u.name}</span><span class="meta">${u.blurb} · soon</span></li>`).join(''),
    );
  }
  return section(level.title, all.filter((m) => m.level === level.level).map(row).join(''));
}

function home() {
  app.innerHTML = `
    <canvas class="banner" width="64" height="20" aria-hidden="true"></canvas>
    <header class="intro">
      <h1>origami</h1>
      <p class="sub">learn to fold · one crease at a time</p>
      <p>every model here is folded live. press <kbd>space</kbd> to make a fold, drag the slider to scrub through it, and drag the paper to see each step from any side.</p>
      <p>start with <a href="#/learn">the basics</a> to learn the symbols diagrams use, then work up from a <a href="#/fold/dog">dog face</a> to a <a href="#/fold/kabuto">samurai helmet</a>.</p>
    </header>
    ${levels.map(levelSection).join('')}`;
  drawBanner(app.querySelector('canvas.banner')!);
}

function learn() {
  app.innerHTML = `
    <header class="intro">
      <h1>learn to fold</h1>
      <p>origami diagrams use a small set of symbols. each lesson shows one, folded live. finish all five and every model will read like a sentence.</p>
    </header>
    ${levelSection(levels[0]!)}
    <section><h2>tips</h2><ul class="tips">
      <li>fold on a hard, flat table</li>
      <li>line up corners and edges first, then crease from the middle out</li>
      <li>use square paper about 15 cm across; printer paper cut square works fine</li>
    </ul></section>`;
}

function modelsView() {
  app.innerHTML = `
    <header class="intro">
      <h1>models</h1>
      <p>start easy. each level adds a new idea: layers, flaps, and bases you reuse across models.</p>
    </header>
    ${levels.slice(1).map(levelSection).join('')}`;
}

let stopFold: (() => void) | null = null;

function fold(model: Model) {
  const stages = buildStages(sheet(model.paper), model.steps);
  const view = fitView(stages);
  const next = all[all.indexOf(model) + 1];
  const last = stages.length - 1;
  const cam: Camera = { yaw: 0, pitch: 0 };
  let i = 0;
  let t = 0;
  let playing = false;
  let spinning = false;
  let resetting = false;
  let raf = 0;
  let then = 0;

  app.innerHTML = `
    <a class="back" href="#/${model.level === 'basics' ? 'learn' : 'models'}">${icons.left}${model.level === 'basics' ? 'learn' : 'models'}</a>
    <header class="intro tight">
      <h1>${model.name}</h1>
      <p class="sub">${model.level} · ${model.steps.length} steps</p>
    </header>
    <div class="steps" role="tablist"></div>
    <figure class="stage">
      <canvas role="img"></canvas>
      <div class="view-controls">
        <button class="spin" aria-pressed="false" title="spin (s)">spin</button>
        <button class="reset" title="reset view (v)">top view</button>
      </div>
      <span class="hint">drag to look around</span>
    </figure>
    <p class="step-text" aria-live="polite"></p>
    <div class="controls">
      <button class="prev" aria-label="previous step">${icons.left}</button>
      <button class="play"></button>
      <button class="next" aria-label="next step">${icons.right}</button>
      <input class="scrub" type="range" min="0" max="1000" value="0" aria-label="fold progress" />
    </div>
    <p class="keys">
      <span><kbd>space</kbd> fold</span>
      <span><kbd>←</kbd><kbd>→</kbd> steps</span>
      <span><kbd>s</kbd> spin</span>
      <span><kbd>v</kbd> top view</span>
      <span><kbd>r</kbd> restart</span>
    </p>
    <div class="finish" hidden></div>`;

  const $ = <T extends Element>(sel: string) => app.querySelector<T>(sel)!;
  const figure = $<HTMLElement>('.stage');
  const canvas = $<HTMLCanvasElement>('.stage canvas');
  const text = $<HTMLElement>('.step-text');
  const steps = $<HTMLElement>('.steps');
  const play = $<HTMLButtonElement>('.play');
  const spin = $<HTMLButtonElement>('.spin');
  const reset = $<HTMLButtonElement>('.reset');
  const scrub = $<HTMLInputElement>('.scrub');
  const finish = $<HTMLElement>('.finish');
  const pixels = new PixelStage(canvas);

  steps.innerHTML = stages.map((_, k) => `<button role="tab" aria-label="step ${k + 1}" data-k="${k}"></button>`).join('');
  steps.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
    b.addEventListener('click', () => go(Number(b.dataset.k), 0)),
  );

  const complete = () => i === last && t >= 1;

  function draw() {
    const stage = stages[i]!;
    pixels.draw(stage, t, view, model.whiteUp, cam, complete() ? model.dots : []);
    canvas.setAttribute('aria-label', stage.step.text);
    text.innerHTML = `<span class="num">${String(i + 1).padStart(2, '0')}</span>${esc(stage.step.text)}`;
    scrub.value = String(Math.round(t * 1000));
    play.textContent = t >= 1 ? (i === last ? 'again' : 'next step') : playing ? 'pause' : 'fold';
    spin.setAttribute('aria-pressed', String(spinning));
    reset.disabled = !resetting && cam.yaw === 0 && cam.pitch === 0;
    steps.querySelectorAll('button').forEach((b, k) => {
      b.classList.toggle('past', k < i || (k === i && t >= 1));
      b.setAttribute('aria-selected', String(k === i));
    });
    finish.hidden = !complete();
    if (complete()) {
      markDone(model.slug);
      finish.innerHTML = `<p>${esc(model.finish)}</p>${
        next ? `<a class="cta" href="#/fold/${next.slug}">next: ${next.name}</a>` : '<a class="cta" href="#/models">all models</a>'
      }`;
    }
  }

  function frame(now: number) {
    const dt = Math.min(50, now - then);
    then = now;
    if (playing) {
      t = Math.min(1, t + dt / (stages[i]!.step.kind === 'crease' ? 1800 : 1300));
      playing = t < 1;
    }
    if (spinning) cam.yaw += dt * 0.0011;
    if (resetting) {
      cam.yaw = Math.atan2(Math.sin(cam.yaw), Math.cos(cam.yaw)) * 0.85;
      cam.pitch *= 0.85;
      if (Math.abs(cam.yaw) + Math.abs(cam.pitch) < 0.002) {
        cam.yaw = cam.pitch = 0;
        resetting = false;
      }
    }
    draw();
    raf = playing || spinning || resetting ? requestAnimationFrame(frame) : 0;
  }

  function kick() {
    if (raf) return;
    then = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function animate() {
    playing = true;
    kick();
  }

  function go(k: number, at: number) {
    playing = false;
    i = Math.max(0, Math.min(last, k));
    t = at;
    draw();
  }

  function advance() {
    if (playing) {
      playing = false;
      return draw();
    }
    if (t < 1) return animate();
    if (i === last) return go(0, 0);
    go(i + 1, 0);
    animate();
  }

  function toggleSpin() {
    spinning = !spinning;
    resetting = false;
    if (spinning) kick();
    else draw();
  }

  function topView() {
    spinning = false;
    resetting = true;
    kick();
  }

  play.addEventListener('click', advance);
  spin.addEventListener('click', toggleSpin);
  reset.addEventListener('click', topView);
  $<HTMLButtonElement>('.next').addEventListener('click', () => (t < 1 ? animate() : go(i + 1, 0)));
  $<HTMLButtonElement>('.prev').addEventListener('click', () => (t > 0 && !playing ? go(i, 0) : go(i - 1, 0)));
  scrub.addEventListener('input', () => {
    playing = false;
    t = Number(scrub.value) / 1000;
    draw();
  });

  let drag: { x: number; y: number; yaw: number; pitch: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch };
    spinning = resetting = false;
    canvas.setPointerCapture(e.pointerId);
    figure.classList.add('dragging', 'touched');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    cam.yaw = drag.yaw + (e.clientX - drag.x) * 0.012;
    cam.pitch = Math.max(-1.45, Math.min(1.45, drag.pitch - (e.clientY - drag.y) * 0.012));
    if (!raf) draw();
  });
  const release = () => {
    drag = null;
    figure.classList.remove('dragging');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('dblclick', topView);

  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement && e.key !== ' ') return;
    if (e.key === ' ') {
      e.preventDefault();
      advance();
    } else if (e.key === 'ArrowRight') {
      if (t < 1) animate();
      else go(i + 1, 0);
    } else if (e.key === 'ArrowLeft') {
      go(t > 0 ? i : i - 1, 0);
    } else if (e.key === 'r') {
      go(0, 0);
    } else if (e.key === 's') {
      toggleSpin();
    } else if (e.key === 'v') {
      topView();
    }
  };
  window.addEventListener('keydown', onKey);
  stopFold = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
  };
  draw();
}

function route() {
  stopFold?.();
  stopFold = null;
  const [, page, slug] = location.hash.split('/');
  const model = page === 'fold' ? all.find((m) => m.slug === slug) : undefined;
  if (model) fold(model);
  else if (page === 'learn') learn();
  else if (page === 'models') modelsView();
  else home();
  document.title = model ? `${model.name} · origami` : 'origami';
  renderBar();
  window.scrollTo(0, 0);
}

applyTheme(currentTheme());
window.addEventListener('hashchange', route);
route();
