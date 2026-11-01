import type { Chapter } from './types'

export const fuel: Chapter = {
  id: 'fuel',
  title: 'Fuel',
  intro:
    "A 787 carries roughly 100 tonnes of fuel, almost all of it inside the wing. The fuel system stores it, keeps it from bending the wing too far, pumps it to the engines through more than one path, can throw it overboard when the airplane is too heavy to land, and fills the empty space above it with nitrogen so it cannot explode.",
  entries: {
    tanks: {
      title: 'Tanks',
      summary:
        'Three tanks: a main tank in each wing and a center tank in the wing box under the cabin floor. The wing skin itself is the tank wall.',
      body: [
        "The 787 has three fuel tanks. The left and right main tanks fill most of each wing between the front and rear spars, and the center tank sits in the center wing box, the structural box that joins the two wings beneath the fuselage. There are no separate bladders: the tanks are integral, meaning the wing's own carbon fiber skins, spars and ribs form the walls, and every joint and fastener is sealed. Outboard of each main tank is a small surge tank. It catches fuel that sloshes or expands into the vent system and drains it back, and it connects to a vent on the lower wing surface so the tanks breathe to the outside air as the airplane climbs and descends. Flame arrestors in the vent path stop an outside fire (a lightning strike on the vent, say) from traveling into the tank.",
        "Capacity is almost identical across the family. Boeing's airport planning document lists 33,340 US gallons (126,206 L) of usable fuel for the 787-8, and 33,399 US gallons (126,429 L) for the 787-9 and 787-10. At Boeing's standard density of 6.7 lb per gallon that is about 101,300 kg and 101,500 kg. The -9 and -10 are much heavier airplanes, but they did not get a bigger fuel volume: the -9 trades its extra weight for range at higher payloads, and the -10 uses the same tanks to carry more people over shorter distances.",
        "Where the fuel sits matters structurally. In flight the wing carries the whole airplane, and lift bends it upward at the root. Fuel stored in the wing pushes down along the span, close to where the lift is generated, so it partly cancels that bending moment. That is why the airplane has a maximum zero fuel weight (161,025 kg on the 787-8): above that weight, the load in the fuselage, which the wing must hold up but which does nothing to relieve the wing, would overstress the root. It is also why the center tank is burned first: wing fuel stays out in the wing, relieving bending, for as long as possible.",
        "Fuel quantity is measured by sensors inside each tank. The available evidence indicates the 787 uses capacitance probes: each probe is a pair of concentric tubes, and because fuel and air have different dielectric constants, the probe's capacitance changes with how much of it is wetted. A computer combines dozens of probe readings with the airplane's attitude and with measured fuel density to compute a mass, which is what the crew and the performance calculations actually need. The 787's flexible, sharply shaped composite wing makes the readings move more than on older jets, especially at low fuel. Since the TWA 800 accident, wiring that enters a fuel tank has to be designed so that no fault can put enough energy into the tank to ignite vapor.",
      ],
      facts: [
        ['Tanks', 'Left main, right main, center (plus 2 surge tanks)'],
        ['787-8 usable fuel', '33,340 US gal / 126,206 L'],
        ['787-9 and -10 usable fuel', '33,399 US gal / 126,429 L'],
        ['Fuel mass (full)', 'About 101 to 102 tonnes at 6.7 lb/gal'],
        ['787-8 max zero fuel weight', '161,025 kg (355,000 lb)'],
      ],
    },
    pumps: {
      title: 'Boost pumps',
      summary:
        'Each tank has two electric pumps. The center tank pumps push harder than the wing pumps, so the airplane burns center fuel first without anyone switching tanks.',
      body: [
        "Each main tank has two AC-powered boost pumps, forward and aft, and the center tank has two override/jettison pumps. A single pump can supply enough fuel to run one engine under all conditions, so each tank has a full spare. The left main tank also has a DC pump with no cockpit switch, used to feed the APU when no AC power is available yet (on the ground before the APU generator is online, for example).",
        "The center pumps produce a higher output pressure than the main tank pumps. All pumps feed the same manifolds through check valves, so when the center pumps are running their higher pressure holds the main tank check valves shut, and the engines draw only center tank fuel even though the wing pumps are on. When the center tank empties and its pressure falls, the main tank pumps take over automatically. This is the override in override/jettison, and it is the simple hydraulic trick that implements burn-center-first. A scavenge system later moves the last unpumpable fuel in the center tank into the main tanks.",
        "If every pump in a main tank fails, the engine can still run on suction feed. The first stage of the engine-driven fuel pump pulls fuel from its own main tank through a bypass line that goes around the boost pumps. Suction feed is fine at low altitude, but as the airplane climbs, the lower pressure on the fuel lets dissolved air and light fractions come out of solution and form vapor in the line, which the engine pump cannot handle well. That is why manufacturers publish altitude limits for operating on suction feed. Center tank fuel has no suction path: without its pumps it cannot reach an engine.",
        "On the 787 everything that used to be pneumatic or engine-driven is electric, and the electrical system is busy. When generating capacity is short (one generator lost, or on the ground on limited power), the system can load shed some fuel pumps, and the synoptic display marks those pumps so the crew can tell a shed pump from a failed one.",
      ],
      facts: [
        ['Main tank pumps', '2 AC boost pumps per wing tank'],
        ['Center tank pumps', '2 AC override/jettison pumps'],
        ['APU on the ground', 'DC pump in the left main tank'],
        ['One pump can feed', 'One engine, in all conditions'],
        ['If all pumps in a main tank fail', 'Suction feed, with altitude limits'],
      ],
    },
    feed: {
      title: 'Feed to the engines',
      summary:
        'Fuel goes from the tank pumps through a shutoff valve in the wing spar, into the engine pump, through a heat exchanger that warms it with engine oil, and is metered to the burners by the engine computer.',
      body: [
        "Each engine normally feeds from its own side: left main tank to left engine, right to right, with the center tank feeding both while it has fuel. The boost pumps discharge into a feed manifold that runs forward along the wing to the engine fuel shutoff valve, usually called the spar valve because it sits at the wing's front spar. It is the boundary between airframe and engine. Moving the fuel control switch to CUTOFF, or pulling the engine fire switch, closes it, which isolates the engine from tens of tonnes of fuel in a fire.",
        "Once fuel is in the engine, the engine owns it. A low-pressure pump stage, driven by the engine's accessory gearbox, raises the pressure and pushes the fuel through the fuel/oil heat exchanger. That component does two jobs at once: fuel is the coldest fluid on the engine, so it cools the engine's lubricating oil, and the oil warms the fuel so that water in it cannot freeze into ice crystals that would block the fuel filter. (A 777 with Rolls-Royce Trent 895 engines crashed short of Heathrow in 2008 after ice released from the fuel system restricted flow at exactly this heat exchanger, and the design was changed afterward.) A filter follows, then a high-pressure gear pump that delivers far more fuel than the engine needs.",
        "The fuel metering unit decides how much of that flow actually reaches the combustor. It is commanded by the FADEC (full authority digital engine control), a dual-channel computer on the engine that turns thrust lever position into a fuel flow while protecting against overspeed, overtemperature, surge and flameout. Excess fuel from the high-pressure pump is spilled back to the pump inlet. Metered fuel goes through a high-pressure shutoff valve, also closed by the fuel control switch, to the fuel nozzles in the combustor.",
        "The crossfeed system connects the left and right feed manifolds so either tank can feed either engine. Its most common use is balancing: if one wing has burned more than the other (one engine out, or a slightly different fuel flow over a long flight), the crew opens crossfeed and turns off the pumps in the lighter tank, so both engines draw from the heavier side until the tanks match. The 787's fuel synoptic shows when the tanks are balanced. Crossfeed may be used in any phase of flight.",
      ],
      steps: [
        'AC boost pumps in the tank pressurize the fuel (center tank pumps win while center fuel remains).',
        'Fuel flows through the feed manifold, or across through crossfeed if the crew has opened it.',
        'The engine fuel shutoff (spar) valve at the wing front spar lets it into the engine.',
        'The low-pressure stage of the engine-driven pump boosts it further.',
        'The fuel/oil heat exchanger cools the oil and warms the fuel; the filter cleans it.',
        'The high-pressure stage of the engine-driven pump raises it to injection pressure.',
        'The fuel metering unit, commanded by the FADEC, meters exactly the flow needed and spills the rest back.',
        'A high-pressure shutoff valve opens and the fuel nozzles spray it into the combustor.',
      ],
      facts: [
        ['Normal feed', 'Each engine from its own main tank, center tank first'],
        ['Firewall isolation', 'Spar valve closed by fuel control switch or fire switch'],
        ['Fuel metering', 'FADEC-commanded fuel metering unit'],
        ['Heat exchanger', 'Fuel cools oil; oil keeps fuel above icing'],
        ['Imbalance fix', 'Crossfeed, pumps off on the light side'],
      ],
    },
    jettison: {
      title: 'Fuel jettison',
      summary:
        'Depending on the model, a 787 can take off 52 to 66 tonnes heavier than it is designed to land. If it has to come back soon after takeoff, it can pump fuel out of nozzles near the wingtips to get down to landing weight.',
      body: [
        "Long-range airplanes take off with far more fuel than they land with, so the structure is designed around two different weights. The 787-8 has a maximum takeoff weight of 227,930 kg and a maximum landing weight of 172,365 kg. For the 787-9 the figures are 254,692 kg (or 259,228 kg on the higher-weight version) and 192,776 kg; for the 787-10, 254,011 kg (or 260,362 kg) and 201,848 kg. The landing gear and airframe are certified to absorb a touchdown at 10 ft per second sink rate at maximum landing weight, but only 6 ft per second at maximum takeoff weight. Landing heavy also means higher approach speeds, more energy for the brakes to absorb, and a poorer go-around climb gradient.",
        "The certification rules (FAR and CS 25.1001) require a jettison system unless the airplane can meet its approach and landing climb requirements at maximum takeoff weight minus the fuel for a 15-minute flight (takeoff, go-around and landing back at the departure airport). Twin-engine widebodies with large weight gaps cannot, so the 787 has one. The jettison system must also be able to dump enough fuel in 15 minutes to restore the required climb performance. An overweight landing is still permitted in an emergency, and is sometimes the better choice: if there is a fire, nobody waits to dump fuel. After an overweight landing the airplane gets a structural inspection.",
        "On the 787 the nozzles sit on the trailing edge of each outer wing, well outboard and away from the engines and the fuselage, so the fuel sprays clear of the airplane and mostly evaporates. The crew arms the system and sets a fuel-to-remain quantity; when a nozzle switch is turned on, the override/jettison pumps run, the jettison valves open, and fuel flows from a jettison manifold to the nozzles. The fuel synoptic shows an estimated time to complete, first computed from programmed rates and then updated from the actual rate of change. Jettison stops automatically just above the fuel-to-remain value, and the nozzles cannot open on the ground whatever the switches say.",
        "Boeing does not publish the jettison rate. Crew reports suggest it is on the order of 1.4 tonnes per minute while the center tank pumps are running and much less once only the wing tanks are feeding the nozzles, so dumping 50 tonnes takes a substantial part of an hour. Air traffic control normally assigns an area away from populated places and an altitude high enough (usually several thousand feet above the ground) for the fuel to vaporize and disperse before it gets there.",
      ],
      steps: [
        'The crew arms jettison and sets the fuel to remain (often to reach maximum landing weight).',
        'The system computes and displays a time to complete.',
        'Nozzle switches on: override/jettison pumps run and jettison valves open.',
        'Fuel flows through the jettison manifold to nozzles on the outboard trailing edge of each wing.',
        'The displayed time updates from the measured rate.',
        'Jettison stops automatically just above the fuel-to-remain quantity; the valves close.',
      ],
      facts: [
        ['787-8 MTOW / MLW', '227,930 kg / 172,365 kg'],
        ['787-9 MTOW / MLW', '254,692 or 259,228 kg / 192,776 kg'],
        ['787-10 MTOW / MLW', '254,011 or 260,362 kg / 201,848 kg'],
        ['Rule', 'FAR/CS 25.1001: dump enough fuel in 15 minutes'],
        ['Nozzles', 'Outboard trailing edge, one per wing'],
        ['Ground protection', 'Nozzles cannot open on the ground'],
      ],
    },
    inerting: {
      title: 'Nitrogen inerting',
      summary:
        'A machine in the belly filters nitrogen out of the air and blows it into the empty space above the fuel in every tank, so the vapor there has too little oxygen to burn.',
      body: [
        "A fuel tank is never really full of fuel. The space above the liquid, the ullage, holds fuel vapor mixed with air, and in a warm tank that mixture can sit inside the flammable range. All you then need is a spark. For decades the industry's defense was ignition source control: keep every possible spark out of the tank. Inerting adds a second, independent defense by taking away the oxygen instead. The FAA treats a tank as inert when the bulk oxygen concentration in the ullage is 12 percent or less at sea level, rising to 14.5 percent at 40,000 ft (normal air is about 21 percent).",
        "The 787's Nitrogen Generation System (NGS), originally supplied by Hamilton Sundstrand, draws air from beneath the cargo floor, compresses it, conditions its temperature and filters it, then passes it through an air separation module. The module is a bundle of thousands of hollow polymer fibers. Air flows down the inside of the fibers under pressure; oxygen, water vapor and carbon dioxide permeate through the fiber walls faster than nitrogen does, so what comes out the far end is nitrogen-enriched air, and the oxygen-enriched permeate is dumped overboard. The nitrogen-enriched air is piped into the ullage of the tanks.",
        "Most airliners that have inerting got it as a retrofit covering only the center tank. The 787 was the first airliner designed from scratch with inerting, and it inerts all of its tanks, wings included. A composite skin conducts heat away less readily than aluminum, so a composite wing tank does not cool off as quickly in cold air at altitude, and Boeing chose to treat every tank. The hardest phase for the system is descent: as outside pressure rises, air flows into the tanks through the vents, and the system must supply enough nitrogen-enriched air to keep the oxygen level down while that happens.",
        "The reason for all of this is TWA Flight 800. On 17 July 1996 a Boeing 747-100 exploded off Long Island 12 minutes after leaving New York JFK, killing all 230 people aboard. The NTSB found that the nearly empty center wing tank, warmed by the air conditioning packs below it during a long wait on a hot ramp, held a flammable vapor that ignited; the most likely ignition source was a short circuit outside the tank that let excess voltage into it through the fuel quantity wiring. The investigation led to new wiring and ignition-prevention rules, and in 2008 to the FAA's Fuel Tank Flammability Reduction rule, which requires a flammability reduction means such as inerting for high-risk tanks.",
      ],
      facts: [
        ['Method', 'Hollow-fiber membrane air separation'],
        ['Tanks inerted', 'All three (center and both mains)'],
        ['Inert threshold (FAA)', '12% oxygen at sea level, 14.5% at 40,000 ft'],
        ['Normal air', 'About 21% oxygen'],
        ['Origin', 'TWA 800, 17 July 1996, 230 killed'],
        ['Rule', 'FAA Fuel Tank Flammability Reduction, 2008'],
      ],
    },
  },
}
