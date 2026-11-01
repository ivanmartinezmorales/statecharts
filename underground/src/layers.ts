// The layers of the cutaway, top to bottom. `top` and `bottom` are the rows of the 320 x 480 picture a layer's
// close-up shows; `slice` is where the exploded view cuts it, so the slices meet edge to edge. Each label points at
// one thing: `at` is that thing, `note` is where its label sits (top-left), both in picture pixels.

export type Label = { text: string; at: [number, number]; note: [number, number] }
export type Layer = { id: string; name: string; depth: string; top: number; bottom: number; slice: [number, number]; text: string; labels: Label[] }

export const LAYERS: Layer[] = [
  {
    id: 'street',
    name: 'The street',
    depth: 'Ground level',
    top: 8,
    bottom: 106,
    slice: [0, 104],
    text: 'Everything up here leans on what is below it. The lamp is wired from underground, the hydrant taps the water main, and the grate at the curb carries rain away. Tonight a road crew has the manhole open: the way down.',
    labels: [
      { text: 'Street lamp', at: [174, 55], note: [104, 18] },
      { text: 'Road crew', at: [124, 86], note: [104, 44] },
      { text: 'Open manhole', at: [152, 98], note: [104, 70] },
      { text: 'Storm drain', at: [267, 103], note: [204, 60] },
    ],
  },
  {
    id: 'utilities',
    name: 'Pipes and cables',
    depth: 'About 1 to 2 meters down',
    top: 100,
    bottom: 206,
    slice: [104, 206],
    text: 'Just under the road is a crowded layer. Water and gas come in through pipes, electricity and internet through cables in concrete. Each runs at its own depth, so crews know where to dig. A building\'s basement sits right beside them.',
    labels: [
      { text: 'Asphalt, concrete, gravel', at: [300, 113], note: [218, 166] },
      { text: 'Water main', at: [124, 140], note: [96, 160] },
      { text: 'Gas line', at: [176, 130], note: [166, 158] },
      { text: 'Power cables', at: [213, 136], note: [196, 104] },
      { text: 'Boiler', at: [29, 168], note: [36, 112] },
    ],
  },
  {
    id: 'sewer',
    name: 'The sewer',
    depth: 'About 3 to 6 meters down',
    top: 196,
    bottom: 292,
    slice: [206, 290],
    text: 'Everything that goes down a drain ends up here, flowing downhill to a treatment plant. Brick sewers like this one can be well over a hundred years old. Workers climb down the manhole ladder to check on them.',
    labels: [
      { text: 'Manhole ladder', at: [152, 210], note: [172, 199] },
      { text: 'House drain', at: [112, 207], note: [8, 210] },
      { text: 'Sewer worker', at: [204, 240], note: [226, 228] },
      { text: 'Wastewater', at: [180, 274], note: [104, 238] },
    ],
  },
  {
    id: 'subway',
    name: 'The subway',
    depth: 'About 6 to 15 meters down',
    top: 290,
    bottom: 382,
    slice: [290, 380],
    text: 'Deeper still, trains run through a concrete box. Many old lines were built by digging up the street, building the box and covering it over again. Beside it, the building\'s piles reach past the tunnel toward the rock.',
    labels: [
      { text: 'Subway train', at: [226, 336], note: [232, 292] },
      { text: 'Tunnel light', at: [134, 311], note: [100, 292] },
      { text: 'Building piles', at: [76, 330], note: [6, 300] },
    ],
  },
  {
    id: 'bedrock',
    name: 'Bedrock',
    depth: 'Below about 15 meters',
    top: 374,
    bottom: 480,
    slice: [380, 480],
    text: 'Solid rock can carry the heaviest loads, so tall buildings stand on it. The deepest tunnels are bored straight through it, bringing fresh water to the city from reservoirs far away.',
    labels: [
      { text: 'Pile footing', at: [17, 387], note: [34, 394] },
      { text: 'Bedrock', at: [110, 440], note: [92, 456] },
      { text: 'Water tunnel', at: [236, 430], note: [160, 384] },
    ],
  },
]
