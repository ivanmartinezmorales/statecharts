// What you can click on inside a layer: what it is, a few facts, and how to build its exploded 3D model.
// Numbers are typical for a big city's streets; every city differs, so the facts say "about" and "often".
//
// A model is a list of parts, from the inside out (a tube: a pipe or cable, its layers stepped back like a
// stripped wire) or from the bottom up (a stack: slabs and rings set on each other). Sizes are in model units.

export type Fact = [label: string, value: string]
type Tube = { kind: 'tube'; parts: { name: string; color: string; r: number }[]; extras?: { name: string; color: string; shape: 'tape' | 'wire'; y: number }[] }
type Stack = { kind: 'stack'; parts: { name: string; color: string; shape: 'box' | 'disc' | 'ring' | 'rails' | 'ties'; w: number; d: number; h: number; hole?: number; z?: number }[] }
export type Model = Tube | Stack
export type Journey = 'water' | 'wastewater'
export type Component = { title: string; blurb: string; facts: Fact[]; model?: Model; journey?: Journey }

export const COMPONENTS: Record<string, Component> = {
  'street-lamp': {
    title: 'Street lamp',
    blurb: 'Its power comes up from a cable under the sidewalk, and a light sensor turns it on at dusk.',
    facts: [['Power', 'About 50 to 150 watts for an LED head'], ['Height', 'Often 8 to 10 meters'], ['Fed by', 'A low-voltage cable in a conduit below the sidewalk']],
  },
  'road-crew': {
    title: 'Road crew',
    blurb: 'Before anyone digs, every pipe and cable below is marked on the road in colored paint: blue for water, yellow for gas, red for power, orange for telecom, green for sewer.',
    facts: [['Tools', 'A jackhammer to break the asphalt, cones and a barricade to keep traffic away'], ['Rule', 'Call before you dig, so the lines are marked first'], ['Flagger', 'Turns the STOP / SLOW sign to let cars pass one way at a time']],
  },
  manhole: {
    title: 'Manhole',
    blurb: 'A brick or concrete shaft from the street down to the sewer, with iron rungs to climb. The lid is round so it can never fall through its own hole.',
    facts: [['Cover', 'Cast iron, about 100 to 150 kg'], ['Opening', 'About 60 cm across'], ['Spacing', 'Often one every 100 meters or so along a sewer']],
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
    title: 'Storm drain',
    blurb: 'Rain runs along the gutter into this grate and down a pipe to the sewer, or in newer streets to its own pipe that empties into a river.',
    facts: [['Grate', 'Cast iron, with slots narrow enough for bike wheels'], ['Catch basin', 'A sump below the grate traps sand and trash before the pipe']],
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
    blurb: 'Clean drinking water under pressure, on its way to every tap in the block. A smaller pipe branches off it into each building.',
    facts: [['Pressure', 'About 40 to 80 psi (3 to 5.5 bar), enough to lift water several floors'], ['Size', 'Often 15 to 30 cm across under a street; trunk mains can be over a meter'], ['Made of', 'Ductile iron lined with cement mortar; older mains are cast iron'], ['Depth', 'Below the frost line, so it never freezes']],
    model: { kind: 'tube', parts: [
      { name: 'Drinking water', color: '#4f9ac8', r: 0.7 },
      { name: 'Cement-mortar lining', color: '#c9c4b8', r: 0.8 },
      { name: 'Ductile iron wall', color: '#5a6a7e', r: 0.95 },
      { name: 'Polyethylene sleeve', color: '#2e3a5a', r: 1.02 },
    ] },
  },
  'gas-line': {
    title: 'Gas line',
    blurb: 'Natural gas for stoves and boilers. It has no smell of its own, so a sulfur odor is added to make any leak easy to notice.',
    facts: [['Pressure', 'Mains often run at 15 to 60 psi; into a home it is a fraction of a psi'], ['Made of', 'Yellow polyethylene plastic; older lines are coated steel or cast iron'], ['Above it', 'A yellow warning tape about 30 cm up, then backfill, then the road'], ['Beside it', 'A copper tracer wire, so a plastic pipe can be found with a metal detector']],
    model: { kind: 'tube', parts: [
      { name: 'Natural gas', color: '#e8e2a0', r: 0.6 },
      { name: 'Polyethylene pipe', color: '#f2c230', r: 0.72 },
    ], extras: [
      { name: 'Copper tracer wire', color: '#d0804a', shape: 'wire', y: 0.95 },
      { name: 'Warning tape', color: '#f5d020', shape: 'tape', y: 1.9 },
    ] },
  },
  power: {
    title: 'Power cables',
    blurb: 'Electricity for the block runs in plastic conduits set in concrete, which protects the cables and helps carry their heat away.',
    facts: [['Voltage', 'Often about 13,000 volts here, stepped down to 120/240 volts near the buildings'], ['Conductor', 'Copper or aluminum strands'], ['Around it', 'Insulation, a semiconducting screen and a metal shield, so the high voltage stays inside'], ['Duct bank', 'Plastic conduits in concrete, with spares for future cables']],
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
    facts: [['Size', 'About 10 to 15 cm across'], ['Slope', 'About 2 cm drop per meter'], ['Made of', 'Clay, cast iron or PVC plastic']],
    model: { kind: 'tube', parts: [
      { name: 'Wastewater', color: '#7a8a5a', r: 0.5 },
      { name: 'Vitrified clay pipe', color: '#b07a5a', r: 0.68 },
    ] },
  },
  'brick-sewer': {
    journey: 'wastewater',
    title: 'Brick sewer',
    blurb: 'Many city sewers were laid in brick in the 1800s and still work. Their egg shape keeps a thin trickle moving fast enough to carry everything along.',
    facts: [['Age', 'Often well over 100 years'], ['Walls', 'Two or three rings of brick in mortar'], ['Flow', 'By gravity, downhill to a treatment plant'], ['Combined', 'Older sewers also take rain, and can overflow in big storms']],
    model: { kind: 'tube', parts: [
      { name: 'Wastewater', color: '#5f7a5a', r: 0.9 },
      { name: 'Inner brick ring', color: '#9a4a36', r: 1.1 },
      { name: 'Outer brick ring', color: '#7e3a2a', r: 1.3 },
      { name: 'Mortar and backfill', color: '#c9a78a', r: 1.4 },
    ] },
  },
  'sewer-worker': {
    title: 'Sewer worker',
    blurb: 'Crews walk the big sewers to check for cracks, roots and blockages. Before going down they test the air, and someone always stays at the top.',
    facts: [['Gear', 'A gas detector, a harness on a line, a headlamp and waders'], ['Air', 'Fans blow fresh air down the manhole first'], ['Today', 'Many pipes are now checked by small camera robots instead']],
  },
  rats: {
    title: 'Sewer rats',
    blurb: 'Brown rats are good swimmers and climbers, and can squeeze through a gap about the width of a thumb.',
    facts: [['Swim', 'They can hold their breath for a few minutes'], ['Teeth', 'Strong enough to gnaw through soft pipe and wood']],
  },
  wastewater: {
    journey: 'wastewater',
    title: 'Wastewater',
    blurb: 'What goes down the drains, flowing downhill toward a treatment plant, where it is cleaned before going back to a river or the sea.',
    facts: [['Speed', 'About 0.6 to 1 meter a second, fast enough to keep solids moving'], ['Mostly', 'Over 99% water']],
  },
  ladder: {
    title: 'Manhole ladder',
    blurb: 'Iron or plastic-coated steel rungs set into the shaft wall, about 30 cm apart.',
    facts: [['Rungs', 'About 30 cm apart'], ['Safety', 'Workers climb clipped to a line from the top']],
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
  'tunnel-light': {
    title: 'Tunnel light',
    blurb: 'Lights along the tunnel wall let crews and passengers see in an emergency, and mark the way to the exits.',
    facts: [['Power', 'Its own circuit, with a battery or generator backup']],
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
    facts: [['Depth', 'Some city water tunnels run 150 to 250 meters down'], ['Size', 'Several meters across'], ['Lining', 'Concrete, sometimes with a steel liner'], ['Carries', 'Fresh water from reservoirs far outside the city']],
    model: { kind: 'tube', parts: [
      { name: 'Fresh water', color: '#4f9ac8', r: 1.1 },
      { name: 'Steel liner', color: '#7f8fa6', r: 1.18 },
      { name: 'Concrete lining', color: '#b0aca2', r: 1.45 },
      { name: 'Grouted rock', color: '#5a5866', r: 1.8 },
    ] },
  },
}
