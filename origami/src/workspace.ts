import { all, type Model } from './models';
import type { Step } from './diagram';
import { PaperCanvas, type Camera } from './engine';
import { markDone } from './progress';
import { kami } from './kami';
import { esc, icons } from './icons';

const lessons: Record<Exclude<Step['kind'], 'reverse'>, { slug: string; name: string }> = {
  valley: { slug: 'valley-fold', name: 'valley fold' },
  mountain: { slug: 'mountain-fold', name: 'mountain fold' },
  crease: { slug: 'crease', name: 'fold and unfold' },
  flip: { slug: 'turn-over', name: 'turn over' },
  rotate: { slug: 'rotate', name: 'rotate' },
  squash: { slug: 'squash-fold', name: 'squash fold' },
  petal: { slug: 'petal-fold', name: 'petal fold' },
  collapse: { slug: 'squash-fold', name: 'squash fold' },
};

/** The lesson that teaches the symbol a step uses. */
const lessonFor = (step: Step) =>
  step.kind === 'reverse'
    ? step.direction === 'inside'
      ? { slug: 'inside-reverse-fold', name: 'inside reverse fold' }
      : { slug: 'outside-reverse-fold', name: 'outside reverse fold' }
    : lessons[step.kind];

/** First sentence of a step, for the step list. */
const short = (text: string) => text.split(/(?<=\.)\s/)[0]!.replace(/\.$/, '');

/** Renders the folding workspace for one model and returns a function that tears it down. */
export function workspace(app: HTMLElement, model: Model): () => void {
  const steps = model.steps;
  const next = all[all.indexOf(model) + 1];
  const last = steps.length - 1;
  const cam: Camera = { yaw: 0, pitch: 0 };
  let i = 0;
  let t = 0;
  let playing = false;
  let spinning = false;
  let resetting = false;
  let raf = 0;
  let then = 0;

  app.innerHTML = `
    <div class="workspace" style="--paper:${model.color}">
      <div class="ws-head">
        <a class="back" href="#/level/${model.level}">${icons.left}All models</a>
        <h1>${esc(model.name)}</h1>
        <div class="swatches" role="radiogroup" aria-label="Paper color">
          ${kami
            .map(
              (k) =>
                `<button role="radio" aria-checked="${k.hex === model.color}" aria-label="${k.name} paper" title="${k.name}" data-hex="${k.hex}" style="--swatch:${k.hex}"></button>`,
            )
            .join('')}
        </div>
      </div>
      <div class="ws-body">
        <figure class="stage">
          <canvas role="img"></canvas>
          <div class="view-controls">
            <button class="spin" aria-pressed="false" title="Spin (S)">${icons.orbit}Spin</button>
            <button class="reset" title="Top view (V)">${icons.top}Top view</button>
          </div>
          <span class="hint">Drag the paper to look around</span>
        </figure>
        <aside class="panel">
          <p class="step-count" aria-live="polite"></p>
          <p class="instruction"></p>
          <a class="symbol"></a>
          <div class="controls">
            <button class="prev" aria-label="Previous step">${icons.left}</button>
            <button class="play"></button>
            <button class="next" aria-label="Next step">${icons.right}</button>
          </div>
          <input class="scrub" type="range" min="0" max="1000" value="0" aria-label="Fold progress" />
          <div class="finish" hidden></div>
          <ol class="step-list">
            ${steps.map((s, k) => `<li><button data-k="${k}"><span class="num">${k + 1}</span><span>${esc(short(s.text))}</span></button></li>`).join('')}
          </ol>
        </aside>
      </div>
      <p class="keys">
        <span><kbd>Space</kbd> fold</span>
        <span><kbd>←</kbd><kbd>→</kbd> steps</span>
        <span><kbd>S</kbd> spin</span>
        <span><kbd>V</kbd> top view</span>
        <span><kbd>R</kbd> restart</span>
      </p>
    </div>`;

  const $ = <T extends Element>(sel: string) => app.querySelector<T>(sel)!;
  const root = $<HTMLElement>('.workspace');
  const figure = $<HTMLElement>('.stage');
  const canvas = $<HTMLCanvasElement>('.stage canvas');
  const count = $<HTMLElement>('.step-count');
  const instruction = $<HTMLElement>('.instruction');
  const symbol = $<HTMLAnchorElement>('.symbol');
  const play = $<HTMLButtonElement>('.play');
  const spin = $<HTMLButtonElement>('.spin');
  const reset = $<HTMLButtonElement>('.reset');
  const scrub = $<HTMLInputElement>('.scrub');
  const finish = $<HTMLElement>('.finish');
  const list = [...app.querySelectorAll<HTMLButtonElement>('.step-list button')];
  const paper = new PaperCanvas(canvas, model);

  const complete = () => i === last && t >= 1;

  function draw() {
    const step = steps[i]!;
    paper.draw(i, t, cam, complete());
    canvas.setAttribute('aria-label', step.text);
    count.textContent = `Step ${i + 1} of ${steps.length}`;
    instruction.textContent = step.text;
    const lesson = lessonFor(step);
    symbol.hidden = lesson.slug === model.slug;
    symbol.href = `#/fold/${lesson.slug}`;
    symbol.textContent = `Uses the ${lesson.name} symbol`;
    scrub.value = String(Math.round(t * 1000));
    play.textContent = t >= 1 ? (i === last ? 'Fold again' : 'Next step') : playing ? 'Pause' : 'Fold';
    spin.setAttribute('aria-pressed', String(spinning));
    reset.disabled = !resetting && cam.yaw === 0 && cam.pitch === 0;
    list.forEach((b, k) => {
      b.classList.toggle('past', k < i || (k === i && t >= 1));
      if (k === i) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    finish.hidden = !complete();
    if (complete()) {
      markDone(model.slug);
      const title = model.level === 'basics' ? 'Lesson complete' : `You folded a ${esc(model.name.toLowerCase())}`;
      finish.innerHTML = `<p class="finish-title">${title}</p><p>${esc(model.finish)}</p>${
        next ? `<a class="button primary" href="#/fold/${next.slug}">Next: ${esc(next.name)}</a>` : '<a class="button primary" href="#/">Back to all models</a>'
      }`;
    }
  }

  function frame(now: number) {
    const dt = Math.min(50, now - then);
    then = now;
    if (playing) {
      t = Math.min(1, t + dt / (steps[i]!.kind === 'crease' ? 1800 : 1300));
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
  list.forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.k), 0)));
  scrub.addEventListener('input', () => {
    playing = false;
    t = Number(scrub.value) / 1000;
    draw();
  });
  app.querySelectorAll<HTMLButtonElement>('[data-hex]').forEach((b) =>
    b.addEventListener('click', () => {
      root.style.setProperty('--paper', b.dataset.hex!);
      app.querySelectorAll('[data-hex]').forEach((o) => o.setAttribute('aria-checked', String(o === b)));
      draw();
    }),
  );

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
    const key = e.key.toLowerCase();
    if (key === ' ') {
      e.preventDefault();
      advance();
    } else if (key === 'arrowright') {
      if (t < 1) animate();
      else go(i + 1, 0);
    } else if (key === 'arrowleft') {
      go(t > 0 ? i : i - 1, 0);
    } else if (key === 'r') {
      go(0, 0);
    } else if (key === 's') {
      toggleSpin();
    } else if (key === 'v') {
      topView();
    }
  };
  window.addEventListener('keydown', onKey);
  draw();
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKey);
  };
}
