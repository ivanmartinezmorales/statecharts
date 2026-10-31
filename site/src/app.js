'use strict';
// The story player: shows the picture for the current state, the steps out of it, and a map of the whole chart.
// A new picture arrives in blocks, then sharpens from big pixels to small ones. Hovering the picture pixelates it
// under the pointer.
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
  let shown = null, animating = false, lens = null, anim = 0;

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

  function drawLens() {
    if (!shown || animating || !lens) return;
    drawWhole(shown);
    const p = pixelated(shown, 6);
    ctx.save(); ctx.beginPath(); ctx.arc(lens.x, lens.y, 26, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(p.canvas, 0, 0, p.w, p.h, 0, 0, p.w * 6, p.h * 6);
    ctx.restore();
  }

  function show(img) {
    const run = ++anim;
    if (reduceMotion || !shown) {
      if (!shown && !reduceMotion) return reveal(img, run);
      shown = img; drawWhole(img); return Promise.resolve();
    }
    return reveal(img, run);
  }

  function reveal(img, run) {
    animating = true;
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
        if (run !== anim) return done();
        const t = now - t0;
        if (t < REVEAL) {
          const want = Math.floor((1 - (1 - t / REVEAL) ** 2) * blocks.length);
          for (; drawn < want; drawn++) { const [x, y] = blocks[drawn]; ctx.drawImage(coarse, x, y, BLOCK, BLOCK, x, y, BLOCK, BLOCK); }
          return requestAnimationFrame(frame);
        }
        const u = Math.min(1, (t - REVEAL) / SHARPEN), block = Math.max(1, Math.round(BLOCK - (1 - (1 - u) ** 2) * (BLOCK - 1)));
        drawWhole(img, block);
        if (u < 1) return requestAnimationFrame(frame);
        shown = img; animating = false; drawLens(); done();
      };
      requestAnimationFrame(frame);
    });
  }

  const at = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
  canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && !reduceMotion) { lens = at(e); drawLens(); } });
  canvas.addEventListener('pointerleave', () => { lens = null; if (shown && !animating) drawWhole(shown); });

  // ---- the map: states on a ring in story order, steps as arrows
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
    return story.states.map((s) => s.id).sort((a, b) => (depth[a] ?? 99) - (depth[b] ?? 99));
  }

  // A winding path: rows of four (two on a phone), each row running back the other way, like a board game.
  const COLS = matchMedia('(max-width: 520px)').matches ? 2 : 4;
  const svg = $('map'), order = storyOrder(), pos = {}, NW = 66, NH = 44, ROW = 104;
  const rows = Math.ceil(order.length / COLS), VW = 420, VH = rows * ROW + 16;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  order.forEach((id, i) => {
    const row = Math.floor(i / COLS), col = row % 2 ? COLS - 1 - (i % COLS) : i % COLS;
    const margin = Math.max(54, VW / (COLS * 2));
    pos[id] = { x: margin + col * ((VW - 2 * margin) / (COLS - 1)), y: 40 + row * ROW };
  });
  const center = { x: VW / 2, y: VH / 2 }, rank = Object.fromEntries(order.map((id, i) => [id, i]));
  const edgeLayer = el('g', {}, svg), nodeLayer = el('g', {}, svg), edges = [], nodes = {};
  const clip = (from, to) => { const dx = to.x - from.x, dy = to.y - from.y, t = Math.min((NW / 2 + 4) / Math.abs(dx || 1e-9), (NH / 2 + 4) / Math.abs(dy || 1e-9)); return { x: from.x + dx * t, y: from.y + dy * t }; };
  for (const s of story.steps) {
    const a = pos[s.from], b = pos[s.to];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, out = { x: mid.x - center.x, y: mid.y - center.y }, len = Math.hypot(out.x, out.y) || 1;
    const bend = Math.abs(rank[s.to] - rank[s.from]) > 1 ? 66 : 0, c = { x: mid.x + (out.x / len) * bend, y: mid.y + (out.y / len) * bend };
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
