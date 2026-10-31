// lucide paths, drawn at one size and stroke
const icon = (d: string) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

export const icons = {
  check: icon('<path d="M20 6 9 17l-5-5"/>'),
  left: icon('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>'),
  right: icon('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
  orbit: icon('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
  top: icon('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16"/>'),
};

export const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => `&${({ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' } as const)[c as '&']};`);
