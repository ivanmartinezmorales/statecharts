// Animal faces, flowers and a butterfly. Most start from a diamond: a square with a corner at the top.

import { v, type Line, type Step, type Vec2 } from './diagram';
import type { Model } from './models';

const diamond = [v(50, 0), v(100, 50), v(50, 100), v(0, 50)];
const square = [v(0, 0), v(100, 0), v(100, 100), v(0, 100)];
const mirror = (p: Vec2) => v(100 - p.x, p.y);

export const pointUp: Step = {
  kind: 'valley',
  line: [v(0, 50), v(100, 50)],
  move: v(50, 100),
  text: 'Start white side up with a corner pointing at you. Fold the bottom corner up to the top corner.',
};

/**
 * Folds the triangle's two bottom corners up into ears whose points land at `tip` and its mirror.
 * The crease runs from the middle of the bottom edge, halfway between the corner and where it lands.
 */
export function ears(tip: Vec2, text: string, mirrorText: string): Step[] {
  const pivot = v(50, 50);
  const unit = (p: Vec2) => {
    const len = Math.hypot(p.x - pivot.x, p.y - pivot.y);
    return v((p.x - pivot.x) / len, (p.y - pivot.y) / len);
  };
  const a = unit(v(0, 50));
  const b = unit(tip);
  const along = v(pivot.x + (a.x + b.x) * 20, pivot.y + (a.y + b.y) * 20);
  const left: Line = [pivot, along];
  const right: Line = [pivot, mirror(along)];
  return [
    { id: 'leftEar', kind: 'valley', line: left, move: v(0, 50), text },
    { id: 'rightEar', kind: 'valley', line: right, move: v(100, 50), text: mirrorText },
  ];
}

/** Folds the top of the head down, leaving the ears standing. */
export const forehead = (y: number, text: string): Step => ({
  kind: 'valley',
  line: [v(0, y), v(100, y)],
  move: v(50, 0),
  only: { notMovedIn: ['leftEar', 'rightEar'] },
  text,
});

const waterbombCollapse: Step[] = [
  {
    kind: 'crease',
    line: [v(0, 0), v(100, 100)],
    move: v(100, 0),
    text: 'Start colored side up. Fold in half corner to corner, then unfold.',
  },
  {
    kind: 'crease',
    line: [v(100, 0), v(0, 100)],
    move: v(0, 0),
    text: 'Fold in half along the other diagonal, then unfold.',
  },
  {
    kind: 'crease',
    line: [v(0, 50), v(100, 50)],
    move: v(50, 0),
    text: 'Turn it over in your mind: fold the top edge down to the bottom edge, then unfold. This crease folds the other way.',
  },
  {
    kind: 'collapse',
    parts: [
      { line: [v(50, 50), v(0, 100)], side: v(0, 70), only: { within: [v(0, 50), v(50, 50), v(0, 100)] } },
      {
        line: [v(0, 50), v(50, 50)],
        side: v(0, 20),
        only: { within: [v(0, 0), v(50, 50), v(0, 50)] },
        over: [[v(0, 50), v(50, 50)], [v(50, 50), v(0, 100)]],
      },
      { line: [v(50, 50), v(100, 100)], side: v(100, 70), only: { within: [v(100, 50), v(50, 50), v(100, 100)] } },
      {
        line: [v(100, 50), v(50, 50)],
        side: v(100, 20),
        only: { within: [v(100, 0), v(50, 50), v(100, 50)] },
        over: [[v(100, 50), v(50, 50)], [v(50, 50), v(100, 100)]],
      },
      { line: [v(0, 50), v(100, 50)], side: v(50, 0), only: { within: [v(0, 0), v(100, 0), v(50, 50)] } },
    ],
    text: 'Push the left and right sides in along the middle crease and bring the top edge down. It collapses into a triangle: the waterbomb base.',
  },
];

/** The kite base folded from the bottom corner, twice, for a long thin stem. */
const stemFolds: Step[] = [
  {
    kind: 'crease',
    line: [v(50, 0), v(50, 100)],
    move: v(100, 50),
    text: 'Start white side up with a corner pointing at you. Fold in half from side to side, then unfold.',
  },
  {
    kind: 'valley',
    line: [v(50, 100), v(20.71, 29.29)],
    move: v(0, 50),
    text: 'Fold the lower left edge to the center crease.',
  },
  {
    kind: 'valley',
    line: [v(50, 100), v(79.29, 29.29)],
    move: v(100, 50),
    text: 'Fold the lower right edge to the center crease.',
  },
  {
    kind: 'valley',
    line: [v(50, 100), v(34.39, 21.54)],
    move: v(20.71, 29.29),
    text: 'Fold the new left edge to the center again. The bottom gets long and thin.',
  },
  {
    kind: 'valley',
    line: [v(50, 100), v(65.61, 21.54)],
    move: v(79.29, 29.29),
    text: 'Same on the right.',
  },
];

