import './style.css';
import { all, levels, upcoming, type Model } from './models';
import { buildStages, sheet } from './paper';
import { fitView, renderStage } from './render';
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

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&${({ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' } as const)[c as '&']};`);

function renderBar() {
  const route = location.hash.split('/')[1] ?? '';
  const basics = all.filter((m) => m.level === 'basics');
  const learned = basics.filter((m) => done.has(m.slug)).length;
  const folded = all.filter((m) => done.has(m.slug)).length;
  const pct = Math.round((folded / all.length) * 100);
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
    <div class="progress" title="${folded} of ${all.length} folded">
      <div class="fill" style="width:${pct}%"></div>
    </div>
    <div class="progress-label">${folded}/${all.length} folded · ${pct}%</div>`;
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
  const check = done.has(m.slug) ? '<span class="tick">✓</span>' : '';
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
      <p>every model here is folded live. press <kbd>space</kbd> to make a fold, drag the slider to scrub through it, and use the arrow keys to move between steps.</p>
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
      <li>fold on a hard, flat table.</li>
      <li>line up corners and edges first, then crease from the middle out.</li>
      <li>use square paper about 15 cm across. printer paper cut square works fine.</li>
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
  const idx = all.indexOf(model);
  const next = all[idx + 1];
  let i = 0;
  let t = 0;
  let raf = 0;

  app.innerHTML = `
    <a class="back" href="#/${model.level === 'basics' ? 'learn' : 'models'}">← ${model.level === 'basics' ? 'learn' : 'models'}</a>
    <header class="intro tight">
      <h1>${model.name}</h1>
      <p class="sub">${model.level} · ${model.steps.length} steps</p>
    </header>
    <div class="steps" role="tablist"></div>
    <figure class="stage"></figure>
    <p class="step-text" aria-live="polite"></p>
    <div class="controls">
      <button class="prev" aria-label="previous step">←</button>
      <button class="play"></button>
      <button class="next" aria-label="next step">→</button>
      <input class="scrub" type="range" min="0" max="1000" value="0" aria-label="fold progress" />
    </div>
    <p class="keys"><kbd>space</kbd> fold <kbd>←</kbd><kbd>→</kbd> steps <kbd>r</kbd> restart</p>
    <div class="finish" hidden></div>`;

  const $ = <T extends Element>(sel: string) => app.querySelector<T>(sel)!;
  const figure = $<HTMLElement>('.stage');
  const text = $<HTMLElement>('.step-text');
  const steps = $<HTMLElement>('.steps');
  const play = $<HTMLButtonElement>('.play');
  const scrub = $<HTMLInputElement>('.scrub');
  const finish = $<HTMLElement>('.finish');

  steps.innerHTML = stages.map((_, k) => `<button role="tab" aria-label="step ${k + 1}" data-k="${k}"></button>`).join('');
  steps.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
    b.addEventListener('click', () => go(Number(b.dataset.k), 0)),
  );

  const last = stages.length - 1;
  const complete = () => i === last && t >= 1;

  function draw() {
    const stage = stages[i]!;
    const deco = complete() && model.decorate ? `<g class="deco">${model.decorate}</g>` : '';
    figure.innerHTML = renderStage(stage, t, view, model.whiteUp, deco);
    text.innerHTML = `<span class="num">${String(i + 1).padStart(2, '0')}</span>${esc(stage.step.text)}`;
    scrub.value = String(Math.round(t * 1000));
    play.textContent = t >= 1 ? (i === last ? 'again' : 'next step') : raf ? 'pause' : 'fold';
    steps.querySelectorAll('button').forEach((b, k) => {
      b.classList.toggle('past', k < i || (k === i && t >= 1));
      b.setAttribute('aria-selected', String(k === i));
    });
    finish.hidden = !complete();
    if (complete()) {
      markDone(model.slug);
      finish.innerHTML = `<p><span class="tick">✓</span> ${esc(model.finish)}</p>${
        next ? `<a class="cta" href="#/fold/${next.slug}">next: ${next.name} →</a>` : '<a class="cta" href="#/models">all models →</a>'
      }`;
    }
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function animate() {
    stop();
    const duration = stages[i]!.step.kind === 'crease' ? 1800 : 1300;
    let prev = performance.now();
    const tick = (now: number) => {
      t = Math.min(1, t + (now - prev) / duration);
      prev = now;
      raf = t < 1 ? requestAnimationFrame(tick) : 0;
      draw();
    };
    raf = requestAnimationFrame(tick);
  }

  function go(k: number, at: number) {
    stop();
    i = Math.max(0, Math.min(last, k));
    t = at;
    draw();
  }

  function advance() {
    if (raf) return stop(), draw();
    if (t < 1) return animate();
    if (i === last) return go(0, 0);
    go(i + 1, 0);
    animate();
  }

  play.addEventListener('click', advance);
  $<HTMLButtonElement>('.next').addEventListener('click', () => (t < 1 ? animate() : go(i + 1, 0)));
  $<HTMLButtonElement>('.prev').addEventListener('click', () => (t > 0 && !raf ? go(i, 0) : go(i - 1, 0)));
  scrub.addEventListener('input', () => {
    stop();
    t = Number(scrub.value) / 1000;
    draw();
  });

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
    }
  };
  window.addEventListener('keydown', onKey);
  stopFold = () => {
    stop();
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
