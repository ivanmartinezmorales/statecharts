// What you can click on inside a layer: what it is, how it works, a few facts, and how to build its exploded 3D
// model. Numbers are typical for a big North American city; every city differs, so the facts say "about" and "often".
// Labels in layers.ts with no entry here are plain labels: they name a thing without opening anything.
//
// A model is a list of parts, from the inside out (a tube: a pipe or cable, its layers stepped back like a
// stripped wire) or from the bottom up (a stack: slabs and rings set on each other). Sizes are in model units.

import { PARTS, POWER_QUESTIONS, INTERNET_QUESTIONS } from './parts'

export type Fact = [label: string, value: string]
type Tube = { kind: 'tube'; parts: { name: string; color: string; r: number }[]; extras?: { name: string; color: string; shape: 'tape' | 'wire'; y: number }[] }
// A stack part sits on the one below unless it gives its own height `y` (so windings can sit around a core);
// `repeat` copies it upward every `pitch` (insulator sheds, turbine blade rows), `cols` copies it sideways every
// `gap` (a row of bushings). A stack with `axis: 'x'` lies on its side and pulls apart lengthwise, like a rotor
// sliding out of a generator.
type StackPart = { name: string; color: string; shape: 'box' | 'disc' | 'ring' | 'rails' | 'ties'; w: number; d: number; h: number; hole?: number; x?: number; y?: number; z?: number; repeat?: number; pitch?: number; cols?: number; gap?: number }
type Stack = { kind: 'stack'; axis?: 'x'; parts: StackPart[] }
export type Model = Tube | Stack
export type Journey = 'water' | 'wastewater' | 'power' | 'internet'
export type Component = { title: string; blurb: string; steps?: string[]; facts: Fact[]; questions?: Fact[]; model?: Model; journey?: Journey }

const WATER_STEPS = [
  'Treated water leaves the reservoirs and big tunnels already under pressure, because the source is higher than the city.',
  'Trunk mains, up to a meter or more across, carry it to each neighborhood.',
  'Distribution mains under every street form a loop, so water can reach any block from two directions.',
  'Valves every block or so let crews shut off one stretch to fix a break without cutting off the rest.',
  'A service line branches into each building through a shutoff valve and a meter.',
  'Tall buildings pump it to a rooftop tank, and it falls back down to the taps.',
]
const POWER_STEPS = [
  'A power plant spins generators that make electricity at about 10,000 to 25,000 volts.',
  'Transformers raise it to 115,000 volts or more for the long trip, because high voltage loses less on the way.',
  'At a substation near the city, transformers bring it down to about 13,000 volts for the streets.',
  'Feeder cables run under the streets in duct banks like this one.',
  'In dense cities they feed a network: transformers in vaults under the sidewalk, all tied together, so one cable failing does not black out the block.',
  'Those transformers drop it to 120/208 volts, which goes through a meter and a panel of breakers to every outlet.',
]
const SEWER_STEPS = [
  'Every sink, tub and toilet has a curved trap that holds water, so sewer gas cannot come back up into the room.',
  'A house drain, sloping about 2 cm per meter, carries everything out to the street. Vent pipes on the roof let air in so it flows smoothly.',
  'Street sewers slope gently downhill, joining bigger and bigger pipes. Where the land rises, pumping stations lift the flow.',
  'In many older cities the same sewers also take the rain from the storm drains: a combined sewer.',
  'An interceptor gathers a whole neighborhood\'s sewers and carries them to a treatment plant.',
  'In a heavy storm, more water arrives than the plant can treat; regulators let the overflow spill into a river so it does not back up into basements.',
]

