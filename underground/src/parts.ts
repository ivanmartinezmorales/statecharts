import type { Component, Fact, Model } from './components'

// The parts you can look inside along the power and internet journeys: what they do, how they work step by step,
// facts, the questions people ask, and an exploded model where the shape says something. Numbers are typical for
// North America unless they say otherwise.

const POWER_QUESTIONS: Fact[] = [
  ['Why alternating current?', 'Transformers only work with AC, and they make it easy to raise the voltage for long trips and lower it for homes. That is why AC won the "war of the currents" in the 1890s.'],
  ['Why doesn\'t a bird on a wire get shocked?', 'Current flows only when it has a path to somewhere at a different voltage. A bird touches one wire, so its whole body sits at that wire\'s voltage. Touch the wire and the ground, or two wires, and the current would flow through you.'],
  ['How does the grid keep up when everyone turns on the air conditioning?', 'Operators match supply to demand every second. The tell is frequency: when demand outruns supply, every generator slows a hair and 60 Hz dips, and plants are told to push harder within seconds.'],
  ['What causes a blackout?', 'Usually a fault: a tree on a line, a storm, an overloaded transformer. Breakers cut off the damaged piece. If too much is lost at once, protection trips whole regions to save the equipment, and restarting takes hours.'],
  ['Where does my electricity come from?', 'A mix that changes hour by hour. In the US it is roughly 40% natural gas, 20% nuclear, 15% coal, and about a fifth wind, water and sun. Your outlet cannot tell which.'],
  ['How much does a home use?', 'An average US home uses about 900 kWh a month, around 30 a day. One kilowatt-hour runs a 100-watt bulb for ten hours.'],
  ['Volts, amps, watts?', 'Voltage is the push, current (amps) is how much flows, like water pressure and flow in a hose. Power (watts) is the two multiplied.'],
  ['Why do plugs have three prongs?', 'The round one is ground: a safe path so that if a wire touches a metal case, the current trips the breaker instead of flowing through you.'],
]

const INTERNET_QUESTIONS: Fact[] = [
  ['What happens when I type a web address?', 'Your computer asks a DNS server, the internet\'s address book, for the site\'s numeric address. Then it opens a connection and sends a request. The answer comes back cut into packets of about 1,500 bytes, put back in order on your screen.'],
  ['How many stops does a request make?', 'Usually 10 to 20 routers, each reading the address on the packet and passing it on in a few thousandths of a second.'],
  ['Where is "the cloud"?', 'In data centers: windowless buildings full of servers, often built near cheap power and cool air. The biggest use as much electricity as a small town; together they use a percent or two of the world\'s electricity.'],
  ['Why is Wi-Fi slower than the cable?', 'Radio is shared by every device and neighbor nearby, and weakens through walls. The glass fiber outside carries far more, with no one else on it.'],
  ['How much does one undersea cable carry?', 'The newest carry hundreds of terabits a second over a dozen or more pairs of fibers: enough for millions of HD videos at once.'],
  ['Who owns the cables?', 'Phone companies, and more and more the big tech companies, often sharing one cable between them.'],
  ['What happens when a cable breaks?', 'It happens 150 to 200 times a year, mostly from ship anchors and fishing gear. Traffic reroutes over other cables in moments, and a repair ship hauls the broken ends up to splice them.'],
  ['Why not satellites?', 'Satellites carry a small share. Fiber carries vastly more, and for long distances light in glass is quicker than bouncing to a high orbit and back.'],
  ['Why does a video start instantly?', 'Popular videos are copied to servers close to you, sometimes inside your internet provider\'s own building, so they never cross an ocean at all.'],
]

const TRANSFORMER: Model = { kind: 'stack', parts: [
  { name: 'Tank base', color: '#4a4a54', shape: 'box', w: 3.2, d: 1.8, h: 0.25 },
  { name: 'Laminated steel core (three legs)', color: '#7f8fa6', shape: 'box', w: 0.5, d: 0.5, h: 2.2, y: 0.25, cols: 3, gap: 1.05 },
  { name: 'Low-voltage windings', color: '#d98a4a', shape: 'ring', w: 0.8, d: 0.8, h: 1.8, hole: 0.55, y: 0.45, cols: 3, gap: 1.05 },
  { name: 'High-voltage windings', color: '#c4703a', shape: 'ring', w: 1.0, d: 1.0, h: 1.6, hole: 0.82, y: 0.55, cols: 3, gap: 1.05 },
  { name: 'Top yoke', color: '#7f8fa6', shape: 'box', w: 2.8, d: 0.5, h: 0.3, y: 2.45 },
  { name: 'Tank cover', color: '#5a6a7a', shape: 'box', w: 3.4, d: 2, h: 0.15, y: 2.8 },
  { name: 'Bushings', color: '#e8e2d6', shape: 'ring', w: 0.34, d: 0.34, h: 0.08, hole: 0.12, y: 2.95, repeat: 6, pitch: 0.14, cols: 3, gap: 1.05 },
] }

