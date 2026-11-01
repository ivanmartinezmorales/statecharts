// Lessons for the compound folds (squash, petal, reverse) and the advanced models built from them.
// Every model here starts from the same diamond: a square sheet with a corner pointing at you.

import { v, type Line, type Part, type Step, type Vec2 } from './diagram';
import type { Model } from './models';

const diamond = [v(50, 0), v(100, 50), v(50, 100), v(0, 50)];
const card = [v(0, 0), v(60, 0), v(60, 100), v(0, 100)];

/** The four triangles the two diagonal folds of the diamond make, named by the corner they hold. */
const triangle = {
  lowerRight: [v(50, 50), v(100, 50), v(50, 100)],
  upperRight: [v(50, 50), v(100, 50), v(50, 0)],
  upperLeft: [v(50, 50), v(0, 50), v(50, 0)],
  lowerLeft: [v(50, 50), v(0, 50), v(50, 100)],
};

/** The four squares a preliminary base stacks up, named by the paper corner each holds. */
const square = {
  right: [v(50, 50), v(75, 25), v(100, 50), v(75, 75)],
  left: [v(50, 50), v(25, 25), v(0, 50), v(25, 75)],
};
/** The inner layers next to the front square, and next to the back one. */
const innerRight = [v(50, 0), v(75, 25), v(75, 75), v(50, 100)];
const innerLeft = [v(50, 0), v(25, 25), v(25, 75), v(50, 100)];
/** The inner squares, which become the bird base's two lower flaps. */
const upperSquare = [v(50, 50), v(25, 25), v(50, 0), v(75, 25)];
const lowerSquare = [v(50, 50), v(25, 75), v(50, 100), v(75, 75)];

/** Fold top to bottom, then left onto right: the folded triangle a squash starts from. */
const quarterFolds: Step[] = [
  {
    kind: 'valley',
    line: [v(0, 50), v(100, 50)],
    move: v(50, 0),
    text: 'Start white side up with a corner pointing at you. Fold the top corner down to the bottom corner.',
  },
  {
    kind: 'valley',
    line: [v(50, 50), v(50, 100)],
    move: v(0, 75),
    text: 'Fold the left corner over to the right corner.',
  },
];

/**
 * Squashes the top flap of the folded triangle into a square. The flap's front layer folds in half
 * onto the side it sits on; its back layer swings across the hinge and folds in half there.
 */
function squashTriangle(p: Vec2, q: Vec2, r: Vec2, front: readonly Vec2[], back: readonly Vec2[]): Part[] {
  // The new crease bisects the corner at p, so the flap's folded edge pq lands on the hinge pr.
  const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);
  const k = dist(p, q) / (dist(p, q) + dist(p, r));
  const h = v(q.x + (r.x - q.x) * k, q.y + (r.y - q.y) * k);
  const center: Line = [p, h];
  const hinge: Line = [p, r];
  return [
    { line: center, side: q, only: { within: front }, over: [center] },
    { line: center, side: r, only: { within: back }, over: [hinge] },
    { line: center, side: q, only: { within: back }, over: [center, hinge] },
  ];
}

const squashText = 'Lift the top flap upright, open it from the inside, and press it flat into a square. Its folded edge lands on the center line.';

/** Diamond to preliminary (square) base: two folds, a squash, turn over, and the matching squash. */
const preliminaryBase: Step[] = [
  ...quarterFolds,
  {
    kind: 'squash',
    parts: squashTriangle(v(50, 50), v(100, 50), v(50, 100), triangle.lowerLeft, triangle.upperLeft),
    text: squashText,
  },
  { kind: 'flip', text: 'Turn the model over.' },
  {
    kind: 'squash',
    parts: squashTriangle(v(75, 50), v(25, 50), v(75, 100), triangle.lowerRight, triangle.upperRight),
    text: 'Squash the other flap the same way. This is the preliminary base, also called the square base.',
  },
];

