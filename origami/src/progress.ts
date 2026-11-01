const KEY = 'origami:done';
/** When each model was first finished, kept apart from KEY so older saves still read. */
const WHEN = 'origami:when';

function read<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? 'null') as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode: progress just isn't remembered */
  }
}

export const done = new Set<string>(read<string[]>(KEY, []));

/** Epoch milliseconds a model was first finished. Missing for models folded before this was kept. */
export const foldedAt: Record<string, number> = read<Record<string, number>>(WHEN, {});

/** Remembers a finished model and tells the page so the learning path can update. True the first time. */
export function markDone(slug: string): boolean {
  if (done.has(slug)) return false;
  done.add(slug);
  foldedAt[slug] = Date.now();
  write(KEY, [...done]);
  write(WHEN, foldedAt);
  window.dispatchEvent(new Event('progress'));
  return true;
}

const SEEN = 'origami:welcomed';

/** Whether the first-visit welcome has been dismissed. */
export const welcomed = () => read<boolean>(SEEN, false);

export function dismissWelcome() {
  write(SEEN, true);
}
