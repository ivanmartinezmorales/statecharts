import { createRenderLoop } from './render-loop.mjs';
import { createCanvasBloom } from './bloom.mjs';
// The story player: shows the picture for the current state, the steps out of it, and a map of the whole chart.
// A new picture arrives in blocks, then sharpens from big pixels to small ones. Over the crisp pixels sits a soft
// layer of light: bright parts bloom, stars twinkle, and motes drift up.
(async () => {
  const W = 240, H = 160, BLOCK = 10;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const story = await (await fetch('story.json')).json();
  const byId = Object.fromEntries(story.states.map((s) => [s.id, s]));
  const stepsFrom = (id) => story.steps.filter((s) => s.from === id);

  const images = {};
  const load = (src) => (images[src] ||= new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; }));
  story.states.forEach((s) => load(s.image));

  // ---- the picture
  const canvas = $('scene'), ctx = canvas.getContext('2d');
  const tmp = document.createElement('canvas'), tctx = tmp.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let shown = null, animating = false, anim = 0;
  let stopReveal = () => {};

  function pixelated(img, block) {
    const w = Math.max(1, Math.ceil(W / block)), h = Math.max(1, Math.ceil(H / block));
    tmp.width = w; tmp.height = h; tctx.imageSmoothingEnabled = true; tctx.drawImage(img, 0, 0, w, h);
    return { canvas: tmp, w, h };
  }

  function drawWhole(img, block = 1) {
    ctx.imageSmoothingEnabled = false;
    if (block <= 1) { ctx.drawImage(img, 0, 0); return; }
    const p = pixelated(img, block);
    ctx.drawImage(p.canvas, 0, 0, p.w, p.h, 0, 0, p.w * block, p.h * block);
  }

  function show(img) {
    stopReveal();
    const run = ++anim;
    if (reduceMotion || !shown) {
      if (!shown && !reduceMotion) return reveal(img, run);
      shown = img; drawWhole(img); glow.set(img); return Promise.resolve();
    }
    return reveal(img, run);
  }

  function reveal(img, run) {
    animating = true;
    glow.hide();
    const blocks = [];
    for (let y = 0; y < H; y += BLOCK) for (let x = 0; x < W; x += BLOCK) blocks.push([x, y]);
    for (let i = blocks.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [blocks[i], blocks[j]] = [blocks[j], blocks[i]]; }
    const big = pixelated(img, BLOCK), coarse = document.createElement('canvas');
    coarse.width = W; coarse.height = H;
    const cc = coarse.getContext('2d'); cc.imageSmoothingEnabled = false; cc.drawImage(big.canvas, 0, 0, big.w, big.h, 0, 0, big.w * BLOCK, big.h * BLOCK);
    const t0 = performance.now(), REVEAL = 420, SHARPEN = 520;
    return new Promise((done) => {
      let drawn = 0;
      const frame = (now) => {
        if (run !== anim) { stopReveal(); return; }
        const t = now - t0;
        if (t < REVEAL) {
          const want = Math.floor((1 - (1 - t / REVEAL) ** 2) * blocks.length);
          for (; drawn < want; drawn++) { const [x, y] = blocks[drawn]; ctx.drawImage(coarse, x, y, BLOCK, BLOCK, x, y, BLOCK, BLOCK); }
          return true;
        }
        const u = Math.min(1, (t - REVEAL) / SHARPEN), block = Math.max(1, Math.round(BLOCK - (1 - (1 - u) ** 2) * (BLOCK - 1)));
        drawWhole(img, block);
        if (u < 1) return true;
        shown = img; animating = false; glow.set(img); stopReveal();
      };
      const loop = createRenderLoop(frame, { element: canvas, continuous: false });
      stopReveal = () => { loop.destroy(); done(); };
    });
  }


  // ---- the light, drawn smooth at screen resolution so it glows while the pixels stay sharp
  const glow = (() => {
    const layer = $('glow'), g = layer.getContext('2d', { colorSpace: 'display-p3' }) || layer.getContext('2d');
    let bloom = null, bright = null, stars = [], motes = [], fade = 0, target = 0, last = 0, R = Math.random;
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    { const x = sprite.getContext('2d'), r = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.14, 'rgba(255,250,232,0.75)');
      r.addColorStop(0.42, 'rgba(255,238,200,0.16)'); r.addColorStop(1, 'rgba(255,238,200,0)');
      x.fillStyle = r; x.fillRect(0, 0, 64, 64); }

    function fit() {
      const r = layer.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
      if (w === layer.width && h === layer.height) return;
      layer.width = w; layer.height = h;
      soften();
      loop?.invalidate();
    }

    function soften() {
      if (!bright) return;
      const s = layer.width / W;
      bloom = createCanvasBloom(bright, layer.width, layer.height, [s * 2, s * 8]);
    }

    // Bright parts of the picture become the bloom; small points brighter than their surroundings are stars.
    function study(im) {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, W, H).data, lum = (i) => (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      const pass = x.createImageData(W, H);
      for (let i = 0; i < d.length; i += 4) { const k = Math.max(0, (lum(i) - 0.58) / 0.42); pass.data[i] = d[i]; pass.data[i + 1] = d[i + 1]; pass.data[i + 2] = d[i + 2]; pass.data[i + 3] = 255 * k; }
      const bp = document.createElement('canvas'); bp.width = W; bp.height = H; bp.getContext('2d').putImageData(pass, 0, 0);
      bright = bp; soften();
      stars = [];
      for (let y = 2; y < H - 2; y++) for (let xx = 2; xx < W - 2; xx++) {
        const l = lum(4 * (y * W + xx));
        if (l < 0.68) continue;
        const around = [[-2, 0], [2, 0], [0, -2], [0, 2]].reduce((a, [dx, dy]) => a + lum(4 * ((y + dy) * W + xx + dx)), 0) / 4;
        if (l - around < 0.22 || stars.some((t) => Math.abs(t.x - xx) < 3 && Math.abs(t.y - y) < 3)) continue;
        stars.push({ x: xx, y, size: l, phase: R() * 6.28, speed: 0.7 + R() * 1.8 });
        if (stars.length >= 140) break;
      }
      motes = Array.from({ length: 28 }, () => ({ x: R() * W, y: R() * H, vy: 1.2 + R() * 3, sway: 2 + R() * 5, phase: R() * 6.28, a: 0.15 + R() * 0.35 }));
    }

    function draw(now) {
      const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
      fade += (target - fade) * Math.min(1, dt * 2.5);
      g.clearRect(0, 0, layer.width, layer.height);
      if (!bloom || fade < 0.01) return;
      const s = layer.width / W, t = now / 1000;
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = fade * (0.5 + 0.12 * Math.sin(t * 0.6));
      g.drawImage(bloom, 0, 0);
      for (const st of stars) {
        const tw = (0.5 + 0.5 * Math.sin(t * st.speed + st.phase)) ** 2, r = (2.5 + 5 * st.size * tw) * s, cx = (st.x + 0.5) * s, cy = (st.y + 0.5) * s;
        g.globalAlpha = fade * (0.2 + 0.8 * tw);
        g.drawImage(sprite, cx - r, cy - r, 2 * r, 2 * r);
        if (tw > 0.7) { g.globalAlpha = fade * (tw - 0.7) * 2; g.drawImage(sprite, cx - r * 3, cy - r * 0.2, r * 6, r * 0.4); g.drawImage(sprite, cx - r * 0.2, cy - r * 3, r * 0.4, r * 6); }
      }
      for (const m of motes) {
        m.y -= m.vy * dt; if (m.y < -4) { m.y = H + 4; m.x = R() * W; }
        const x = (m.x + Math.sin(t * 0.5 + m.phase) * m.sway) * s, y = m.y * s, r = 1.6 * s;
        g.globalAlpha = fade * m.a * (0.6 + 0.4 * Math.sin(t + m.phase));
        g.drawImage(sprite, x - r, y - r, 2 * r, 2 * r);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }

    let loop;
    fit();
    loop = createRenderLoop(draw, { element: layer, continuous: !reduceMotion });
    let resizing = 0;
    addEventListener('resize', () => { clearTimeout(resizing); resizing = setTimeout(fit, 150); });
    return {
      set(im) { study(im); target = 1; if (reduceMotion) fade = 1; loop.invalidate(); },
      hide() { target = 0; if (reduceMotion) fade = 0; loop.invalidate(); },
    };
  })();

  // ---- the map: the chart laid out in layers, one per step from the start, with forks side by side
  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs, parent) => { const n = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); parent?.appendChild(n); return n; };

  function storyOrder() {
    const onStack = new Set(), seen = new Set(), back = new Set();
    const visit = (id) => { seen.add(id); onStack.add(id); for (const s of stepsFrom(id)) { if (onStack.has(s.to)) back.add(s); else if (!seen.has(s.to)) visit(s.to); } onStack.delete(id); };
    visit(story.initial);
    const depth = { [story.initial]: 0 };
    for (let changed = true; changed;) {
      changed = false;
      for (const s of story.steps) if (!back.has(s) && depth[s.from] !== undefined && (depth[s.to] ?? -1) < depth[s.from] + 1) { depth[s.to] = depth[s.from] + 1; changed = true; }
    }
    // Each layer holds the states at one depth; within a layer, order by where their parents sit, so arrows cross less.
    const layers = [];
    for (const s of story.states) (layers[depth[s.id] ?? 0] ||= []).push(s.id);
    const slot = {};
    layers.forEach((layer, L) => {
      if (L) {
        const parentSlot = (id) => { const ps = story.steps.filter((t) => t.to === id && slot[t.from] !== undefined).map((t) => slot[t.from]); return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0; };
        layer.sort((a, b) => parentSlot(a) - parentSlot(b));
      }
      layer.forEach((id, k) => { slot[id] = k - (layer.length - 1) / 2; });
    });
    return { layers, depth, slot };
  }

  // Across the page on a wide screen, down the page on a phone.
  const tall = matchMedia('(max-width: 520px)').matches;
  const svg = $('map'), { layers, depth, slot } = storyOrder(), pos = {}, NW = 66, NH = 44;
  const STEP = tall ? 92 : 108, SPREAD = tall ? 150 : 82, widest = Math.max(...layers.map((l) => l.length));
  const VW = tall ? Math.max(360, widest * SPREAD + 40) : layers.length * STEP + 20, VH = tall ? layers.length * STEP + 10 : widest * SPREAD + 30;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  for (const [id, k] of Object.entries(slot)) {
    const along = 10 + STEP / 2 + depth[id] * STEP - (tall ? 10 : 0), across = (tall ? VW : VH - 14) / 2 + k * SPREAD;
    pos[id] = tall ? { x: across, y: along } : { x: along, y: across };
  }
  const center = { x: VW / 2, y: VH / 2 };
  const edgeLayer = el('g', {}, svg), nodeLayer = el('g', {}, svg), edges = [], nodes = {};
  const clip = (from, to) => { const dx = to.x - from.x, dy = to.y - from.y, t = Math.min((NW / 2 + 4) / Math.abs(dx || 1e-9), (NH / 2 + 4) / Math.abs(dy || 1e-9)); return { x: from.x + dx * t, y: from.y + dy * t }; };
  for (const s of story.steps) {
    const a = pos[s.from], b = pos[s.to];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, out = { x: mid.x - center.x, y: mid.y - center.y }, len = Math.hypot(out.x, out.y) || 1;
    const bend = Math.abs(depth[s.to] - depth[s.from]) > 1 ? 66 : 0, c = { x: mid.x + (out.x / len) * bend, y: mid.y + (out.y / len) * bend };
    const p0 = clip(a, c), p1 = clip(b, c);
    const path = el('path', { class: 'edge', d: `M${p0.x},${p0.y} Q${c.x},${c.y} ${p1.x},${p1.y}` }, edgeLayer);
    const ang = Math.atan2(p1.y - c.y, p1.x - c.x), k = 8;
    const arrow = el('polygon', { class: 'arrow', points: [[p1.x, p1.y], [p1.x - k * Math.cos(ang - 0.45), p1.y - k * Math.sin(ang - 0.45)], [p1.x - k * Math.cos(ang + 0.45), p1.y - k * Math.sin(ang + 0.45)]].map((p) => p.join(',')).join(' ') }, edgeLayer);
    el('title', {}, path).textContent = s.label;
    edges.push({ step: s, path, arrow });
  }
  for (const s of story.states) {
    const { x, y } = pos[s.id];
    const g = el('g', { class: `node ${s.group || ''}`, tabindex: '-1' }, nodeLayer);
    el('image', { href: s.image, x: x - NW / 2, y: y - NH / 2, width: NW, height: NH }, g);
    el('rect', { x: x - NW / 2, y: y - NH / 2, width: NW, height: NH }, g);
    el('text', { x, y: y + NH / 2 + 14 }, g).textContent = s.label;
    g.addEventListener('click', () => { const step = stepsFrom(current).find((t) => t.to === s.id); if (step) go(step.to); });
    nodes[s.id] = g;
  }

  // ---- the page
  let current = null;
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  async function go(id, { push = true } = {}) {
    if (!byId[id] || id === current) return;
    current = id;
    const s = byId[id];
    if (push) history.replaceState(null, '', `#${encodeURIComponent(s.label.toLowerCase().replace(/\s+/g, '-'))}`);
    $('state-label').textContent = s.label;
    $('state-text').textContent = s.text;
    canvas.setAttribute('aria-label', s.alt);
    const button = (n, label, onClick) => {
      const b = document.createElement('button');
      b.type = 'button';
      const key = document.createElement('span');
      key.className = 'key'; key.textContent = String(n);
      b.append(key, label);
      b.addEventListener('click', onClick);
      return b;
    };
    const out = stepsFrom(id);
    $('choices').replaceChildren(...(out.length
      ? out.map((step, i) => button(i + 1, cap(step.label), () => go(step.to)))
      : [button(1, 'The end. Read it again?', () => go(story.initial))]));
    const next = new Set(stepsFrom(id).map((t) => t.to));
    for (const [sid, g] of Object.entries(nodes)) {
      g.classList.toggle('here', sid === id); g.classList.toggle('next', next.has(sid));
      g.setAttribute('tabindex', next.has(sid) ? '0' : '-1');
    }
    for (const e of edges) { const on = e.step.from === id; e.path.classList.toggle('next', on); e.arrow.classList.toggle('next', on); }
    await show(await load(s.image));
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    const n = parseInt(e.key, 10), steps = stepsFrom(current);
    if (n >= 1 && n <= steps.length) go(steps[n - 1].to);
    else if (n === 1 && !steps.length) go(story.initial);
    else if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('#map .node.next')) { e.preventDefault(); e.target.closest('#map .node').dispatchEvent(new Event('click')); }
  });
  $('restart').addEventListener('click', () => go(story.initial));

  $('title').textContent = story.title;
  document.title = story.title;
  $('tagline').textContent = story.tagline;
  $('checked').textContent = `TLC, a model checker, tried every path through the story: ${story.checked.states} states and ${story.checked.steps} steps. These rules hold on all of them.`;
  $('rules').replaceChildren(...story.rules.map((r) => { const li = document.createElement('li'); li.textContent = r.text; return li; }));

  const fromHash = () => {
    const slug = decodeURIComponent(location.hash.slice(1));
    return story.states.find((s) => s.label.toLowerCase().replace(/\s+/g, '-') === slug);
  };
  addEventListener('hashchange', () => { const s = fromHash(); if (s) go(s.id, { push: false }); });
  go(fromHash()?.id ?? story.initial);
})();