// Landmarks on the preliminary base: top, sides, bottom, and where the kite creases meet its upper edges.
const top = v(75, 50);
const bottom = v(75, 100);
const sideL = v(50, 75);
const sideR = v(100, 75);
const kiteL = v(60.36, 64.64);
const kiteR = v(89.64, 64.64);

/** Kite creases and a petal fold on the front of a preliminary base. */
function petal(face: readonly Vec2[], inner: readonly Vec2[], which: string): Step[] {
  const left: Line = [bottom, kiteL];
  const right: Line = [bottom, kiteR];
  const across: Line = [kiteL, kiteR];
  return [
    {
      kind: 'crease',
      line: left,
      move: sideL,
      only: { within: face },
      text: `Fold the lower left edge of the ${which} layer to the center line, then unfold.`,
    },
    {
      kind: 'crease',
      line: right,
      move: sideR,
      only: { within: face },
      text: 'Do the same with the lower right edge, then unfold.',
    },
    {
      kind: 'crease',
      line: across,
      move: top,
      only: { within: face },
      text: 'Fold the top down along the ends of those creases, then unfold.',
    },
    {
      kind: 'petal',
      parts: [
        { line: left, side: sideL, only: { within: face }, over: [left, across] },
        { line: right, side: sideR, only: { within: face }, over: [right, across] },
        { line: across, side: bottom, only: { within: face } },
        { line: left, side: sideL, only: { within: inner } },
        { line: right, side: sideR, only: { within: inner } },
      ],
      text: `Lift the bottom corner of the ${which} layer up along the top crease. The sides fold in along the kite creases and meet in the middle.`,
    },
  ];
}

/** Diamond to bird base: a preliminary base with a petal fold on each side. */
const birdBase: Step[] = [
  ...preliminaryBase,
  ...petal(square.right, innerRight, 'front'),
  { kind: 'flip', text: 'Turn the model over.' },
  ...petal(square.left, innerLeft, 'top'),
];

/** The inner triangles of a preliminary base: each is the back layer of one of its four flaps. */
const flapBack = {
  frontLeft: [v(50, 50), v(75, 75), v(50, 100)],
  frontRight: [v(50, 50), v(75, 25), v(50, 0)],
  backLeft: [v(50, 50), v(25, 25), v(50, 0)],
  backRight: [v(50, 50), v(25, 75), v(50, 100)],
};

/** Moves the right half of the top flap over to the left, like turning a page. */
function pageTurn(within: readonly Vec2[], text: string): Step {
  return { kind: 'valley', line: [top, bottom], move: sideR, only: { within }, text };
}

/** A page turn from left to right. */
function pageBack(within: readonly Vec2[], text: string): Step {
  return { kind: 'valley', line: [top, bottom], move: sideL, only: { within }, text };
}

/** Preliminary base to the squashed frog base: squash each of the four flaps, turning pages in between. */
const frogBase: Step[] = [
  ...preliminaryBase,
  {
    kind: 'squash',
    parts: squashTriangle(top, sideL, bottom, square.right, flapBack.frontLeft),
    text: 'Lift the front left flap upright, open it, and squash it flat so its folded edge lands on the center line.',
  },
  pageTurn(flapBack.frontLeft, 'Turn the right half of that squashed flap over to the left, like a page.'),
  {
    kind: 'squash',
    parts: squashTriangle(top, sideR, bottom, square.right, flapBack.frontRight),
    text: 'Squash the right flap the same way.',
  },
  { kind: 'flip', text: 'Turn the model over.' },
  {
    kind: 'squash',
    parts: squashTriangle(top, sideL, bottom, square.left, flapBack.backLeft),
    text: 'Squash the left flap on this side.',
  },
  pageTurn(flapBack.backLeft, 'Turn the right half of it over to the left.'),
  {
    kind: 'squash',
    parts: squashTriangle(top, sideR, bottom, square.left, flapBack.backRight),
    text: 'Squash the last flap. All four flaps are now squashed.',
  },
];

