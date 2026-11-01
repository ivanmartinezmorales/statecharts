// More animals, a couple of flowers and some things to fold. Simple folds wherever the shape allows.

import { v, type Line, type Step, type Vec2 } from './diagram';
import type { Model } from './models';
import { ears, forehead, pointUp } from './menagerie';

const diamond = [v(50, 0), v(100, 50), v(50, 100), v(0, 50)];
const mirror = (p: Vec2) => v(100 - p.x, p.y);
const mirrorLine = ([a, b]: Line): Line => [mirror(a), mirror(b)];

/** The crease that lays point `from` exactly on point `to`: their perpendicular bisector. */
function foldTo(from: Vec2, to: Vec2, reach = 12): Line {
  const mid = v((from.x + to.x) / 2, (from.y + to.y) / 2);
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const d = v(-(to.y - from.y) / len, (to.x - from.x) / len);
  return [v(mid.x - d.x * reach, mid.y - d.y * reach), v(mid.x + d.x * reach, mid.y + d.y * reach)];
}

const pointDown: Step = {
  kind: 'valley',
  line: [v(0, 50), v(100, 50)],
  move: v(50, 0),
  text: 'Start white side up with a corner pointing at you. Fold the top corner down to the bottom corner.',
};

const frogEye: Line = [v(18, 50), v(27, 77)];
const bellLobe: Line = [v(18, 50), v(36, 14)];
const butterflyWing = foldTo(v(50, 100), v(6, 40), 8);
const rabbitEar = foldTo(v(50, 100), v(28, 22), 6);
const scoopEdge: Line = [v(50, 100), v(20.71, 29.29)];

