import { v, type FaceInfo, type Step, type Vec2 } from './paper';
import type { Dot } from './render';

export type Level = 'basics' | 'beginner' | 'intermediate' | 'advanced';

export interface Model {
  readonly slug: string;
  readonly name: string;
  readonly level: Level;
  readonly blurb: string;
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
  readonly blurb: string;
}

const square = [v(0, 0), v(100, 0), v(100, 100), v(0, 100)];
const diamond = [v(50, 0), v(100, 50), v(50, 100), v(0, 50)];
const letter = [v(0, 0), v(85, 0), v(85, 110), v(0, 110)];

const basics: Model[] = [
  {
    slug: 'valley-fold',
    name: 'valley fold',
    level: 'basics',
    blurb: 'dashes · fold toward you',
    paper: square,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 100),
        text: 'a dashed line is a valley fold. the paper folds toward you, so the crease sinks like a valley. bring the bottom edge up to the top.',
      },
    ],
    finish: 'the most common fold in origami. when a diagram just says "fold", it means this.',
  },
  {
    slug: 'mountain-fold',
    name: 'mountain fold',
    level: 'basics',
    blurb: 'dash-dot · fold away',
    paper: square,
    whiteUp: false,
    steps: [
      {
        kind: 'mountain',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 100),
        text: 'a dash-dot line is a mountain fold. the paper folds away from you, behind the model, and the crease rises like a ridge. the hollow arrowhead means "behind".',
      },
    ],
    finish: 'a mountain fold is just a valley fold seen from the other side.',
  },
  {
    slug: 'crease',
    name: 'fold & unfold',
    level: 'basics',
    blurb: 'two-way arrow · pre-crease',
    paper: square,
    whiteUp: true,
    steps: [
      {
        kind: 'crease',
        line: [v(0, 0), v(100, 100)],
        move: v(100, 0),
        text: 'an arrow that comes back on itself means fold, make a sharp crease, then unfold. creases act as guides for later steps.',
      },
      {
        kind: 'crease',
        line: [v(100, 0), v(0, 100)],
        move: v(0, 0),
        text: 'do it again on the other diagonal. where creases cross is the exact center of the paper.',
      },
    ],
    finish: 'sharp creases make everything after them easier. run a fingernail along each one.',
  },
  {
    slug: 'turn-over',
    name: 'turn over',
    level: 'basics',
    blurb: 'loop arrow · flip the model',
    paper: square,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(40, 0), v(0, 40)],
        move: v(0, 0),
        text: 'fold one corner in so you can see which side is which.',
      },
      {
        kind: 'flip',
        text: 'a looping arrow means turn the whole model over, left to right, like a page in a book.',
      },
    ],
    finish: 'the folded corner is now behind. turning over shows you the other side of every layer.',
  },
  {
    slug: 'rotate',
    name: 'rotate',
    level: 'basics',
    blurb: 'curved arrow · spin in place',
    paper: square,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(40, 0), v(0, 40)],
        move: v(0, 0),
        text: 'fold one corner in so the rotation is easy to see.',
      },
      {
        kind: 'rotate',
        deg: 90,
        text: 'a curved arrow around the model means rotate it flat on the table. here, a quarter turn clockwise.',
      },
    ],
    finish: 'rotating never changes the paper, only your point of view. diagrams rotate to keep the next fold easy to reach.',
  },
];

// Which half of the unfolded sheet a face came from; after the first fold this tells front layers from back ones.
const topHalf = (f: FaceInfo) => f.c.y < 50;
const bottomHalf = (f: FaceInfo) => f.c.y > 50;
const body = (f: FaceInfo) => !f.movedIn('right') && !f.movedIn('left');

