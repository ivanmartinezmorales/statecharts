import { v, type Dot, type Only, type Step, type Vec2 } from '../../rendering/origami/model';
import { advanced, techniques } from './advanced';
import { menagerie } from './menagerie';
import { zoo } from './zoo';
import { effort } from './effort';

export type Level = 'basics' | 'beginner' | 'intermediate' | 'advanced';
export type Topic = 'technique' | 'animal' | 'flower' | 'thing';

export interface Model {
  readonly slug: string;
  readonly name: string;
  readonly level: Level;
  readonly topic: Topic;
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
    topic: 'technique',
    about: 'Dashed line, fold toward you',
    color: '#2d5bd0',
    paper: square,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 100),
        text: 'A dashed line is a valley fold. The paper folds toward you, so the crease sinks like a valley. Bring the bottom edge up to the top.',
      },
    ],
    finish: 'The most common fold in origami. When a diagram just says "fold", it means this.',
  },
  {
    slug: 'mountain-fold',
    name: 'Mountain fold',
    level: 'basics',
    topic: 'technique',
    about: 'Dash-dot line, fold away',
    color: '#1f8a84',
    paper: square,
    whiteUp: false,
    steps: [
      {
        kind: 'mountain',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 100),
        text: 'A dash-dot line is a mountain fold. The paper folds away from you, behind the model, and the crease rises like a ridge. The hollow arrowhead means "behind".',
      },
    ],
    finish: 'A mountain fold is just a valley fold seen from the other side.',
  },
  {
    slug: 'crease',
    name: 'Fold and unfold',
    level: 'basics',
    topic: 'technique',
    about: 'Pre-crease a guide line',
    color: '#edb51c',
    paper: square,
    whiteUp: true,
    steps: [
      {
        kind: 'crease',
        line: [v(0, 0), v(100, 100)],
        move: v(100, 0),
        text: 'An arrow that comes back on itself means fold, make a sharp crease, then unfold. Creases act as guides for later steps.',
      },
      {
        kind: 'crease',
        line: [v(100, 0), v(0, 100)],
        move: v(0, 0),
        text: 'Do it again on the other diagonal. Where creases cross is the exact center of the paper.',
      },
    ],
    finish: 'Sharp creases make everything after them easier. Run a fingernail along each one.',
  },
  {
    slug: 'turn-over',
    name: 'Turn over',
    level: 'basics',
    topic: 'technique',
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
    finish: 'The folded corner is now behind. Turning over shows you the other side of every layer.',
  },
  {
    slug: 'rotate',
    name: 'Rotate',
    level: 'basics',
    topic: 'technique',
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
        text: 'A curved arrow around the model means rotate it flat on the table. Here, a quarter turn clockwise.',
      },
    ],
    finish: 'Rotating never changes the paper, only your point of view. Diagrams rotate to keep the next fold easy to reach.',
  },
];

// Which half of the unfolded sheet a face came from; after the first fold this tells front layers from back ones.
const topHalf: Only = { half: 'top' };
const bottomHalf: Only = { half: 'bottom' };
// The helmet's body, leaving out the two side flaps.
const body = { notMovedIn: ['right', 'left'] } as const;