// The frog base petal fold lifts the top layer's point (where the squash put it) up across y = 75.
const petalPoint = v(75, 85.36);
const kiteL2 = v(64.65, 75);
const kiteR2 = v(85.35, 75);
const kiteSideL = v(60.36, 85.36);
const kiteSideR = v(89.64, 85.36);

/** Kite creases and a petal fold on the top layer of the front squashed flap. */
function frogPetal(left: readonly Vec2[], right: readonly Vec2[], text: string): Step[] {
  const kl: Line = [petalPoint, kiteL2];
  const kr: Line = [petalPoint, kiteR2];
  const across: Line = [kiteL2, kiteR2];
  const keepLeft = [{ line: [top, bottom] as Line, side: sideL }];
  const keepRight = [{ line: [top, bottom] as Line, side: sideR }];
  return [
    { kind: 'crease', line: kl, move: kiteSideL, only: { within: left, layers: 'front' }, text: 'Fold the lower left edge of the top layer to the center line, then unfold.' },
    { kind: 'crease', line: kr, move: kiteSideR, only: { within: right, layers: 'front' }, text: 'Fold the lower right edge of the top layer to the center line, then unfold.' },
    {
      kind: 'petal',
      parts: [
        { line: kl, side: kiteSideL, only: { within: left, layers: 'front' }, over: [kl, across], clip: keepLeft },
        { line: kr, side: kiteSideR, only: { within: right, layers: 'front' }, over: [kr, across], clip: keepRight },
        { line: across, side: v(75, 80), only: { within: left, layers: 'front' }, clip: keepLeft },
        { line: across, side: v(75, 80), only: { within: right, layers: 'front' }, clip: keepRight },
      ],
      text,
    },
  ];
}

/** Narrows one lower flap of the bird base by folding its outer edge to the center. */
function narrow(side: 'left' | 'right', flap: readonly Vec2[], text: string): Step {
  const x = side === 'left' ? 67.97 : 82.03;
  return {
    kind: 'valley',
    line: [bottom, v(x, 64.64)],
    move: side === 'left' ? kiteL : kiteR,
    only: { within: flap, layers: 'front' },
    text,
  };
}

const narrowing: Step[] = [
  narrow('left', upperSquare, 'Fold the lower left edge of the front layer to the center line. The lower flaps get thinner.'),
  narrow('right', lowerSquare, 'Fold the lower right edge to the center line too.'),
  { kind: 'flip', text: 'Turn the model over.' },
  narrow('left', lowerSquare, 'Narrow the left side on this side as well.'),
  narrow('right', upperSquare, 'And the right side.'),
];

export const techniques: Model[] = [
  {
    slug: 'squash-fold',
    name: 'Squash fold',
    level: 'basics',
    topic: 'technique',
    about: 'Open a flap and press it flat',
    color: '#2d5bd0',
    paper: diamond,
    whiteUp: true,
    steps: [...quarterFolds, { kind: 'squash', parts: squashTriangle(v(50, 50), v(100, 50), v(50, 100), triangle.lowerLeft, triangle.upperLeft), text: squashText }],
    finish: 'A squash turns one flap into two, side by side. The preliminary base is two squashes, back to back.',
  },
  {
    slug: 'inside-reverse-fold',
    name: 'Inside reverse fold',
    level: 'basics',
    topic: 'technique',
    about: 'Tuck a point between its layers',
    color: '#1f8a84',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 100),
        text: 'Start white side up with a corner pointing at you. Fold the bottom corner up to the top corner.',
      },
      {
        kind: 'reverse',
        direction: 'inside',
        line: [v(62, 50), v(86.1, 36.1)],
        move: v(100, 50),
        text: 'Open the layers of the right point and push it up between them along the crease. Each layer folds the opposite way. This is how necks and heads are made.',
      },
    ],
    finish: 'The point turns inside out and ends up tucked between its own layers, so nothing new shows on the outside.',
  },
  {
    slug: 'outside-reverse-fold',
    name: 'Outside reverse fold',
    level: 'basics',
    topic: 'technique',
    about: 'Wrap a point around the outside',
    color: '#7b3f8c',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 100),
        text: 'Start white side up with a corner pointing at you. Fold the bottom corner up to the top corner.',
      },
      {
        kind: 'reverse',
        direction: 'outside',
        line: [v(62, 50), v(86.1, 36.1)],
        move: v(100, 50),
        text: 'Open the layers of the right point and wrap them back around the outside along the crease. The inside of the paper now shows.',
      },
    ],
    finish: 'Same crease as an inside reverse fold, but the point wraps around the outside, so the other color shows.',
  },
  {
    slug: 'petal-fold',
    name: 'Petal fold',
    level: 'basics',
    topic: 'technique',
    about: 'Lift a point while the sides fold in',
    color: '#d9412b',
    paper: diamond,
    whiteUp: true,
    steps: [...preliminaryBase, ...petal(square.right, innerRight, 'front')],
    finish: 'Do it on the back too and you have the bird base, the start of the crane, the flapping bird and many more.',
  },
];

