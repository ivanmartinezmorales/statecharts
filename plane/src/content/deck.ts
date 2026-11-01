import type { Chapter } from './types'

export const deck: Chapter = {
  id: 'deck',
  title: 'The flight deck',
  intro:
    'Two pilots, five big screens, two head-up displays and an overhead panel that is mostly dark. The 787 flight deck is built so that a 777 pilot feels at home, while hiding much of the old switchology behind automation and software.',
  entries: {
    deck: {
      title: 'The office',
      summary:
        'Five large displays replace almost every dedicated gauge, and the crew moves information between them like windows on a computer.',
      body: [
        'The forward panel carries four large landscape displays across its width and a fifth on the forward pedestal between the pilots. Each is roughly 12 by 9 inches (about 15 inches diagonal), built by Collins Aerospace (formerly Rockwell Collins). The outboard screens show each pilot\'s primary flight display; the others are split into windows the crew can fill with the navigation display, engine and alert display, checklists, system diagrams, FMC pages or charts. A small standby instrument in the middle shows attitude, airspeed and altitude from independent sensors in case the main displays fail.',
        'Instead of a dedicated box for every function, much of the avionics runs as software on a shared computing platform (the Common Core System), connected by a high-speed network. Pilots interact with it through cursor control devices (a trackpad and rotary knob on the pedestal at each seat) and multifunction keypads. The design philosophy is "dark and quiet": when everything is normal, no lights are on in the overhead and no messages are on the screen. Anything lit is something to look at.',
        'Boeing deliberately kept the 787 close to the 777 in layout and behavior. A 777 pilot can get a 787 type rating through a short differences course rather than a full type rating, and many airlines fly both on a common qualification. That commonality is a big part of why the flight deck still has a control column and wheel, and why the autoflight logic is nearly identical to the 777\'s.',
        'Two electronic flight bags (tablet-like computers mounted at the side windows) hold charts, the airline\'s manuals and performance tools. Many airlines run takeoff and landing performance on them rather than in the FMC.',
      ],
      facts: [
        ['Main displays', '5, ~15 in diagonal'],
        ['Head-up displays', '2, standard'],
        ['Crew', '2 pilots (more on long flights)'],
        ['Common type rating', 'with 777'],
      ],
    },
    pfd: {
      title: 'Primary flight display',
      summary:
        'The PFD shows everything needed to fly the airplane this second: attitude, speed, altitude, vertical speed, heading and what the automation is doing.',
      body: [
        'The center of the PFD is the attitude indicator: a sky-and-ground ball with the airplane symbol fixed in the middle. Pitch lines are marked in degrees and a bank scale sits on top. The flight director bars or a flight path guidance cue sit on top of it, telling the pilot where to point the nose to follow the selected mode. The 787 also shows a flight path vector (FPV), a small airplane-shaped symbol that marks where the airplane is actually going rather than where it is pointing, which makes it easy to judge the descent angle to a runway.',
        'On the left is the airspeed tape. Its marks matter as much as the number. A magenta bug shows the commanded speed. A green trend arrow shows where the speed will be in 10 seconds at the current acceleration. Amber and red-black bands at the bottom and top show the minimum maneuvering speed and stall warning speed below, and the maximum operating speed above. Takeoff speeds (V1, VR) and flap retraction speeds appear as labeled bugs, so the pilot can see at a glance when to retract the next stage of flaps.',
        'On the right is the altitude tape, with the selected altitude in magenta, the barometric setting below it and a vertical speed scale beside it. During an approach a minimums marker shows the decision altitude, and the radio altitude (height above the ground measured by radar) appears near the bottom of the attitude display below 2,500 ft. ILS localizer and glideslope deviation scales appear next to the attitude display when tuned.',
        'Across the top is the flight mode annunciator (FMA): three columns showing the autothrottle mode, the roll mode and the pitch mode, with armed modes in white beneath active modes in green. Reading the FMA is the core habit of flying any Boeing: the pilot does not assume the automation is doing what was requested, they read it. A box drawn around a mode for 10 seconds means it just changed.',
      ],
      facts: [
        ['Speed trend vector', '10 s prediction'],
        ['FMA columns', 'thrust, roll, pitch'],
        ['Radio altitude shown', 'below 2,500 ft'],
        ['Active / armed modes', 'green / white'],
      ],
    },
    nd: {
      title: 'Navigation display',
      summary:
        'The ND is the moving map: route, other traffic, weather, terrain and, at the bottom, a side view of the vertical profile.',
      body: [
        'The navigation display shows the airplane from above against its route. In MAP mode, the FMC flight plan is drawn as a magenta line with waypoints, the airplane symbol sits at the bottom and the map moves beneath it, oriented by track. A green curved arrow predicts where the airplane will be in 30, 60 and 90 seconds based on the current turn. PLAN mode shows the route north-up for checking it. APP and VOR modes give a classic compass rose with deviation bars for raw-data flying.',
        'Overlays come from separate systems. The weather radar paints precipitation in green, amber and red (and turbulence in magenta where detected). The terrain awareness system colors terrain relative to the airplane\'s altitude. TCAS shows nearby traffic as diamonds with relative altitude, turning amber or red when it issues an alert. Pilots usually show weather on one side and terrain on the other so both are visible at once.',
        'At the bottom of the ND sits the vertical situation display (VSD): a side view along the current track showing terrain, the airplane, the selected altitude and, on approach, the descent path. It answers "will I clear that ridge" and "am I high on the profile" directly, instead of making the pilot calculate it. On the ground, an airport moving map shows the taxiways and runways with the airplane\'s own position, a real help at night or in poor visibility.',
        'The top corners show groundspeed, true airspeed, wind direction and speed, the next waypoint with distance and estimated time. Pilots change range and mode with the EFIS control panel on the glareshield.',
      ],
      facts: [
        ['Modes', 'MAP, PLAN, APP, VOR'],
        ['Vertical profile', 'VSD at bottom of ND'],
        ['Overlays', 'WX, TERR, TCAS'],
        ['Ground mode', 'airport moving map'],
      ],
    },
    eicas: {
      title: 'EICAS and the electronic checklist',
      summary:
        'EICAS shows engine health and every crew alert in one place, ranked by urgency, and links each alert to the checklist that deals with it.',
      body: [
        'EICAS (engine indicating and crew alerting system) is the airplane\'s dashboard and its voice. The top part shows the primary engine indications: the thrust parameter with a reference bug (the thrust the FMC wants), exhaust gas temperature (EGT) and engine core speeds, plus fuel quantity, flap and gear position, and total air temperature. Secondary indications such as oil pressure, oil temperature and vibration are on the engine page and appear automatically if one goes out of limits.',
        'Alerts are written as short messages in a list, ranked by urgency. Warnings are red, light the master warning lights and sound a siren or chime: they need immediate action (engine fire, cabin altitude, configuration errors on takeoff). Cautions are amber with the master caution light and a beeper: they need prompt attention. Advisories are amber without sound. Memos in white confirm a normal but notable state, such as PARKING BRAKE SET. The system suppresses less important messages during takeoff and landing so the crew is not distracted at the busiest moments.',
        'The 787 has an electronic checklist (ECL). When a caution appears, a checklist icon tells the crew a procedure exists; one button press brings it up on a lower display. Many items are "closed loop": the airplane senses switch positions and ticks them off itself when the pilot moves the switch. Open-loop items (things the airplane cannot sense, like "Brief the cabin") are ticked with the cursor. Normal checklists work the same way, so the before-takeoff check shows green only when the airplane agrees.',
        'System synoptics (simplified diagrams of the electrical, hydraulic, fuel, air, door, gear and flight control systems) can be called up in any window. The flight control synoptic is used during the control check before takeoff: each surface is shown moving as the pilots move the controls.',
      ],
      facts: [
        ['Warning', 'red, siren or chime'],
        ['Caution', 'amber, beeper'],
        ['Advisory', 'amber, silent'],
        ['Memo', 'white'],
        ['Checklist', 'electronic, partly self-sensing'],
      ],
    },
    hud: {
      title: 'Head-up display',
      summary:
        'A glass plate in front of each pilot projects flight data focused at infinity, so the pilot can fly while looking outside instead of down at the panel.',
      body: [
        'The 787 was the first Boeing airliner with dual head-up displays (HUDs) as standard equipment. A projector in the ceiling shines onto a transparent combiner glass that folds down in front of each pilot\'s eyes. The image is collimated, meaning focused at infinity, so the symbols appear to float on the outside world and the eye does not need to refocus between the symbology and the runway.',
        'The key symbol is the flight path vector, a small circle with wings that sits exactly where the airplane is going. On approach, the pilot places it on the runway touchdown zone and it stays there; if it sits short of the runway, the airplane will land short. Speed and altitude appear as compact tapes, a speed error indicator shows whether the airplane is fast or slow against the target, and a guidance cue shows where the flight director wants the flight path to go. A conformal runway outline is drawn over the real runway during an ILS approach.',
        'The HUD shows a reduced, decluttered version of the PFD; in its most decluttered setting it shows little more than the flight path vector and essential numbers. At rotation it shows a pitch limit for tail strike, and during the landing flare it helps judge the flare height and rate. When not needed, the combiner swings up out of the way against the ceiling.',
        'Pilots use it for visual approaches, for low-visibility takeoffs where it adds guidance down the runway, and for hand-flown approaches where seeing the runway and the flight path at the same moment is a real safety gain. What a HUD lets an airline do in low visibility (lower minimums, special approvals) depends on the operator\'s approvals and procedures.',
      ],
      facts: [
        ['Units', '2, standard on 787'],
        ['Optics', 'collimated, focused at infinity'],
        ['Key symbol', 'flight path vector'],
        ['Mount', 'fold-down combiner'],
      ],
    },
    mcp: {
      title: 'Mode control panel',
      summary:
        'The MCP on the glareshield is how pilots tell the autopilot and autothrottle what to do right now: speed, heading, altitude and which mode to fly.',
      body: [
        'The mode control panel runs across the glareshield and is reachable by both pilots. From left to right it has the flight director switches, the autothrottle arm switches, the speed window (IAS or Mach), the roll and pitch mode buttons, the heading or track window, the vertical speed or flight path angle wheel, the altitude window and the autopilot engage buttons with a disengage bar beneath. Outboard on each side sits that pilot\'s EFIS control panel for minimums, barometric setting and ND range and mode.',
        'Autothrottle modes on the FMA include THR REF (set the reference thrust, such as takeoff or climb), SPD (hold speed), IDLE (thrust levers to idle), HOLD (servos off, levers stay where they are) and THR (just enough thrust for the commanded climb or descent rate). Roll modes include LNAV (follow the FMC lateral route), HDG SEL or TRK SEL (fly the selected heading or track), HDG HOLD, LOC (follow the ILS localizer) and ROLLOUT on the runway after an autoland.',
        'Pitch modes include VNAV (follow the FMC vertical profile and speeds, shown as VNAV SPD, VNAV PTH or VNAV ALT), FLCH SPD (flight level change: climb or descend at a selected speed using climb or idle thrust), V/S and FPA (a set vertical speed or flight path angle), ALT (hold altitude), G/S (follow the ILS glideslope) and FLARE. The 787 also has integrated approach navigation, which flies non-precision approaches like an ILS using FMC-built guidance (FAC for the lateral course and G/P for the glide path).',
        'Everything flown by the automation is bounded by the altitude window: the airplane will not climb or descend through the MCP altitude without the pilot setting a new one. That single habit, "set the cleared altitude in the window", is one of the most important safety barriers in airline flying. Pilots change modes with the MCP for tactical, near-term changes and with the FMC for the strategic plan.',
      ],
      facts: [
        ['Location', 'glareshield, center'],
        ['Lateral modes', 'LNAV, HDG/TRK, LOC'],
        ['Vertical modes', 'VNAV, FLCH, V/S, ALT, G/S'],
        ['Autoland status', 'LAND 3 / LAND 2'],
        ['Min A/P engage', '200 ft after takeoff'],
      ],
    },
    cdu: {
      title: 'FMC and the keypad',
      summary:
        'The flight management computer holds the route, the weights and the performance plan; pilots program it through CDU pages on screen and a keypad on the pedestal.',
      body: [
        'The flight management computer (FMC) is the airplane\'s navigator and planner. It knows the route, the airplane\'s weight and fuel, the winds and temperatures forecast along the way and the airline\'s cost index (a number that trades fuel cost against time cost; low means slow and frugal, high means fast). From these it builds the lateral path that LNAV follows, the vertical profile and speeds that VNAV follows, predicted fuel at each waypoint and arrival times. It blends GPS, the inertial reference units and radio navigation aids to know where the airplane is to within a few meters.',
        'Older Boeings have a CDU (control display unit): a small screen with a keyboard. The 787 removes the physical box. The CDU pages appear as windows on the main displays, and each pilot types on a multifunction keypad (MFK) on the pedestal. The page structure is familiar to any Boeing pilot: IDENT, POS INIT, ROUTE, DEP/ARR, LEGS, PERF INIT, THRUST LIM, TAKEOFF REF, VNAV and PROGRESS. Line select keys beside the page are replaced by cursor clicks or keys on the MFK.',
        'Much of the data arrives by datalink: the route, winds aloft, takeoff data and the final load figures can be uplinked from the airline\'s operations center and accepted by the crew. The crew still cross-checks it: the most dangerous FMC errors are wrong weights or a wrong runway, because they produce believable but wrong takeoff speeds and thrust. That is why both pilots independently verify the entries before engine start.',
      ],
      steps: [
        'IDENT: check the airplane, engine type and navigation database dates.',
        'POS INIT: confirm the current position for the inertial reference units.',
        'ROUTE: load or uplink origin, destination, flight number and the route.',
        'DEP/ARR: select the departure runway and the standard instrument departure.',
        'PERF INIT: enter zero fuel weight, reserves, cost index and cruise altitude.',
        'THRUST LIM: choose takeoff thrust, any derate or assumed temperature.',
        'TAKEOFF REF: enter flaps, center of gravity and V speeds; check the stab trim value.',
      ],
      facts: [
        ['Physical CDU', 'none, shown on displays'],
        ['Input', 'multifunction keypad + cursor'],
        ['Position sources', 'GPS, inertial, radio aids'],
        ['Cost index', 'airline-set, fuel vs time'],
      ],
    },
    pedestal: {
      title: 'The pedestal',
      summary:
        'Between the seats sit the thrust levers, the speedbrake, the flap lever and the fuel control switches that start and stop the engines.',
      body: [
        'The two thrust levers are in the middle. They move under autothrottle servo control, so the pilot sees and feels thrust changes. Each has a TO/GA switch (pressed to start a takeoff or a go-around) and an autothrottle disconnect switch on its side. Behind each forward lever is a reverse thrust lever that can only be raised when the forward lever is at idle; air/ground logic lets the reversers deploy only on the ground.',
        'On the left is the speedbrake lever. Pulled aft in flight, it raises the spoilers symmetrically to add drag for descent. Armed before landing, it deploys the spoilers automatically at touchdown, dumping lift so the weight goes onto the wheels and the brakes become effective. On the right is the flap lever, with gated detents at UP, 1, 5, 15, 17, 18, 20, 25 and 30. Takeoff normally uses 5 to 20 depending on runway and weight; landing uses 25 or 30. The gate at certain positions stops a pilot from accidentally retracting flaps too far during a go-around.',
        'Just aft of the thrust levers are the two fuel control switches, one per engine, with RUN and CUTOFF positions. They are the 787\'s engine master switches: RUN opens the fuel valves and enables ignition so the engine can start; CUTOFF shuts the fuel off and stops the engine. To move one, the pilot must pull the switch out over a detent before moving it, and guards on either side protect them from being knocked. They are used at engine start, at shutdown at the gate and in a few emergency procedures.',
        'The rest of the pedestal holds the multifunction keypads and cursor control devices, the lower center display, radio and transponder controls, the alternate flap and stabilizer controls, and the parking brake.',
      ],
      facts: [
        ['Flap detents', 'UP, 1, 5, 15, 17, 18, 20, 25, 30'],
        ['Landing flaps', '25 or 30'],
        ['Fuel switches', 'RUN / CUTOFF, lift-to-move'],
        ['Thrust lever switches', 'TO/GA, A/T disconnect'],
      ],
    },
    overhead: {
      title: 'The overhead panel',
      summary:
        'The overhead holds switches for the airplane\'s systems: electrics, hydraulics, fuel, air, ice protection and lights. In normal flight almost all of them sit in AUTO, with no lights on.',
      body: [
        'The electrical panel controls the main battery, external power, the APU generators and the four engine starter-generators. Normally the generators are left on and the system manages itself, shedding loads automatically if a source is lost. A ram air turbine (RAT), a small propeller-driven generator and pump, drops out of the fuselage automatically if both engines fail or all hydraulic pressure is lost, to power essential flight controls and instruments.',
        'The hydraulic panel controls three independent systems (left, center and right) at 5,000 psi. Left and right each have an engine-driven pump and an electric demand pump that runs when needed; the center system relies on two electric pumps and the RAT. The fuel panel controls the tank pumps, crossfeed and fuel jettison, with the airplane computing how much fuel to dump to reach a target weight. The APU selector has OFF, ON and START positions.',
        'The air conditioning panel controls the two packs (units that cool and condition air) fed by the four electric cabin air compressors, the recirculation fans, and the pressurization, which runs automatically by modulating the outflow valves. Ice protection is mostly automatic: ice detectors switch on wing and engine anti-ice when needed. Engine start selectors, window heat, wipers, exterior lights, seatbelt signs and passenger oxygen complete the panel.',
        'The design follows Boeing\'s "dark cockpit" idea: a switch lights only if it is not where it should be, or something has failed. A quick scan of an all-dark overhead tells the crew the systems are configured normally. The 787 overhead is noticeably simpler than a 747-400\'s because the computers handle sequencing that pilots once did by hand.',
      ],
      facts: [
        ['Hydraulic systems', '3 at 5,000 psi'],
        ['Engine generators', '4 x 250 kVA'],
        ['APU generators', '2 x 225 kVA'],
        ['Cabin air compressors', '4, electric'],
        ['Emergency power', 'ram air turbine'],
      ],
    },
    yoke: {
      title: 'Column, wheel and pedals',
      summary:
        'The 787 is fly-by-wire but keeps a traditional control column, wheel and rudder pedals, with artificial feel that makes it handle like a conventional Boeing.',
      body: [
        'There are no cables to the elevators, ailerons or rudder. Sensors on the column, wheel and pedals send electrical signals to the primary flight computers, which command electrohydraulic actuators on each surface (and electric motors on some spoilers and the stabilizer). The computers add stability augmentation, turn coordination and protections, but Boeing kept a yoke rather than a sidestick so the pilots can see and feel each other\'s inputs, and so 777 pilots transfer easily.',
        'The feel is manufactured. Feel units push back on the column and wheel with springs and electric actuators, and the force grows with airspeed the way an unboosted control would. In normal mode, pitch works on a "C* U" control law: pulling the column commands a change in flight path (g load and pitch rate blended), and the airplane holds that path when the column is released. But Boeing added speed stability on purpose: the trim switches set a reference speed rather than moving the stabilizer directly. Fly faster or slower than the trimmed speed and the pilot must hold column force, exactly as on a conventional airplane. That keeps the pilot aware of speed through their hands.',
        'The protections are "soft": they make the controls heavier rather than locking the pilot out. Near stall the column force increases sharply and the autothrottle, if armed, wakes up to add thrust. Near overspeed the airplane resists nose-down. Beyond about 35 degrees of bank, the wheel pushes back and the airplane tends to roll back toward 30 degrees if released. Thrust asymmetry compensation adds rudder automatically if an engine fails. A determined pilot can override any of these, which is a deliberate Boeing choice: the pilot has final authority.',
        'When the autopilot flies, backdrive actuators move the column, wheel and pedals to match the surfaces, so the crew can see what the autopilot is doing and feel it if they rest a hand there. Pushing hard enough against the backdrive disconnects the autopilot. If computers or sensors fail, the system degrades from normal to secondary mode (fewer protections) and then to direct mode, where control inputs map straight to surface movement. The rudder pedals also steer the nosewheel by a few degrees for small corrections and work the wheel brakes when pressed at the top.',
      ],
      facts: [
        ['Control type', 'fly-by-wire, yoke'],
        ['Pitch law', 'C* U with trim reference speed'],
        ['Bank protection', 'above ~35 degrees'],
        ['Modes', 'normal, secondary, direct'],
        ['A/P feedback', 'backdriven controls'],
      ],
    },
  },
}