export const COMPONENTS: Record<string, Component> = {
  'street-lamp': {
    journey: 'power',
    title: 'Street lamp',
    blurb: 'The end of a long trip for its electricity: from a power plant, through substations and the cables under this street, up the pole to the lamp.',
    facts: [['Power', 'About 50 to 150 watts for an LED head'], ['Height', 'Often 8 to 10 meters'], ['Fed by', 'A low-voltage street lighting circuit in a conduit under the sidewalk'], ['Switch', 'A small light sensor on top turns it on at dusk']],
  },
  hydrant: {
    journey: 'water',
    title: 'Fire hydrant',
    blurb: 'A tap on the water main for firefighters. It connects to the main through its own pipe and valve, so it always has full city pressure.',
    facts: [['Flow', 'Often 1,000 to 1,500 liters a minute or more'], ['Spacing', 'Usually every 100 meters or so along a street'], ['In cold places', 'The valve sits deep underground, below the frost line, so the hydrant drains empty and never freezes'], ['Color', 'Some cities color the cap to show how much water it can give']],
  },
  manhole: {
    journey: 'wastewater',
    title: 'Manhole',
    blurb: 'A brick or concrete shaft from the street down to the sewer, with iron rungs to climb. The lid is round so it can never fall through its own hole.',
    facts: [['Cover', 'Cast iron, about 100 to 150 kg'], ['Opening', 'About 60 cm across'], ['Spacing', 'At every bend and junction, and about every 100 meters along a straight sewer, so every stretch can be reached']],
    model: { kind: 'stack', parts: [
      { name: 'Precast base', color: '#7e7a72', shape: 'disc', w: 3.2, d: 3.2, h: 0.4 },
      { name: 'Riser ring', color: '#9a968c', shape: 'ring', w: 2.6, d: 2.6, h: 1.0, hole: 1.9 },
      { name: 'Riser ring', color: '#8a867c', shape: 'ring', w: 2.6, d: 2.6, h: 1.0, hole: 1.9 },
      { name: 'Cone', color: '#9a968c', shape: 'ring', w: 2.6, d: 2.6, h: 0.9, hole: 1.2 },
      { name: 'Iron frame', color: '#4a4a54', shape: 'ring', w: 1.7, d: 1.7, h: 0.25, hole: 1.25 },
      { name: 'Iron cover', color: '#5a5a66', shape: 'disc', w: 1.24, d: 1.24, h: 0.12 },
    ] },
  },
  'storm-drain': {
    journey: 'wastewater',
    title: 'Storm drain',
    blurb: 'Rain runs along the gutter into this grate. In older cities it joins the sewer (a combined system); in newer streets it has its own pipe straight to a river.',
    facts: [['Grate', 'Cast iron, with slots narrow enough for bike wheels'], ['Catch basin', 'A sump below the grate traps sand and trash, with a hood that keeps floating litter and sewer smells in'], ['In a storm', 'A combined sewer can fill up; the overflow goes to the river untreated, which is why many cities are building giant storage tunnels']],
  },
  road: {
    title: 'Road layers',
    blurb: 'A road is a sandwich. Each layer spreads the weight of a truck a bit wider, so the soil below never feels more than it can bear.',
    facts: [['Asphalt', 'About 5 to 10 cm of stone glued with bitumen'], ['Base', 'About 15 to 30 cm of concrete or packed crushed stone'], ['Subbase', 'Gravel that lets water drain away'], ['Why layers', 'A wheel presses on a patch the size of a book; by the soil it is spread over a table']],
    model: { kind: 'stack', parts: [
      { name: 'Soil', color: '#6b4a34', shape: 'box', w: 4, d: 2.4, h: 0.7 },
      { name: 'Gravel subbase', color: '#8a7a66', shape: 'box', w: 4, d: 2.4, h: 0.45 },
      { name: 'Concrete base', color: '#9a968c', shape: 'box', w: 4, d: 2.4, h: 0.5 },
      { name: 'Asphalt', color: '#2c2c34', shape: 'box', w: 4, d: 2.4, h: 0.25 },
    ] },
  },
  'water-main': {
    journey: 'water',
    title: 'Water main',
    blurb: 'Clean drinking water under pressure, on its way to every tap, hydrant and sprinkler on the block. It is one link in a looped grid that covers the whole city.',
    steps: WATER_STEPS,
    facts: [
      ['Pressure', 'About 40 to 80 psi (3 to 5.5 bar). The city is split into pressure zones by height, so low streets are not over-pressured and hills still get enough'],
      ['Size', 'Often 15 to 30 cm across under a street; trunk mains can be over a meter'],
      ['Made of', 'Ductile iron lined with cement mortar; older mains are cast iron, some over 100 years old'],
      ['Depth', 'About 1 to 2 meters, below the frost line so it never freezes'],
      ['Kept clean', 'A trace of chlorine stays in the water all the way to the tap, and crews flush mains through hydrants'],
      ['Breaks', 'Old cast iron can crack when the ground freezes and thaws; the loop means a break can be valved off while water flows around it'],
    ],
    model: { kind: 'tube', parts: [
      { name: 'Drinking water', color: '#4f9ac8', r: 0.7 },
      { name: 'Cement-mortar lining', color: '#c9c4b8', r: 0.8 },
      { name: 'Ductile iron wall', color: '#5a6a7e', r: 0.95 },
      { name: 'Polyethylene sleeve', color: '#2e3a5a', r: 1.02 },
    ] },
  },
  'water-service': {
    journey: 'water',
    title: 'Water service line',
    blurb: 'The building\'s own pipe off the main. It passes a shutoff valve under the sidewalk, then a meter in the basement that counts every liter.',
    facts: [['Size', 'About 2 to 5 cm for a house, bigger for an apartment building'], ['Made of', 'Copper or plastic; very old lines can be lead, which cities are replacing'], ['Valves', 'A curb valve under the sidewalk and a main shutoff inside'], ['Backflow', 'A check valve stops water from the building flowing back into the main']],
    model: { kind: 'tube', parts: [
      { name: 'Drinking water', color: '#4f9ac8', r: 0.55 },
      { name: 'Copper pipe', color: '#c4703a', r: 0.65 },
    ] },
  },
  'gas-line': {
    title: 'Gas line',
    blurb: 'Natural gas for stoves and boilers. It has no smell of its own, so a sulfur odor is added to make any leak easy to notice.',
    facts: [['Pressure', 'Mains often run at 15 to 60 psi; a regulator at each building drops it to a fraction of a psi'], ['Made of', 'Yellow polyethylene plastic; older lines are coated steel or cast iron'], ['Above it', 'A yellow warning tape about 30 cm up, then backfill, then the road'], ['Beside it', 'A copper tracer wire, so a plastic pipe can be found with a metal detector']],
    model: { kind: 'tube', parts: [
      { name: 'Natural gas', color: '#e8e2a0', r: 0.6 },
      { name: 'Polyethylene pipe', color: '#f2c230', r: 0.72 },
    ], extras: [
      { name: 'Copper tracer wire', color: '#d0804a', shape: 'wire', y: 0.95 },
      { name: 'Warning tape', color: '#f5d020', shape: 'tape', y: 1.9 },
    ] },
  },
  power: {
    journey: 'power',
    title: 'Power cables',
    blurb: 'The block\'s electricity, in plastic conduits set in concrete. The concrete protects the cables from shovels and helps carry their heat away.',
    steps: POWER_STEPS,
    questions: POWER_QUESTIONS,
    facts: [
      ['Voltage', 'Often about 13,000 volts in these feeders, stepped down to 120/208 volts near the buildings'],
      ['Current', 'Alternating current at 60 cycles a second (50 in Europe)'],
      ['Conductor', 'Copper or aluminum strands, as thick as a finger or more'],
      ['Around it', 'Insulation, semiconducting screens and a metal shield keep the high voltage inside and safe to touch'],
      ['Duct bank', 'Plastic conduits in concrete, with spares so new cables can be pulled through without digging'],
      ['Network', 'Several feeders supply each block, so if one fails the others carry the load'],
    ],
    model: { kind: 'tube', parts: [
      { name: 'Copper conductor', color: '#d98a4a', r: 0.35 },
      { name: 'Conductor screen', color: '#2a2a30', r: 0.42 },
      { name: 'XLPE insulation', color: '#e8e2d6', r: 0.7 },
      { name: 'Insulation screen', color: '#2a2a30', r: 0.76 },
      { name: 'Copper shield wires', color: '#c4703a', r: 0.82 },
      { name: 'Outer jacket', color: '#c4501f', r: 0.92 },
    ] },
  },
  telecom: {
    journey: 'internet',
    questions: INTERNET_QUESTIONS,
    title: 'Internet cables',
    blurb: 'Light pulses in strands of glass thinner than a hair carry phone calls, video and the web in and out of the block.',
    facts: [['Fiber', 'Glass about 125 micrometers thick, a bit more than a hair'], ['Speed', 'Light in glass travels about 200,000 km a second'], ['Count', 'One cable can hold hundreds of fibers'], ['Housing', 'Plastic innerducts, often green or orange']],
    model: { kind: 'tube', parts: [
      { name: 'Glass core', color: '#bfe6ff', r: 0.12 },
      { name: 'Glass cladding', color: '#8fc8e8', r: 0.3 },
      { name: 'Acrylate coating', color: '#e8e2d6', r: 0.42 },
      { name: 'Aramid strength yarn', color: '#e8c04a', r: 0.62 },
      { name: 'Jacket', color: '#3f8a5a', r: 0.75 },
    ] },
  },
  boiler: {
    title: 'Boiler',
    blurb: 'Burns gas from the street to heat water, which runs up to the radiators in every room. The smoke leaves through a flue up the chimney.',
    facts: [['Fuel', 'Natural gas from the gas line'], ['Heats', 'Water or steam for radiators and taps'], ['Flue', 'Carries exhaust up and out through the roof']],
    model: { kind: 'stack', parts: [
      { name: 'Base', color: '#4a3a30', shape: 'box', w: 2.2, d: 1.8, h: 0.3 },
      { name: 'Burner', color: '#ff8a30', shape: 'box', w: 1.8, d: 1.4, h: 0.5 },
      { name: 'Firebox', color: '#8a3a2a', shape: 'box', w: 2, d: 1.6, h: 0.9 },
      { name: 'Heat exchanger', color: '#a8b0bc', shape: 'box', w: 2, d: 1.6, h: 0.7 },
      { name: 'Flue collar', color: '#6a6e78', shape: 'disc', w: 0.7, d: 0.7, h: 0.6 },
    ] },
  },
  'house-drain': {
    journey: 'wastewater',
    title: 'House drain',
    blurb: 'Everything from the building\'s sinks, showers and toilets slides down this pipe into the sewer. No pump: just a steady slope.',
    facts: [['Size', 'About 10 to 15 cm across'], ['Slope', 'About 2 cm drop per meter, steep enough to carry solids, gentle enough to keep water with them'], ['Made of', 'Clay, cast iron or PVC plastic'], ['Cleanout', 'A capped opening where a plumber can push a snake through a clog']],
    model: { kind: 'tube', parts: [
      { name: 'Wastewater', color: '#7a8a5a', r: 0.5 },
      { name: 'Vitrified clay pipe', color: '#b07a5a', r: 0.68 },
    ] },
  },
  'brick-sewer': {
    journey: 'wastewater',
    title: 'Brick sewer',
    blurb: 'Many city sewers were laid in brick in the 1800s and still work. Their egg shape keeps even a small flow deep and fast enough to carry everything along.',
    steps: SEWER_STEPS,
    facts: [
      ['Age', 'Often well over 100 years'],
      ['Walls', 'Two or three rings of brick in mortar'],
      ['Flow', 'By gravity, at about 0.6 to 1 meter a second, fast enough that solids never settle'],
      ['Combined', 'Older sewers also take rain, and can overflow into rivers in big storms'],
      ['Upkeep', 'Robots with cameras crawl the pipes to find cracks; some are relined from inside without digging'],
    ],
    model: { kind: 'tube', parts: [
      { name: 'Wastewater', color: '#5f7a5a', r: 0.9 },
      { name: 'Inner brick ring', color: '#9a4a36', r: 1.1 },
      { name: 'Outer brick ring', color: '#7e3a2a', r: 1.3 },
      { name: 'Mortar and backfill', color: '#c9a78a', r: 1.4 },
    ] },
  },
  wastewater: {
    journey: 'wastewater',
    title: 'Wastewater',
    blurb: 'What goes down the drains, flowing downhill toward a treatment plant, where it is cleaned before going back to a river or the sea.',
    steps: SEWER_STEPS,
    facts: [['Mostly', 'Over 99% water'], ['Volume', 'A city of a million people sends roughly 300 to 500 million liters a day'], ['Treatment', 'Screens, settling tanks, bacteria and disinfection; the settled sludge can be turned into biogas and fertilizer']],
  },
  train: {
    title: 'Subway train',
    blurb: 'The train picks up power from a third rail beside the track through a sliding metal shoe.',
    facts: [['Power', 'About 600 to 750 volts DC from the third rail'], ['Car', 'About 15 to 18 meters long'], ['Speed', 'Often up to about 80 km an hour between stations']],
  },
  track: {
    title: 'Track',
    blurb: 'Two steel running rails hold the train; a third rail beside them carries its power. Everything sits on ties fixed to the tunnel\'s concrete floor.',
    facts: [['Gauge', '1,435 mm between the rails on most lines'], ['Third rail', 'About 600 to 750 volts DC, under a protective cover'], ['Ties', 'Wood or concrete, set in the floor']],
    model: { kind: 'stack', parts: [
      { name: 'Concrete floor', color: '#9a968c', shape: 'box', w: 4.4, d: 2.8, h: 0.35 },
      { name: 'Ties', color: '#6a4a30', shape: 'ties', w: 4, d: 2.2, h: 0.18 },
      { name: 'Running rails', color: '#a8b0bc', shape: 'rails', w: 4.4, d: 1.4, h: 0.22 },
      { name: 'Third rail and cover', color: '#e8c04a', shape: 'box', w: 4.4, d: 0.2, h: 0.2, z: 1.2 },
    ] },
  },
  piles: {
    title: 'Building piles',
    blurb: 'Soft soil cannot hold up a heavy building, so long columns reach down through it to stand on the rock below, like stilts.',
    facts: [['Made of', 'Steel H-beams or reinforced concrete'], ['How', 'Driven in by a pile driver, or cast in a drilled hole'], ['Carries', 'Each one can hold hundreds of tonnes']],
  },
  'pile-footing': {
    title: 'Pile footing',
    blurb: 'Why down here? Rock barely squeezes under weight, while soil sinks. Each pile ends on the rock (or is socketed into it) so the building can never settle or tilt.',
    facts: [['Why rock', 'Rock can carry far more load than soil, and does not shrink when it dries'], ['Socket', 'Often drilled a meter or more into the rock and filled with concrete'], ['Tall towers', 'Stand on rock wherever it is close enough to reach']],
    model: { kind: 'stack', parts: [
      { name: 'Bedrock', color: '#5a5866', shape: 'box', w: 3.4, d: 3.4, h: 0.8 },
      { name: 'Rock socket (concrete)', color: '#9a968c', shape: 'disc', w: 1.2, d: 1.2, h: 0.8 },
      { name: 'Footing cap', color: '#b0aca2', shape: 'box', w: 1.8, d: 1.8, h: 0.4 },
      { name: 'Steel pile', color: '#7f8fa6', shape: 'box', w: 0.5, d: 0.5, h: 2.2 },
    ] },
  },
  bedrock: {
    title: 'Bedrock',
    blurb: 'Under many cities lies hard, ancient rock. Under Manhattan it is a layered rock called schist, hundreds of millions of years old, and the tallest towers cluster where it is close to the surface.',
    facts: [['Rock here', 'Schist: flaky layers squeezed and heated deep underground long ago'], ['Strength', 'Can carry the weight of a skyscraper'], ['Water', 'Seeps through its cracks, so deep tunnels must be lined']],
  },
  'water-tunnel': {
    journey: 'water',
    title: 'Water tunnel',
    blurb: 'Why so deep? Bored through solid rock, a tunnel is out of the way of everything above, and the rock holds the huge water pressure in. Shafts rise from it to the mains under the streets.',
    steps: WATER_STEPS,
    facts: [['Depth', 'Some city water tunnels run 150 to 250 meters down'], ['Size', 'Several meters across'], ['Lining', 'Concrete, sometimes with a steel liner'], ['Carries', 'Fresh water from reservoirs far outside the city, by gravity alone'], ['Backup', 'Big cities build a second and third tunnel so one can be shut for repairs']],
    model: { kind: 'tube', parts: [
      { name: 'Fresh water', color: '#4f9ac8', r: 1.1 },
      { name: 'Steel liner', color: '#7f8fa6', r: 1.18 },
      { name: 'Concrete lining', color: '#b0aca2', r: 1.45 },
      { name: 'Grouted rock', color: '#5a5866', r: 1.8 },
    ] },
  },
  ...PARTS,
}