const models: Model[] = [
  {
    slug: 'dog',
    name: 'Dog face',
    level: 'beginner',
    topic: 'animal',
    about: 'Your first real model',
    color: '#b98a55',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 0),
        text: 'Start with the white side up and a corner pointing at you. Fold the top corner down to the bottom corner.',
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
        text: 'Fold just the front layer of the bottom point up. This is the snout.',
      },
      {
        kind: 'mountain',
        line: [v(35, 85), v(65, 85)],
        move: v(50, 100),
        only: bottomHalf,
        text: 'Fold the back layer behind along the same line so the chin is flat.',
      },
    ],
    finish: 'Draw on eyes and a nose. Woof.',
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
    topic: 'thing',
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
        text: 'Fold the right corner across so its tip touches the left edge. The top edge of the flap should end up level.',
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
        text: 'Fold the front layer of the top point down. Tuck it into the pocket of the flap if you like.',
      },
      {
        kind: 'mountain',
        line: [v(29.29, 20.71), v(70.71, 20.71)],
        move: v(50, 0),
        only: topHalf,
        text: 'Fold the back layer down behind.',
      },
    ],
    finish: 'Squeeze the sides to open the cup. It holds water for a minute or two.',
  },
  {
    slug: 'airplane',
    name: 'Paper airplane',
    level: 'beginner',
    topic: 'thing',
    about: 'The classic dart',
    color: '#2d5bd0',
    paper: letter,
    whiteUp: false,
    steps: [
      {
        kind: 'crease',
        line: [v(42.5, 0), v(42.5, 110)],
        move: v(85, 55),
        text: 'Use a letter-sized sheet. Fold it in half lengthwise and unfold to mark the center.',
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
        text: 'Fold the new left edge to the center crease. The nose gets sharper.',
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
        only: { half: 'left', at: 42.5 },
        text: 'Fold the front wing down so its top edge lines up with the bottom of the body.',
      },
      {
        kind: 'mountain',
        line: [v(42.5, 0), v(30, 110)],
        move: v(5, 105),
        only: { half: 'right', at: 42.5 },
        text: 'Fold the back wing the same way, behind.',
      },
      { kind: 'rotate', deg: 90, text: 'Turn it on its side so it points the way it will fly.' },
    ],
    finish: 'Open the wings so they sit flat, pinch the body, and throw it level and gently.',
  },
  {
    slug: 'heart',
    name: 'Heart',
    level: 'beginner',
    topic: 'thing',
    about: 'Six folds, no cuts',
    color: '#d9412b',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(25, 25), v(75, 25)],
        move: v(50, 0),
        text: 'Start white side up with a corner pointing at you. Fold the top corner down to the center.',
      },
      {
        kind: 'valley',
        line: [v(0, 62.5), v(100, 62.5)],
        move: v(50, 100),
        text: 'Fold the bottom corner up to the top edge.',
      },
      {
        kind: 'valley',
        line: [v(50, 62.5), v(81.25, 31.25)],
        move: v(100, 50),
        text: 'Fold the right half of the bottom edge up so it lines up with the center.',
      },
      {
        kind: 'valley',
        line: [v(50, 62.5), v(18.75, 31.25)],
        move: v(0, 50),
        text: 'Do the same on the left. The outline is already a heart.',
      },
      {
        kind: 'mountain',
        line: [v(56.25, 18.75), v(71.88, 21.88)],
        move: v(62.5, 12.5),
        text: 'Fold the point of the right lobe behind to round it off.',
      },
      {
        kind: 'mountain',
        line: [v(43.75, 18.75), v(28.13, 21.88)],
        move: v(37.5, 12.5),
        text: 'Round off the left lobe the same way.',
      },
    ],
    finish: 'Fold the side corners behind too if you want a softer heart. Makes a good card insert.',
  },
  {
    slug: 'tulip',
    name: 'Tulip',
    level: 'beginner',
    topic: 'flower',
    about: 'Three folds, two petals',
    color: '#e98ba8',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 0),
        text: 'Start white side up with a corner pointing at you. Fold the top corner down to the bottom corner.',
      },
      {
        kind: 'valley',
        line: [v(50, 100), v(17.5, 40.45)],
        move: v(0, 50),
        text: 'Fold the left corner up so it pokes above the top edge, a little left of center. This is a petal.',
      },
      {
        kind: 'valley',
        line: [v(50, 100), v(82.5, 40.45)],
        move: v(100, 50),
        text: 'Fold the right corner up the same way so the petals cross.',
      },
    ],
    finish: 'Fold a long green kite for a stem and tape the flower on top.',
  },
  {
    slug: 'envelope',
    name: 'Envelope',
    level: 'beginner',
    topic: 'thing',
    about: 'Four folds, holds a note',
    color: '#edb51c',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(25, 0), v(25, 100)],
        move: v(0, 50),
        text: 'Start white side up with a corner pointing at you. Fold the left corner to the center.',
      },
      {
        kind: 'valley',
        line: [v(75, 0), v(75, 100)],
        move: v(100, 50),
        text: 'Fold the right corner to the center.',
      },
      {
        kind: 'valley',
        line: [v(0, 65), v(100, 65)],
        move: v(50, 100),
        text: 'Fold the bottom corner up past the center. This is the pocket.',
      },
      {
        kind: 'valley',
        line: [v(0, 30), v(100, 30)],
        move: v(50, 0),
        text: 'Fold the top corner down over the pocket to close it.',
      },
    ],
    finish: 'Slip a note inside before the last fold, then tuck the point under the pocket edge to seal it.',
  },
  {
    slug: 'house',
    name: 'House',
    level: 'beginner',
    topic: 'thing',
    about: 'Cupboard folds and a roof',
    color: '#b98a55',
    paper: square,
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 50), v(100, 50)],
        move: v(50, 0),
        text: 'Start white side up. Fold the top edge down to the bottom edge.',
      },
      {
        kind: 'crease',
        line: [v(50, 50), v(50, 100)],
        move: v(100, 75),
        text: 'Fold in half from side to side and unfold.',
      },
      {
        kind: 'valley',
        line: [v(25, 50), v(25, 100)],
        move: v(0, 75),
        text: 'Fold the left edge to the center crease.',
      },
      {
        kind: 'valley',
        line: [v(75, 50), v(75, 100)],
        move: v(100, 75),
        text: 'Fold the right edge to the center crease. Folding both sides to the middle is called a cupboard fold.',
      },
      {
        kind: 'mountain',
        line: [v(25, 75), v(50, 50)],
        move: v(25, 50),
        text: 'Fold the top left corner behind at an angle to start the roof.',
      },
      {
        kind: 'mountain',
        line: [v(75, 75), v(50, 50)],
        move: v(75, 50),
        text: 'Fold the top right corner behind to finish the roof.',
      },
    ],
    finish: 'The seam down the middle is the front door. Draw windows on either side.',
  },
  {
    slug: 'penguin',
    name: 'Penguin',
    level: 'beginner',
    topic: 'animal',
    about: 'Two-tone, with a beak',
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
        line: [v(20, 0), v(20, 100)],
        move: v(0, 50),
        text: 'Fold the left corner in, stopping short of the center. This is a wing.',
      },
      {
        kind: 'valley',
        line: [v(80, 0), v(80, 100)],
        move: v(100, 50),
        text: 'Fold the right corner in the same amount. The white strip between the wings is the belly.',
      },
      {
        id: 'head',
        kind: 'valley',
        line: [v(0, 22), v(100, 22)],
        move: v(50, 0),
        text: 'Fold the top corner down to make the head.',
      },
      {
        kind: 'valley',
        line: [v(0, 36), v(100, 36)],
        move: v(50, 44),
        only: { movedIn: 'head' },
        text: 'Fold the tip of the head back up a little. The white point is the beak.',
      },
      {
        kind: 'mountain',
        line: [v(0, 86), v(100, 86)],
        move: v(50, 100),
        text: 'Fold the bottom corner behind so the penguin can stand flat.',
      },
    ],
    finish: 'Draw two eyes under the hood, either side of the beak.',
    dots: [
      { x: 35, y: 36, r: 1.8 },
      { x: 65, y: 36, r: 1.8 },
    ],
  },
  {
    slug: 'kabuto',
    name: 'Samurai helmet',
    level: 'intermediate',
    topic: 'thing',
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
        text: 'Fold the left corner down to the bottom point. You have a diamond.',
      },
      {
        kind: 'valley',
        line: [v(50, 75), v(75, 75)],
        move: v(50, 95),
        only: { movedIn: 'right' },
        text: 'Fold the bottom point of the right flap up to the top.',
      },
      {
        kind: 'valley',
        line: [v(25, 75), v(50, 75)],
        move: v(50, 95),
        only: { movedIn: 'left' },
        text: 'Fold the bottom point of the left flap up to the top.',
      },
      {
        kind: 'valley',
        line: [v(57, 57), v(50, 75)],
        move: v(51, 60),
        only: { movedIn: 'right' },
        text: 'Fold the tip of the right flap out at an angle. This is a horn.',
      },
      {
        kind: 'valley',
        line: [v(43, 57), v(50, 75)],
        move: v(49, 60),
        only: { movedIn: 'left' },
        text: 'Fold the left tip out to make the second horn.',
      },
      {
        kind: 'valley',
        line: [v(37.5, 87.5), v(62.5, 87.5)],
        move: v(50, 100),
        only: { ...topHalf, ...body },
        text: 'Fold just the front layer of the bottom point up to the middle line.',
      },
      {
        kind: 'valley',
        line: [v(25, 75), v(75, 75)],
        move: v(50, 80),
        only: { ...topHalf, ...body },
        text: 'Fold that strip up again along the middle line. This is the brim.',
      },
      {
        kind: 'mountain',
        line: [v(25, 75), v(75, 75)],
        move: v(50, 90),
        only: { ...bottomHalf, ...body },
        text: 'Fold the back point up behind (or tuck it inside).',
      },
    ],
    finish: 'Open the bottom and it sits on your head if you started with a big sheet. Newspaper works.',
  },
  {
    slug: 'fortune-teller',
    name: 'Fortune teller',
    level: 'intermediate',
    topic: 'thing',
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
        text: 'Bottom left corner to the center. Folding all four corners in is called a blintz.',
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
  {
    slug: 'whale',
    name: 'Whale',
    level: 'intermediate',
    topic: 'animal',
    about: 'Kite base, folded in half',
    color: '#2d5bd0',
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
        text: 'Fold the top left edge to the center crease. This is half of a kite base.',
      },
      {
        kind: 'valley',
        line: [v(50, 0), v(79.29, 70.71)],
        move: v(100, 50),
        text: 'Fold the top right edge to the center crease. You have a kite.',
      },
      {
        kind: 'valley',
        line: [v(20.71, 70.71), v(79.29, 70.71)],
        move: v(50, 100),
        text: 'Fold the bottom corner up over the flaps. This becomes the head.',
      },
      {
        kind: 'mountain',
        line: [v(50, 0), v(50, 100)],
        move: v(100, 35),
        text: 'Fold the right half behind along the center crease.',
      },
      { kind: 'rotate', deg: 90, text: 'Turn the model so the narrow point faces right. That point is the tail.' },
      {
        kind: 'valley',
        line: [v(56, 50), v(60.31, 45.69)],
        move: v(70.71, 50),
        text: 'Fold the tail up so it stands straight.',
      },
    ],
    finish: 'Draw an eye near the front. Curl the tail a little with your finger so it looks like it is diving.',
    dots: [{ x: 10, y: 40, r: 1.6 }],
  },
  {
    slug: 'cicada',
    name: 'Cicada',
    level: 'intermediate',
    topic: 'animal',
    about: 'Wings, layers and a tucked body',
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
        id: 'right',
        kind: 'valley',
        line: [v(50, 50), v(75, 25)],
        move: v(100, 50),
        text: 'Fold the right corner up to the top corner.',
      },
      {
        id: 'left',
        kind: 'valley',
        line: [v(50, 50), v(25, 25)],
        move: v(0, 50),
        text: 'Fold the left corner up to the top corner. You have a diamond.',
      },
      {
        kind: 'valley',
        line: [v(50, 32.2), v(72.1, 27.9)],
        move: v(50, 0),
        only: { movedIn: 'right' },
        text: 'Fold the right flap down at an angle so its point sticks out below the diamond. This is a wing.',
      },
      {
        kind: 'valley',
        line: [v(50, 32.2), v(27.9, 27.9)],
        move: v(50, 0),
        only: { movedIn: 'left' },
        text: 'Fold the left flap down the same way for the second wing.',
      },
      {
        kind: 'valley',
        line: [v(0, 20), v(100, 20)],
        move: v(50, 0),
        only: { ...bottomHalf, ...body },
        text: 'Fold the front layer of the top corner down.',
      },
      {
        kind: 'valley',
        line: [v(0, 12), v(100, 12)],
        move: v(50, 0),
        only: { ...topHalf, ...body },
        text: 'Fold the back layer down too, stopping a little above the first. This makes the head.',
      },
      {
        kind: 'mountain',
        line: [v(33, 0), v(33, 100)],
        move: v(0, 50),
        text: 'Fold the left side behind.',
      },
      {
        kind: 'mountain',
        line: [v(67, 0), v(67, 100)],
        move: v(100, 50),
        text: 'Fold the right side behind. The body narrows and the wings spread.',
      },
    ],
    finish: 'A traditional Japanese model, known as semi. Add two eyes on the head band.',
    dots: [
      { x: 43, y: 21, r: 1.6 },
      { x: 57, y: 21, r: 1.6 },
    ],
  },
];

/** Levels follow the effort estimate, so each shelf holds models of a similar difficulty. */
const leveled = (m: Model): Model =>
  m.level === 'basics' ? m : { ...m, level: (['beginner', 'intermediate', 'advanced'] as const)[effort(m).difficulty - 1]! };

export const all: readonly Model[] = [...basics, ...techniques, ...models, ...menagerie, ...zoo, ...advanced].map(leveled);

export const upcoming: readonly Upcoming[] = [
];

export const levels: readonly { level: Level; title: string }[] = [
  { level: 'basics', title: 'Symbols' },
  { level: 'beginner', title: 'Beginner' },
  { level: 'intermediate', title: 'Intermediate' },
  { level: 'advanced', title: 'Advanced' },
];
