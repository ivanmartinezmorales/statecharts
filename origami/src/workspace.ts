import { all, type Model } from './models';
import type { Step } from './diagram';
import { PaperCanvas, type Camera } from './engine';
import { done, markDone } from './progress';
import { surprise } from './picker';
import { kami } from './kami';
import { esc, icons } from './icons';
import { difficultyName, effort, pips, time } from './effort';

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

/** What usually goes wrong with each kind of fold, and how to avoid it. */
const tips: Record<Step['kind'], string> = {
  valley: 'Line the edges or corners up exactly first, hold them with one hand, then press the crease flat from the middle outward.',
  mountain: 'Easiest done as a valley fold from behind: turn the model over, fold toward you, and turn it back.',
  crease: 'Make the crease sharp with a fingernail before you unfold. Later steps use it as a guide, so a soft crease drifts.',
  flip: 'Turn it over like a page, left to right, so the top stays at the top.',
  rotate: 'Turn the paper flat on the table, without flipping it. The arrows show which way.',
  squash: 'Lift the flap upright first, open it a little, then press straight down on the spine so both sides spread evenly.',
  petal: 'Pre-crease the edges to the center line first. Then lift the bottom point slowly and let those creases fold in on their own.',
  collapse: 'Make every crease first, both directions. Then bring the points together gently, the paper wants to fall into shape.',
  reverse: 'Pre-crease the line in both directions first. Open the layers slightly and push the point between them, along the crease.',
};

/** Paper starts and stops gently: the fold clock stays linear, only what is drawn eases. */
const eased = (t: number) => t * t * (3 - 2 * t);

/** First sentence of a step, for the step list. */
const short = (text: string) => text.split(/(?<=\.)\s/)[0]!.replace(/\.$/, '');

