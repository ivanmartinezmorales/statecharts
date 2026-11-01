import { all } from './models';
import { done, foldedAt } from './progress';
import { nextUp, preview } from './picker';
import { esc } from './icons';

const when = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

/** Everything you've folded, newest first, as finished paper. Returns a function that stops its animations. */
export function drawer(app: HTMLElement): () => void {
  const folded = all
    .filter((m) => done.has(m.slug))
    .sort((a, b) => (foldedAt[b.slug] ?? 0) - (foldedAt[a.slug] ?? 0));
  const models = folded.filter((m) => m.topic !== 'technique');
  const lessons = folded.length - models.length;
  const next = nextUp();
  const total = all.filter((m) => m.topic !== 'technique').length;

  const summary = folded.length
    ? `${models.length} of ${total} models${lessons ? `, plus ${lessons} ${lessons === 1 ? 'lesson' : 'lessons'}` : ''}.`
    : '';

  app.innerHTML = `
    <div class="drawer">
      <header class="picker-head">
        <h1>Your paper drawer</h1>
        <p>${folded.length ? `Everything you’ve folded, newest first. ${summary}` : 'Each model you finish is kept here, folded.'}</p>
      </header>
      ${
        folded.length
          ? `<div class="grid">${folded
              .map((m) => {
                const at = foldedAt[m.slug];
                return `<a class="tile folded" href="#/fold/${m.slug}" data-slug="${m.slug}" style="--paper:${m.color}">
                    <canvas aria-hidden="true"></canvas>
                    <span class="tile-label">
                      <span class="tile-name">${esc(m.name)}</span>
                      <span class="tile-meta">${at ? `Folded ${when.format(at)}` : 'Folded'}</span>
                    </span>
                  </a>`;
              })
              .join('')}</div>
            <p class="drawer-next">Next to fold: <a href="#/fold/${next.slug}">${esc(next.name)}</a></p>`
          : `<div class="empty">
              <div class="empty-art" aria-hidden="true"></div>
              <p class="empty-title">Nothing folded yet</p>
              <p>Finish any model and it lands here. The first lesson takes under a minute.</p>
              <a class="button primary" href="#/fold/${next.slug}">Fold the ${esc(next.name.toLowerCase())}</a>
            </div>`
      }
    </div>`;

  const previews = [...app.querySelectorAll<HTMLElement>('[data-slug]')].map((el) => {
    const p = preview(el.querySelector('canvas')!, all.find((m) => m.slug === el.dataset.slug)!);
    el.addEventListener('pointerenter', () => p.play(true));
    el.addEventListener('pointerleave', () => p.play(false));
    el.addEventListener('focus', () => p.play(true));
    el.addEventListener('blur', () => p.play(false));
    return p;
  });
  return () => previews.forEach((p) => p.play(false));
}
