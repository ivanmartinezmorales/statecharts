import type { Chapter } from './types'

export const engines: Chapter = {
  id: 'engines',
  title: 'The engines',
  intro:
    "Each 787 hangs one big turbofan under each wing. Inside, a gas turbine burns kerosene to spin a fan almost three metres across, and most of the thrust comes from that fan pushing a huge mass of air slightly faster, not from a hot jet.",
  entries: {
    engine: {
      title: 'Two engine families, one airplane',
      summary:
        "A 787 flies on either the GE GEnx-1B or the Rolls-Royce Trent 1000. Both are high-bypass turbofans in the 64,000 to 78,000 lbf class, built to the same airplane interface.",
      body: [
        "Boeing offered two engines from launch. The GE GEnx-1B is a two-spool turbofan derived from GE90 technology, with an 18-blade fan about 111 inches (2.82 m) across. The Rolls-Royce Trent 1000 is a three-spool turbofan with a 20-blade fan about 112 inches (2.85 m) across. On the 787-8, -9 and -10 the GEnx-1B is certified at takeoff ratings of roughly 69,800, 74,100 and 76,100 lbf respectively; Rolls-Royce quotes the Trent 1000 family across 53,000 to 78,000 lbf, with the later Trent 1000 TEN covering the heavier 787-9 and -10.",
        "Both are high-bypass engines. Bypass ratio is the mass of air that goes around the core, through the fan duct only, divided by the mass that goes through the core and is burned. GE publishes about 9:1 at takeoff for the GEnx-1B (sources range from 8.8 to 9.3 depending on rating), and Rolls-Royce publishes above 10:1 for the Trent 1000. A 1970s widebody engine ran around 5:1.",
        "High bypass is about propulsive efficiency. Thrust is mass flow times the change in velocity, but the kinetic energy you waste in the wake grows with the square of that velocity change. Accelerating a lot of air a little costs less fuel per unit of thrust than accelerating a little air a lot. The limit is the size of the fan: bigger fans weigh more, add nacelle drag, need ground clearance under the wing, and their tips go supersonic. The 787's fans are close to the largest that fit under its wing.",
        "Boeing specified a standard engine interface so that the airplane does not care which engine it carries. Both engines are bleedless (no compressed air for the cabin), both drive the same type of electrical starter-generators, and the commonality sits at the pylon-to-wing attachment and the systems connections. In principle an airline can change engine types on an airframe; in practice it means changing pylon parts as well as engines, and it is rarely done. Early reporting showed Boeing never achieved the quick swap it first advertised.",
        "The Trent 1000 had a hard service life: corrosion-fatigue cracking in intermediate-pressure turbine blades from 2016, vibration cracking of intermediate-pressure compressor blades, and shorter-than-planned high-pressure turbine blade life on the TEN. Repeated inspections and redesigns kept many Trent-powered 787s on the ground for long periods between 2016 and the early 2020s.",
      ],
      facts: [
        ['Options', 'GE GEnx-1B or Rolls-Royce Trent 1000'],
        ['Thrust class', 'About 64,000 to 78,000 lbf takeoff on the 787 (varies by rating)'],
        ['Fan diameter', 'GEnx-1B 111 in; Trent 1000 112 in'],
        ['Bypass ratio', 'GEnx-1B about 9:1; Trent 1000 above 10:1'],
        ['Spools', 'GEnx two; Trent three'],
      ],
    },

    brayton: {
      title: 'The Brayton cycle',
      summary:
        "A jet engine runs the Brayton cycle: squeeze air, add heat at roughly constant pressure, then let the hot gas expand through turbines and out the back. Higher pressure and hotter turbines make it more efficient.",
      body: [
        "Every gas turbine is an open Brayton cycle. Air is compressed nearly adiabatically (without heat exchange), fuel is burned in it at roughly constant pressure, and the hot gas expands through turbines that take back enough work to drive the compressor and fan. What remains, as shaft work for the fan and as jet velocity, is the useful output. The cycle closes in the atmosphere: hot exhaust mixes away and fresh cold air comes in the front.",
        "The overall pressure ratio (OPR) is the pressure at the compressor exit divided by the pressure at the fan face. GE publishes takeoff OPRs of about 44 to 47 for the GEnx-1B family, rising to about 53 to 58 at top of climb, where the air entering is colder and denser relative to what the compressor can do. Rolls-Royce quotes about 50:1 for the Trent 1000. For an ideal Brayton cycle, thermal efficiency is 1 minus 1 over (OPR raised to the power (γ minus 1)/γ), where γ is about 1.4 for air. At an OPR of 50 that ideal figure is about 67 percent; real engines lose a good share of that to component inefficiencies, cooling air and pressure losses.",
        "Turbine entry temperature matters too. A higher pressure ratio only pays if you can also burn hotter, because otherwise there is little energy left after the turbine has driven the compressor. Specific work rises steeply with turbine temperature, which lets the core be smaller for the same power. That is why so much engineering goes into turbine blades that live in gas hotter than their own melting point.",
        "Two efficiencies multiply to give overall efficiency. Thermal efficiency is how well the core turns fuel energy into useful kinetic energy. Propulsive efficiency is how well that kinetic energy becomes thrust work on the airplane, and it is roughly 2 divided by (1 plus jet velocity over flight velocity). A hot core with a high OPR gives thermal efficiency; a big, slow fan gives propulsive efficiency. Modern widebody engines reach overall efficiencies around 40 percent in cruise.",
      ],
      steps: [
        'Intake: the inlet slows the incoming air from about Mach 0.85 to roughly Mach 0.5 to 0.6 at the fan face, raising its pressure slightly (ram compression).',
        'Compression: the fan, then the booster or intermediate compressor, then the high-pressure compressor raise pressure about 40 to 58 times; air leaves the last stage at several hundred degrees Celsius from compression alone.',
        'Combustion: fuel burns in the compressed air at nearly constant pressure (a few percent pressure loss), raising gas temperature well above 1,000 °C.',
        'Expansion: the high-pressure turbine drives the high-pressure compressor, and the low-pressure turbine drives the fan; each stage drops pressure and temperature.',
        'Exhaust: the remaining energy leaves as a core jet, while the bypass air, accelerated by the fan, provides most of the thrust.',
      ],
      facts: [
        ['Cycle', 'Open Brayton: compress, heat at constant pressure, expand'],
        ['OPR, GEnx-1B', 'About 44 to 47 at takeoff, 53 to 58 at top of climb'],
        ['OPR, Trent 1000', 'About 50:1 (Rolls-Royce)'],
        ['Ideal efficiency at OPR 50', 'About 67 percent (γ = 1.4)'],
        ['Propulsive efficiency', 'About 2 / (1 + Vjet / Vflight)'],
      ],
    },

    fan: {
      title: 'The fan',
      summary:
        "The fan is a giant first-stage compressor that sends most of its air around the core. It makes the large majority of the engine's thrust.",
      body: [
        "The GEnx-1B fan has 18 wide-chord, swept carbon-fibre composite blades with titanium leading-edge sheaths that protect against bird and hail impact. GE introduced composite fan blades on the GE90 (22 blades); improved aerodynamics let the GEnx do the same job with 18. The Trent 1000 has 20 swept hollow titanium blades. Rolls-Royce makes them by diffusion-bonding titanium skins around an internal girder-like core and superplastically forming them, which gives a stiff, damage-tolerant blade at much lower weight than a solid one.",
        "At takeoff the fan tips move faster than sound. On the GEnx-1B, a nominal low-spool speed of about 2,560 rpm on a 111-inch fan works out to a tip speed of roughly 380 m/s, above Mach 1 at sea level. Swept blades manage the shock waves this creates and reduce the buzz-saw noise heard on the ground. The fan pressure ratio is modest, around 1.5 or so, but the mass flow is enormous.",
        "Because about nine to ten times more air goes through the bypass duct than through the core, the fan produces the large majority of thrust. A simple momentum estimate using typical exit velocities puts the fan's share at roughly 85 percent at takeoff, and the core jet supplies the rest. The core's main job on a modern turbofan is to drive the fan.",
        "Fan containment is a certification requirement. In the blade-off test the engine runs at full speed and an explosive bolt releases a fan blade at the root. The fan case must contain it, the engine must not catch fire, and the mounts must hold through the violent imbalance as the engine runs down. The GEnx uses a braided carbon-fibre composite fan case, about 350 lb lighter per engine than a metal one, and it contained the released blade in testing.",
      ],
      facts: [
        ['GEnx-1B blades', '18, carbon-fibre composite, titanium leading edge'],
        ['Trent 1000 blades', '20, swept hollow titanium'],
        ['Fan diameter', 'About 2.8 m'],
        ['Tip speed at takeoff', 'Supersonic'],
        ['Share of thrust', 'Roughly 85 percent (estimate)'],
        ['GEnx fan case', 'Braided composite, about 350 lb lighter'],
      ],
    },

    compressor: {
      title: 'The compressor',
      summary:
        "Rows of spinning and fixed blades squeeze the core air dozens of times over. Each stage adds a little pressure, and the control system keeps the airflow from stalling.",
      body: [
        "An axial compressor is a series of stages. Each stage is a row of rotating blades (the rotor) followed by a row of fixed vanes (the stator). The rotor does work on the air, adding velocity and some pressure. The stator turns the flow back and slows it down, converting that velocity into more pressure and lining it up for the next rotor. Because the air is slowed against a rising pressure, each stage can only manage a modest pressure rise before the flow separates from the blades, so you need many stages. The blades get shorter toward the back as the air gets denser.",
        "The GEnx-1B has the fan, a 4-stage booster (low-pressure compressor) on the fan shaft, and a 10-stage high-pressure compressor. GE quotes a pressure ratio of about 23:1 for that high-pressure compressor alone, very high for one spool, and uses blisks (blades and disc machined as one piece) on several stages. The Trent 1000 splits the job across three shafts: the fan, an 8-stage intermediate-pressure compressor, and a 6-stage high-pressure compressor. The Trent 1000 TEN uses an intermediate compressor scaled from the Trent XWB.",
        "A compressor blade is a wing, and like a wing it stalls if its angle of attack gets too large. At low speed the front stages see too much incidence and the rear stages too little, because the compressor is designed for the density change at full power. Stall in one stage can spread into surge, where the whole compressor stops pumping and the high-pressure air behind it blows back out the front with a bang. Surge margin is the distance between the operating line and the stall line on the compressor map.",
        "Two tools protect that margin. Variable stator vanes (VSVs), on the inlet guide vanes and front stator rows, rotate on actuated rings so the front stages see a sensible angle of attack across the speed range. Bleed valves dump some compressor air into the bypass duct at low power, during starts and during rapid throttle movements, which keeps the front and back of the compressor matched. GE calls these variable bleed valves; Rolls-Royce calls them handling bleed valves. The engine control schedules both automatically.",
      ],
      facts: [
        ['GEnx-1B', 'Fan + 4-stage booster + 10-stage HPC'],
        ['Trent 1000', 'Fan + 8-stage IPC + 6-stage HPC'],
        ['GEnx HPC pressure ratio', 'About 23:1 (GE)'],
        ['Stage', 'Rotor adds energy, stator turns flow and recovers pressure'],
        ['Stall protection', 'Variable stator vanes and bleed valves'],
      ],
    },

    combustor: {
      title: 'The combustor',
      summary:
        "Fuel sprays into the compressed air and burns in an annular chamber. The design challenge is burning very hot for efficiency while making as little NOx as possible.",
      body: [
        "Both engines use a single annular combustor, a ring-shaped chamber around the shaft. Only part of the compressor air takes part in the flame; the rest cools the liner walls and dilutes the hot gas to an acceptable temperature profile before it reaches the turbine. Combustion runs at nearly constant pressure, losing only a few percent across the chamber.",
        "Nitrogen oxides (NOx) form fastest where the flame is hottest and the gas stays hot longest. Raising pressure ratio raises combustor inlet temperature, which pushes NOx up, so emission control fights the cycle that gives you efficiency. Two broad strategies exist: rich-burn, quick-quench, lean-burn (RQL), which burns rich, mixes in air very quickly and finishes lean, and lean premixed burning, which mixes fuel and air thoroughly before combustion so there are no hot stoichiometric pockets.",
        "The GEnx uses GE's TAPS combustor (twin annular premixing swirler). Each fuel nozzle has a central pilot surrounded by a main mixer. At low power only the pilot burns, keeping the flame stable; at higher power the main stage feeds a lean, well-mixed charge through high-swirl passages. The lower peak flame temperature cuts NOx. GE reported NOx around 58 to 60 percent below the CAEP/6 standard in certification testing.",
        "The Trent 1000 uses a single-annular, rich-burn style combustor with 18 fuel spray nozzles and a tiled liner, derived from earlier low-emissions Trent combustors. The liner is made of cast heat-resistant tiles held off a cooler outer skin, cooled by air flowing behind and through them. Tiles need less cooling air than a conventional film-cooled wall, which leaves more air for controlling the flame and the exit temperature profile.",
        "Ignition uses two high-energy igniter plugs per engine, fired by the engine control during start and selectable for continuous use in heavy rain, icing or turbulence. Once lit, the flame is self-sustaining; the control monitors for flameout and relights automatically.",
      ],
      facts: [
        ['Type, both', 'Single annular combustor'],
        ['GEnx', 'TAPS lean premixed, pilot and main stages'],
        ['GEnx NOx', 'About 58 to 60 percent below CAEP/6 (GE)'],
        ['Trent 1000', 'Tiled liner, 18 fuel spray nozzles'],
        ['Igniters', 'Two per engine'],
      ],
    },

    turbine: {
      title: 'The turbine',
      summary:
        "Turbines take energy back out of the hot gas to drive the compressors and fan. The first blades sit in gas hotter than the melting point of their own metal.",
      body: [
        "The high-pressure turbine (HPT) sits right behind the combustor and drives the high-pressure compressor. The low-pressure turbine (LPT) at the back drives the fan, and on the Trent an intermediate-pressure turbine sits in between. The GEnx-1B has a 2-stage HPT and a 7-stage LPT on the 787-8 rating (6 stages on later ratings, per published tables). The Trent 1000 has single-stage HP and IP turbines and a 6-stage LPT. The LPT has many stages because it turns slowly, at fan speed, so each stage can extract only a little work.",
        "Gas leaving the combustor of a modern high-OPR engine is around 1,500 to 1,700 °C at takeoff; neither manufacturer publishes exact figures for these engines. Nickel superalloys begin to melt around 1,300 °C. The first-stage HPT blades survive by layering three defences: the alloy, a ceramic coating, and cooling air.",
        "The blades are cast as single crystals of a nickel superalloy containing rhenium and other heavy elements. A single crystal has no grain boundaries, which are where creep (slow stretching under load at high temperature) and cracks start. Each blade spins at more than 10,000 rpm and carries centrifugal loads of several tonnes at red heat, so creep strength is the limit that matters.",
        "The blade is coated with a thermal barrier coating (TBC), a thin layer of yttria-stabilised zirconia ceramic over a bond coat, which drops the metal temperature by roughly 100 °C or more. Inside, the blade is hollow with serpentine cooling passages fed by air bled from the compressor, still several hundred degrees but far cooler than the gas. That air exits through rows of laser-drilled film-cooling holes and spreads as a thin cool blanket over the surface.",
        "Cooling air costs efficiency, because it has been compressed but bypasses the combustor. Turbine design is a trade between hotter gas (better cycle), less cooling air (better cycle) and blade life. Erosion of coatings and loss of cooling over time is why exhaust gas temperature margin falls as an engine ages, and why HPT blades are a leading reason engines come off wing.",
      ],
      facts: [
        ['GEnx-1B', '2-stage HPT, 6 or 7-stage LPT by rating'],
        ['Trent 1000', '1-stage HPT, 1-stage IPT, 6-stage LPT'],
        ['Gas temperature', 'Roughly 1,500 to 1,700 °C class (not published)'],
        ['Blade material', 'Single-crystal nickel superalloy'],
        ['Protection', 'Ceramic TBC plus internal and film cooling'],
      ],
    },

    spools: {
      title: 'Spools',
      summary:
        "A spool is a compressor and the turbine that drives it, joined by a shaft. The GEnx has two spools; the Trent 1000 has three, each turning at its own best speed.",
      body: [
        "Different parts of the engine want very different speeds. The fan is nearly 3 metres across, and its tip speed limits it to a few thousand rpm. The high-pressure compressor and turbine are small, and they need high rpm to do enough work per stage. A single shaft cannot satisfy both, so engines split into concentric shafts, each joining a compressor to the turbine that drives it.",
        "The GEnx-1B is a two-spool engine. N1 is the low-pressure spool (fan, booster and LPT); N2 is the high-pressure spool (HPC and HPT). Published nominal speeds are about 2,560 rpm for N1 and 11,377 rpm for N2. The two spools turn in opposite directions (counter-rotating), which lets the turbine vanes between them do less turning of the flow and reduces losses.",
        "The Trent 1000 is a three-spool engine, the Rolls-Royce signature since the RB211. N1 is the fan and LPT, N2 is the intermediate spool (IPC and IPT), and N3 is the high-pressure spool (HPC and HPT). Published speeds are about 2,683, 8,937 and 13,391 rpm. The HP spool counter-rotates relative to the other two. Three spools let each compressor run nearer its optimum speed, so fewer stages are needed and the engine is shorter and stiffer, at the cost of an extra set of shafts and bearings.",
        "On the 787 the spool choice also decides where electrical power comes from. GE drives the generators from the HP spool gearbox, as is conventional. Rolls-Royce takes the power from the IP spool, which runs over a narrower speed range and leaves the HP spool free to accelerate, which helps stability margin and lets idle thrust be lower.",
        "Pilots see these speeds as percentages of a reference rpm, not raw rpm. N1 is the primary thrust indication on most Boeing engines. The engine control and crew watch the high-pressure spool during start, because it is the one the starter turns and it determines when fuel and ignition are introduced.",
      ],
      facts: [
        ['GEnx-1B', 'Two spools: N1 (LP), N2 (HP)'],
        ['Trent 1000', 'Three spools: N1 (LP), N2 (IP), N3 (HP)'],
        ['GEnx speeds', 'About 2,560 and 11,377 rpm nominal'],
        ['Trent speeds', 'About 2,683, 8,937 and 13,391 rpm'],
        ['Rotation', 'HP spool counter-rotates on both engines'],
      ],
    },

    fadec: {
      title: 'FADEC',
      summary:
        "A dual-channel digital computer runs each engine. The pilot asks for thrust with the levers; the FADEC decides how much fuel and where to put every valve and vane.",
      body: [
        "FADEC stands for full authority digital engine control. The engine-mounted electronic engine control (EEC) has two identical channels, each able to run the engine alone; they alternate in command and cross-check each other. When the engine is running it powers itself from a dedicated permanent-magnet alternator on the gearbox, so it does not depend on airplane power. There is no mechanical backup: full authority means the computer is the only path from thrust lever to fuel valve.",
        "The thrust lever sends a demand, not a fuel flow. The FADEC computes the thrust-setting target from the selected rating (takeoff, climb, continuous), any derate or assumed-temperature reduction, and air data: altitude, Mach number and inlet temperature. It then closes the loop on that target by metering fuel. Along the way it schedules variable stator vanes, bleed valves, active clearance control (fan air sprayed on the turbine casings to shrink them around the blade tips in cruise), oil and fuel cooling, starter and ignition, and reverser interlocks.",
        "Protections are built into the control laws. Acceleration and deceleration schedules limit fuel flow relative to compressor pressure, preventing surge on a slam acceleration and flameout on a chop. Overspeed limits protect each spool. Idle schedules keep enough margin for anti-ice, electrical load and a quick go-around. During an automatic start the FADEC watches for hot starts, hung starts and no light, and aborts or retries on its own. In flight it detects flameout and relights.",
        "The thrust-setting parameter is what the control holds constant. GE engines use N1, fan speed, because fan speed maps closely to thrust for a given air density. Rolls-Royce engines traditionally used EPR (engine pressure ratio, exhaust pressure over inlet pressure), which tracks thrust more directly but relies on pressure probes that can ice or block. Crew training material describes the Trent 1000 controlling on a Rolls-Royce pressure-based parameter in its normal mode with an N1 reversionary mode. Either way, the crew sets thrust through the autothrottle and FADEC rather than by hand-matching a gauge.",
      ],
      facts: [
        ['Architecture', 'Dual-channel engine-mounted EEC'],
        ['Own power', 'Dedicated permanent-magnet alternator'],
        ['Schedules', 'Fuel, VSVs, bleeds, clearance control, start, ignition'],
        ['GEnx thrust parameter', 'N1'],
        ['Protections', 'Surge, flameout, overspeed, start limits'],
      ],
    },

    nozzle: {
      title: 'Exhaust and chevrons',
      summary:
        "The bypass and core streams leave through separate nozzles. Saw-tooth chevrons on the nacelle's trailing edge mix the jet gently with outside air to cut noise.",
      body: [
        "Both 787 engines are separate-flow designs. The bypass air leaves through the fan nozzle at the back of the nacelle, a short annular nozzle around the core cowl. The hot core gas leaves through its own smaller nozzle further aft, surrounded by the cold bypass stream. Both are convergent nozzles; at cruise the fan nozzle is close to choked, meaning the flow reaches sonic speed at the throat.",
        "Jet noise comes from turbulent mixing in the shear layer between the fast jet and the slower surrounding air, and its acoustic power rises roughly with the eighth power of jet velocity (Lighthill's law). High bypass already helps a great deal by lowering jet velocity. The cold bypass stream also shields the hot, fast core jet from the still air outside.",
        "The 787's nacelles end in a row of triangular serrations called chevrons. Each one slightly turns the edge flow inward or outward, creating streamwise vortices that mix the two streams faster and more gently near the nozzle. That shortens the loud mixing region and moves energy from low-frequency rumble to higher frequencies that the atmosphere absorbs more readily and that weigh less in the certification noise metric. The cost is a small thrust loss, which careful shaping keeps minimal.",
        "Chevrons are only part of the 787's noise story. Swept fan blades, acoustic liners in the inlet and bypass duct, and the high bypass ratio itself all contribute. Chevrons came out of NASA and industry research in the 1990s and 2000s.",
      ],
      facts: [
        ['Exhaust layout', 'Separate fan and core nozzles'],
        ['Chevrons', 'On the nacelle (fan nozzle) trailing edge'],
        ['Mechanism', 'Vortices mix the jet with outside air sooner'],
        ['Jet noise scaling', 'About jet velocity to the 8th power'],
      ],
    },

    reverser: {
      title: 'Thrust reverser',
      summary:
        "After touchdown, a sleeve on the nacelle slides back and blocker doors divert the fan air forward through cascades of turning vanes. It helps the brakes, especially on wet or icy runways.",
      body: [
        "The 787 uses a cascade-type reverser on the fan duct only. The aft part of the nacelle is a translating sleeve. When it slides aft it opens a gap in the outer nacelle wall lined with cascades, grids of curved vanes. Blocker doors on the inner face of the sleeve swing into the bypass duct on drag links and close it off, so the fan air has nowhere to go but out through the cascades, which turn it forward and outward.",
        "Only the fan stream is reversed. The core jet still points aft, but it is a small share of the thrust, so the net is a modest reverse force. At full reverse a turbofan of this kind produces reverse thrust of a fraction of its forward thrust. Reversers matter most when wheel braking is poor, on wet, contaminated or icy runways, and they save brake wear. Certified landing distances on a dry runway do not count on them.",
        "Each reverser is hydraulically actuated from its own side's hydraulic system (left for the left engine, right for the right). Multiple independent locks and air/ground logic prevent deployment in flight: the airplane must be on the ground, the thrust lever at idle, and the reverse lever lifted through an interlock. The FADEC limits engine power until the sleeve has nearly reached the fully deployed position.",
        "Crews normally reduce to reverse idle by about 60 knots. At low speed the reversed efflux can be re-ingested by the engine, causing compressor stalls, or blow debris into the inlet. Many airlines use idle reverse as standard on long dry runways to save fuel and noise, and full reverse when the runway is short or slippery.",
      ],
      steps: [
        'Touchdown: air/ground sensing confirms the airplane is on the ground with thrust levers at idle.',
        'Pilot lifts the reverse thrust levers to the interlock position; locks release and hydraulic actuators drive the translating sleeve aft.',
        'Blocker doors fold into the bypass duct and the cascades are uncovered; fan air turns forward through them.',
        'Once the sleeve is nearly fully deployed the interlock releases and the FADEC allows reverse power up to the selected level.',
        'Around 60 knots the pilot returns to reverse idle, then stows the reversers as the airplane slows to taxi speed.',
      ],
      facts: [
        ['Type', 'Translating sleeve with cascades and blocker doors'],
        ['Reverses', 'Fan (bypass) air only'],
        ['Actuation', 'Hydraulic, from the same-side system'],
        ['Use', 'On the ground only, mostly at high speed'],
        ['Back to idle reverse', 'About 60 knots'],
      ],
    },
  },
}
