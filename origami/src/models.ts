import { v, type FaceInfo, type Step, type Vec2 } from './paper';
import type { Dot } from './render';

export type Level = 'basics' | 'beginner' | 'intermediate' | 'advanced';

export interface Model {
  readonly slug: string;
  readonly name: string;
  readonly level: Level;
  readonly about: string;
  /** Paper color the model is shown in. */
  readonly color: string;
  readonly paper: readonly Vec2[];
  /** Start with the white (back) side facing you, as most diagrams do. */
  readonly whiteUp: boolean;
  readonly steps: readonly Step[];
  readonly finish: string;
  /** Eyes and noses drawn on the finished model, in paper coordinates. */
  readonly dots?: readonly Dot[];
}

export interface Upcoming {
  readonly name: string;
  readonly about: string;
}

const square = [v(0, 0), v(100, 0), v(100, 100), v(0, 100)];
const diamond = [v(50, 0), v(100, 50), v(50, 100), v(0, 50)];
const letter = [v(0, 0), v(85, 0), v(85, 110), v(0, 110)];

const basics: Model[] = [
  {
    slug: 'valley-fold',
    name: 'Valley fold',
    level: 'basics',
    about: 'Dashed line, fold toward you',
    color: '#2d5bd0',
    paper: square,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 100),
        text: 'A dashed line is a valley fold. the paper folds toward you, so the crease sinks like a valley. bring the bottom edge up to the top.',
      },
    ],
    finish: 'The most common fold in origami. when a diagram just says "fold", it means this.',
  },
  {
    slug: 'mountain-fold',
    name: 'Mountain fold',
    level: 'basics',
    about: 'Dash-dot line, fold away',
    color: '#1f8a84',
    paper: square,
    whiteUp: false,
    steps: [
      {
        kind: 'mountain',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 100),
        text: 'A dash-dot line is a mountain fold. the paper folds away from you, behind the model, and the crease rises like a ridge. the hollow arrowhead means "behind".',
      },
    ],
    finish: 'A mountain fold is just a valley fold seen from the other side.',
  },
  {
    slug: 'crease',
    name: 'Fold and unfold',
    level: 'basics',
    about: 'Pre-crease a guide line',
    color: '#edb51c',
    paper: square,
    whiteUp: true,
    steps: [
      {
        kind: 'crease',
        line: [v(0, 0), v(100, 100)],
        move: v(100, 0),
        text: 'An arrow that comes back on itself means fold, make a sharp crease, then unfold. creases act as guides for later steps.',
      },
      {
        kind: 'crease',
        line: [v(100, 0), v(0, 100)],
        move: v(0, 0),
        text: 'Do it again on the other diagonal. where creases cross is the exact center of the paper.',
      },
    ],
    finish: 'Sharp creases make everything after them easier. run a fingernail along each one.',
  },
  {
    slug: 'turn-over',
    name: 'Turn over',
    level: 'basics',
    about: 'Flip the whole model',
    color: '#7b3f8c',
    paper: square,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(40, 0), v(0, 40)],
        move: v(0, 0),
        text: 'Fold one corner in so you can see which side is which.',
      },
      {
        kind: 'flip',
        text: 'A looping arrow means turn the whole model over, left to right, like a page in a book.',
      },
    ],
    finish: 'The folded corner is now behind. turning over shows you the other side of every layer.',
  },
  {
    slug: 'rotate',
    name: 'Rotate',
    level: 'basics',
    about: 'Spin it flat on the table',
    color: '#e98ba8',
    paper: square,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(40, 0), v(0, 40)],
        move: v(0, 0),
        text: 'Fold one corner in so the rotation is easy to see.',
      },
      {
        kind: 'rotate',
        deg: 90,
        text: 'A curved arrow around the model means rotate it flat on the table. here, a quarter turn clockwise.',
      },
    ],
    finish: 'Rotating never changes the paper, only your point of view. diagrams rotate to keep the next fold easy to reach.',
  },
];

// Which half of the unfolded sheet a face came from; after the first fold this tells front layers from back ones.
const topHalf = (f: FaceInfo) => f.c.y < 50;
const bottomHalf = (f: FaceInfo) => f.c.y > 50;
const body = (f: FaceInfo) => !f.movedIn('right') && !f.movedIn('left');