export const advanced: Model[] = [
  {
    slug: 'lily',
    name: 'Lily',
    level: 'advanced',
    topic: 'flower',
    about: 'Frog base, petal folds and curls',
    color: '#edb51c',
    paper: diamond,
    whiteUp: true,
    steps: [
      ...frogBase,
      ...frogPetal(flapBack.backRight, square.left, 'Lift the bottom point of the top flap up. The sides fold in along the creases: a petal fold.'),
      pageBack(flapBack.backRight, 'Turn the left half of the top flap over to the right.'),
      pageBack(flapBack.backLeft, 'Turn one more page to the right, so a plain flap faces you.'),
      ...frogPetal(square.left, flapBack.backLeft, 'Petal fold this flap too.'),
      { kind: 'flip', text: 'Turn the model over.' },
      ...frogPetal(flapBack.frontRight, square.right, 'Petal fold the flap on this side.'),
      pageBack(flapBack.frontRight, 'Turn the left half of the top flap over to the right.'),
      pageBack(flapBack.frontLeft, 'Turn one more page to the right.'),
      ...frogPetal(square.right, flapBack.frontLeft, 'Petal fold the last flap. This is the frog base.'),
      {
        kind: 'valley',
        line: [bottom, kiteL2],
        move: kiteSideL,
        only: { within: square.right, layers: 'front' },
        text: 'Fold the lower left edge of the front flap to the center line. The bottom gets long and thin.',
      },
      {
        kind: 'valley',
        line: [bottom, kiteR2],
        move: kiteSideR,
        only: { within: flapBack.frontLeft, layers: 'front' },
        text: 'Fold the lower right edge to the center line too.',
      },
      { kind: 'flip', text: 'Turn the model over.' },
      {
        kind: 'valley',
        line: [bottom, kiteL2],
        move: kiteSideL,
        only: { layers: 'front' },
        text: 'Narrow this side the same way: lower left edge to the center.',
      },
      {
        kind: 'valley',
        line: [bottom, kiteR2],
        move: kiteSideR,
        only: { layers: 'front' },
        text: 'And the lower right edge. Turn a page on each side and narrow the two inner flaps the same way.',
      },
      { kind: 'rotate', deg: 180, text: 'Turn the lily upside down: the four long thin flaps are the petals.' },
    ],
    finish: 'Pull the four long petals down and outward one at a time, then curl each one around a pencil. The lily opens.',
  },
  {
    slug: 'flapping-bird',
    name: 'Flapping bird',
    level: 'advanced',
    topic: 'animal',
    about: 'Bird base, neck and tail',
    color: '#e98ba8',
    paper: diamond,
    whiteUp: true,
    steps: [
      ...birdBase,
      {
        kind: 'reverse',
        direction: 'inside',
        line: [v(60, 70), v(80, 60)],
        move: bottom,
        only: { within: upperSquare },
        text: 'Inside reverse fold the left lower flap up between the wings. This is the neck.',
      },
      {
        kind: 'reverse',
        direction: 'inside',
        line: [v(90, 70), v(70, 60)],
        move: bottom,
        only: { within: lowerSquare },
        text: 'Inside reverse fold the right lower flap up the same way for the tail.',
      },
      {
        kind: 'reverse',
        direction: 'inside',
        line: [v(42.5, 45), v(52.5, 50)],
        move: v(45, 40),
        only: { within: upperSquare },
        text: 'Inside reverse fold the tip of the neck down to make the head.',
      },
    ],
    finish: 'Hold the bottom of the neck and gently pull the tail. The wings flap.',
  },
  {
    slug: 'crane',
    name: 'Crane',
    level: 'advanced',
    topic: 'animal',
    about: 'The classic, from a bird base',
    color: '#d9412b',
    paper: diamond,
    whiteUp: true,
    steps: [
      ...birdBase,
      ...narrowing,
      {
        kind: 'reverse',
        direction: 'inside',
        line: [v(60, 70), v(80, 60)],
        move: bottom,
        only: { within: lowerSquare },
        text: 'Inside reverse fold the left thin flap up between the wings. This is the neck.',
      },
      {
        kind: 'reverse',
        direction: 'inside',
        line: [v(90, 70), v(70, 60)],
        move: bottom,
        only: { within: upperSquare },
        text: 'Inside reverse fold the right thin flap up the same way for the tail.',
      },
      {
        kind: 'reverse',
        direction: 'inside',
        line: [v(42.5, 45), v(52.5, 50)],
        move: v(45, 40),
        only: { within: lowerSquare },
        text: 'Inside reverse fold the tip of the neck down to make the head.',
      },
      {
        kind: 'valley',
        line: [kiteL, kiteR],
        move: v(75, 30),
        only: { within: square.right },
        text: 'Fold the front wing down.',
      },
      {
        kind: 'mountain',
        line: [kiteL, kiteR],
        move: v(75, 30),
        only: { within: square.left },
        text: 'Fold the back wing down behind.',
      },
    ],
    finish: 'Pull the wings gently apart and press the middle so the back puffs out. Fold a thousand and make a wish.',
  },
  {
    slug: 'swan',
    name: 'Swan',
    level: 'advanced',
    topic: 'animal',
    about: 'Kite base and a pulled-up neck',
    color: '#232a33',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'crease',
        line: [v(50, 0), v(50, 100)],
        move: v(100, 50),
        text: 'Start white side up with a corner pointing at you. Fold in half from side to side and unfold.',
      },
      {
        kind: 'valley',
        line: [v(50, 0), v(20.71, 70.71)],
        move: v(0, 50),
        text: 'Fold the top left edge to the center crease.',
      },
      {
        kind: 'valley',
        line: [v(50, 0), v(79.29, 70.71)],
        move: v(100, 50),
        text: 'Fold the top right edge to the center crease. This is a kite base.',
      },
      { kind: 'flip', text: 'Turn the model over.' },
      {
        kind: 'valley',
        line: [v(50, 0), v(34.39, 78.46)],
        move: v(20.71, 70.71),
        text: 'Fold the left edge to the center again. The top point gets very thin.',
      },
      {
        kind: 'valley',
        line: [v(50, 0), v(65.61, 78.46)],
        move: v(79.29, 70.71),
        text: 'Fold the right edge to the center too.',
      },
      {
        kind: 'mountain',
        line: [v(50, 0), v(50, 100)],
        move: v(100, 60),
        text: 'Fold the model in half behind, along the center crease.',
      },
      { kind: 'rotate', deg: 90, text: 'Turn it so the folded edge is along the bottom and the thin point faces right.' },
      {
        id: 'neck',
        kind: 'reverse',
        direction: 'outside',
        line: [v(38.2, 58.2), v(68.4, 31.6)],
        move: v(91.8, 58.2),
        text: 'Pull the thin point up to make the neck. The layers wrap around the outside, an outside reverse fold.',
      },
      {
        kind: 'reverse',
        direction: 'outside',
        line: [v(51.5, 9.5), v(42.5, 22.5)],
        move: v(45, 5),
        only: { movedIn: 'neck' },
        text: 'Outside reverse fold the tip of the neck forward to make the head.',
      },
    ],
    finish: 'Shape the neck into a gentle curve and spread the body a little so it stands.',
  },
  {
    slug: 'jumping-frog',
    name: 'Jumping frog',
    level: 'advanced',
    topic: 'animal',
    about: 'Waterbomb collapse and a spring',
    color: '#4c9a3c',
    paper: card,
    whiteUp: true,
    steps: [
      {
        kind: 'crease',
        line: [v(0, 0), v(60, 60)],
        move: v(60, 0),
        text: 'Use an index card, short edge on top. Fold the top left corner down to the right edge, then unfold.',
      },
      {
        kind: 'crease',
        line: [v(60, 0), v(0, 60)],
        move: v(0, 0),
        text: 'Fold the top right corner down to the left edge, then unfold. The creases make an X.',
      },
      {
        kind: 'crease',
        line: [v(0, 30), v(60, 30)],
        move: v(30, 0),
        text: 'Fold the top edge down through the middle of the X, then unfold.',
      },
      {
        kind: 'collapse',
        parts: [
          { line: [v(30, 30), v(0, 60)], side: v(0, 40), only: { within: [v(0, 30), v(30, 30), v(0, 60)] } },
          { line: [v(0, 30), v(30, 30)], side: v(0, 10), only: { within: [v(0, 0), v(30, 30), v(0, 30)] }, over: [[v(0, 30), v(30, 30)], [v(30, 30), v(0, 60)]] },
          { line: [v(30, 30), v(60, 60)], side: v(60, 40), only: { within: [v(60, 30), v(30, 30), v(60, 60)] } },
          { line: [v(60, 30), v(30, 30)], side: v(60, 10), only: { within: [v(60, 0), v(30, 30), v(60, 30)] }, over: [[v(60, 30), v(30, 30)], [v(30, 30), v(60, 60)]] },
          { line: [v(0, 30), v(60, 30)], side: v(30, 0), only: { within: [v(0, 0), v(60, 0), v(30, 30)] } },
        ],
        text: 'Push the sides in along the middle crease and bring the top down. It collapses into a triangle, called a waterbomb base.',
      },
      {
        kind: 'valley',
        line: [v(15, 45), v(30, 60)],
        move: v(0, 60),
        only: { within: [v(0, 0), v(60, 0), v(30, 30)] },
        text: 'Fold the left corner of the triangle up to its top point. This is a front leg.',
      },
      {
        kind: 'valley',
        line: [v(45, 45), v(30, 60)],
        move: v(60, 60),
        only: { within: [v(0, 0), v(60, 0), v(30, 30)] },
        text: 'Fold the right corner up to the top too.',
      },
      {
        kind: 'valley',
        line: [v(15, 60), v(15, 100)],
        move: v(0, 80),
        only: { half: 'bottom', at: 60 },
        text: 'Fold the left edge of the body to the center.',
      },
      {
        kind: 'valley',
        line: [v(45, 60), v(45, 100)],
        move: v(60, 80),
        only: { half: 'bottom', at: 60 },
        text: 'Fold the right edge of the body to the center.',
      },
      {
        id: 'legs',
        kind: 'valley',
        line: [v(0, 80), v(60, 80)],
        move: v(30, 100),
        text: 'Fold the bottom edge up to the bottom of the triangle.',
      },
      {
        kind: 'valley',
        line: [v(0, 70), v(60, 70)],
        move: v(30, 60),
        only: { movedIn: 'legs' },
        text: 'Fold that flap back down in half. This pleat is the spring.',
      },
      { kind: 'flip', text: 'Turn the frog over.' },
    ],
    finish: 'Press down on the back edge and slide your finger off. It jumps.',
    dots: [
      { x: 24, y: 40, r: 1.8 },
      { x: 36, y: 40, r: 1.8 },
    ],
  },
];
