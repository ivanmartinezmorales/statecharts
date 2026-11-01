import type { Chapter } from './types'

export const flying: Chapter = {
  id: 'flying',
  title: 'How to fly it',
  intro:
    'Follow a 787-9 on an overnight flight from New York JFK to London Heathrow, about six and a half to seven hours eastbound. This is a simplified educational walkthrough, not an operating procedure: real crews follow their airline\'s manuals and checklists, and the exact speeds, settings and callouts vary by airline, weight and weather.',
  entries: {
    preflight: {
      title: 'Preflight',
      summary:
        'About an hour before departure the crew briefs, walks around the airplane, powers it up and programs the FMC, then both pilots cross-check every number.',
      body: [
        'The day starts in the briefing room or on a tablet: the flight plan, weather at departure, destination and alternates, NOTAMs (notices of runway closures, unserviceable aids and so on), the North Atlantic track message, and the fuel figure. For a trip like this, block fuel is typically somewhere around 40 to 55 tonnes depending on payload and winds, well under the tanks\' 101 tonnes. The captain decides the final fuel, often adding extra for expected holding at Heathrow.',
        'On the airplane, one pilot (often the first officer) walks around the outside: tires, brakes and wear pins, gear, probes and static ports, the radome, engine inlets and fan blades, the tail, and any leaks or damage. The other sets up the flight deck. The airplane may already be on ground power or the APU; if it is cold and dark, the first step is the battery switch, then external power or the APU. The inertial reference units start aligning on their own as soon as they have power; they need the airplane still for several minutes, longer at high latitude.',
        'FMC setup follows the page order, much of it by datalink. The route and winds are uplinked; the crew loads the departure (say a JFK runway 31L departure), checks the route against the flight plan waypoint by waypoint, and enters the performance data. Final weights arrive later on the load sheet; the zero fuel weight and center of gravity go into the FMC, takeoff performance is calculated (in the FMC or on the airline\'s EFB tool) and the resulting flaps, thrust setting and V speeds are entered. The stabilizer trim value for takeoff comes from the center of gravity.',
        'Then the briefing: the captain or the pilot flying talks through the departure, the expected taxi route, the takeoff numbers, what happens if an engine fails before or after V1, and the return or diversion plan. Both pilots verify the critical FMC entries independently. Most serious performance errors in airline history came from a wrong weight or wrong runway entry, so this cross-check is treated as sacred.',
      ],
      steps: [
        'Review flight plan, weather, NOTAMs and fuel; agree on the fuel load.',
        'Exterior walkaround: gear, tires, brakes, probes, engines, surfaces.',
        'Power up: battery ON, external power or APU (selector to START, then ON).',
        'Inertial reference units align automatically; confirm position.',
        'FMC: IDENT, POS INIT, ROUTE (uplink), DEP/ARR, PERF INIT, THRUST LIM, TAKEOFF REF.',
        'Enter final zero fuel weight and CG from the load sheet; set V1, VR, V2 and flaps.',
        'Set MCP: flight directors ON, autothrottle ARM, initial altitude, LNAV and VNAV armed.',
        'Departure briefing, then both pilots cross-check the takeoff data.',
      ],
      facts: [
        ['Crew report', '~60 to 90 min before'],
        ['Block fuel (typical)', '~40 to 55 t'],
        ['Takeoff weight (typical)', '~200 to 230 t'],
        ['IRS alignment', 'several minutes, still'],
      ],
    },
    start: {
      title: 'Pushback and engine start',
      summary:
        'With doors closed and clearance received, the tug pushes the airplane back while the crew starts the engines with electric power from the APU.',
      body: [
        'Before pushback the crew runs the Before Start checklist: doors closed, fuel pumps on, hydraulic demand pumps to AUTO, beacon on, the trim set, and the takeoff numbers rechecked against the final load sheet. Ground control clears the push; the ground crew connects a tug and talks to the captain by headset. The parking brake is released only when the ground crew asks for it.',
        'There is no air starter on a 787. Each engine has two starter-generators on its gearbox; for starting, they run as electric motors, powered by the APU\'s two generators (or by ground power if the APU is inoperative). The pilot turns the engine start selector on the overhead to START, which begins motoring the engine core, then moves that engine\'s fuel control switch on the pedestal to RUN. Autostart, managed by the engine\'s FADEC (full authority digital engine control, the engine\'s own computer), introduces fuel and ignition at the right core speed, watches temperature and acceleration, and aborts and retries if something is wrong.',
        'Engines are usually started one at a time. The crew watches EGT rise, then the core speed stabilize at idle; the starter disengages and switches to generating. When both engines are running and stable, the APU can be shut down (often left running until airborne in hot weather or at airlines that prefer it), the generators take over the electrical load, and the hydraulic engine-driven pumps pressurize the left and right systems.',
        'After Start: flaps to the takeoff setting (for example flaps 15), the flight control check with the synoptic display showing each surface move, and the After Start checklist.',
      ],
      steps: [
        'Before Start checklist; beacon ON; pushback clearance from ground control.',
        'Parking brake released on the ground crew\'s request; push starts.',
        'Engine start selector to START; the starter-generator begins motoring the engine.',
        'Fuel control switch to RUN; autostart adds fuel and ignition at the right speed.',
        'Monitor EGT and core speed on EICAS until the engine stabilizes at idle.',
        'Repeat for the other engine; APU off or left running per airline practice.',
        'Flaps set for takeoff; flight control check; After Start checklist.',
      ],
      facts: [
        ['Starter', 'electric starter-generators'],
        ['Start power', 'APU or ground power'],
        ['Start control', 'FADEC autostart'],
        ['Bleed air for start', 'none'],
      ],
    },
    taxi: {
      title: 'Taxi',
      summary:
        'The captain steers with a tiller to the runway while the first officer handles the radio, and both run the takeoff checks before reaching the holding point.',
      body: [
        'The captain steers with the tiller, a small handwheel beside the left seat that turns the nosewheel through large angles; the rudder pedals give only small corrections. Taxi speed is kept modest, typically under about 20 to 30 knots on long straight taxiways and around 10 knots in turns, because a 200-tonne airplane has a lot of momentum and the main gear is far behind the pilots. On a widebody the pilot overshoots the centerline turn to keep the main gear on the pavement; the airport moving map on the ND shows the airplane\'s exact position.',
        'Carbon brakes heat up with every stop. The 787\'s brakes are electrically actuated rather than hydraulic, and brake temperatures are shown on the gear synoptic. Pilots avoid riding the brakes: let the speed build a little, then apply a firm, steady brake to slow down, then release. Thrust is kept near idle; a 787 at light weight often accelerates on idle thrust alone.',
        'On the way the crew completes the Before Takeoff checklist: flaps confirmed, trim set, transponder to TA/RA (so TCAS will give resolution advisories), the autobrake set to RTO (rejected takeoff, which applies maximum braking automatically if the takeoff is rejected above about 85 knots), and the cabin reported ready. They review the takeoff numbers once more as they approach the runway.',
      ],
      steps: [
        'Taxi clearance from ground control; parking brake off.',
        'Captain steers with the tiller; first officer follows on the airport map and talks to ATC.',
        'Monitor brake temperatures; use firm, intermittent braking.',
        'Autobrake to RTO; transponder to TA/RA; Before Takeoff checklist.',
        'Hold short of the runway until cleared to line up.',
      ],
      facts: [
        ['Steering', 'tiller + rudder pedals'],
        ['Turn speed', '~10 kt'],
        ['Brakes', 'carbon, electrically actuated'],
        ['Autobrake for takeoff', 'RTO'],
      ],
    },
    takeoff: {
      title: 'Takeoff',
      summary:
        'Line up, set thrust with TO/GA, and accelerate through V1 (committed to go), VR (rotate) and V2 (safe climb speed even on one engine).',
      body: [
        'Three speeds come out of the performance calculation. V1 is the decision speed: below it, a serious failure means stopping on the remaining runway; above it, the airplane is committed to fly because it can no longer stop in the distance left. VR is the rotation speed, when the pilot starts raising the nose. V2 is the takeoff safety speed, the speed the airplane must reach by 35 ft and can safely climb at with one engine failed. For a 787-9 at a typical transatlantic weight with flaps 15, these are in the region of 140 to 165 knots; the exact numbers depend on weight, flaps, runway, temperature and wind.',
        'Most takeoffs use reduced thrust to save engine wear: a derate (a fixed lower rating, TO 1 or TO 2) and/or an assumed temperature (telling the engines it is hotter than it is, so they produce less thrust), always within what the runway allows. On the runway, the pilot flying advances the thrust levers to about mid-range, checks both engines spool up evenly, then presses a TO/GA switch. The autothrottle drives the levers to the reference thrust (FMA: THR REF). At 80 knots the autothrottle goes to HOLD, removing servo power so the levers cannot move by themselves during the critical part of the roll.',
        'The pilot monitoring calls "V1" and the pilot flying takes the hand off the thrust levers; at "Rotate" they pull smoothly at about 2 to 3 degrees per second toward the flight director pitch, roughly 15 degrees with both engines. Rotating too fast or too early is how tail strikes happen on long airplanes like the 787-9. Once the vertical speed and altitude show a positive climb, the call is "Positive rate", answered with "Gear up".',
        'LNAV engages at 50 ft and VNAV at 400 ft if armed. The autopilot can be engaged from 200 ft, though many pilots hand-fly the first few thousand feet. At the thrust reduction altitude (often 1,000 to 1,500 ft above the field) the autothrottle reduces to climb thrust; at the acceleration altitude VNAV lowers the nose to accelerate, and flaps are retracted on schedule as the speed passes each flap maneuvering bug on the speed tape: 15 to 5, 5 to 1, 1 to UP.',
      ],
      steps: [
        'Cleared for takeoff: lights on, check runway heading and FMA.',
        'Thrust levers to about mid-range; check engines stable and symmetrical.',
        'Press TO/GA: autothrottle sets THR REF; PM calls "thrust set".',
        '80 knots: autothrottle HOLD; crosscheck airspeeds.',
        'V1: hand off the thrust levers, committed to fly.',
        'VR: rotate smoothly about 2 to 3 degrees per second to ~15 degrees pitch.',
        'Positive rate: gear up. LNAV at 50 ft, VNAV at 400 ft.',
        'Thrust reduction to CLB; accelerate and retract flaps on the speed tape bugs.',
      ],
      facts: [
        ['V speeds (typical)', '~140 to 165 kt'],
        ['Takeoff flaps', '5 to 20, often 15'],
        ['A/T at 80 kt', 'HOLD'],
        ['Rotation rate', '~2 to 3 deg/s'],
        ['Min A/P engage', '200 ft'],
      ],
    },
    climb: {
      title: 'Climb',
      summary:
        'The airplane climbs under VNAV at a speed set by the cost index, levels off in steps as ATC allows and reaches an initial cruise altitude in the mid-thirties.',
      body: [
        'With the autopilot engaged in LNAV and VNAV, the airplane follows the departure procedure and its altitude and speed restrictions. Below 10,000 ft speed is limited to 250 knots in US and most European airspace. Above it, the airplane accelerates to its economy climb speed, typically somewhere around 300 to 320 knots, which becomes a Mach number (around 0.84 to 0.85) as it climbs. The crossover altitude, where the climb switches from holding airspeed to holding Mach, is usually in the high twenties.',
        'Climb thrust is the thrust reference in VNAV SPD: the autothrottle holds climb thrust and the pitch is adjusted to hold speed. If the climb was derated (CLB 1 or CLB 2) to save engine wear, the derate washes out gradually as the airplane climbs. Departure controllers often stop the climb temporarily; the MCP altitude caps the climb and the FMA shows VNAV ALT until the crew sets the next cleared altitude and VNAV resumes.',
        'Passing the transition altitude (18,000 ft in the US) both pilots set standard pressure, 1013 hPa or 29.92 inHg, and altitudes become flight levels. A heavy 787-9 at the start of a transatlantic trip usually begins cruise around FL340 to FL370 (34,000 to 37,000 ft) because it cannot yet climb efficiently higher. The FMC shows the optimum and maximum altitudes for the current weight.',
      ],
      steps: [
        'Autopilot on, LNAV/VNAV following the departure procedure.',
        'Below 10,000 ft: 250 kt maximum; after-takeoff checklist complete.',
        'Above 10,000 ft: accelerate to economy climb speed.',
        'Transition altitude: set standard pressure and cross-check altimeters.',
        'Reset the MCP altitude for each new clearance; watch the FMA.',
        'Level off at initial cruise altitude; VNAV switches to cruise.',
      ],
      facts: [
        ['Below 10,000 ft', '250 kt max'],
        ['Climb speed (typical)', '~300 to 320 kt / M0.84'],
        ['Initial cruise (heavy)', '~FL340 to FL370'],
        ['Transition altitude (US)', '18,000 ft'],
      ],
    },
    cruise: {
      title: 'Crossing the ocean',
      summary:
        'Over the North Atlantic there is no radar coverage in most places: the airplane flies an assigned track, reports by datalink, and the crew manages fuel, weather and diversion options.',
      body: [
        'Typical cruise is around Mach 0.85, at an altitude that climbs in steps from the mid-thirties toward FL400 as fuel burns off and the airplane gets lighter. The 787 is certified to 43,100 ft and its maximum operating Mach number is 0.90, but the useful altitude at any moment is set by weight, temperature and the buffet margin. Fuel burn is roughly 5 to 6 tonnes per hour for the whole airplane, falling as weight decreases.',
        'Before the ocean the crew receives its oceanic route, often one of the day\'s organized North Atlantic tracks laid out each day to use or avoid the jet stream. Eastbound, the jet stream can add 100 knots or more of tailwind, which is why the trip home is shorter. The crew logs on to the oceanic centers (Gander, then Shanwick) by CPDLC (controller-pilot datalink, essentially text messages to ATC), the airplane sends automatic position reports by ADS-C, and a SELCAL check confirms ATC can call the crew on HF radio if needed. Many crews fly a small lateral offset of 1 or 2 nautical miles right of the track (SLOP) to reduce collision risk from very accurate navigation.',
        'The 787 is approved for ETOPS (extended operations) up to 330 minutes from a diversion airport, though a North Atlantic crossing stays well within much shorter limits thanks to airports in Canada, Greenland, Iceland, Ireland and the UK. At each waypoint the crew checks fuel remaining against the plan, monitors that fuel is balanced between the wings, watches the weather radar and the cabin altitude, and keeps track of the nearest suitable diversion airport. On an overnight flight, pilots may take short controlled rest periods in their seats if their airline permits it, or rotate into the crew rest on a longer sector with an augmented crew.',
      ],
      steps: [
        'Receive the oceanic route; load and verify the track waypoints in the FMC.',
        'Log on to CPDLC; ADS-C position reporting begins automatically.',
        'SELCAL check on HF radio; set strategic lateral offset if used.',
        'At each waypoint: fuel check against the plan, position, next estimate.',
        'Request step climbs as weight decreases (for example FL360 to FL380 to FL400).',
        'Monitor weather, fuel balance, cabin altitude and diversion options.',
      ],
      facts: [
        ['Typical cruise', 'Mach 0.85'],
        ['Max altitude', '43,100 ft'],
        ['Mmo', 'Mach 0.90'],
        ['Fuel burn (typical)', '~5 to 6 t/h total'],
        ['ETOPS approval', 'up to 330 min'],
      ],
    },
    descent: {
      title: 'Descent',
      summary:
        'About 120 nautical miles from London the FMC starts the descent at idle thrust, following a path planned to arrive at the right height and speed with minimum fuel.',
      body: [
        'Before the top of descent the crew gets the Heathrow weather (ATIS), loads the expected arrival and runway into the FMC, enters the forecast descent winds and does the approach briefing: the approach type, minimums, missed approach, taxi route, landing performance and autobrake setting. Landing performance is calculated for the expected weight (typically around 170 to 180 tonnes after this trip) and runway condition.',
        'VNAV builds the descent path backward from the runway and its altitude and speed constraints, then calculates the top of descent. A rule of thumb pilots use to check it: about 3 nautical miles of track for every 1,000 ft to lose, plus a bit for slowing down. From FL400 that is roughly 120 nm plus deceleration. At the top of descent, VNAV pulls the thrust to idle (FMA: IDLE, then HOLD) and pitches to follow the path (VNAV PTH) at the economy descent speed, typically Mach 0.84 to 0.85 transitioning to around 280 to 310 knots.',
        'In reality ATC changes the plan: shortcuts make the airplane high, speed restrictions make it slow. The speedbrake adds drag to get down faster, and the VSD on the navigation display shows at a glance whether the airplane is above or below the path. Busy airports like Heathrow often hold arrivals in stacks, flying racetrack patterns at assigned levels; the FMC shows how much holding fuel is available before the crew must divert.',
        'Passing the transition level the crew sets the local pressure setting (QNH), and below 10,000 ft the speed comes back to 250 knots. Seatbelt signs go on and the cabin is prepared for landing.',
      ],
      steps: [
        'Get ATIS; set up the arrival, runway and approach in the FMC.',
        'Approach briefing; landing performance; set autobrake (for example 2 or 3).',
        'At top of descent: idle thrust, VNAV PTH at economy descent speed.',
        'Use speedbrake if high; check the profile on the VSD.',
        'Enter holding if instructed; monitor fuel against diversion minimum.',
        'Transition level: set QNH; below 10,000 ft slow to 250 kt.',
      ],
      facts: [
        ['Top of descent from FL400', '~120 nm + slowdown'],
        ['Rule of thumb', '3 nm per 1,000 ft'],
        ['Descent thrust', 'idle'],
        ['Below 10,000 ft', '250 kt max'],
      ],
    },
    approach: {
      title: 'Approach',
      summary:
        'The airplane slows down in stages, extends flaps and gear, and locks onto the ILS beam that guides it down a 3-degree slope to the runway.',
      body: [
        'Approach control vectors the airplane onto a long final, often 10 to 15 nm from the runway at Heathrow. As speed is reduced, the flaps go out on schedule: flaps 1 at the flaps-up maneuvering speed, then 5, then 15 or 20. The speed tape shows the minimum speed for each setting, so the pilot only extends the next stage once the speed is low enough and retracts only once it is high enough.',
        'For an ILS approach the pilot presses APP on the MCP, which arms LOC (localizer, lateral guidance) and G/S (glideslope, vertical guidance). The localizer captures first, turning the airplane onto the runway centerline, and then the glideslope captures as the airplane intercepts the 3-degree beam from below. At around 145 knots groundspeed a 3-degree slope needs a descent rate of roughly 750 ft per minute (about five times the groundspeed). Around glideslope capture the gear goes down, then landing flaps (25 or 30), the speedbrake is armed and the Landing checklist is completed.',
        'Final approach speed is the reference speed (Vref) plus an additive: with the autothrottle engaged Boeing\'s guidance is usually Vref plus 5 knots; if flying manual thrust, a wind correction of half the steady headwind plus the full gust is added, up to 20 knots. Vref for a 787-9 at a typical landing weight is around 140 to 145 knots; Boeing lists 153 knots at the 787-9\'s maximum landing weight.',
        'The approach must be stable by 1,000 ft above the runway in instrument conditions (some airlines use 500 ft in good visual conditions): on speed, on the path, in landing configuration, with a normal descent rate. If not, the rule is a go-around: press TO/GA, and the airplane pitches up to a go-around attitude with go-around thrust while the crew retracts flaps one step and raises the gear. In low visibility the autopilot stays engaged for an autoland: its redundant channels come online automatically during the approach, and the FMA shows LAND 3 or LAND 2 to confirm how much redundancy is available.',
      ],
      steps: [
        'Slow down; extend flaps 1, then 5 as speed allows.',
        'Cleared for the ILS: press APP to arm LOC and G/S.',
        'Localizer captures, then glideslope captures.',
        'Gear down, flaps 20 then 25 or 30; arm the speedbrake.',
        'Set the final approach speed; Landing checklist.',
        'Stable by 1,000 ft, or go around.',
        'Minimums: runway in sight, "Landing"; or TO/GA for a missed approach.',
      ],
      facts: [
        ['Glideslope', '3 degrees'],
        ['Descent rate', '~700 to 800 ft/min'],
        ['Landing flaps', '25 or 30'],
        ['Vref (typical / MLW)', '~145 / 153 kt'],
        ['Stable by', '1,000 ft (IMC)'],
      ],
    },
    landing: {
      title: 'Landing and taxi in',
      summary:
        'Cross the threshold at 50 ft, flare, touch down on the main gear, and let the spoilers, reversers and autobrake bring 170 tonnes to taxi speed.',
      body: [
        'The airplane crosses the runway threshold at about 50 ft on the glideslope, aiming at the touchdown zone around 1,000 ft down the runway. Many pilots disconnect the autopilot a few hundred feet up to hand-fly the last part. At around 20 to 30 ft the pilot raises the nose a few degrees (the flare) to reduce the descent rate, while the autothrottle retards the thrust levers to idle (FMA: IDLE). The HUD helps judge the flare. Touchdown is main gear first, at a pitch attitude of roughly 4 to 6 degrees; the long 787-9 has limited tail clearance, so the pilot avoids holding the nose high to float.',
        'The moment the main gear compresses, the armed speedbrake system raises all the spoilers, killing lift so the weight goes onto the tires. The autobrake starts braking at the selected deceleration rate (settings 1, 2, 3, 4 and MAX AUTO). The pilot lowers the nose gear smoothly, then raises the reverse thrust levers: the reversers block the fan exhaust and turn it forward. Reverse thrust is most effective at high speed and is reduced to idle reverse by about 60 knots, to avoid ingesting debris and exhaust.',
        'Below a comfortable speed the pilot takes over braking (pressing the pedals disarms the autobrake), stows the reversers and turns off at a high-speed exit. Off the runway the crew retracts the flaps, stows the speedbrake, starts the APU, switches off the landing lights and turns the transponder to standby or as required. At the stand: parking brake set, fuel control switches to CUTOFF to stop the engines, beacon off once they have spooled down, and the shutdown and secure checklists. The airplane is then handed over to the ground crew and the next crew.',
      ],
      steps: [
        'Cross the threshold at ~50 ft on speed; autopilot off if hand-flying.',
        'Flare at ~20 to 30 ft; thrust to idle.',
        'Touch down main gear first; spoilers deploy automatically.',
        'Lower the nose; reverse thrust; autobrake decelerates.',
        'Reverse to idle by ~60 kt; take over manual braking; vacate the runway.',
        'After Landing: flaps up, APU start, lights and transponder.',
        'At the stand: parking brake, fuel control switches to CUTOFF, shutdown checklist.',
      ],
      facts: [
        ['Threshold crossing', '~50 ft'],
        ['Flare height', '~20 to 30 ft'],
        ['Autobrake settings', '1, 2, 3, 4, MAX AUTO'],
        ['Reverse to idle by', '~60 kt'],
        ['Landing weight (typical)', '~170 to 180 t'],
      ],
    },
  },
}