const models: Model[] = [
  {
    slug: 'dog',
    name: 'Dog face',
    level: 'beginner',
    about: 'Your first real model',
    color: '#b98a55',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 0),
        text: 'Start with the white side up and a corner pointing at you. fold the top corner down to the bottom corner.',
      },
      {
        kind: 'valley',
        line: [v(32, 50), v(10, 60)],
        move: v(0, 50),
        text: 'Fold the left corner down at an angle to make a floppy ear.',
      },
      {
        kind: 'valley',
        line: [v(68, 50), v(90, 60)],
        move: v(100, 50),
        text: 'Do the same on the right so the ears match.',
      },
      {
        kind: 'valley',
        line: [v(35, 85), v(65, 85)],
        move: v(50, 100),
        only: topHalf,
        text: 'Fold just the front layer of the bottom point up. this is the snout.',
      },
      {
        kind: 'mountain',
        line: [v(35, 85), v(65, 85)],
        move: v(50, 100),
        only: bottomHalf,
        text: 'Fold the back layer behind along the same line so the chin is flat.',
      },
    ],
    finish: 'Draw on eyes and a nose. woof.',
    dots: [
      { x: 39, y: 61, r: 2.6 },
      { x: 61, y: 61, r: 2.6 },
      { x: 50, y: 77, r: 3.2 },
    ],
  },
  {
    slug: 'cup',
    name: 'Paper cup',
    level: 'beginner',
    about: 'Holds water, for a while',
    color: '#1f8a84',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 100),
        text: 'Fold the bottom corner up to the top to make a triangle.',
      },
      {
        kind: 'valley',
        line: [v(58.58, 50), v(70.71, 20.71)],
        move: v(100, 50),
        text: 'Fold the right corner across so its tip touches the left edge. the top edge of the flap should end up level.',
      },
      {
        kind: 'valley',
        line: [v(41.42, 50), v(29.29, 20.71)],
        move: v(0, 50),
        text: 'Fold the left corner across the same way, on top.',
      },
      {
        kind: 'valley',
        line: [v(29.29, 20.71), v(70.71, 20.71)],
        move: v(50, 0),
        only: bottomHalf,
        text: 'Fold the front layer of the top point down. tuck it into the pocket of the flap if you like.',
      },
      {
        kind: 'mountain',
        line: [v(29.29, 20.71), v(70.71, 20.71)],
        move: v(50, 0),
        only: topHalf,
        text: 'Fold the back layer down behind.',
      },
    ],
    finish: 'Squeeze the sides to open the cup. it holds water for a minute or two.',
  },
  {
    slug: 'airplane',
    name: 'Paper airplane',
    level: 'beginner',
    about: 'The classic dart',
    color: '#2d5bd0',
    paper: letter,
    whiteUp: false,
    steps: [
      {
        kind: 'crease',
        line: [v(42.5, 0), v(42.5, 110)],
        move: v(85, 55),
        text: 'Use a letter-sized sheet. fold it in half lengthwise and unfold to mark the center.',
      },
      {
        kind: 'valley',
        line: [v(42.5, 0), v(0, 42.5)],
        move: v(0, 0),
        text: 'Fold the top left corner to the center crease.',
      },
      {
        kind: 'valley',
        line: [v(42.5, 0), v(85, 42.5)],
        move: v(85, 0),
        text: 'Fold the top right corner to the center crease.',
      },
      {
        kind: 'valley',
        line: [v(42.5, 0), v(0, 102.6)],
        move: v(0, 60),
        text: 'Fold the new left edge to the center crease. the nose gets sharper.',
      },
      {
        kind: 'valley',
        line: [v(42.5, 0), v(85, 102.6)],
        move: v(85, 60),
        text: 'Same on the right.',
      },
      {
        kind: 'mountain',
        line: [v(42.5, 0), v(42.5, 110)],
        move: v(85, 55),
        text: 'Fold the right half behind along the center crease.',
      },
      {
        kind: 'valley',
        line: [v(42.5, 0), v(30, 110)],
        move: v(5, 105),
        only: (f) => f.c.x < 42.5,
        text: 'Fold the front wing down so its top edge lines up with the bottom of the body.',
      },
      {
        kind: 'mountain',
        line: [v(42.5, 0), v(30, 110)],
        move: v(5, 105),
        only: (f) => f.c.x > 42.5,
        text: 'Fold the back wing the same way, behind.',
      },
      { kind: 'rotate', deg: 90, text: 'Turn it on its side so it points the way it will fly.' },
    ],
    finish: 'Open the wings so they sit flat, pinch the body, and throw it level and gently.',
  },
  {
    slug: 'kabuto',
    name: 'Samurai helmet',
    level: 'intermediate',
    about: 'Layers, flaps and horns',
    color: '#d9412b',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 0),
        text: 'White side up, fold the top corner down to the bottom corner.',
      },
      {
        id: 'right',
        kind: 'valley',
        line: [v(50, 50), v(75, 75)],
        move: v(100, 50),
        text: 'Fold the right corner down to the bottom point.',
      },
      {
        id: 'left',
        kind: 'valley',
        line: [v(50, 50), v(25, 75)],
        move: v(0, 50),
        text: 'Fold the left corner down to the bottom point. you have a diamond.',
      },
      {
        kind: 'valley',
        line: [v(50, 75), v(75, 75)],
        move: v(50, 95),
        only: (f) => f.movedIn('right'),
        text: 'Fold the bottom point of the right flap up to the top.',
      },
      {
        kind: 'valley',
        line: [v(25, 75), v(50, 75)],
        move: v(50, 95),
        only: (f) => f.movedIn('left'),
        text: 'Fold the bottom point of the left flap up to the top.',
      },
      {
        kind: 'valley',
        line: [v(57, 57), v(50, 75)],
        move: v(51, 60),
        only: (f) => f.movedIn('right'),
        text: 'Fold the tip of the right flap out at an angle. this is a horn.',
      },
      {
        kind: 'valley',
        line: [v(43, 57), v(50, 75)],
        move: v(49, 60),
        only: (f) => f.movedIn('left'),
        text: 'Fold the left tip out to make the second horn.',
      },
      {
        kind: 'valley',
        line: [v(37.5, 87.5), v(62.5, 87.5)],
        move: v(50, 100),
        only: (f) => topHalf(f) && body(f),
        text: 'Fold just the front layer of the bottom point up to the middle line.',
      },
      {
        kind: 'valley',
        line: [v(25, 75), v(75, 75)],
        move: v(50, 80),
        only: (f) => topHalf(f) && body(f),
        text: 'Fold that strip up again along the middle line. this is the brim.',
      },
      {
        kind: 'mountain',
        line: [v(25, 75), v(75, 75)],
        move: v(50, 90),
        only: (f) => bottomHalf(f) && body(f),
        text: 'Fold the back point up behind (or tuck it inside).',
      },
    ],
    finish: 'Open the bottom and it sits on your head if you started with a big sheet. newspaper works.',
  },
  {
    slug: 'fortune-teller',
    name: 'Fortune teller',
    level: 'intermediate',
    about: 'Built on a blintz base',
    color: '#edb51c',
    paper: square,
    whiteUp: true,
    steps: [
      { kind: 'crease', line: [v(0, 0), v(100, 100)], move: v(100, 0), text: 'Fold and unfold along one diagonal.' },
      { kind: 'crease', line: [v(100, 0), v(0, 100)], move: v(0, 0), text: 'Fold and unfold along the other diagonal to find the center.' },
      { kind: 'valley', line: [v(50, 0), v(0, 50)], move: v(0, 0), text: 'Fold the top left corner to the center.' },
      { kind: 'valley', line: [v(50, 0), v(100, 50)], move: v(100, 0), text: 'Fold the top right corner to the center.' },
      { kind: 'valley', line: [v(100, 50), v(50, 100)], move: v(100, 100), text: 'Bottom right corner to the center.' },
      {
        kind: 'valley',
        line: [v(50, 100), v(0, 50)],
        move: v(0, 100),
        text: 'Bottom left corner to the center. folding all four corners in is called a blintz.',
      },
      { kind: 'flip', text: 'Turn the model over.' },
      { kind: 'valley', line: [v(25, 25), v(75, 25)], move: v(50, 0), text: 'Blintz again: fold the top corner to the center.' },
      { kind: 'valley', line: [v(75, 25), v(75, 75)], move: v(100, 50), text: 'Right corner to the center.' },
      { kind: 'valley', line: [v(25, 75), v(75, 75)], move: v(50, 100), text: 'Bottom corner to the center.' },
      { kind: 'valley', line: [v(25, 25), v(25, 75)], move: v(0, 50), text: 'Left corner to the center.' },
      { kind: 'crease', line: [v(25, 50), v(75, 50)], move: v(50, 25), text: 'Fold in half and unfold.' },
      { kind: 'crease', line: [v(50, 25), v(50, 75)], move: v(25, 50), text: 'Fold in half the other way and unfold.' },
    ],
    finish:
      'Number the inner flaps, color the outer squares, then push the four corners together from underneath and slide your fingers into the pockets.',
  },
];

export const all: readonly Model[] = [...basics, ...models];

export const upcoming: readonly Upcoming[] = [
  { name: 'Crane', about: 'Squash and petal folds' },
  { name: 'Jumping frog', about: 'Pleats and reverse folds' },
  { name: 'Lily', about: 'Frog base and curling' },
];

export const levels: readonly { level: Level; title: string }[] = [
  { level: 'basics', title: 'Symbols' },
  { level: 'beginner', title: 'Beginner' },
  { level: 'intermediate', title: 'Intermediate' },
  { level: 'advanced', title: 'Advanced' },
];
