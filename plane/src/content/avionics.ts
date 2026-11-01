import type { Chapter } from './types'

export const avionics: Chapter = {
  id: 'avionics',
  title: 'Avionics',
  intro:
    "The 787's electronics are built more like a data center than a row of separate instruments: shared computers, one deterministic network, and sensors whose answers are voted on before anyone sees them.",
  entries: {
    ccs: {
      title: 'Common Core System',
      summary:
        "Instead of dozens of dedicated boxes, the 787 runs many of its systems as software on two shared computer cabinets. Each function lives in its own walled-off partition so a fault in one cannot spill into another.",
      body: [
        "On earlier airliners almost every system had its own line replaceable unit: a box with its own processor, power supply, connectors and wiring. The 787 replaced much of that with the Common Core System (CCS), designed by Smiths Aerospace, which became part of GE Aviation in 2007. The CCS is an integrated modular avionics platform: a set of standard computing modules, a shared network and distributed input/output units, on which many aircraft functions run as hosted software applications.",
        "The computing lives in two Common Computing Resource (CCR) cabinets. Each cabinet holds eight General Processing Modules (GPMs), two power conditioning modules, two network switches, fiber optic translator modules and the graphics generators that draw the flight deck displays. Every GPM has the same hardware and the same core operating system. Hosted functions include flight management, thrust management, electrical generator and bus power control, remote power distribution and circuit breaker control, landing gear indication and control, crew alerting and central maintenance.",
        "The key technology is partitioning, defined by the ARINC 653 standard. Each application gets a fixed slice of memory and a fixed, repeating slice of processor time. The operating system enforces both, so an application that crashes, loops or overruns its memory cannot corrupt or starve its neighbours. This lets software of the highest criticality (DO-178 Level A, where a failure could be catastrophic) share a processor with software of minor importance, which is what makes a shared computer acceptable to certification authorities.",
        "The payoff is weight, wiring, spares and flexibility. Fewer boxes means fewer connectors, less cable and fewer unique spare parts for airlines to stock. New functions can be added as software rather than new hardware. The cost is concentration: the shared platform must be extremely robust, and in 2020 the FAA required operators to power the airplane down completely at least every 51 days because a monitor that checks for stale network data could be lost after that long continuously powered.",
      ],
      facts: [
        ['Designer', 'Smiths Aerospace, now GE Aerospace'],
        ['Cabinets', '2 Common Computing Resource cabinets'],
        ['Processing modules', '8 GPMs per cabinet'],
        ['Partitioning standard', 'ARINC 653'],
        ['Remote data concentrators', '21'],
      ],
    },
    afdx: {
      title: 'The data network',
      summary:
        "The 787's systems talk over a switched Ethernet built for aircraft, where every message has a reserved lane and a guaranteed maximum delay. Everything is sent twice, over two separate networks.",
      body: [
        "The Common Data Network (CDN) is the 787's backbone. It follows ARINC 664 Part 7, often called AFDX (Avionics Full-Duplex Switched Ethernet). Physically it is Ethernet: the same frame format and the same kind of switches as an office network, using both copper wire and fiber optic cable. What makes it suitable for flight-critical data is that it is deterministic: the worst-case delay for every message is known in advance and guaranteed.",
        "Determinism comes from virtual links. A virtual link is a one-way, preconfigured channel from one sender to one or more receivers. Each has a bandwidth allocation gap, the minimum time between frames, so a sender can never flood the network. The switches know every virtual link ahead of time, police the traffic and drop anything that breaks its contract. Because every link's maximum rate is fixed, engineers can calculate the worst-case queueing in every switch and prove that critical data arrives on time.",
        "Redundancy is built in at the frame level. Each connected unit has an end system, the aircraft equivalent of a network card, which sends every frame out on two independent networks, A and B, through separate switches and cables. The receiver takes the first valid copy and discards the duplicate using a sequence number. A cable cut or switch failure on one network costs nothing. On top of that, Boeing requires critical data to carry extra error detection: timestamps and checksums added by the sender, so receivers can reject data that is corrupted or simply too old.",
        "Not every sensor or valve speaks Ethernet, so the CCS uses 21 Remote Data Concentrators (RDCs) spread around the airframe. Each RDC sits near the equipment it serves, reads analog signals, discrete on/off signals, older ARINC 429 data buses and CAN buses, and publishes the data onto the network. Short local wires to a nearby RDC replace long point-to-point cable runs to the electronics bay, which removes a large amount of wiring weight.",
      ],
      steps: [
        'A hosted application or sensor produces data.',
        'Its end system packs the data into frames on a preconfigured virtual link, no faster than the link allows.',
        'The end system sends identical copies out on network A and network B.',
        'Switches on each network check each frame against the virtual link table and forward it to the right ports.',
        'The receiving end system accepts the first valid copy, discards the duplicate, and checks freshness before handing data to the application.',
      ],
      facts: [
        ['Standard', 'ARINC 664 Part 7 (AFDX)'],
        ['Redundancy', 'Dual networks, A and B'],
        ['Media', 'Copper and fiber optic'],
        ['Link speed', 'Up to 100 Mbit/s'],
        ['Remote data concentrators', '21'],
      ],
    },
    adiru: {
      title: 'Air data and inertial reference',
      summary:
        "Pressure probes and angle of attack vanes measure the air; spinning laser light inside sealed gyros measures the airplane's own motion. The two are cross-checked and voted so the crew sees one trustworthy answer.",
      body: [
        "Air data describes the airplane's motion through the air. Pitot probes face into the airflow and measure total pressure; static ports flush with the fuselage measure ambient pressure. The difference gives airspeed, static pressure gives altitude, and the rate of change gives vertical speed. Angle of attack (AOA) vanes on the nose sides measure the angle between the wing and the oncoming air, and a temperature probe gives outside air temperature. Modern Boeing designs typically digitize the pressures in air data modules mounted close to the probes, which saves long pneumatic lines that can leak, freeze or be wrongly connected during maintenance.",
        "Inertial reference describes the airplane's motion relative to space. Inside each inertial reference unit are three ring laser gyros and three accelerometers. A ring laser gyro sends two laser beams in opposite directions around a closed glass path; when the unit rotates, one beam's path gets slightly longer than the other's, and the resulting interference pattern measures the rotation rate precisely with no moving parts. Integrating rotation and acceleration gives attitude, heading, velocity and position. Honeywell supplies the 787's inertial system, which it calls the Earth Reference System; pilot accounts report that it pairs inertial reference units with separate attitude and heading reference units as an extra independent source.",
        "Before flight the inertial units must align. With the airplane stationary, the accelerometers find which way is down, and the gyros sense the Earth's rotation (about 15 degrees per hour), which reveals the direction of true north and the latitude. Position comes from GPS. Alignment takes several minutes and longer at high latitudes, where the horizontal component of the Earth's rotation is small. If the airplane moves, the alignment must restart.",
        "Boeing's design for the 777 and 787 moves fault arbitration from the crew to the system. On older airplanes, each pilot had independent sources and a disagreement meant the crew had to decide which instrument was wrong. On the 787, multiple sources are voted and monitored, and a failed source is removed automatically. The 787 also protects against common-mode failures, where every pitot probe is fooled at once by ice, volcanic ash or a blocked port. It computes a synthetic airspeed from angle of attack, inertial data and airplane weight, and a GPS-derived altitude, and a common mode monitor compares these against the measured values. A large mismatch triggers an AIRSPEED UNRELIABLE alert.",
      ],
      facts: [
        ['Gyro type', 'Ring laser gyro'],
        ['Inertial system', 'Honeywell Earth Reference System'],
        ['Pressure sensing', 'Typically digitized near the probes'],
        ['Backup airspeed', 'Synthetic, from AOA and inertial data'],
        ['Alignment', 'Several minutes, stationary'],
      ],
    },
    gps: {
      title: 'Satellite navigation and approaches',
      summary:
        "Integrated navigation receivers combine GPS, ILS, GLS and VOR in one box. Paired with the flight management system, they let the 787 fly precise curved paths and approaches with or without ground radio aids.",
      body: [
        "The 787 uses Honeywell integrated navigation receivers, a modern form of the multimode receiver. One unit contains GPS, the instrument landing system (ILS), the GPS landing system (GLS) and VOR receivers, replacing several separate radios. GPS position feeds the flight management function and is blended with inertial data: inertial navigation is smooth and immune to jamming but drifts slowly, while GPS is accurate but can be interrupted. Together they give a position that is both accurate and continuous.",
        "Area navigation (RNAV) means flying any path defined by waypoints rather than flying from one ground beacon to the next. Required Navigation Performance (RNP) adds onboard monitoring and alerting: the airplane continuously estimates its own position accuracy, called actual navigation performance, and alerts the crew if it cannot meet the accuracy the procedure requires. RNP Authorization Required (RNP AR) approaches use this to fly curved paths around terrain to accuracies of a fraction of a nautical mile, opening airports surrounded by mountains.",
        "ILS is the traditional precision approach: a localizer radio beam gives left-right guidance and a glideslope beam gives vertical guidance. With the appropriate certification and crew training it supports automatic landing in very low visibility. GLS gives ILS-like guidance from GPS. A ground station at the airport with surveyed antennas measures the GPS errors and broadcasts corrections and the approach path over a VHF data link; the airplane applies them and displays the result just like an ILS. One ground station can serve every runway end at an airport.",
        "For approaches without a localizer beam, Boeing's integrated approach navigation (IAN) presents RNAV and non-precision approaches with ILS-style deviation scales and autopilot modes, so the crew flies every approach type the same way. That consistency reduces the chance of mode confusion in a high-workload phase of flight.",
      ],
      facts: [
        ['Receiver', 'Honeywell integrated navigation receiver'],
        ['Functions', 'GPS, ILS, GLS, VOR'],
        ['Precision approaches', 'ILS and GLS'],
        ['Performance-based navigation', 'RNAV, RNP, RNP AR'],
        ['Position solution', 'GPS blended with inertial'],
      ],
    },
    radar: {
      title: 'Weather radar',
      summary:
        "The nose radar scans ahead at several tilt angles automatically, removes ground echoes, and paints storms, turbulence and wind shear for the crew without constant manual tilt adjustment.",
      body: [
        "The weather radar is part of the 787's Rockwell Collins (now Collins Aerospace) integrated surveillance system, which combines the radar with the transponder, traffic collision avoidance and terrain awareness in a single system. The radar uses Collins' MultiScan technology. Its antenna sits behind the radome in the nose, sweeps side to side across the forward sector, and measures the energy reflected by water droplets and ice.",
        "With a conventional radar the pilot sets the antenna tilt by hand, and a poor tilt choice can miss the reflective core of a storm or bury it in ground clutter. MultiScan sweeps at more than one tilt angle automatically, samples both the near and the far part of the beam, and merges the scans into one picture. It uses a terrain database to remove ground returns, which lets it look down toward the lower, most reflective part of a thunderstorm without the display filling with mountains. It also adjusts the displayed intensity for altitude and storm height, so a cell the airplane will overfly is shown differently from one in its path.",
        "Turbulence detection uses the Doppler effect. Raindrops in turbulent air move in many directions at once, which spreads the frequencies of the returned echo. The radar measures that spread and shows turbulence in magenta, out to about 40 nautical miles. It can only see turbulence inside precipitation; clear-air turbulence has nothing to reflect the signal.",
        "Predictive wind shear works on takeoff and approach at low altitude. The radar looks for the Doppler signature of a microburst: air rushing toward the airplane on one side and away on the other. It can warn before the airplane enters the shear, unlike reactive wind shear warnings that only trigger once the airplane's own airspeed and flight path start to change.",
      ],
      facts: [
        ['Supplier', 'Rockwell Collins (Collins Aerospace)'],
        ['Technology', 'MultiScan automatic tilt'],
        ['Turbulence detection', 'Doppler, about 40 NM'],
        ['Ground clutter', 'Removed using a terrain database'],
        ['Wind shear', 'Predictive, on takeoff and approach'],
      ],
    },
    comms: {
      title: 'Communications and surveillance',
      summary:
        "Voice radios, satellite links and datalink let the crew talk to controllers anywhere on Earth, and the transponder broadcasts the airplane's GPS position for others to see.",
      body: [
        "VHF radios handle line-of-sight voice and data, typically out to about 200 nautical miles at cruise altitude. The 787's Rockwell Collins VHF radios also support VDL Mode 2, a digital data link that is much faster than the older analog ACARS channel. HF radios use frequencies that bounce off the ionosphere, giving voice contact far over oceans and polar regions where VHF cannot reach, at the cost of noise and variable propagation. Satellite communications (SATCOM) through the Inmarsat network provide voice and data almost anywhere except the extreme polar regions.",
        "ACARS (Aircraft Communications Addressing and Reporting System) is the airline's text messaging network. It carries weather, flight plans, takeoff performance data, engine health reports and maintenance messages, routed over whichever link is available: VHF, SATCOM or HF data link. On the 787 the communication management function that chooses the route runs as hosted software, and engine and system monitoring can send reports to the airline's maintenance base during flight.",
        "CPDLC (Controller-Pilot Data Link Communications) replaces some voice exchanges with text messages: clearances, frequency changes and altitude requests. The crew reads, accepts or rejects them, and accepted clearances can be loaded into the flight management system directly, which avoids misheard readbacks. The 787 supports FANS 1/A, used over oceanic and remote airspace via ACARS links, and ATN-based CPDLC used in European continental airspace over VDL Mode 2.",
        "The transponder, part of the integrated surveillance system, answers radar interrogations on 1030 MHz with replies on 1090 MHz, including the airplane's identity and altitude. ADS-B Out goes further: the transponder broadcasts the airplane's GPS position, velocity and identity on 1090 MHz about twice a second, whether or not anything interrogates it. Controllers and other airplanes receive it directly, and the traffic collision avoidance system (TCAS) uses transponder replies from nearby aircraft to predict conflicts and issue resolution advisories.",
      ],
      facts: [
        ['Voice', 'VHF, HF, SATCOM'],
        ['Digital VHF', 'VDL Mode 2'],
        ['Datalink', 'ACARS, CPDLC (FANS 1/A and ATN)'],
        ['SATCOM network', 'Inmarsat'],
        ['ADS-B Out', '1090 MHz extended squitter'],
      ],
    },
  },
}
