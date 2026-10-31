const KEY = 'origami:done';

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export const done = new Set<string>(read());

/** Remembers a finished model and tells the page so the learning path can update. */
export function markDone(slug: string) {
  if (done.has(slug)) return;
  done.add(slug);
  try {
    localStorage.setItem(KEY, JSON.stringify([...done]));
  } catch {
    /* private mode: progress just isn't remembered */
  }
  window.dispatchEvent(new Event('progress'));
}