const models: Model[] = [
  {
    slug: 'dog',
    name: 'dog face',
    level: 'beginner',
    blurb: '5 folds · your first model',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 0),
        text: 'start with the white side up and a corner pointing at you. fold the top corner down to the bottom corner.',
      },
      {
        kind: 'valley',
        line: [v(32, 50), v(10, 60)],
        move: v(0, 50),
        text: 'fold the left corner down at an angle to make a floppy ear.',
      },
      {
        kind: 'valley',
        line: [v(68, 50), v(90, 60)],
        move: v(100, 50),
        text: 'do the same on the right so the ears match.',
      },
      {
        kind: 'valley',
        line: [v(35, 85), v(65, 85)],
        move: v(50, 100),
        only: topHalf,
        text: 'fold just the front layer of the bottom point up. this is the snout.',
      },
      {
        kind: 'mountain',
        line: [v(35, 85), v(65, 85)],
        move: v(50, 100),
        only: bottomHalf,
        text: 'fold the back layer behind along the same line so the chin is flat.',
      },
    ],
    finish: 'draw on eyes and a nose. woof.',
    dots: [
      { x: 39, y: 61, r: 2.6 },
      { x: 61, y: 61, r: 2.6 },
      { x: 50, y: 77, r: 3.2 },
    ],
  },
  {
    slug: 'cup',
    name: 'paper cup',
    level: 'beginner',
    blurb: '5 folds · it actually holds water',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 100),
        text: 'fold the bottom corner up to the top to make a triangle.',
      },
      {
        kind: 'valley',
        line: [v(58.58, 50), v(70.71, 20.71)],
        move: v(100, 50),
        text: 'fold the right corner across so its tip touches the left edge. the top edge of the flap should end up level.',
      },
      {
        kind: 'valley',
        line: [v(41.42, 50), v(29.29, 20.71)],
        move: v(0, 50),
        text: 'fold the left corner across the same way, on top.',
      },
      {
        kind: 'valley',
        line: [v(29.29, 20.71), v(70.71, 20.71)],
        move: v(50, 0),
        only: bottomHalf,
        text: 'fold the front layer of the top point down. tuck it into the pocket of the flap if you like.',
      },
      {
        kind: 'mountain',
        line: [v(29.29, 20.71), v(70.71, 20.71)],
        move: v(50, 0),
        only: topHalf,
        text: 'fold the back layer down behind.',
      },
    ],
    finish: 'squeeze the sides to open the cup. it holds water for a minute or two.',
  },
  {
    slug: 'airplane',
    name: 'paper airplane',
    level: 'beginner',
    blurb: '9 steps · classic dart',
    paper: letter,
    whiteUp: false,
    steps: [
      {
        kind: 'crease',
        line: [v(42.5, 0), v(42.5, 110)],
        move: v(85, 55),
        text: 'use a letter-sized sheet. fold it in half lengthwise and unfold to mark the center.',
      },
      {
        kind: 'valley',
        line: [v(42.5, 0), v(0, 42.5)],
        move: v(0, 0),
        text: 'fold the top left corner to the center crease.',
      },
      {
        kind: 'valley',
        line: [v(42.5, 0), v(85, 42.5)],
        move: v(85, 0),
        text: 'fold the top right corner to the center crease.',
      },
      {
        kind: 'valley',
        line: [v(42.5, 0), v(0, 102.6)],
        move: v(0, 60),
        text: 'fold the new left edge to the center crease. the nose gets sharper.',
      },
      {
        kind: 'valley',
        line: [v(42.5, 0), v(85, 102.6)],
        move: v(85, 60),
        text: 'same on the right.',
      },
      {
        kind: 'mountain',
        line: [v(42.5, 0), v(42.5, 110)],
        move: v(85, 55),
        text: 'fold the right half behind along the center crease.',
      },
      {
        kind: 'valley',
        line: [v(42.5, 0), v(30, 110)],
        move: v(5, 105),
        only: (f) => f.c.x < 42.5,
        text: 'fold the front wing down so its top edge lines up with the bottom of the body.',
      },
      {
        kind: 'mountain',
        line: [v(42.5, 0), v(30, 110)],
        move: v(5, 105),
        only: (f) => f.c.x > 42.5,
        text: 'fold the back wing the same way, behind.',
      },
      { kind: 'rotate', deg: 90, text: 'turn it on its side so it points the way it will fly.' },
    ],
    finish: 'open the wings so they sit flat, pinch the body, and throw it level and gently.',
  },
  {
    slug: 'kabuto',
    name: 'samurai helmet',
    level: 'intermediate',
    blurb: '10 folds · layers & flaps',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 0),
        text: 'white side up, fold the top corner down to the bottom corner.',
      },
      {
        id: 'right',
        kind: 'valley',
        line: [v(50, 50), v(75, 75)],
        move: v(100, 50),
        text: 'fold the right corner down to the bottom point.',
      },
      {
        id: 'left',
        kind: 'valley',
        line: [v(50, 50), v(25, 75)],
        move: v(0, 50),
        text: 'fold the left corner down to the bottom point. you have a diamond.',
      },
      {
        kind: 'valley',
        line: [v(50, 75), v(75, 75)],
        move: v(50, 95),
        only: (f) => f.movedIn('right'),
        text: 'fold the bottom point of the right flap up to the top.',
      },
      {
        kind: 'valley',
        line: [v(25, 75), v(50, 75)],
        move: v(50, 95),
        only: (f) => f.movedIn('left'),
        text: 'fold the bottom point of the left flap up to the top.',
      },
      {
        kind: 'valley',
        line: [v(57, 57), v(50, 75)],
        move: v(51, 60),
        only: (f) => f.movedIn('right'),
        text: 'fold the tip of the right flap out at an angle. this is a horn.',
      },
      {
        kind: 'valley',
        line: [v(43, 57), v(50, 75)],
        move: v(49, 60),
        only: (f) => f.movedIn('left'),
        text: 'fold the left tip out to make the second horn.',
      },
      {
        kind: 'valley',
        line: [v(37.5, 87.5), v(62.5, 87.5)],
        move: v(50, 100),
        only: (f) => topHalf(f) && body(f),
        text: 'fold just the front layer of the bottom point up to the middle line.',
      },
      {
        kind: 'valley',
        line: [v(25, 75), v(75, 75)],
        move: v(50, 80),
        only: (f) => topHalf(f) && body(f),
        text: 'fold that strip up again along the middle line. this is the brim.',
      },
      {
        kind: 'mountain',
        line: [v(25, 75), v(75, 75)],
        move: v(50, 90),
        only: (f) => bottomHalf(f) && body(f),
        text: 'fold the back point up behind (or tuck it inside).',
      },
    ],
    finish: 'open the bottom and it sits on your head if you started with a big sheet. newspaper works.',
  },
  {
    slug: 'fortune-teller',
    name: 'fortune teller',
    level: 'intermediate',
    blurb: '13 folds · blintz base',
    paper: square,
    whiteUp: true,
    steps: [
      { kind: 'crease', line: [v(0, 0), v(100, 100)], move: v(100, 0), text: 'fold and unfold along one diagonal.' },
      { kind: 'crease', line: [v(100, 0), v(0, 100)], move: v(0, 0), text: 'fold and unfold along the other diagonal to find the center.' },
      { kind: 'valley', line: [v(50, 0), v(0, 50)], move: v(0, 0), text: 'fold the top left corner to the center.' },
      { kind: 'valley', line: [v(50, 0), v(100, 50)], move: v(100, 0), text: 'fold the top right corner to the center.' },
      { kind: 'valley', line: [v(100, 50), v(50, 100)], move: v(100, 100), text: 'bottom right corner to the center.' },
      {
        kind: 'valley',
        line: [v(50, 100), v(0, 50)],
        move: v(0, 100),
        text: 'bottom left corner to the center. folding all four corners in is called a blintz.',
      },
      { kind: 'flip', text: 'turn the model over.' },
      { kind: 'valley', line: [v(25, 25), v(75, 25)], move: v(50, 0), text: 'blintz again: fold the top corner to the center.' },
      { kind: 'valley', line: [v(75, 25), v(75, 75)], move: v(100, 50), text: 'right corner to the center.' },
      { kind: 'valley', line: [v(25, 75), v(75, 75)], move: v(50, 100), text: 'bottom corner to the center.' },
      { kind: 'valley', line: [v(25, 25), v(25, 75)], move: v(0, 50), text: 'left corner to the center.' },
      { kind: 'crease', line: [v(25, 50), v(75, 50)], move: v(50, 25), text: 'fold in half and unfold.' },
      { kind: 'crease', line: [v(50, 25), v(50, 75)], move: v(25, 50), text: 'fold in half the other way and unfold.' },
    ],
    finish:
      'number the inner flaps, color the outer squares, then push the four corners together from underneath and slide your fingers into the pockets.',
  },
];

export const all: readonly Model[] = [...basics, ...models];

export const upcoming: readonly Upcoming[] = [
  { name: 'crane', blurb: 'squash + petal folds' },
  { name: 'jumping frog', blurb: 'pleats + reverse folds' },
  { name: 'lily', blurb: 'frog base + curling' },
];

export const levels: readonly { level: Level; title: string }[] = [
  { level: 'basics', title: 'learn to fold' },
  { level: 'beginner', title: 'beginner' },
  { level: 'intermediate', title: 'intermediate' },
  { level: 'advanced', title: 'advanced' },
];