export const menagerie: Model[] = [
  {
    slug: 'fox',
    name: 'Fox face',
    level: 'beginner',
    topic: 'animal',
    about: 'Pointy ears, flat forehead',
    color: '#e98b3a',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointUp,
      ...ears(v(20, 10), 'Fold the left corner up at an angle so its point sticks out past the top edge. This is an ear.', 'Fold the right corner up the same way for the second ear.'),
      forehead(22, 'Fold the top point down to flatten the forehead.'),
    ],
    finish: 'Draw on eyes and a nose.',
    dots: [
      { x: 41, y: 31, r: 2.2 },
      { x: 59, y: 31, r: 2.2 },
      { x: 50, y: 41, r: 1.6 },
    ],
  },
  {
    slug: 'cat',
    name: 'Cat face',
    level: 'beginner',
    topic: 'animal',
    about: 'Tall ears and whiskers',
    color: '#5f636b',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointUp,
      ...ears(v(38, 1.5), 'Fold the left corner almost straight up so it stands tall above the head.', 'Fold the right corner up the same way.'),
      forehead(26, 'Fold the top point down between the ears.'),
    ],
    finish: 'Add eyes, a nose and whiskers.',
    dots: [
      { x: 42, y: 34, r: 2 },
      { x: 58, y: 34, r: 2 },
      { x: 50, y: 42, r: 1.5 },
    ],
  },
  {
    slug: 'mouse',
    name: 'Mouse face',
    level: 'beginner',
    topic: 'animal',
    about: 'Round ears, pointy nose',
    color: '#8a8f99',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointUp,
      ...ears(v(12, 22), 'Fold the left corner up and out for a wide ear.', 'Fold the right corner the same way.'),
      { kind: 'mountain', line: [v(8, 30), v(22, 16)], move: v(12, 22), text: 'Fold the tip of the left ear behind to round it.' },
      { kind: 'mountain', line: [v(92, 30), v(78, 16)], move: v(88, 22), text: 'Round off the right ear too.' },
      forehead(20, 'Fold the top point down.'),
    ],
    finish: 'The bottom point is the nose. Draw two eyes and whiskers.',
    dots: [
      { x: 41, y: 30, r: 2 },
      { x: 59, y: 30, r: 2 },
      { x: 50, y: 48, r: 1.8 },
    ],
  },
  {
    slug: 'bear',
    name: 'Bear face',
    level: 'beginner',
    topic: 'animal',
    about: 'Small ears, square jaw',
    color: '#8a5a33',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointUp,
      ...ears(v(22, 12), 'Fold the left corner up and out. This is a small ear.', 'Fold the right corner the same way.'),
      { kind: 'mountain', line: [v(16, 20), v(30, 12)], move: v(22, 12), text: 'Fold the tip of the left ear behind to round it.' },
      { kind: 'mountain', line: [v(84, 20), v(70, 12)], move: v(78, 12), text: 'Round off the right ear.' },
      forehead(24, 'Fold the top point down.'),
      { kind: 'mountain', line: [v(30, 44), v(70, 44)], move: v(50, 50), text: 'Fold the bottom point behind to square off the jaw.' },
    ],
    finish: 'Draw two eyes and a big nose.',
    dots: [
      { x: 40, y: 32, r: 2 },
      { x: 60, y: 32, r: 2 },
      { x: 50, y: 39, r: 2.6 },
    ],
  },
  {
    slug: 'lotus',
    name: 'Lotus',
    level: 'intermediate',
    topic: 'flower',
    about: 'Waterbomb base, petals out',
    color: '#7b3f8c',
    paper: square,
    whiteUp: false,
    steps: [
      ...waterbombCollapse,
      {
        kind: 'valley',
        line: [v(25, 75), v(50, 100)],
        move: v(0, 100),
        only: { within: [v(0, 0), v(100, 0), v(50, 50)] },
        text: 'Fold the left corner of the front layer up to the top point.',
      },
      {
        kind: 'valley',
        line: [v(75, 75), v(50, 100)],
        move: v(100, 100),
        only: { within: [v(0, 0), v(100, 0), v(50, 50)] },
        text: 'Fold the right corner of the front layer up to the top point.',
      },
      {
        kind: 'valley',
        line: [v(31, 56), v(37, 75)],
        move: v(50, 50),
        only: { within: [v(0, 0), v(25, 25), v(50, 0)] },
        text: 'Fold the point of the left flap up and out to the side. This is a petal.',
      },
      {
        kind: 'valley',
        line: [v(69, 56), v(63, 75)],
        move: v(50, 50),
        only: { within: [v(100, 0), v(75, 25), v(50, 0)] },
        text: 'Fold the right flap out the same way.',
      },
    ],
    finish: 'Curl the petals outward with a pencil so the flower opens.',
  },
  {
    slug: 'koala',
    name: 'Koala face',
    level: 'beginner',
    topic: 'animal',
    about: 'Big round ears',
    color: '#7d8a99',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointUp,
      ...ears(v(12, 18), 'Fold the left corner up and out to the side. This is a big ear.', 'Fold the right corner the same way.'),
      { kind: 'mountain', line: [v(6, 25), v(19, 12)], move: v(12, 18), text: 'Fold the tip of the left ear behind to round it.' },
      { kind: 'mountain', line: [v(94, 25), v(81, 12)], move: v(88, 18), text: 'Round off the right ear.' },
      forehead(22, 'Fold the top point down.'),
    ],
    finish: 'Draw a big dark nose in the middle and two small eyes.',
    dots: [
      { x: 42, y: 30, r: 1.8 },
      { x: 58, y: 30, r: 1.8 },
      { x: 50, y: 38, r: 3.4 },
    ],
  },
  {
    slug: 'pig',
    name: 'Pig face',
    level: 'beginner',
    topic: 'animal',
    about: 'Floppy ears and a snout',
    color: '#ef9fb8',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 0),
        text: 'Start white side up with a corner pointing at you. Fold the top corner down to the bottom corner.',
      },
      { kind: 'valley', line: [v(20, 50), v(8, 58)], move: v(0, 50), text: 'Fold the left corner down a little for a small floppy ear.' },
      { kind: 'valley', line: [v(80, 50), v(92, 58)], move: v(100, 50), text: 'Same on the right.' },
      {
        kind: 'valley',
        line: [v(0, 80), v(100, 80)],
        move: v(50, 100),
        text: 'Fold the bottom point up to make a flat snout.',
      },
    ],
    finish: 'Draw two eyes and two nostrils on the snout.',
    dots: [
      { x: 40, y: 62, r: 2 },
      { x: 60, y: 62, r: 2 },
      { x: 46, y: 74, r: 1.5 },
      { x: 54, y: 74, r: 1.5 },
    ],
  },
  {
    slug: 'stem',
    name: 'Stem and leaf',
    level: 'beginner',
    topic: 'flower',
    about: 'A stem for any flower',
    color: '#4c9a3c',
    paper: diamond,
    whiteUp: true,
    steps: [
      ...stemFolds,
      {
        id: 'leaf',
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 100),
        text: 'Fold the long bottom point up to the top point.',
      },
      {
        kind: 'mountain',
        line: [v(50, 0), v(50, 100)],
        move: v(100, 30),
        text: 'Fold in half behind along the center.',
      },
      {
        kind: 'valley',
        line: [v(50, 50), v(36, 20)],
        move: v(48, 10),
        only: { movedIn: 'leaf' },
        text: 'Fold the front flap out to the side at an angle. This is the leaf.',
      },
    ],
    finish: 'Tape a tulip on top of the stem.',
  },
  {
    slug: 'blintz-flower',
    name: 'Four-petal flower',
    level: 'intermediate',
    topic: 'flower',
    about: 'Two blintzes and four petals',
    color: '#d9412b',
    paper: square,
    whiteUp: true,
    steps: [
      { kind: 'crease', line: [v(0, 0), v(100, 100)], move: v(100, 0), text: 'Start white side up. Fold in half corner to corner, then unfold.' },
      { kind: 'crease', line: [v(100, 0), v(0, 100)], move: v(0, 0), text: 'Fold along the other diagonal, then unfold. The creases cross at the center.' },
      { kind: 'valley', line: [v(50, 0), v(0, 50)], move: v(0, 0), text: 'Fold each corner to the center. Start with the top left.' },
      { kind: 'valley', line: [v(50, 0), v(100, 50)], move: v(100, 0), text: 'Top right corner to the center.' },
      { kind: 'valley', line: [v(100, 50), v(50, 100)], move: v(100, 100), text: 'Bottom right corner to the center.' },
      { kind: 'valley', line: [v(50, 100), v(0, 50)], move: v(0, 100), text: 'Bottom left corner to the center. This is a blintz.' },
      { kind: 'flip', text: 'Turn the model over.' },
      { kind: 'valley', line: [v(25, 25), v(75, 25)], move: v(50, 0), text: 'Blintz again: fold the top corner to the center.' },
      { kind: 'valley', line: [v(75, 25), v(75, 75)], move: v(100, 50), text: 'Right corner to the center.' },
      { kind: 'valley', line: [v(25, 75), v(75, 75)], move: v(50, 100), text: 'Bottom corner to the center.' },
      { kind: 'valley', line: [v(25, 25), v(25, 75)], move: v(0, 50), text: 'Left corner to the center.' },
      { kind: 'flip', text: 'Turn the model over again.' },
      ...petalOut(),
    ],
    finish: 'Puff up the petals with a pencil tip so the flower opens.',
  },
];

/** Folds each paper corner, now meeting in the middle, back out across its quarter: four petals. */
function petalOut(): Step[] {
  const folds: [Line, Vec2[], string][] = [
    [[v(50, 25), v(25, 50)], [v(0, 0), v(50, 0), v(0, 50)], 'Fold the point in the top left quarter back out to its outer corner. It becomes a petal.'],
    [[v(50, 25), v(75, 50)], [v(100, 0), v(50, 0), v(100, 50)], 'Do the same in the top right quarter.'],
    [[v(75, 50), v(50, 75)], [v(100, 100), v(100, 50), v(50, 100)], 'And the bottom right.'],
    [[v(25, 50), v(50, 75)], [v(0, 100), v(0, 50), v(50, 100)], 'And the bottom left. Four petals.'],
  ];
  return folds.map(([line, within, text]) => ({ kind: 'valley', line, move: v(50, 50), only: { within }, text }));
}