export const PARTS: Record<string, Component> = {
  // ---- making electricity
  'steam-turbine': {
    title: 'Boiler and steam turbine',
    blurb: 'Most power plants are giant kettles. Burning gas or coal, or a nuclear reactor, boils water into steam that blasts through rows of blades and spins a shaft.',
    steps: [
      'Fuel heats water in tubes lining the boiler until it becomes steam at enormous pressure, over 150 times the air around us, and over 500 °C.',
      'The steam rushes through rows of fixed blades that aim it, then rows of moving blades that it pushes, like wind on a pinwheel.',
      'As the steam expands it loses pressure, so each later row of blades is longer to catch it: high-, intermediate- and low-pressure sections.',
      'All the rows turn one shaft at exactly 3,600 turns a minute, locked to the grid\'s 60 cycles a second (3,000 in 50 Hz countries).',
      'The spent steam is cooled back into water by a river, the sea or a cooling tower, and pumped back to the boiler to go round again.',
    ],
    facts: [['Speed', '3,600 rpm, locked to the grid'], ['Efficiency', 'About a third of the fuel\'s energy becomes electricity in an old plant; about 60% in a modern combined-cycle gas plant'], ['Blades', 'The last rows can be over a meter long, with tips moving faster than sound'], ['Cooling towers', 'The big curved towers only release water vapor, not smoke']],
    model: { kind: 'stack', axis: 'x', parts: [
      { name: 'Shaft', color: '#a8b0bc', shape: 'disc', w: 0.3, d: 0.3, h: 5.2, y: 0 },
      { name: 'High-pressure blade rows', color: '#e8c04a', shape: 'disc', w: 1.1, d: 1.1, h: 0.08, y: 0.6, repeat: 4, pitch: 0.22 },
      { name: 'Intermediate-pressure blade rows', color: '#d99a4a', shape: 'disc', w: 1.6, d: 1.6, h: 0.08, y: 1.8, repeat: 4, pitch: 0.26 },
      { name: 'Low-pressure blade rows', color: '#c4703a', shape: 'disc', w: 2.4, d: 2.4, h: 0.1, y: 3.2, repeat: 4, pitch: 0.32 },
      { name: 'Casing', color: '#5a6a7a', shape: 'ring', w: 2.9, d: 2.9, h: 4.6, hole: 2.6, y: 0.3 },
    ] },
  },
  generator: {
    title: 'Generator',
    blurb: 'Where spinning becomes electricity: a huge electromagnet (the rotor) turns inside coils of copper (the stator), and its sweeping magnetic field pushes the electrons in the coils back and forth.',
    steps: [
      'A small exciter feeds direct current into the rotor\'s windings, turning it into a powerful electromagnet.',
      'The turbine spins the rotor inside the stator, a ring of steel slotted with copper bars.',
      'As the rotor\'s north and south poles sweep past each bar, they push current one way, then the other: alternating current, 60 times a second.',
      'Three sets of windings, spaced around the ring, make three-phase power: three currents in step, a third of a turn apart. That is why big power lines come in threes.',
      'Big generators are cooled with hydrogen gas or water flowing through hollow copper, because even 1% of their power is a lot of heat.',
    ],
    facts: [['Output', 'Up to over 1,000 megawatts from one machine, at about 10,000 to 25,000 volts'], ['Phases', 'Three'], ['Same idea as', 'A bicycle dynamo, scaled up a million times'], ['Weight', 'The rotor alone can weigh over 200 tonnes']],
    model: { kind: 'stack', axis: 'x', parts: [
      { name: 'Shaft', color: '#a8b0bc', shape: 'disc', w: 0.35, d: 0.35, h: 5.4, y: 0 },
      { name: 'Rotor (electromagnet)', color: '#c4503f', shape: 'disc', w: 1.4, d: 1.4, h: 2.6, y: 1.4 },
      { name: 'Stator windings (copper)', color: '#d98a4a', shape: 'ring', w: 2.0, d: 2.0, h: 2.8, hole: 1.55, y: 1.3 },
      { name: 'Stator core and frame', color: '#5a6a7a', shape: 'ring', w: 2.8, d: 2.8, h: 3.0, hole: 2.05, y: 1.2 },
      { name: 'Exciter', color: '#7f8fa6', shape: 'disc', w: 0.9, d: 0.9, h: 0.6, y: 4.5 },
    ] },
  },
  'step-up-transformer': {
    title: 'Transformer',
    blurb: 'No moving parts at all: two coils of wire wrapped around an iron core. Alternating current in one coil makes a changing magnetic field in the core, and that field makes a voltage in the other coil.',
    steps: [
      'The core is a stack of thin steel sheets, insulated from each other so stray currents cannot swirl in it and waste energy as heat.',
      'Two windings wrap each leg of the core: a low-voltage coil with few turns and a high-voltage coil with many.',
      'The ratio of turns is the ratio of voltages. 100 turns in and 1,000 turns out makes ten times the voltage, and a tenth of the current.',
      'The whole thing sits in a steel tank of mineral oil, which insulates the windings and carries their heat to radiators and fans outside.',
      'Wires come in and out through porcelain bushings on the lid, kept far from the grounded tank.',
    ],
    facts: [['Efficiency', 'Over 99% for big ones'], ['The hum', 'The core\'s steel flexes slightly with the magnetic field, 120 times a second: that is the hum you hear'], ['Weight', 'The largest weigh hundreds of tonnes and travel on special rail cars'], ['Three-phase', 'Three legs, one for each phase']],
    model: TRANSFORMER,
  },
  bushing: {
    title: 'Bushing',
    blurb: 'How do you pass a 100,000-volt wire through a grounded steel tank wall without the power leaping across? A bushing: a conductor down the middle, layers of insulation around it, and a ribbed housing outside.',
    steps: [
      'A copper or aluminum rod down the center carries the current.',
      'Around it are many layers of oil-soaked paper with thin metal foils between them. The foils spread the electric stress evenly, so no single spot breaks down.',
      'A porcelain or silicone rubber housing protects the core and holds oil.',
      'The ribs, called sheds, make the path along the surface much longer, and keep their undersides dry in the rain, so current cannot creep across dirt and water.',
      'A metal flange in the middle bolts to the grounded tank; the top terminal connects to the line.',
    ],
    facts: [['Length', 'Grows with voltage: a few meters tall at 500,000 volts'], ['Sheds', 'Several times longer surface path than the bushing itself'], ['Check', 'A small window shows the oil level, and crews test its insulation for decades']],
    model: { kind: 'stack', parts: [
      { name: 'Conductor rod', color: '#d98a4a', shape: 'disc', w: 0.18, d: 0.18, h: 3.4, y: 0 },
      { name: 'Graded paper-and-foil core', color: '#e8d8b0', shape: 'disc', w: 0.45, d: 0.45, h: 2.8, y: 0.2 },
      { name: 'Porcelain housing', color: '#a86a4a', shape: 'ring', w: 0.7, d: 0.7, h: 2.6, hole: 0.47, y: 0.3 },
      { name: 'Sheds', color: '#c4805a', shape: 'ring', w: 1.15, d: 1.15, h: 0.07, hole: 0.7, y: 0.45, repeat: 9, pitch: 0.26 },
      { name: 'Mounting flange', color: '#7f8fa6', shape: 'ring', w: 1.5, d: 1.5, h: 0.14, hole: 0.7, y: 0.25 },
      { name: 'Terminal cap', color: '#a8b0bc', shape: 'disc', w: 0.6, d: 0.6, h: 0.18, y: 3.0 },
    ] },
  },
  'transmission-tower': {
    title: 'Transmission line',
    blurb: 'The wires are not insulated: the air around them is the insulation. That is why they hang so high, and why the towers hold them out on long arms.',
    steps: [
      'Each wire is aluminum strands wound around a steel core: aluminum carries the current, steel carries the weight.',
      'They come in threes, one for each phase, and are often bundled in pairs or fours to carry more.',
      'Strings of glass or porcelain insulators hang each wire from the tower.',
      'Thin wires along the very top are shield wires: they catch lightning before it hits the power lines.',
      'Wires sag more on hot days, because the metal expands. Lines are sized so they never sag too close to trees or the ground.',
    ],
    facts: [['Voltage', '115,000 to 765,000 volts'], ['Losses', 'A few percent over hundreds of kilometers'], ['The buzz', 'In damp weather the high voltage ionizes the air at the wire\'s surface: a crackle called corona']],
    questions: POWER_QUESTIONS.slice(0, 2),
    model: { kind: 'tube', parts: [
      { name: 'Steel core strands', color: '#7f8fa6', r: 0.3 },
      { name: 'Inner aluminum strands', color: '#c9d0da', r: 0.65 },
      { name: 'Outer aluminum strands', color: '#e8eef4', r: 0.95 },
    ] },
  },
  insulator: {
    title: 'Insulator string',
    blurb: 'A chain of glass or porcelain discs that holds a high-voltage wire to a grounded steel tower without letting any current through.',
    steps: [
      'Each disc is a bell of glass or porcelain with a metal cap on top and a pin underneath, linked to the next disc like a chain.',
      'Each disc holds back about 10,000 to 15,000 volts, so higher voltages need longer strings: about 8 discs at 115,000 volts, over 20 at 500,000.',
      'The bell shape keeps the underside dry in rain, so water cannot form a path across.',
      'Newer lines often use one long rod of silicone rubber with ribs instead: lighter, and hard to break.',
    ],
    facts: [['Glass discs', 'Shatter visibly when damaged, so crews can spot them from the ground'], ['Count the discs', 'The longer the string, the higher the voltage on the line']],
    model: { kind: 'stack', parts: [
      { name: 'Conductor clamp and wire', color: '#c9d0da', shape: 'box', w: 3, d: 0.16, h: 0.16 },
      { name: 'Glass discs', color: '#7fc4a0', shape: 'disc', w: 1.0, d: 1.0, h: 0.12, y: 0.4, repeat: 8, pitch: 0.32 },
      { name: 'Caps and pins', color: '#7f8fa6', shape: 'disc', w: 0.3, d: 0.3, h: 2.8, y: 0.25 },
      { name: 'Tower clamp', color: '#5a6a7a', shape: 'box', w: 0.7, d: 0.4, h: 0.25, y: 3.1 },
    ] },
  },
  substation: {
    title: 'Substation',
    blurb: 'Where voltages change and the grid\'s switches live. Behind the fence: transformers, breakers, switches and a maze of metal pipes called busbars.',
    steps: [
      'High-voltage lines come in over the fence onto the busbars.',
      'Disconnect switches can open with a visible air gap, so crews can see a line is truly cut before they touch it.',
      'Circuit breakers can interrupt the enormous current of a fault in a few hundredths of a second.',
      'Protective relays watch every current and trip the breakers the instant something looks wrong.',
      'Transformers step the voltage down to about 13,000 volts, and feeders carry it out under the streets.',
      'A grid of copper buried under the gravel keeps everything at ground potential, so a fault cannot make the ground itself dangerous.',
    ],
    facts: [['Voltage out', 'About 4,000 to 35,000 volts, often 13,000'], ['The gravel', 'Drains water and insulates your feet'], ['Run by', 'Remote control rooms, often with nobody on site']],
    questions: POWER_QUESTIONS.slice(2, 4),
    model: TRANSFORMER,
  },
  'circuit-breaker': {
    title: 'Circuit breaker',
    blurb: 'A switch that can open while thousands of amps are flowing. When it opens, the current tries to keep going as an arc, and the breaker has to put that arc out.',
    steps: [
      'A powerful spring mechanism, wound up and waiting, snaps the contacts apart when a relay says so.',
      'An arc forms between the separating contacts, as hot as the surface of the sun.',
      'The contacts sit in a sealed tank of sulfur hexafluoride gas or a vacuum, which cools and smothers the arc.',
      'AC passes through zero twice every cycle; at that instant the arc goes out and stays out.',
    ],
    facts: [['Speed', 'Opens in about two or three cycles: a few hundredths of a second'], ['Current', 'Can interrupt tens of thousands of amps']],
    model: { kind: 'stack', parts: [
      { name: 'Steel frame', color: '#5a6a7a', shape: 'box', w: 2.6, d: 1.2, h: 0.4 },
      { name: 'Spring operating mechanism', color: '#7f8fa6', shape: 'box', w: 0.9, d: 0.9, h: 0.9 },
      { name: 'Gas-filled interrupter tanks', color: '#c9d0da', shape: 'disc', w: 0.6, d: 0.6, h: 1.4, cols: 3, gap: 0.8 },
      { name: 'Bushings', color: '#a86a4a', shape: 'ring', w: 0.34, d: 0.34, h: 0.08, hole: 0.12, repeat: 6, pitch: 0.14, cols: 3, gap: 0.8 },
    ] },
  },
  'vault-transformer': {
    title: 'Vault transformer',
    blurb: 'Under that sidewalk grate: a transformer that turns the street\'s 13,000 volts into the 120/208 volts your building uses.',
    steps: [
      'Feeder cables bring 13,000 volts into the vault.',
      'The transformer steps it down to 120/208 volts.',
      'A network protector, a smart switch, stops power from flowing backward into a feeder that has failed.',
      'Its output joins a grid of cables under the street, so every building is fed from several transformers at once. If one fails, the others carry on.',
      'Air through the grate keeps it cool; in a flood, the equipment is built to keep running under water.',
    ],
    facts: [['Voltage', '13,000 volts in, 120/208 volts out'], ['Why the grate gets warm', 'The transformer below is a few percent short of perfect, and that loss is heat']],
    model: TRANSFORMER,
  },
  meter: {
    title: 'Electric meter',
    blurb: 'Counts every kilowatt-hour your building uses. Most new ones are smart meters that report by radio, so nobody has to come read them.',
    steps: [
      'It measures the voltage and current flowing through it thousands of times a second.',
      'Multiplying them gives power; adding that up over time gives energy, in kilowatt-hours.',
      'A smart meter sends the readings to the utility every few minutes or hours.',
    ],
    facts: [['A kilowatt-hour', 'Runs a 100-watt bulb for ten hours'], ['A typical US home', 'About 900 a month']],
    questions: POWER_QUESTIONS.slice(4, 7),
  },
  'breaker-panel': {
    title: 'Breaker panel',
    blurb: 'Splits the building\'s supply into circuits, each protected by a breaker that trips before a wire can overheat.',
    steps: [
      'The main breaker can shut off the whole building at once.',
      'Copper bus bars carry power to rows of smaller breakers, one per circuit.',
      'Each breaker has a strip of two metals that bends as it heats: a long overload trips it.',
      'It also has an electromagnet that trips instantly on a short circuit.',
      'Some breakers also watch for current leaking to ground, through water or a person, and trip in a fortieth of a second.',
    ],
    facts: [['A circuit', 'Often 15 or 20 amps at 120 volts'], ['Big appliances', 'Dryers and ovens use two phases for 240 volts']],
    questions: POWER_QUESTIONS.slice(6),
    model: { kind: 'stack', parts: [
      { name: 'Back box', color: '#5a6a7a', shape: 'box', w: 2, d: 0.5, h: 0.2 },
      { name: 'Bus bars', color: '#d98a4a', shape: 'box', w: 0.2, d: 0.2, h: 2.6, cols: 2, gap: 0.5 },
      { name: 'Breakers', color: '#2a2a30', shape: 'box', w: 0.6, d: 0.35, h: 0.22, repeat: 8, pitch: 0.3, cols: 2, gap: 0.8 },
      { name: 'Main breaker', color: '#c4503f', shape: 'box', w: 1.2, d: 0.4, h: 0.4 },
      { name: 'Cover', color: '#9a968c', shape: 'box', w: 2.2, d: 0.08, h: 3.2, y: 0 },
    ] },
  },

  // ---- the internet
  router: {
    title: 'Router',
    blurb: 'The traffic cop of your home: it turns the fiber\'s light into data your devices can use, hands each device its own address, and sends every packet the right way.',
    steps: [
      'A small box (the modem, or an ONT on fiber) turns flashes of light into electrical signals, and back.',
      'The router gives every phone, laptop and TV a private address, and keeps track of which packets belong to which.',
      'Its radios talk Wi-Fi on 2.4, 5 and 6 GHz: the lower bands reach farther, the higher ones carry more.',
      'It sends everything bound for the wider internet out through one public address.',
    ],
    facts: [['Range', 'Tens of meters indoors, less through thick walls'], ['Packets', 'About 1,500 bytes each, thousands a second']],
    questions: INTERNET_QUESTIONS.slice(0, 4),
    model: { kind: 'stack', parts: [
      { name: 'Base', color: '#2a2a30', shape: 'box', w: 2.4, d: 1.6, h: 0.2 },
      { name: 'Circuit board', color: '#3f8a5a', shape: 'box', w: 2.2, d: 1.4, h: 0.08 },
      { name: 'Processor and radio chips', color: '#a8b0bc', shape: 'box', w: 0.4, d: 0.4, h: 0.12, cols: 3, gap: 0.6 },
      { name: 'Antennas', color: '#2a2a30', shape: 'disc', w: 0.14, d: 0.14, h: 1.4, cols: 3, gap: 0.8 },
      { name: 'Case', color: '#e8e2d6', shape: 'box', w: 2.5, d: 1.7, h: 0.5 },
    ] },
  },
  'pon-splitter': {
    title: 'Fiber splitter',
    blurb: 'A small glass chip in a box on a pole or under the street that splits the light from one fiber into 32 or 64, one for each home. It needs no power at all.',
    steps: [
      'Light from the exchange enters one fiber.',
      'Tiny waveguides etched in glass divide it, again and again, into many outputs.',
      'Every home receives all of it, but only reads the packets addressed to it, all encrypted.',
      'Going up, homes take turns in tiny time slots, so their signals never collide.',
    ],
    facts: [['Split', 'Often 1 into 32'], ['Power', 'None: it is just glass']],
  },
  exchange: {
    title: 'The exchange',
    blurb: 'A windowless building in your neighborhood, once full of telephone switches, now full of the equipment that lights the fibers of thousands of homes.',
    steps: [
      'Each street\'s fibers end on a rack of laser transmitters and receivers.',
      'Routers here gather all that traffic onto a few very fast fibers into the wider network.',
      'Racks of batteries and a generator keep it running through a power cut.',
    ],
    facts: [['Serves', 'Often tens of thousands of homes'], ['History', 'Many still sit in the old telephone buildings, close to the original copper lines']],
  },
  'server-rack': {
    title: 'Server rack',
    blurb: 'The cloud, up close: a cabinet of flat computers stacked like pizza boxes, in rows that fill a building.',
    steps: [
      'Each server has processors, memory and solid-state drives; a rack holds about 40 of them.',
      'A switch at the top of each rack connects its servers to the rest of the building at enormous speed.',
      'Fans pull cool air from a cold aisle in front and blow hot air into a hot aisle behind, which is cooled again.',
      'Your video lives on many of them at once, so if one fails, another answers.',
    ],
    facts: [['Power', 'A busy rack can draw as much as a dozen homes'], ['Worldwide', 'Data centers use a percent or two of all electricity']],
    questions: INTERNET_QUESTIONS.slice(2, 3),
    model: { kind: 'stack', parts: [
      { name: 'Rack frame', color: '#2a2a30', shape: 'box', w: 1.6, d: 1.6, h: 0.15 },
      { name: 'Servers', color: '#5a6a7a', shape: 'box', w: 1.4, d: 1.4, h: 0.16, repeat: 9, pitch: 0.24 },
      { name: 'Top-of-rack switch', color: '#3f6fb0', shape: 'box', w: 1.4, d: 1.4, h: 0.12 },
      { name: 'Status lights', color: '#7fe0a0', shape: 'box', w: 0.08, d: 0.05, h: 0.05, x: 0.6, z: 0.72, y: 0.25, repeat: 9, pitch: 0.24 },
    ] },
  },
  ixp: {
    title: 'Internet exchange',
    blurb: 'Where networks meet. Hundreds of internet providers, phone companies and big websites plug into the same giant switches and hand traffic straight to each other.',
    steps: [
      'Each network runs a fiber to the exchange and plugs into its switches.',
      'Networks agree to swap traffic directly, often for free, because it is cheaper and faster for everyone.',
      'Without it, your packet might travel to another city just to come back to a site next door.',
    ],
    facts: [['Traffic', 'The biggest handle over 10 terabits a second at peak'], ['Members', 'Hundreds of networks each']],
  },
  'landing-station': {
    title: 'Cable landing station',
    blurb: 'An ordinary-looking, well-guarded building near the beach, where an undersea cable comes ashore and joins the land network.',
    steps: [
      'The cable comes up a pipe under the beach into a manhole, then on to the station.',
      'Power equipment sends a direct current of thousands of volts out along the cable to run its repeaters across the ocean.',
      'Line terminal equipment turns the cable\'s light into signals for the land networks, and back.',
    ],
    facts: [['Power out', 'Up to around 15,000 volts DC'], ['Security', 'Treated as critical infrastructure']],
  },
  'undersea-cable': {
    title: 'Undersea cable',
    blurb: 'About as thick as a garden hose in the deep ocean, yet it carries a large part of a continent\'s traffic. The light travels in a few hair-thin glass fibers at its very center.',
    steps: [
      'A dozen or so pairs of optical fibers lie in a steel tube filled with jelly, to keep water out.',
      'Steel strength wires around it take the strain of being lowered kilometers to the seafloor.',
      'A copper sheath carries power to the repeaters.',
      'Thick polyethylene insulates it all.',
      'Near shore, where anchors and fishing nets are, it gets extra layers of armor wire and is buried under the seabed.',
    ],
    facts: [['Thickness', 'About 2 cm in the deep ocean; up to about 5 cm armored near shore'], ['Depth', 'Down to about 8 km'], ['Capacity', 'Up to hundreds of terabits a second'], ['Life', 'Designed to last about 25 years']],
    questions: INTERNET_QUESTIONS.slice(4, 8),
    model: { kind: 'tube', parts: [
      { name: 'Optical fibers', color: '#bfe6ff', r: 0.08 },
      { name: 'Water-blocking jelly', color: '#e8d870', r: 0.15 },
      { name: 'Steel tube', color: '#a8b0bc', r: 0.21 },
      { name: 'Steel strength wires', color: '#7f8fa6', r: 0.4 },
      { name: 'Copper power sheath', color: '#d98a4a', r: 0.46 },
      { name: 'Polyethylene insulation', color: '#2a2a30', r: 0.72 },
      { name: 'Armor wires (near shore)', color: '#5a5a66', r: 0.92 },
      { name: 'Tar-soaked yarn', color: '#3a3020', r: 1.0 },
    ] },
  },
  repeater: {
    title: 'Repeater',
    blurb: 'Light fades as it travels through glass, so every 60 to 100 km a pressure-proof canister on the cable boosts it again, on the seafloor, for 25 years without a visit.',
    steps: [
      'Inside, each fiber passes through a coil of special fiber laced with the element erbium.',
      'Small pump lasers, powered by the cable\'s copper, energize the erbium.',
      'As the faint signal passes through, the energized erbium copies and strengthens it, directly as light, without turning it into electricity.',
      'A thick housing of beryllium-copper holds out the crushing pressure of the deep sea.',
    ],
    facts: [['Spacing', 'Every 60 to 100 km'], ['Power', 'From the landing stations, through the cable'], ['Built for', 'About 25 years on the seafloor']],
    model: { kind: 'stack', axis: 'x', parts: [
      { name: 'Cable and bend limiters', color: '#2a2a30', shape: 'disc', w: 0.3, d: 0.3, h: 5.2, y: 0 },
      { name: 'Erbium-doped fiber coils', color: '#ff9ac8', shape: 'ring', w: 0.8, d: 0.8, h: 0.2, hole: 0.5, y: 1.8, repeat: 4, pitch: 0.4 },
      { name: 'Pump lasers', color: '#e8c04a', shape: 'box', w: 0.3, d: 0.3, h: 0.3, y: 1.6, cols: 2, gap: 0.6 },
      { name: 'Pressure housing', color: '#c4703a', shape: 'ring', w: 1.4, d: 1.4, h: 2.4, hole: 1.15, y: 1.4 },
    ] },
  },
  'cable-ship': {
    title: 'Cable ship',
    blurb: 'Cables are laid by special ships carrying thousands of kilometers of cable coiled in giant tanks, paying it out over the stern as they cross the ocean at walking pace.',
    steps: [
      'Engineers survey the seafloor first to find a safe, gentle route around cliffs and volcanoes.',
      'Near shore, a sea plow towed behind the ship digs a trench and buries the cable.',
      'Out in the deep, it is laid straight onto the seafloor.',
      'For repairs, a ship drags a hook along the seabed to catch the cable, hauls the ends aboard and splices in new cable.',
    ],
    facts: [['Speed', 'About 10 to 15 km an hour while laying'], ['Fleet', 'Only a few dozen of these ships in the world']],
    questions: INTERNET_QUESTIONS.slice(6, 7),
  },
}

export { POWER_QUESTIONS, INTERNET_QUESTIONS }
