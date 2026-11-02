import './style.css';
import { inject } from '@vercel/analytics';
import { all, levels } from './models';
import { picker, topics, type Filter } from './picker';
import { workspace } from './workspace';
import { drawer } from './drawer';
import { done } from './progress';
import { ready } from '../../rendering/origami/browser';

// Initialize Vercel Web Analytics
inject();

const app = document.querySelector<HTMLElement>('#app')!;
const bar = document.querySelector<HTMLElement>('#bar')!;

/** The learning path: one station per level, the first unfinished one is where you are. */
function renderBar() {
  const stations = levels.map((l) => {
    const models = all.filter((m) => m.level === l.level);
    const folded = models.filter((m) => done.has(m.slug)).length;
    return { ...l, folded, total: models.length };
  });
  const here = stations.findIndex((s) => s.total > 0 && s.folded < s.total);
  // Built once; later calls patch the same nodes so a finished level can transition instead of popping.
  if (!bar.firstElementChild) {
    bar.innerHTML = `
    <div class="bar-row">
      <a class="brand" href="#/"><span class="mark" aria-hidden="true">折</span>Foldable Art</a>
      <ol class="path" aria-label="Learning path">
        ${stations
          .map(
            (s) => `<li class="station">
              <a href="#/level/${s.level}"><span class="node" aria-hidden="true"></span><span class="station-name">${s.title}</span><span class="station-count"></span></a>
            </li>`,
          )
          .join('')}
      </ol>
      <a class="drawer-link" href="#/drawer">
        <span class="drawer-icon" aria-hidden="true"></span><span class="drawer-name">My folds</span><span class="drawer-count" aria-hidden="true"></span>
      </a>
    </div>`;
  }
  bar.querySelectorAll<HTMLElement>('.station').forEach((li, k) => {
    const s = stations[k]!;
    li.className = `station ${s.total === 0 ? 'locked' : s.folded === s.total ? 'complete' : k === here ? 'current' : 'upcoming'}`;
    if (k === here) li.setAttribute('aria-current', 'step');
    else li.removeAttribute('aria-current');
    li.querySelector('.station-count')!.textContent = s.total ? `${s.folded}/${s.total}` : 'Soon';
  });
  const drawerLink = bar.querySelector<HTMLElement>('.drawer-link')!;
  drawerLink.setAttribute('aria-label', `Your paper drawer, ${done.size} folded`);
  if (location.hash === '#/drawer') drawerLink.setAttribute('aria-current', 'page');
  else drawerLink.removeAttribute('aria-current');
  bar.querySelector('.drawer-count')!.textContent = String(done.size);
}

let teardown: (() => void) | null = null;

function render() {
  teardown?.();
  const [, page, arg, step] = location.hash.split('/');
  const model = page === 'fold' ? all.find((m) => m.slug === arg) : undefined;
  if (model) {
    teardown = workspace(app, model, Number(step) - 1 || 0);
  } else if (page === 'drawer') {
    teardown = drawer(app);
  } else {
    const level = page === 'level' ? levels.find((l) => l.level === arg)?.level : undefined;
    const topic = page === 'topic' ? topics.find((t) => t.topic === arg)?.topic : undefined;
    const filter: Filter = level ? { by: 'level', level } : topic ? { by: 'topic', topic } : { by: 'all' };
    teardown = picker(app, filter);
  }
  document.title = model ? `${model.name} · Foldable Art` : page === 'drawer' ? 'My folds · Foldable Art' : 'Foldable Art: learn origami, one fold at a time';
  renderBar();
  window.scrollTo(0, 0);
}

/** Swap pages with a short crossfade where the browser can, and with a plain cut where it cannot or the visitor asked for less motion. */
function route() {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || calm || document.visibilityState !== 'visible' || !app.firstElementChild) return render();
  const swap = document.startViewTransition(render);
  // A newer navigation skips the one in flight; that is expected, not an error.
  const skipped = (error: unknown) => {
    if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
  };
  swap.ready.catch(skipped);
  swap.finished.catch(skipped);
}

window.addEventListener('hashchange', route);
window.addEventListener('progress', renderBar);
void ready.then(route);
