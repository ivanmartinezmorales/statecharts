import './style.css';
import { all, levels } from './models';
import { picker, topics, type Filter } from './picker';
import { workspace } from './workspace';
import { drawer } from './drawer';
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
      <a class="drawer-link" href="#/drawer" ${location.hash === '#/drawer' ? 'aria-current="page"' : ''} aria-label="Your paper drawer, ${done.size} folded">
        <span class="drawer-icon" aria-hidden="true"></span><span class="drawer-name">Drawer</span><span class="drawer-count" aria-hidden="true">${done.size}</span>
      </a>
    </div>`;
}

let teardown: (() => void) | null = null;

function route() {
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
  document.title = model ? `${model.name} · Origami` : page === 'drawer' ? 'Your paper drawer · Origami' : 'Origami: learn to fold, step by step';
  renderBar();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
window.addEventListener('progress', renderBar);
void ready.then(route);
