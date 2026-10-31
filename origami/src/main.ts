import './style.css';
import { all, levels } from './models';
import { picker, type Filter } from './picker';
import { workspace } from './workspace';
import { done } from './progress';
import { ready } from './engine';

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
  bar.innerHTML = `
    <div class="bar-row">
      <a class="brand" href="#/"><span class="mark" aria-hidden="true">折</span>Origami</a>
      <ol class="path" aria-label="Learning path">
        ${stations
          .map((s, k) => {
            const state = s.total === 0 ? 'locked' : s.folded === s.total ? 'complete' : k === here ? 'current' : 'upcoming';
            const progress = s.total ? `${s.folded}/${s.total}` : 'Soon';
            return `<li class="station ${state}" ${k === here ? 'aria-current="step"' : ''}>
              <a href="#/level/${s.level}"><span class="node" aria-hidden="true"></span><span class="station-name">${s.title}</span><span class="station-count">${progress}</span></a>
            </li>`;
          })
          .join('')}
      </ol>
    </div>`;
}

let teardown: (() => void) | null = null;

function route() {
  teardown?.();
  const [, page, arg] = location.hash.split('/');
  const model = page === 'fold' ? all.find((m) => m.slug === arg) : undefined;
  if (model) {
    teardown = workspace(app, model);
  } else {
    const filter = (levels.some((l) => l.level === arg) && page === 'level' ? arg : 'all') as Filter;
    teardown = picker(app, filter);
  }
  document.title = model ? `${model.name} · Origami` : 'Origami: learn to fold, step by step';
  renderBar();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
window.addEventListener('progress', renderBar);
void ready.then(route);
