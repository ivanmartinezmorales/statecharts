// The layers of the cutaway, top to bottom. `slice` is the rows of the 320 x 480 picture a layer takes. Each label
// names one component (see components.ts): `at` is the thing, `note` is the direction its label sits in, both in
// picture pixels. A label with `track` follows something that moves (see life.ts) instead of a fixed spot.

export type Label = { id: string; text: string; at: [number, number]; note: [number, number]; track?: 'worker' | 'rat' | 'train' }
export type Layer = { id: string; name: string; depth: string; slice: [number, number]; text: string; labels: Label[] }

export const LAYERS: Layer[] = [
  {
    id: 'street',
    name: 'The street',
    depth: 'Ground level',
    slice: [0, 104],
    text: 'Everything up here leans on what is below it. The lamp is wired from underground, the hydrant taps the water main, and the grate at the curb carries rain away. Tonight a road crew has the manhole open: the way down.',
    labels: [
      { id: 'street-lamp', text: 'Street lamp', at: [174, 55], note: [104, 18] },
      { id: 'road-crew', text: 'Road crew', at: [124, 86], note: [104, 44] },
      { id: 'manhole', text: 'Open manhole', at: [152, 98], note: [150, 70] },
      { id: 'storm-drain', text: 'Storm drain', at: [267, 103], note: [204, 60] },
    ],
  },
  {
    id: 'utilities',
    name: 'Pipes and cables',
    depth: 'About 1 to 2 meters down',
    slice: [104, 206],
    text: 'Just under the road is a crowded layer. Water and gas come in through pipes, electricity and internet through cables in concrete. Each runs at its own depth, so crews know where to dig. A building\'s basement sits right beside them.',
    labels: [
      { id: 'road', text: 'Road layers', at: [300, 113], note: [290, 150] },
      { id: 'water-main', text: 'Water main', at: [124, 140], note: [96, 160] },
      { id: 'gas-line', text: 'Gas line', at: [176, 130], note: [166, 158] },
      { id: 'power', text: 'Power cables', at: [213, 136], note: [196, 104] },
      { id: 'telecom', text: 'Internet cables', at: [253, 134], note: [262, 166] },
      { id: 'boiler', text: 'Boiler', at: [29, 168], note: [36, 112] },
    ],
  },
  {
    id: 'sewer',
    name: 'The sewer',
    depth: 'About 3 to 6 meters down',
    slice: [206, 290],
    text: 'Everything that goes down a drain ends up here, flowing downhill to a treatment plant. Brick sewers like this one can be well over a hundred years old. Workers climb down the manhole ladder to check on them.',
    labels: [
      { id: 'house-drain', text: 'House drain', at: [112, 207], note: [70, 230] },
      { id: 'ladder', text: 'Manhole ladder', at: [152, 210], note: [172, 199] },
      { id: 'brick-sewer', text: 'Brick sewer', at: [300, 208], note: [270, 222] },
      { id: 'sewer-worker', text: 'Sewer worker', at: [204, 240], note: [226, 228], track: 'worker' },
      { id: 'rats', text: 'Rats', at: [150, 262], note: [130, 248], track: 'rat' },
      { id: 'wastewater', text: 'Wastewater', at: [180, 276], note: [104, 286] },
    ],
  },
  {
    id: 'subway',
    name: 'The subway',
    depth: 'About 6 to 15 meters down',
    slice: [290, 380],
    text: 'Deeper still, trains run through a concrete box. Many old lines were built by digging up the street, building the box and covering it over again. Beside it, the building\'s piles reach past the tunnel toward the rock.',
    labels: [
      { id: 'piles', text: 'Building piles', at: [76, 330], note: [6, 300] },
      { id: 'tunnel-light', text: 'Tunnel light', at: [134, 311], note: [100, 292] },
      { id: 'train', text: 'Subway train', at: [226, 336], note: [232, 300], track: 'train' },
      { id: 'track', text: 'Track', at: [200, 366], note: [220, 378] },
    ],
  },
  {
    id: 'bedrock',
    name: 'Bedrock',
    depth: 'Below about 15 meters',
    slice: [380, 480],
    text: 'Solid rock can carry the heaviest loads, so tall buildings stand on it. The deepest tunnels are bored straight through it, bringing fresh water to the city from reservoirs far away.',
    labels: [
      { id: 'pile-footing', text: 'Pile footing', at: [17, 387], note: [34, 394] },
      { id: 'bedrock', text: 'Bedrock', at: [110, 440], note: [92, 456] },
      { id: 'water-tunnel', text: 'Water tunnel', at: [236, 430], note: [160, 384] },
    ],
  },
]
