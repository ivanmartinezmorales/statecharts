import type { Chapter } from './types'

export const airplane: Chapter = {
  id: 'airplane',
  title: 'The airplane',
  intro:
    'The 787 is a long-range twin built mostly from carbon fiber and run mostly on electricity. Both choices ripple through everything else: how the cabin feels, how the wing bends, and how the systems are laid out.',
  entries: {
    overview: {
      title: 'A plastic, electric airliner',
      summary:
        'The 787 replaced aluminum with carbon fiber composite for most of its structure and replaced engine bleed air with electric power for most of its systems.',
      body: [
        'Boeing launched the 787 to replace the 767 on long, thin routes: city pairs with enough demand for a widebody but not for a 777 or 747. The answer was a midsize twin that burns roughly 20 percent less fuel per seat than the airplanes it replaced (Boeing\'s figure). The 787-8 flew first in December 2009 and entered service in 2011. The stretched 787-9, the most common variant and the one this tour uses, flew in 2013 and entered service in 2014. The 787-10 stretches it again for capacity rather than range.',
        'About half of the structure by weight is carbon fiber reinforced plastic (CFRP): carbon fibers locked in cured epoxy. Aluminum makes up about a fifth, titanium about 15 percent, steel about 10 percent. Composites are stiffer and stronger for their weight than aluminum, they do not corrode, and they do not fatigue the way metal does under repeated pressurization. That last property is what let Boeing pressurize the cabin harder and run it more humid.',
        'The second big decision is the "more-electric" architecture. On a conventional jet, hot high-pressure air is bled from the engine compressors to pressurize the cabin, de-ice the wings and start the engines. Bleed air is convenient but wasteful: the engine has to compress more air than it needs for thrust, then the heat is dumped through precoolers. The 787 has no traditional pneumatic system. Each engine drives two large starter-generators; electric compressors pressurize the cabin, electric heater mats protect the wing, and the same generators spin the engines up to start. The only bleed air left is a small tap to keep each engine\'s own inlet lip free of ice.',
        'That electric plant is large: four engine generators at 250 kVA each plus two 225 kVA generators on the auxiliary power unit (APU), around 1.45 megawatts in total. Power is distributed at 235 volts AC (variable frequency, tracking engine speed) and converted to plus and minus 270 volts DC for big motor loads. Hydraulics remain for the heavy flight control actuators and landing gear, at 5,000 psi instead of the usual 3,000 psi, which lets the pipes and actuators be smaller and lighter.',
      ],
      facts: [
        ['Variant shown', '787-9'],
        ['Composite share', '~50% by weight'],
        ['Seats (two-class)', '~290 typical'],
        ['Range', 'up to 8,300 nmi'],
        ['Max takeoff weight', '561,500 to 571,500 lb'],
        ['Engines', 'GEnx-1B or Trent 1000'],
      ],
    },
    fuselage: {
      title: 'The fuselage',
      summary:
        'The body is built as a handful of one-piece carbon fiber barrels instead of thousands of riveted aluminum panels, which lets the cabin run at a lower altitude and higher humidity.',
      body: [
        'A traditional fuselage is a skeleton of aluminum frames and stringers skinned with panels and joined by hundreds of thousands of rivets. The 787 fuselage is made as complete barrels. Machines lay carbon fiber tape onto a rotating mandrel, the stringers are laid in, and the whole section is cured in an autoclave (a big pressurized oven). The barrels are built around the world and flown to final assembly in Boeing\'s Dreamlifter: the nose section (Section 41) by Spirit AeroSystems in Wichita, Section 43 by Kawasaki in Japan, the center barrels (44 and 46) by Leonardo in Italy, and the aft body (47 and 48) by Boeing in South Carolina.',
        'Because composite does not fatigue under pressure cycles like aluminum, Boeing set the maximum cabin altitude at 6,000 ft instead of the 8,000 ft common on older jets. At cruise, passengers breathe air as if they were in a mountain town rather than on a small mountain; the difference shows up as less fatigue and fewer headaches on long flights. The cabin air comes from four electric cabin air compressors rather than engine bleed, so it never passes through an engine core.',
        'Moisture is aluminum\'s enemy: condensation in the walls causes corrosion. With a composite structure the 787 can run higher cabin humidity, which helps with dry eyes and throats on long sectors. The same structure allowed the largest windows of any airliner, about 47 cm (18.4 in) tall, because cutting big holes in a composite barrel costs less strength than in a metal one. Instead of plastic shades, the windows dim electrically: a gel layer between the panes darkens when voltage is applied.',
        'Carbon composite conducts electricity far worse than aluminum, which matters for lightning. Metal mesh is embedded in the outer skin to carry strike current around the airplane, and fasteners near fuel tanks are specially sealed and insulated so a strike cannot spark inside them. The 787-9 is 20 ft (6.1 m) longer than the 787-8 but shares the same cross-section: about 5.77 m wide outside and about 5.5 m inside, enough for nine-abreast economy at most airlines.',
      ],
      steps: [
        'Carbon fiber tape is laid onto a rotating mandrel shaped like the inside of the barrel.',
        'Stringers (lengthwise stiffeners) are placed and the barrel is bagged and cured in an autoclave under heat and pressure.',
        'The cured barrel is trimmed, inspected with ultrasound for voids or delamination, and window and door holes are cut.',
        'Frames, floors, wiring and systems are installed by the supplier before the section ships.',
        'Sections are joined at final assembly with a single circumferential splice per joint.',
      ],
      facts: [
        ['Length (787-9)', '62.8 m (206 ft)'],
        ['Outside width', '~5.77 m'],
        ['Max cabin altitude', '6,000 ft'],
        ['Window height', '~47 cm (18.4 in)'],
        ['Cabin air source', '4 electric compressors'],
      ],
    },
    wing: {
      title: 'The wing',
      summary:
        'A long, thin, carbon fiber wing that bends visibly upward in flight and changes its own shape in cruise to stay efficient as the airplane gets lighter.',
      body: [
        'The wing is built by Mitsubishi Heavy Industries in Nagoya, with the center wing box by Subaru (formerly Fuji Heavy Industries). It spans 60.1 m (197 ft 3 in) on the 787-8 and -9 and is swept about 32 degrees. Composite let Boeing make it longer and thinner than an aluminum wing of the same weight. A high aspect ratio (long span relative to chord) reduces induced drag, the drag that comes from producing lift, and that is where most of the cruise efficiency comes from.',
        'The flex is the first thing passengers notice. On the ground the tips droop; in cruise they rise several feet above that. In the 2010 ultimate load test, Boeing bent a test wing to 150 percent of the highest load expected in service and the tips moved up roughly 25 ft without failure. The flexibility is designed in: it softens gust loads and lowers the stress on the structure. The tips are raked (swept back more steeply) instead of carrying winglets, which gives a similar drag benefit with a cleaner structure.',
        'The trailing edge has inboard and outboard single-slotted flaps, a flaperon between them (a surface that works as both flap and aileron, sitting behind the engine where a slot would be hit by exhaust), and an aileron near the tip. Seven spoilers per side sit on top. When the flaps extend, the spoilers droop to close the gap above them, which shapes the slot without a complex track mechanism. Slats run along the leading edge, with a small Krueger flap near the root. In cruise, the flight control computers nudge the flaps and flaperons a few degrees up or down (variable camber) to keep the wing at its most efficient shape as fuel burns off.',
        'The wings hold most of the fuel: left and right main tanks in the wings and a center tank in the wing box, about 126,400 liters (33,399 US gal, roughly 101.5 tonnes) in total. Because there is no bleed air, ice protection on the slats is done by electric heater mats bonded inside the leading edge, cycled in zones to save power. Spoilers also help with roll, act as speedbrakes in flight and dump lift after touchdown. A gust suppression function uses sensors and fast surface movements to take the edge off turbulence before passengers feel it.',
      ],
      facts: [
        ['Span (787-8/-9)', '60.1 m (197 ft 3 in)'],
        ['Sweep', '~32 degrees'],
        ['Fuel capacity', '126,429 L (33,399 US gal)'],
        ['Spoilers', '7 per side'],
        ['Ultimate load test tip rise', '~25 ft'],
        ['Wing ice protection', 'electric heater mats'],
      ],
    },
    nose: {
      title: 'The nose',
      summary:
        'The nose carries the flight deck, the weather radar and the air data sensors, and it is shaped with just four large cockpit windows to cut drag and noise.',
      body: [
        'The nose section (Section 41) is built by Spirit AeroSystems in Wichita and contains the flight deck, the forward electronics bays, the nose landing gear well and the forward entry doors. Its smooth, rounded shape is one of the 787\'s identifying features. Most Boeing jets have six flight deck windows; the 787 has four larger ones. Fewer frame joints mean less drag, less wind noise in the cockpit and a simpler, stronger structure.',
        'The radome at the very tip is a non-metallic cover that radar energy passes through. Behind it sits the weather radar antenna, which scans ahead for precipitation (and the turbulence and hail that come with it) and also predicts windshear on approach. The radome takes bird strikes and hail, so it is built to absorb impact and is one of the most frequently inspected parts during the walkaround.',
        'Around the nose are the air data sensors: pitot probes (which sense the ram pressure used to compute airspeed), static ports (ambient pressure for altitude), angle-of-attack vanes (the angle between wing and oncoming air) and a total air temperature probe. They are heated electrically so ice cannot block them. The flight control computers compare several sources and vote out a bad one; this redundancy is why a single blocked probe should not mislead the airplane.',
        'Below the flight deck, the nose gear carries two wheels and is steered hydraulically from a tiller beside each pilot and, for small corrections, through the rudder pedals. Above the forward cabin, behind the flight deck, many 787s have an overhead crew rest compartment with bunks so augmented crews on long flights can sleep in shifts.',
      ],
      facts: [
        ['Built by', 'Spirit AeroSystems'],
        ['Flight deck windows', '4'],
        ['Nose gear wheels', '2'],
        ['Probe heating', 'electric'],
      ],
    },
    tail: {
      title: 'The tail',
      summary:
        'The fin and tailplane keep the airplane straight and level, house the APU in the tail cone, and on the 787-9 use suction through tiny holes to keep the airflow smooth.',
      body: [
        'The vertical fin and rudder provide directional stability and yaw control; the horizontal stabilizer and elevators provide pitch stability and pitch control. On the 787 both are composite. The whole horizontal stabilizer moves for trim: it pivots at its rear spar and a jackscrew at its front tilts it a few degrees, so the elevators can sit near neutral in steady flight instead of holding a load all the time. The stabilizer is long-span and swept, and its trim position at takeoff is set from the airplane\'s center of gravity.',
        'The 787-9 was the first Boeing airliner with hybrid laminar flow control (HLFC) on its tail. Normally the thin layer of air hugging a surface (the boundary layer) turns turbulent soon after the leading edge, and turbulent flow causes more skin friction. On the 787-9, the leading edges of the fin and tailplane are perforated with tiny holes; a passive suction system draws a small amount of air through them, which keeps the flow smooth (laminar) farther back. The only visible clue is a set of small doors on the fin sides and under the tailplanes.',
        'In the tail cone sits the auxiliary power unit (APU), a small gas turbine. On the 787 it produces no bleed air at all: it only drives two 225 kVA starter-generators. On the ground it powers the airplane and starts the engines; in flight it is a backup power source and can be started at high altitude if needed.',
        'The tail also matters at rotation. Because the 787-9 is a long airplane, over-rotating on takeoff or landing could strike the aft body on the runway. A tail strike protection function in the flight control computers limits elevator authority when the airplane is near the ground at high pitch, reducing the risk without taking control away from the pilot.',
      ],
      facts: [
        ['Height (787-9)', '~17 m (56 ft)'],
        ['Laminar flow', 'HLFC on fin and tailplane'],
        ['APU output', '2 x 225 kVA, no bleed'],
        ['Trim surface', 'moving stabilizer'],
      ],
    },
  },
}
