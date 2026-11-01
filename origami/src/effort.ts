import type { Step } from './diagram';
import type { Model } from './models';

/** Rough minutes a first-timer spends on one step of each kind, with real paper in hand. */
const minutes: Record<Step['kind'], number> = {
  valley: 0.5,
  mountain: 0.6,
  crease: 0.5,
  flip: 0.1,
  rotate: 0.1,
  squash: 1.5,
  reverse: 1.5,
  petal: 2.5,
  collapse: 2.5,
};

/** Steps that take a new folder more than one try. */
const tricky = new Set<Step['kind']>(['squash', 'reverse', 'petal', 'collapse']);

export interface Effort {
  /** Rounded estimate, at least one minute. */
  readonly minutes: number;
  /** 1 easy, 2 takes care, 3 a challenge. */
  readonly difficulty: 1 | 2 | 3;
}

export function effort(m: Model): Effort {
  const total = m.steps.reduce((sum, s) => sum + minutes[s.kind], 0);
  const hard = m.steps.filter((s) => tricky.has(s.kind)).length;
  const difficulty = hard >= 3 || m.steps.length >= 14 ? 3 : hard >= 1 || m.steps.length >= 8 ? 2 : 1;
  return { minutes: Math.max(1, Math.round(total)), difficulty };
}

export const difficultyName = ['', 'Easy', 'Takes care', 'A challenge'] as const;

/** "4 min" */
export const time = (e: Effort) => `${e.minutes} min`;

/** Three small diamonds, filled up to the difficulty. */
export const pips = (e: Effort) =>
  `<span class="pips" role="img" aria-label="${difficultyName[e.difficulty]}" title="${difficultyName[e.difficulty]}">${[1, 2, 3]
    .map((k) => `<span class="pip${k <= e.difficulty ? ' on' : ''}"></span>`)
    .join('')}</span>`;
