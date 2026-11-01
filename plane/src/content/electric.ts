import type { Chapter } from './types'

export const electric: Chapter = {
  id: 'electric',
  title: 'The more-electric airplane',
  intro:
    "Most jets run their cabin air, wing de-icing and engine starting on hot air piped from the engines. The 787 does nearly all of it with electricity instead, which is why it carries about four times the generating capacity of the airplanes it replaced.",
  entries: {
    bleedless: {
      title: 'No bleed air',
      summary:
        "The 787 does not tap its engine compressors for cabin air, wing anti-ice or engine starting. Electric compressors, heaters and motors do those jobs, and only the engine inlets still use hot air.",
      body: [
        "On a conventional jet, bleed air is taken from the engine compressor at several hundred degrees and high pressure, ducted through the wing and fuselage, and throttled down by valves and precoolers to what the systems actually need. It powers air-conditioning packs and pressurization, wing anti-ice, engine starting, and on many airplanes hydraulic reservoir pressurization and some pumps. The trouble is waste: the compressor makes air at whatever pressure the engine happens to produce, which is usually far more than the cabin needs, and the excess is thrown away as heat in valves and precoolers.",
        "The 787 replaces almost all of it with electrical power. Four electric cabin air compressors, two per air-conditioning pack, draw outside air through dedicated inlets on the fuselage and compress it only as much as the cabin needs. Wing ice protection uses electrothermal heater mats bonded into the slat leading edges (eight mats, four per wing), switched on only when ice is detected. Engines are started electrically by their own generators running as motors. The centre hydraulic system is driven by electric motor pumps, and the brakes are electrically actuated.",
        "The one exception is engine inlet (cowl) anti-ice. The inlet lip sits right in front of the compressor, has to be kept clear of ice that could break off into the fan, and hot air is available a short distance away. So a small amount of bleed air is still piped forward to the inlet lip on each engine.",
        "Boeing's chief project engineer for the 787 electrical systems described the gain at the gross level as about 2 percent in fuel efficiency, from extracting power more selectively. Other Boeing material quotes 1 to 2 percent at cruise; the exact figure depends on what you count. The other gains are maintenance and weight: no high-temperature bleed ducts running through the wing and fuselage, no duct leak detection along them, fewer valves and precoolers, and engines that are simpler at the core because they need no bleed ports for airplane use.",
        "The cost is a much bigger electrical system. The airplane needs more generating capacity, high-power motor controllers, power electronics that need their own liquid cooling, and careful handling of heat. Electricity becomes the backbone that the airplane's comfort and much of its safety depend on.",
      ],
      facts: [
        ['Cabin air', 'Four electric cabin air compressors'],
        ['Wing ice protection', 'Electrothermal mats on the slats'],
        ['Engine start', 'Electric, through the generators'],
        ['Still uses bleed', 'Engine cowl (inlet) anti-ice only'],
        ['Fuel saving', 'About 1 to 2 percent (Boeing figures vary)'],
      ],
    },

    generators: {
      title: 'Starter-generators',
      summary:
        "Each engine drives two 250 kVA variable-frequency starter-generators. They make 235 volts AC in flight and turn the engine over on the ground to start it.",
      body: [
        "Each engine carries two variable frequency starter generators (VFSGs) on its accessory gearbox, four on the airplane, each rated at 250 kVA. Add the two 225 kVA generators on the APU and the airplane has six main generators and about 1,450 kVA of installed capacity, just under 1.5 megawatts. A 777 has two engine generators of about 120 kVA each. Boeing has said the 787 can lose up to five of its six main generators and still continue safe flight and landing.",
        "Variable frequency means the generator is geared straight to the engine with no constant-speed drive. Older airplanes used an integrated drive generator, a hydromechanical transmission that held the generator at a fixed speed to make exactly 400 Hz. Dropping it saves weight, heat and maintenance. The 787's output frequency follows engine speed, roughly 360 to 800 Hz, at 235 volts AC. Loads that care about frequency, chiefly motors, are fed through power electronics that convert the power to whatever they need.",
        "Why 235 volts instead of the traditional 115? For the same power, doubling voltage halves current, and wire weight goes with current. On an airplane moving a megawatt around, that saves a lot of copper and aluminium.",
        "The same machines start the engines. During a start, a common motor start controller (CMSC) takes ±270 volts DC and synthesises variable-frequency AC to drive the VFSG as a synchronous motor, accelerating the engine's high-pressure spool. Both VFSGs on an engine can share the work. Once the engine is self-sustaining, the controller drops out and the VFSG switches to generating. On the GEnx the VFSGs are driven from the high-pressure spool; on the Trent 1000 the drive comes from the intermediate-pressure spool.",
      ],
      steps: [
        'Power source: the APU, external ground power or the generators on the already-running engine supply 235 VAC.',
        'Conversion: auto-transformer rectifier units turn that into ±270 VDC for the motor controllers.',
        'Motoring: common motor start controllers drive the engine VFSGs as motors, spinning up the high-pressure spool.',
        'Light-off: at the right core speed the FADEC opens fuel and fires the igniters; the engine lights and begins to accelerate on its own.',
        'Cut-out: once the engine is self-sustaining the starter function drops out, and the FADEC brings the engine to idle.',
        'Generating: the VFSGs come online and start feeding 235 VAC, variable frequency, to the main buses.',
      ],
      facts: [
        ['Per engine', 'Two VFSGs, 250 kVA each'],
        ['Output', '235 VAC, about 360 to 800 Hz'],
        ['Main generators total', 'Six (four engine, two APU)'],
        ['Installed capacity', 'About 1,450 kVA'],
        ['777 for comparison', 'Two engine generators of about 120 kVA'],
      ],
    },

    apu: {
      title: 'The APU',
      summary:
        "A small gas turbine in the tail, the APS5000, drives two 225 kVA generators. It powers the airplane at the gate, starts the engines and backs them up in flight.",
      body: [
        "The auxiliary power unit is a Hamilton Sundstrand (now Pratt & Whitney) APS5000, rated around 1,100 shaft horsepower. Unlike earlier APUs it has no load compressor and supplies no bleed air at all. Its only output is shaft power, which drives two 225 kVA starter-generators through a gearbox, for 450 kVA in total at 235 VAC.",
        "It is started electrically. The APU battery spins one of the APU starter-generators as a motor, powers the APU controller and fuel unit, and opens the inlet door. The APU is a single-shaft, variable-speed turbine, and once running it can feed the whole airplane on the ground: cabin air compressors, galleys, flight deck and engine starts.",
        "In flight the APU is a backup source. If an engine generator fails, the APU can be started and brought online to restore capacity, which supports extended-range twin operations (ETOPS) far from diversion airports. The airplane may also be dispatched with the APU inoperative under certain conditions, because the four engine generators already provide wide margin.",
        "The APU sits in the tail cone behind the pressure bulkhead, inside a fireproof compartment. Air enters through an inlet door in the aft fuselage and the exhaust leaves through the opening at the very tip of the tail. An eductor system uses the exhaust jet to pull cooling air through the compartment and the oil cooler, so no separate cooling fan is needed.",
      ],
      facts: [
        ['Model', 'APS5000 (Hamilton Sundstrand, now Pratt & Whitney)'],
        ['Power', 'About 1,100 shp'],
        ['Generators', 'Two 225 kVA starter-generators'],
        ['Bleed air', 'None, no load compressor'],
        ['Start', 'Electric, from the APU battery'],
      ],
    },

    distribution: {
      title: 'Power distribution',
      summary:
        "Power flows at four voltages: 235 VAC, ±270 VDC, 115 VAC and 28 VDC. Heavy power panels live in two electronics bays, and 17 remote units with solid-state switches feed local loads.",
      body: [
        "The 787 is a hybrid system with four voltage types. 235 VAC from the generators runs the main buses. Auto-transformer rectifier units (ATRUs) convert some of it to ±270 VDC, 540 volts between the two rails, to feed the large motor controllers for the cabin air compressors, hydraulic electric pumps, fans and engine starting. Auto-transformer units step 235 VAC down to the traditional 115 VAC, and transformer-rectifier units make 28 VDC for avionics and control. The 115 VAC and 28 VDC systems are conventional; 235 VAC and ±270 VDC exist because of the no-bleed design.",
        "The high-power equipment sits in two electrical and electronics bays (E/E bays) below the cabin floor, one forward and one aft of the wing. The aft bay houses the big power panels and motor controllers close to the loads and engines; the forward bay holds the main battery and much of the avionics. The high-power electronics generate so much heat that they have their own liquid cooling system.",
        "Instead of running every small circuit back to a central breaker panel, the 787 places 17 remote power distribution units (RPDUs) around the fuselage, like electrical substations close to the loads they feed. Inside them, solid-state power controllers (SSPCs) replace thermal circuit breakers. An SSPC is a semiconductor switch with a programmed trip curve; it can be switched and reset by software, and it reports its state to the airplane's network. Boeing said this approach and the overall architecture let the 787 carry about 70 miles of wiring against about 90 miles on a 767-300ER.",
        "Conventional circuit breakers and contactors still handle the high-power feeders, where solid-state switching would be too heavy and too hot. Pilots see SSPC status and can reset them through the flight deck displays rather than reaching for a breaker panel behind their seat.",
      ],
      facts: [
        ['235 VAC', 'Main generator buses'],
        ['±270 VDC', 'Large motor controllers'],
        ['115 VAC and 28 VDC', 'Conventional loads and avionics'],
        ['E/E bays', 'Forward and aft'],
        ['Remote units', '17 RPDUs with solid-state power controllers'],
      ],
    },

    batteries: {
      title: 'Lithium-ion batteries',
      summary:
        "Two 8-cell, 32-volt lithium-ion batteries start the APU and back up critical systems. In January 2013 two of them failed within ten days, and the whole fleet was grounded.",
      body: [
        "The 787 carries two identical lithium-ion batteries made with GS Yuasa cells: the main battery in the forward E/E bay and the APU battery in the aft E/E bay. Each has eight lithium cobalt oxide cells in series, about 4 volts each, for a 32-volt battery. Boeing chose lithium-ion because it stores more energy for its weight and delivers high current: the battery weighs about 63 lb against 107 lb for the 777's 20-cell nickel-cadmium unit. The APU battery starts the APU. The main battery powers the airplane on the ground before other power is available, supplies the electric brakes when towing, and bridges critical loads for a few seconds if all generators are lost until the ram air turbine comes online.",
        "On 7 January 2013, the APU battery of an empty Japan Airlines 787 caught fire at the gate in Boston shortly after landing. On 16 January an All Nippon Airways 787 made an emergency landing at Takamatsu, Japan, after its main battery overheated and smoke was detected; passengers evacuated by slide. The FAA issued an emergency airworthiness directive that day, and authorities worldwide grounded all 50 787s then in service, the first grounding of an entire US airliner type since the DC-10 in 1979.",
        "The battery failures were thermal runaway. An internal short circuit in one cell heated it until it vented and burned, and the heat spread to neighbouring cells. The NTSB later found that Boeing's certification analysis had underestimated the effects of a cell short circuit, that GS Yuasa's manufacturing could introduce defects its inspections would not catch, and that FAA oversight had missed both. The Japanese investigators of the Takamatsu event could not determine exactly what started the short.",
        "Boeing's fix accepted that a cell might fail and focused on containing it. Each cell was wrapped in electrical insulation and separated from its neighbours, wiring was sleeved, the charger was set to a narrower voltage range, and the battery case gained drain and vent holes. The battery went into a sealed stainless steel enclosure with a tube that vents any gas or smoke directly overboard through the fuselage skin, so even a failure of every cell would not produce fire in the airplane. The FAA approved the redesign on 19 April 2013 and the airplanes returned to service from late April. In January 2014 a single cell vented on a parked JAL 787 at Narita, and the new enclosure contained it as designed.",
      ],
      facts: [
        ['Batteries', 'Main (forward E/E bay) and APU (aft E/E bay)'],
        ['Cells', 'Eight GS Yuasa lithium cobalt oxide cells'],
        ['Voltage', '32 V'],
        ['Weight', 'About 63 lb each'],
        ['Grounding', '16 January to April 2013'],
        ['Fix', 'Insulated cells, steel enclosure, overboard vent'],
      ],
    },

    rat: {
      title: 'Ram air turbine',
      summary:
        "If both engines or all hydraulics fail, a small propeller drops out of the fuselage into the airstream. It drives a hydraulic pump and a generator to keep the flight controls and key instruments alive.",
      body: [
        "The ram air turbine (RAT) is a two-bladed propeller on a strut, stowed in the lower fuselage and made by Hamilton Sundstrand (now Collins Aerospace). When it deploys, a release actuator unlatches it and it swings down into the airflow, where the passing air spins it. A governor varies blade pitch to hold a steady speed across a wide range of airspeeds. It drives a hydraulic pump and an electrical generator.",
        "It deploys automatically in flight when both engines have failed, when all three hydraulic systems lose pressure, or when the captain's and first officer's flight instrument buses lose power. Pilots can also deploy it manually with a switch on the overhead panel. Once out it stays out until maintenance stows it on the ground.",
        "The RAT is an emergency source sized for the essentials, not the whole airplane. Its pump pressurizes the centre hydraulic system, which runs enough primary flight controls to fly and land. Its generator feeds the essential buses for the flight displays, flight control computers and communication and navigation radios. The main battery carries those loads for the few seconds until the RAT is up to speed.",
        "Because so much of the 787 depends on electricity, the RAT is the final layer of a deep stack: six main generators, then the batteries, then the RAT. Even with all three hydraulic systems lost, the airplane can still use electric actuation for two pairs of spoilers and the horizontal stabilizer.",
      ],
      facts: [
        ['Maker', 'Hamilton Sundstrand (now Collins Aerospace)'],
        ['Auto-deploys on', 'Dual engine failure, total hydraulic loss, loss of flight instrument power'],
        ['Drives', 'Centre hydraulic pump and an electrical generator'],
        ['Bridge power', 'Main battery, for a few seconds'],
        ['Stowing', 'On the ground only'],
      ],
    },
  },
}
