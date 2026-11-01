/** One frame at a time. Hidden and offscreen surfaces sleep until they are visible. */
export function createRenderLoop(draw, { element, continuous = true, fps = 60, onError = console.error } = {}) {
  let raf = 0, busy = false, disposed = false, active = true;
  let visible = !element, dirty = true, again = false, last = -Infinity, previous = 0;
  const interval = 1000 / fps;
  const runnable = () => active && visible && !document.hidden && !disposed;
  const schedule = () => {
    if (runnable() && !busy && !raf && (dirty || again || continuous)) raf = requestAnimationFrame(tick);
  };
  const settle = (more) => {
    busy = false; again = more === true;
    if (!dirty && !again && !continuous) previous = 0;
    schedule();
  };
  const fail = (error) => { destroy(); onError(error); };
  function tick(now) {
    raf = 0;
    if (!runnable()) return;
    if (now - last < interval - 0.5) { schedule(); return; }
    const dt = previous ? Math.min(50, now - previous) : 0;
    previous = last = now;
    dirty = again = false;
    busy = true;
    try {
      const result = draw(now, dt);
      if (result && typeof result.then === 'function') result.then(settle, fail);
      else settle(result);
    } catch (error) { fail(error); }
  }
  function wake() {
    cancelAnimationFrame(raf); raf = 0;
    previous = 0; last = -Infinity; dirty = true;
    schedule();
  }
  function destroy() {
    disposed = true;
    cancelAnimationFrame(raf); raf = 0;
    observer?.disconnect();
    document.removeEventListener('visibilitychange', wake);
  }
  const observer = element && typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); }) : undefined;
  if (observer) observer.observe(element);
  else visible = true;
  document.addEventListener('visibilitychange', wake);
  schedule();
  return {
    invalidate() { dirty = true; schedule(); },
    setContinuous(value) { continuous = value; schedule(); },
    pause() { active = false; wake(); },
    resume() { active = true; wake(); },
    destroy,
  };
}
