import type { Chapter } from './types'

export const fbw: Chapter = {
  id: 'fbw',
  title: 'Fly-by-wire',
  intro:
    "There are no cables between the 787's control column and its control surfaces. The pilot's hands move sensors, computers decide what the surfaces should do, and electric or hydraulic actuators make it happen, all while the airplane still feels like a Boeing.",
  entries: {
    path: {
      title: 'The signal path',
      summary:
        "Moving the column moves position sensors, not cables. Those signals go to actuator control electronics, up to the primary flight computers, and back down to the actuators that move the surfaces.",
      body: [
        "Fly-by-wire means the mechanical link between the cockpit controls and the control surfaces has been replaced with electrical signals. The column, wheel and rudder pedals are each fitted with several position transducers, small sensors that turn mechanical movement into an electrical signal. Each transducer is wired to a different Actuator Control Electronics unit (ACE), so no single wire bundle or box carries every copy of the pilot's command. Boeing's architecture uses four ACEs; Boeing's design literature for this generation names them left, center 1, center 2 and right.",
        "In the normal mode the ACEs do not decide anything on their own. They convert the analog transducer signals to digital data and pass them to the Primary Flight Computers (PFCs). The PFCs combine the pilot's input with air data, inertial data, flap position, thrust and configuration to compute what each surface should do: how far each elevator, aileron, flaperon, spoiler and the rudder should move, and where the stabilizer should be trimmed. Those surface commands go back to the ACEs.",
        "The ACEs close the loop at the actuator. For a hydraulic power control unit, the ACE drives an electrohydraulic servo valve and reads back the ram position from a position sensor on the actuator, adjusting the valve until the surface sits where it was told to. For the electrically powered spoilers and the stabilizer trim, the command goes to motor control electronics instead of a valve. The whole loop runs continuously, many times per second, so to the pilot the response feels immediate.",
        "Redundancy is layered at every step. Each input is measured by more than one transducer, each command is computed by more than one PFC, each PFC checks itself internally, the ACEs agree among themselves on which PFC to trust, and most surfaces are driven by more than one actuator fed from different hydraulic systems. A fault anywhere along the chain is outvoted or isolated rather than passed on to a surface.",
      ],
      steps: [
        'The pilot moves the column, wheel or pedals against the artificial feel system.',
        'Redundant position transducers on each control convert that movement into electrical signals, each wired to a different ACE.',
        'The ACEs digitize the signals and send them to the PFCs.',
        'Each PFC runs the control laws using pilot input plus air data, inertial data and airplane configuration.',
        'The PFCs cross-check one another, and the ACEs vote on which PFC output to accept.',
        'The ACEs turn the selected surface commands into drive signals for hydraulic servo valves or electric motor controllers.',
        'Actuators move the surfaces, and position sensors report back to the ACEs, which correct any error until the surface matches the command.',
      ],
      facts: [
        ['Mechanical link to primary surfaces', 'None'],
        ['ACEs', '4'],
        ['PFCs', 'Multiple, redundant'],
        ['Control modes', 'Normal, secondary, direct'],
        ['Feedback', 'Surface position sensed at every actuator'],
      ],
    },
    computers: {
      title: 'Flight control computers',
      summary:
        "Redundant primary flight computers do the thinking and four actuator control electronics units do the interfacing. Each is built so that a fault makes it go quiet rather than send a wrong command.",
      body: [
        "The 787's flight control electronics come from Honeywell. Where the 777 used separate boxes for the PFCs, the ACEs, the flap and slat electronics, the autopilot flight director computers and the power supply assemblies, the 787 integrates these functions into a smaller number of flight control electronics cabinets. The ACE and PFC roles are still distinct, but they share cabinets, power conditioning and packaging. The software runs on a partitioned, safety-certified real-time operating system, so independent functions cannot interfere with one another inside the same hardware.",
        "The architecture follows the 777 lineage developed by Boeing's fly-by-wire team: multiple PFC channels and four ACEs. The 777 uses three PFCs, each with three dissimilar processor lanes. Boeing's documented approach for the next generation, described in its own patent filings, builds each PFC and ACE channel as two lanes: two separate computers using dissimilar processors and compilers, running the same function and comparing results. If the lanes disagree beyond a tolerance, the channel declares itself failed and stops driving outputs. This is called a fail-passive, self-checking pair. Dissimilarity matters because a design error in one processor or compiler is unlikely to produce the identical wrong answer in a completely different one.",
        "In that documented scheme, one PFC is the command channel at any moment and the others are standbys. Each PFC reports which channel should be in command, and the ACEs count those votes before accepting commands, so a single PFC cannot hijack the surfaces. Data between units carries checks for freshness and integrity: a message that is late, repeated, or fails its checksum is rejected. When a PFC is inhibited, control passes to a standby without a transient bump in the surfaces.",
        "The design also refuses to depend on any one power source. The flight control electronics are fed through their own power conditioning from several independent sources, so the loss of main electrical buses does not take the computers down with them. If all PFCs fail or lose contact with the ACEs, the ACEs alone can still fly the airplane in the direct mode.",
      ],
      facts: [
        ['Supplier', 'Honeywell (flight control electronics)'],
        ['PFC channels', 'Multiple, one in command, others in standby'],
        ['ACEs', '4'],
        ['Lanes per channel', '2 dissimilar lanes (documented Boeing approach)'],
        ['Failure behaviour', 'Fail-passive: a disagreeing channel goes silent'],
      ],
    },
    laws: {
      title: 'Control laws and modes',
      summary:
        "In normal mode the column asks for a pitch response and the wheel asks for a roll rate, with the computers handling trim and coordination. If sensors or computers fail, the system steps down to secondary and then direct mode.",
      body: [
        "A control law is the rule that turns a pilot input into surface commands. In pitch, the 787 follows the 777's control laws as described in crew training material: a C*U law. C* (C-star) blends pitch rate and normal load factor (g), so a given column displacement produces a consistent, predictable flight path response across the speed range: mostly pitch rate at low speed, mostly g at high speed. The U term adds speed stability. The airplane is trimmed to a reference speed, and if it slows down or speeds up from that reference the pilot has to hold column force to keep it there, exactly as in a conventional airplane. This is a deliberate choice: Boeing wants the pilot to feel the airplane drifting off speed.",
        "That is why trim works differently in the 787. In flight in normal mode, the pitch trim switches do not move the stabilizer directly. They change the trim reference speed, and the PFCs then move the stabilizer and elevators to hold it. On the ground, the switches position the stabilizer directly, so the crew can set takeoff trim. As on the 777, the PFCs also compensate automatically for pitch changes caused by flap and gear movement, speedbrake deployment and thrust changes, and they supply the extra lift in a turn so the pilot does not need to pull to hold altitude at normal bank angles.",
        "The roll and yaw law is new on the 787 and is called P-Beta. Wheel deflection commands a roll rate (P), and the rudder pedals command sideslip angle (Beta). Disturbances that would roll or yaw the airplane are opposed automatically, turns are coordinated without rudder input, and aileron and rudder out-of-trim conditions are trimmed out by the computers. There is no aileron trim switch. Thrust asymmetry compensation adds rudder automatically after an engine failure.",
        "The cockpit controls keep the conventional Boeing feel. The two columns and the two wheels are linked, so each pilot feels what the other is doing. Crew training material describes feel forces that increase with displacement and with airspeed, so the controls get heavier as you fly faster. Following 777 practice, when the autopilot is engaged, backdrive actuators physically move the column and wheel to match what the autopilot is commanding, so the pilot can see and feel the airplane being flown. A pilot can always overpower the autopilot through the controls.",
        "If the PFCs lose enough sensor data to run the full laws, for example after a disagreement among air data sources, the system drops automatically into the secondary mode and shows FLIGHT CONTROL MODE on the EICAS. The PFCs still compute commands, but with simplified laws, and the trim switches move the stabilizer directly. Autopilot, envelope protections, gust suppression, auto speedbrakes and tail strike protection are lost. If all PFCs fail, or the crew selects the PFC disconnect switch, the system enters the direct mode: the ACEs send pilot inputs straight to the actuators with fixed gains, and the airplane flies much like a well-tuned conventional jet. Behind that, crew training material describes a separate hard-wired path that is reported to give the crew pitch control through the alternate trim switches and roll control through the wheel if all normal signaling is lost.",
      ],
      steps: [
        'Normal mode: full 777-style C*U pitch law and P-Beta lateral law, autopilot available, all protections and gust suppression active.',
        'Secondary mode: entered automatically after certain sensor or computer faults; simplified PFC laws, direct stabilizer trim, no autopilot or envelope protection.',
        'Direct mode: all PFCs failed or disconnected; ACEs map pilot input straight to surface commands.',
        'Hard-wired backup (as described in crew training material): alternate pitch trim and wheel roll control are reported to remain if all fly-by-wire signaling is lost.',
      ],
      facts: [
        ['Pitch law', 'C*U, following the 777'],
        ['Lateral law', 'P-Beta (roll rate and sideslip)'],
        ['Normal mode trim', 'Sets a reference speed'],
        ['Aileron trim switch', 'None'],
        ['Secondary alert', 'FLIGHT CONTROL MODE (EICAS caution)'],
      ],
    },
    protections: {
      title: 'Envelope protection',
      summary:
        "In normal mode the computers make it hard to stall, overspeed or over-bank the airplane by adding resistance and warnings. A pilot who pushes through can still override them, which is Boeing's philosophy.",
      body: [
        "Envelope protection keeps the airplane inside its safe range of speed, angle of attack and attitude. Airbus and Boeing approach this differently. Airbus fly-by-wire uses hard limits: in normal law the computers will not let the airplane exceed certain angles or load factors no matter how hard the pilot pulls. Boeing uses mostly soft limits: the airplane resists, warns and nudges, but the pilot keeps final authority and can push through a protection with enough force. The reasoning is that the pilot may know something the computers do not, such as an imminent collision.",
        "Stall protection works through the speed stability built into the pitch law. The crew cannot trim below roughly the minimum maneuvering speed, so as the airplane slows further the pilot must hold an increasing aft force on the column, a clear physical cue on top of the stick shaker and the speed tape. The 787 added an enhanced stall protection that also limits high angles of attack in normal mode. Overspeed protection works the same way in reverse: the trim reference cannot be set above the maximum operating speed (VMO/MMO), so holding the airplane above it requires a steady, noticeably higher forward force.",
        "Bank angle protection follows the 777's control laws as described in crew training material: when the bank exceeds about 35 degrees, the PFCs add a roll command that returns the airplane toward 30 degrees when the pilot relaxes the wheel. The pilot can hold a steeper bank against the force, but the airplane will not quietly roll itself into a dangerous attitude after a distraction. Tail strike protection reduces elevator deflection during takeoff and landing when the pitch attitude approaches the angle at which the tail would touch the runway. It gives no column feedback, so it works without the pilot noticing it, and it does not reduce takeoff performance.",
        "All of these protections exist only in the normal mode. In the secondary and direct modes the airplane relies on warnings alone: stick shaker, overspeed clacker and bank angle callouts. That is one reason airline training spends time on manual flying in degraded modes.",
      ],
      facts: [
        ['Philosophy', 'Soft limits, pilot can override with force'],
        ['Bank protection', 'As on the 777: above about 35 deg, rolls back toward 30 deg'],
        ['Overspeed', 'Cannot trim above VMO/MMO'],
        ['Stall', 'Trim inhibited near minimum maneuver speed, plus AOA limiting'],
        ['Tail strike', 'Reduces elevator, no column feedback'],
        ['Available in', 'Normal mode only'],
      ],
    },
    surfaces: {
      title: 'Control surfaces',
      summary:
        "Each wing has an aileron, a flaperon, seven spoilers, two flaps and leading edge slats. The tail carries two elevators, a single rudder and a movable horizontal stabilizer.",
      body: [
        "Roll is controlled by three kinds of surface on each wing. The outboard aileron sits near the wingtip; it is most useful at low speed and is locked out at high speed, because deflecting a surface that far out on a long flexible wing at high dynamic pressure would twist the wing and reduce its effect. The flaperon sits behind the engine, between the inboard and outboard flaps, and works as an aileron throughout the flight envelope. Spoilers on the upper surface of the wing raise asymmetrically on the side of the down-going wing to help roll the airplane.",
        "There are seven spoilers per wing, numbered 1 to 14 from the left wingtip to the right wingtip. Raised symmetrically, they act as speedbrakes in flight and as ground spoilers on landing, dumping lift so the weight settles onto the wheels and the brakes become effective. The speedbrake lever commands them manually or arms them for automatic deployment on touchdown.",
        "The high lift system is deliberately simple. Each wing has one inboard and one outboard single-slotted trailing edge flap. Instead of a separate fore flap or complex multi-slotted mechanism, the spoilers are reported to droop downward as the flaps extend, sealing and shaping the gap between the wing and the flap so the airflow through the slot is right. The flaperons droop too. This saves weight and parts compared with older double- and triple-slotted designs. On the leading edge, slats extend forward and down along most of the span, with a Krueger flap (a panel that hinges down and forward from the underside of the wing) inboard. Boeing's hydraulic system diagram shows the flap and slat drive motors on the center system, and crew training material typically describes electric drive as the secondary, backup mode.",
        "Pitch is controlled by two elevators on the trailing edge of the horizontal tail and by the horizontal stabilizer itself, which pivots to trim the airplane. The stabilizer carries the large, slow, steady loads; the elevators supply the fast corrections. Yaw is controlled by a single rudder on the vertical fin. Because the computers command each surface separately, they can also use them in combination, for example moving the flaperons and elevators together to smooth a gust.",
      ],
      facts: [
        ['Spoilers', '7 per wing (14 total)'],
        ['Roll surfaces per wing', 'Aileron, flaperon, spoilers'],
        ['Trailing edge flaps', 'Inboard and outboard, single-slotted'],
        ['Leading edge', 'Slats, plus an inboard Krueger flap'],
        ['Tail', '2 elevators, 1 rudder, movable stabilizer'],
      ],
    },
    actuators: {
      title: 'Actuators and power',
      summary:
        "Most surfaces are moved by hydraulic power control units fed from three independent 5,000 psi systems. Four spoilers and the stabilizer trim are moved by electric motors instead.",
      body: [
        "The 787 has three independent hydraulic systems, left, center and right, all running at 5,000 psi rather than the 3,000 psi typical of older airliners. Higher pressure means smaller actuators, thinner pipes and less fluid for the same force, which saves weight. The left and right systems each have an engine-driven pump and an electric motor pump. The center system has two electric motor pumps and is backed by the ram air turbine (RAT), a small propeller that drops into the airstream to make emergency power.",
        "A power control unit (PCU) is a hydraulic ram with an electrically commanded servo valve and a position sensor. The ACEs command the valve, fluid pushes the ram, and the sensor reports back. The critical surfaces are spread across systems so that losing one leaves the airplane fully controllable: the rudder has three PCUs, one from each system; Boeing's system chart indicates each elevator is typically driven by two PCUs from different systems; each aileron and each flaperon has two PCUs fed from two different systems. The spoilers are shared across all three systems, a different pair or group on each.",
        "Spoilers 4, 5, 10 and 11, two on each wing, are not hydraulic. They are moved by electromechanical actuators (EMAs), electric motors driving a screw. The reason is dissimilar redundancy: if all hydraulic power were lost, the pilot would still have electrically powered roll and drag control from those spoilers. The horizontal stabilizer trim is also electric. Its trim actuator is a ballscrew driven by electric motors with a motor brake, rather than the hydraulic motors used on earlier Boeing jets.",
        "This mix of hydraulic and electric actuation is part of the 787's more-electric design. The airplane takes no engine bleed air for cabin pressurization, air conditioning or wing anti-ice; that work is done electrically instead, and putting some flight control actuators on that electrical network removes a common dependency on hydraulic fluid.",
      ],
      facts: [
        ['Hydraulic systems', '3 (L, C, R) at 5,000 psi'],
        ['Rudder PCUs', '3, one per hydraulic system'],
        ['Electric spoilers', '4, 5, 10, 11'],
        ['Stabilizer trim', 'Electric motor-driven ballscrew'],
        ['Emergency hydraulic power', 'Ram air turbine on the center system'],
      ],
    },
    gust: {
      title: 'Gust suppression and cruise flaps',
      summary:
        "The 787 senses turbulence and moves its flaperons and elevators to cancel part of the bump before passengers feel it. In cruise, it also nudges the flaps a little to keep the wing at its most efficient shape.",
      body: [
        "Vertical gust suppression is new on the 787. When the airplane flies into an updraft or downdraft, the PFCs detect the change in vertical acceleration and angle of attack and deflect the flaperons and elevators symmetrically to counter it. The flaperons change the wing's lift directly, so the wing does not have to wait for the whole airplane to pitch before the lift changes. The system is aimed at light to moderate turbulence, the kind that spills drinks and makes people airsick, rather than severe turbulence. Boeing's flight test data showed a clear reduction in the vertical bouncing felt in the cabin.",
        "Other load and ride functions carried over from the 777. Lateral gust suppression damps side-to-side motion. Gust load alleviation reduces the peak loads on the wing structure in turbulence, which lets the structure be designed lighter. Modal suppression damps the natural bending of the long fuselage and wing so the rear of the cabin does not shake. Flap load relief retracts the flaps to a smaller setting if airspeed exceeds the flap limit and extends them again when the speed comes back. All of these run only in the normal mode.",
        "In cruise the 787 also uses its trailing edge flaps as a variable camber system. The flaps move in small increments while nominally retracted, adjusting the curvature (camber) of the wing's trailing edge. As fuel burns off and the airplane gets lighter, the best spanwise lift distribution changes; adjusting camber keeps the wing closer to its lowest-drag shape throughout the flight. It is automatic and requires no crew action, which is why pilots rarely notice it.",
      ],
      facts: [
        ['Gust suppression surfaces', 'Flaperons and elevators'],
        ['Target turbulence', 'Light to moderate'],
        ['Cruise camber control', 'Small automatic flap movements'],
        ['Crew action needed', 'None'],
        ['Mode required', 'Normal'],
      ],
    },
  },
}