/** Renders the folding workspace for one model and returns a function that tears it down. */
export function workspace(app: HTMLElement, model: Model, start = 0): () => void {
  const steps = model.steps;
  const next = all[all.indexOf(model) + 1];
  const last = steps.length - 1;
  // Start at a three-quarter angle so the paper reads in 3D; Top view flattens it like a printed diagram.
  const cam: Camera = { yaw: -0.32, pitch: 0.48 };
  let i = Math.max(0, Math.min(last, start));
  let t = 0;
  const e = effort(model);
  let playing = false;
  let auto = false;
  let held = 0;
  let spinning = false;
  let resetting = false;
  let raf = 0;
  let then = 0;

  app.innerHTML = `
    <div class="workspace" style="--paper:${model.color}">
      <div class="ws-head">
        <a class="back" href="#/level/${model.level}">${icons.left}All models</a>
        <div class="ws-title">
          <h1>${esc(model.name)}</h1>
          <p class="ws-meta">${steps.length} ${steps.length === 1 ? 'step' : 'steps'}, about ${time(e)}<span class="dot" aria-hidden="true"></span><span aria-hidden="true">${pips(e)}</span>${difficultyName[e.difficulty]}</p>
        </div>
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
          <details class="tip">
            <summary>Tip for this fold</summary>
            <p></p>
          </details>
          <div class="controls">
            <button class="prev" aria-label="Previous step">${icons.left}</button>
            <button class="play"></button>
            <button class="next" aria-label="Next step">${icons.right}</button>
          </div>
          <input class="scrub" type="range" min="0" max="1000" value="0" aria-label="Fold progress" />
          <button class="play-all" type="button" aria-pressed="false"></button>
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
  const tip = $<HTMLElement>('.tip p');
  const play = $<HTMLButtonElement>('.play');
  const spin = $<HTMLButtonElement>('.spin');
  const reset = $<HTMLButtonElement>('.reset');
  const scrub = $<HTMLInputElement>('.scrub');
  const finish = $<HTMLElement>('.finish');
  const playAll = $<HTMLButtonElement>('.play-all');
  const list = [...app.querySelectorAll<HTMLButtonElement>('.step-list button')];
  const paper = new PaperCanvas(canvas, model);

  const complete = () => i === last && t >= 1;

  // The loop calls draw() every frame, so only touch the DOM for what actually changed.
  const setText = (el: HTMLElement, value: string) => {
    if (el.textContent === value) return false;
    el.textContent = value;
    return true;
  };
  // New copy rises in on the same curve as the page; the first paint and reduced motion stay still.
  const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let drawn = false;
  const enter = (el: HTMLElement, rise: number, ms: number) => {
    if (motion && drawn) {
      el.animate([{ opacity: 0, transform: `translateY(${rise}px)` }, { opacity: 1, transform: 'none' }], {
        duration: ms,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      });
    }
  };
  const setAttr = (el: Element, name: string, value: string) => {
    if (el.getAttribute(name) !== value) el.setAttribute(name, value);
  };

  function draw() {
    const step = steps[i]!;
    paper.draw(i, eased(t), cam, complete());
    setAttr(canvas, 'aria-label', step.text);
    if (setText(count, `Step ${i + 1} of ${steps.length}`)) enter(count, 0, 160);
    if (setText(instruction, step.text)) enter(instruction, 6, 280);
    const lesson = lessonFor(step);
    symbol.hidden = lesson.slug === model.slug;
    setAttr(symbol, 'href', `#/fold/${lesson.slug}`);
    if (setText(symbol, `Uses the ${lesson.name} symbol`)) enter(symbol, 6, 280);
    setText(tip, tips[step.kind]);
    // Keep the address on the current step, so a reload or a shared link lands here.
    const here = `#/fold/${model.slug}${i ? `/${i + 1}` : ''}`;
    if (location.hash !== here) history.replaceState(null, '', here);
    const value = String(Math.round(t * 1000));
    if (scrub.value !== value) scrub.value = value;
    setText(play, t >= 1 ? (i === last ? 'Fold again' : 'Next step') : playing ? 'Pause' : 'Fold');
    setText(playAll, auto ? 'Stop playing' : 'Play every step');
    setAttr(playAll, 'aria-pressed', String(auto));
    setAttr(spin, 'aria-pressed', String(spinning));
    reset.disabled = !resetting && cam.yaw === 0 && cam.pitch === 0;
    list.forEach((b, k) => {
      b.classList.toggle('past', k < i || (k === i && t >= 1));
      if (k === i) setAttr(b, 'aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    // Built once per finish, so its buttons stay put while the model spins.
    const shown = !finish.hidden;
    finish.hidden = !complete();
    if (complete() && !shown) {
      if (markDone(model.slug)) celebrate(figure);
      const title = model.level === 'basics' ? 'Lesson complete' : `You folded a ${esc(model.name.toLowerCase())}`;
      const total = all.filter((m) => m.topic !== 'technique');
      const folded = total.filter((m) => done.has(m.slug)).length;
      finish.innerHTML = `<p class="finish-title">${title}</p><p>${esc(model.finish)}</p>
        <p class="tally">${folded} of ${total.length} models folded. <a href="#/drawer">See your drawer</a></p>
        <div class="finish-actions">${
          next ? `<a class="button primary" href="#/fold/${next.slug}">Next: ${esc(next.name)}</a>` : '<a class="button primary" href="#/">Back to all models</a>'
        }<button class="button secondary surprise" type="button">Surprise me</button><button class="button secondary share" type="button">Share</button></div>
        <p class="share-status" aria-live="polite"></p>`;
      finish.querySelector('.surprise')!.addEventListener('click', () => {
        location.hash = `#/fold/${surprise().slug}`;
      });
      finish.querySelector('.share')!.addEventListener('click', () => void share());
    }
    drawn = true;
  }

  async function share() {
    const url = `${location.origin}${location.pathname}#/fold/${model.slug}`;
    const text = model.level === 'basics' ? `I learned the ${model.name.toLowerCase()} on Origami.` : `I folded a ${model.name.toLowerCase()} on Origami. Try it:`;
    const status = finish.querySelector<HTMLElement>('.share-status')!;
    if (navigator.share) {
      // Rejects when the share sheet is dismissed, which needs no message.
      return navigator.share({ title: model.name, text, url }).catch(() => {});
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      status.textContent = 'Link copied';
    } catch {
      status.textContent = url;
    }
  }

  function frame(now: number) {
    const dt = Math.min(50, now - then);
    then = now;
    if (playing) {
      t = Math.min(1, t + dt / (steps[i]!.kind === 'crease' ? 1800 : 1300));
      playing = t < 1;
    } else if (auto && t >= 1) {
      // Rest on each finished step for a moment before folding the next one.
      held += dt;
      if (i === last) auto = false;
      else if (held > 650) {
        held = 0;
        i += 1;
        t = 0;
        playing = true;
      }
    }
    if (spinning) cam.yaw += dt * 0.0011;
    if (resetting) {
      // Ease out on the clock, not per frame, so a 120 Hz screen settles as slowly as a 60 Hz one.
      const rest = Math.exp(-dt / 103);
      cam.yaw = Math.atan2(Math.sin(cam.yaw), Math.cos(cam.yaw)) * rest;
      cam.pitch *= rest;
      if (Math.abs(cam.yaw) + Math.abs(cam.pitch) < 0.002) {
        cam.yaw = cam.pitch = 0;
        resetting = false;
      }
    }
    draw();
    raf = playing || spinning || resetting || auto ? requestAnimationFrame(frame) : 0;
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

  function togglePlayAll() {
    auto = !auto;
    held = 0;
    if (!auto) {
      playing = false;
      return draw();
    }
    if (complete()) go(0, 0);
    if (t < 1) playing = true;
    kick();
  }

  function advance() {
    auto = false;
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
  playAll.addEventListener('click', togglePlayAll);
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

  // On a phone, swipe the instructions sideways to move between steps; the stage itself orbits.
  let swipe: { x: number; y: number } | null = null;
  const panel = $<HTMLElement>('.panel');
  const onTouch = (ev: TouchEvent) => {
    const p = ev.touches[0]!;
    swipe = ev.touches.length === 1 && !(ev.target as Element).closest('input, .step-list') ? { x: p.clientX, y: p.clientY } : null;
  };
  panel.addEventListener('touchstart', onTouch, { passive: true });
  panel.addEventListener('touchend', (ev) => {
    if (!swipe) return;
    const p = ev.changedTouches[0]!;
    const dx = p.clientX - swipe.x;
    const dy = p.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx > 0) go(t > 0 ? i : i - 1, 0);
    else if (t < 1) animate();
    else if (i < last) go(i + 1, 0);
  });

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

/** A burst of square paper confetti over the stage, the first time a model is finished. */
function celebrate(stage: HTMLElement) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.width = canvas.height = 128;
  stage.append(canvas);
  const ctx = canvas.getContext('2d')!;
  const bits = Array.from({ length: 70 }, () => ({
    x: 64 + (Math.random() - 0.5) * 20,
    y: 70,
    vx: (Math.random() - 0.5) * 110,
    vy: -60 - Math.random() * 90,
    size: 2 + Math.round(Math.random() * 2),
    color: kami[Math.floor(Math.random() * kami.length)]!.hex,
  }));
  const start = performance.now();
  let then = start;
  const tick = (now: number) => {
    const dt = (now - then) / 1000;
    then = now;
    ctx.clearRect(0, 0, 128, 128);
    for (const b of bits) {
      b.vy += 160 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      ctx.fillStyle = b.color;
      ctx.fillRect(Math.round(b.x), Math.round(b.y), b.size, b.size);
    }
    if (now - start < 1800) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}