export const zoo: Model[] = [
  {
    slug: 'frog-face',
    name: 'Frog face',
    level: 'beginner',
    topic: 'animal',
    about: 'Wide mouth, eyes on top',
    color: '#5aa846',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointDown,
      {
        kind: 'valley',
        line: frogEye,
        move: v(0, 50),
        text: 'Fold the left corner up and in along a steep line, so its tip pokes up above the top edge. This is an eye.',
      },
      { kind: 'valley', line: mirrorLine(frogEye), move: v(100, 50), text: 'Fold the right corner the same way for the other eye.' },
      { kind: 'mountain', line: [v(25, 80), v(75, 80)], move: v(50, 100), text: 'Fold the bottom point behind to make a wide, flat mouth.' },
    ],
    finish: 'Draw a dot on each eye bump. Ribbit.',
    dots: [
      { x: 29, y: 45, r: 2.4 },
      { x: 71, y: 45, r: 2.4 },
      { x: 46, y: 60, r: 1 },
      { x: 54, y: 60, r: 1 },
    ],
  },
  {
    slug: 'owl-face',
    name: 'Owl face',
    level: 'beginner',
    topic: 'animal',
    about: 'Ear tufts and a beak',
    color: '#8a5a33',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointUp,
      ...ears(v(15, 20), 'Fold the left corner up and out so its point sticks out to the side. This is an ear tuft.', 'Fold the right corner the same way.'),
      forehead(27, 'Fold the top point down across the face so its tip just pokes out below the chin. This is the beak.'),
    ],
    finish: 'Draw two big round eyes just under the brow.',
    dots: [
      { x: 41, y: 38, r: 3.2 },
      { x: 59, y: 38, r: 3.2 },
    ],
  },
  {
    slug: 'rabbit-face',
    name: 'Rabbit face',
    level: 'beginner',
    topic: 'animal',
    about: 'Two long ears',
    color: '#c7b8a6',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointDown,
      { id: 'leftFlap', kind: 'valley', line: [v(50, 50), v(25, 75)], move: v(0, 50), text: 'Fold the left corner down to the bottom point.' },
      { id: 'rightFlap', kind: 'valley', line: [v(50, 50), v(75, 75)], move: v(100, 50), text: 'Fold the right corner down to the bottom point too. You have a diamond.' },
      {
        kind: 'valley',
        line: rabbitEar,
        move: v(50, 100),
        only: { movedIn: 'leftFlap' },
        text: 'Fold the point of the left flap up and out, past the top of the diamond. This is a long ear.',
      },
      {
        kind: 'valley',
        line: mirrorLine(rabbitEar),
        move: v(50, 100),
        only: { movedIn: 'rightFlap' },
        text: 'Fold the right flap up the same way for the other ear.',
      },
      { kind: 'mountain', line: [v(38, 88), v(62, 88)], move: v(50, 100), text: 'Fold the bottom point behind to blunt the chin.' },
    ],
    finish: 'Draw two eyes, a little nose and some whiskers.',
    dots: [
      { x: 42, y: 68, r: 1.8 },
      { x: 58, y: 68, r: 1.8 },
      { x: 50, y: 78, r: 1.6 },
    ],
  },
  {
    slug: 'fish',
    name: 'Fish',
    level: 'beginner',
    topic: 'animal',
    about: 'Pointed nose, forked tail',
    color: '#e98b3a',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointUp,
      ...ears(v(30, 0), 'Fold the left corner up so its point sticks out past the top. This is half of the tail.', 'Fold the right corner up the same way for the other half.'),
      forehead(20, 'Fold the top point down between the two tail points.'),
      { kind: 'rotate', deg: 90, text: 'Turn the model so the tail points right. The point on the left is the nose.' },
    ],
    finish: 'Draw an eye near the nose and a few scales.',
    dots: [{ x: 38, y: 25, r: 2 }],
  },
  {
    slug: 'crown',
    name: 'Crown',
    level: 'beginner',
    topic: 'thing',
    about: 'Three points and a band',
    color: '#edb51c',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointDown,
      {
        kind: 'valley',
        line: [v(0, 65), v(100, 65)],
        move: v(50, 100),
        text: 'Fold the bottom point up so it sticks out above the top edge. This is the middle point of the crown.',
      },
      {
        kind: 'valley',
        line: frogEye,
        move: v(0, 50),
        text: 'Fold the left corner up and in along a steep line, so its tip pokes above the top edge.',
      },
      { kind: 'valley', line: mirrorLine(frogEye), move: v(100, 50), text: 'Fold the right corner the same way. Three points.' },
    ],
    finish: 'Draw jewels on the band. Fold a big one from a large sheet to wear it.',
    dots: [
      { x: 38, y: 58, r: 2 },
      { x: 50, y: 58, r: 2.4 },
      { x: 62, y: 58, r: 2 },
    ],
  },
  {
    slug: 'butterfly',
    name: 'Butterfly',
    level: 'beginner',
    topic: 'animal',
    about: 'Two wings and a slim body',
    color: '#2d5bd0',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointDown,
      { id: 'leftFlap', kind: 'valley', line: [v(50, 50), v(25, 75)], move: v(0, 50), text: 'Fold the left corner down to the bottom point.' },
      { id: 'rightFlap', kind: 'valley', line: [v(50, 50), v(75, 75)], move: v(100, 50), text: 'Fold the right corner down to the bottom point too. You have a diamond.' },
      {
        id: 'leftWing',
        kind: 'valley',
        line: butterflyWing,
        move: v(50, 100),
        only: { movedIn: 'leftFlap' },
        text: 'Fold the point of the left flap up and out to the side, well past the diamond. This is a wing.',
      },
      {
        id: 'rightWing',
        kind: 'valley',
        line: mirrorLine(butterflyWing),
        move: v(50, 100),
        only: { movedIn: 'rightFlap' },
        text: 'Fold the right flap out the same way for the other wing.',
      },
      {
        kind: 'mountain',
        line: [v(30, 84), v(70, 84)],
        move: v(50, 100),
        only: { notMovedIn: ['leftWing', 'rightWing'] },
        text: 'Fold the bottom point of the diamond behind to shorten the body.',
      },
      {
        kind: 'mountain',
        line: [v(37.5, 50), v(37.5, 100)],
        move: v(25, 75),
        only: { notMovedIn: ['leftWing', 'rightWing'] },
        text: 'Fold the left side of the diamond behind to slim the body.',
      },
      {
        kind: 'mountain',
        line: [v(62.5, 50), v(62.5, 100)],
        move: v(75, 75),
        only: { notMovedIn: ['leftWing', 'rightWing'] },
        text: 'Fold the right side behind too.',
      },
    ],
    finish: 'Pinch the body and lift the wings a little so it looks ready to fly.',
  },
  {
    slug: 'sailboat',
    name: 'Sailboat',
    level: 'beginner',
    topic: 'thing',
    about: 'White sail, colored hull',
    color: '#d9412b',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointUp,
      {
        kind: 'mountain',
        line: [v(0, 30), v(100, 30)],
        move: v(50, 0),
        only: { half: 'bottom' },
        text: 'Fold the top point of the front layer behind, so it pokes out below the bottom. The white layer left standing is the sail; the point below is the keel.',
      },
      { kind: 'mountain', line: [v(20, 30), v(30, 50)], move: v(0, 50), text: 'Fold the left corner of the hull behind at an angle.' },
      { kind: 'mountain', line: [v(80, 30), v(70, 50)], move: v(100, 50), text: 'Fold the right corner behind the same way so the hull narrows at the bottom.' },
    ],
    finish: 'Draw a mast and a flag at the top of the sail.',
  },
  {
    slug: 'paper-hat',
    name: 'Paper hat',
    level: 'beginner',
    topic: 'thing',
    about: 'The classic newspaper hat',
    color: '#edb51c',
    paper: [v(0, 0), v(100, 0), v(100, 130), v(0, 130)],
    whiteUp: true,
    steps: [
      {
        kind: 'valley',
        line: [v(0, 65), v(100, 65)],
        move: v(50, 0),
        text: 'Use a rectangle, white side up. Fold it in half, top edge down to the bottom edge.',
      },
      { kind: 'valley', line: [v(50, 65), v(0, 115)], move: v(0, 65), text: 'Fold the top left corner down to the center line.' },
      { kind: 'valley', line: [v(50, 65), v(100, 115)], move: v(100, 65), text: 'Fold the top right corner down to the center line. The top is a point now.' },
      {
        kind: 'valley',
        line: [v(0, 115), v(100, 115)],
        move: v(50, 130),
        only: { half: 'top', at: 65 },
        text: 'Fold the front strip at the bottom up over the triangles. This is the brim.',
      },
      {
        kind: 'mountain',
        line: [v(0, 115), v(100, 115)],
        move: v(50, 130),
        only: { half: 'bottom', at: 65 },
        text: 'Fold the back strip up behind the same way.',
      },
    ],
    finish: 'Open the bottom and put it on. Fold one from a newspaper and it fits a grown-up head.',
  },
  {
    slug: 'ice-cream',
    name: 'Ice cream cone',
    level: 'beginner',
    topic: 'thing',
    about: 'A white scoop on a cone',
    color: '#c98b4a',
    paper: diamond,
    whiteUp: true,
    steps: [
      {
        kind: 'crease',
        line: [v(50, 0), v(50, 100)],
        move: v(100, 50),
        text: 'Start white side up with a corner pointing at you. Fold in half from side to side, then unfold.',
      },
      { kind: 'valley', line: scoopEdge, move: v(0, 50), text: 'Fold the lower left edge to the center crease.' },
      {
        kind: 'valley',
        line: mirrorLine(scoopEdge),
        move: v(100, 50),
        text: 'Fold the lower right edge to the center crease. The colored point is the cone; the white top is the scoop.',
      },
      { kind: 'mountain', line: [v(0, 10), v(100, 10)], move: v(50, 0), text: 'Fold the top point behind to round off the scoop.' },
    ],
    finish: 'Draw a crisscross pattern on the cone and sprinkles on the scoop.',
  },
  {
    slug: 'bell-flower',
    name: 'Bell flower',
    level: 'beginner',
    topic: 'flower',
    about: 'A hanging bell with two lobes',
    color: '#6c5bd0',
    paper: diamond,
    whiteUp: true,
    steps: [
      pointUp,
      {
        kind: 'valley',
        line: bellLobe,
        move: v(0, 50),
        text: 'Fold the left corner down along a steep line so its tip hangs below the bottom edge. This is the lip of the bell.',
      },
      { kind: 'valley', line: mirrorLine(bellLobe), move: v(100, 50), text: 'Fold the right corner the same way.' },
      { kind: 'mountain', line: [v(0, 8), v(100, 8)], move: v(50, 0), text: 'Fold the top point behind to blunt it where the stem joins.' },
    ],
    finish: 'Fold a stem and leaf and hang the bell from its top.',
  },
];
