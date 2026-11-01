import type { Chapter } from './types'

export const hydraulics: Chapter = {
  id: 'hydraulics',
  title: 'Hydraulics and landing gear',
  intro:
    "Hydraulic fluid still moves the heavy things on a 787: flight control surfaces, flaps, landing gear and thrust reversers. But it runs at a higher pressure than on older jets, more of the pumps are electric, and the brakes have no hydraulics at all.",
  entries: {
    systems: {
      title: 'Three systems at 5,000 psi',
      summary:
        'Three separate hydraulic systems, left, center and right, each at 5,000 psi instead of the 3,000 psi used on most earlier airliners. Higher pressure means smaller, lighter pipes and actuators.',
      body: [
        "The 787 has three fully independent hydraulic systems, named left, center and right. Independent means separate reservoirs, pumps, lines and fluid: a leak in one cannot drain another. Every primary flight control surface is moved by actuators supplied from more than one system, so the airplane stays fully controllable after losing any one system, and the mix of hydraulic and electric actuators keeps it controllable through further failures. The fluid is a fire-resistant phosphate ester, as on other Boeing jets.",
        "The left and right systems each power flight control actuators, wing spoilers and the thrust reverser on their own engine. The center system is the workhorse: it powers flight controls plus the landing gear, nose wheel steering, the leading edge slats and the trailing edge flaps. Several jobs that were hydraulic on earlier Boeings have moved to electric motors entirely. The brakes are electric, the horizontal stabilizer is trimmed by electric motors, and some of the spoilers are moved by electromechanical actuators rather than hydraulic ones.",
        "The case for 5,000 psi is simple arithmetic. An actuator's force is pressure times piston area, so at 5,000 psi a piston needs only 60 percent of the area it would need at 3,000 psi to produce the same force. Hydraulic power is pressure times flow, so for the same power the system moves only 60 percent of the fluid, which allows smaller tubes, smaller pumps, smaller reservoirs and less fluid to carry. On a widebody that saves a meaningful amount of weight. The costs are higher stresses in every fitting and seal and more demanding pump design, which is why the step was taken only on the newest designs: the Airbus A380 went to 5,000 psi first and the 787 followed.",
      ],
      facts: [
        ['Systems', 'Left, center, right (independent)'],
        ['Pressure', '5,000 psi (about 345 bar)'],
        ['Older jets', 'Typically 3,000 psi'],
        ['Center system powers', 'Gear, steering, flaps, slats, flight controls'],
        ['Now electric', 'Brakes, stabilizer trim, some spoilers'],
      ],
    },
    pumps: {
      title: 'Pumps, reservoirs and the RAT',
      summary:
        'The left and right systems run off pumps geared to the engines, with electric pumps for backup. The center system is all electric. A small propeller that drops out of the belly is the last resort.',
      body: [
        "The left and right systems each have an engine-driven pump (EDP) mounted on the engine's accessory gearbox. It is the primary pump: it turns whenever the engine turns and delivers pressure on demand by changing its displacement (a variable-displacement piston pump). Each of those systems also has an electric motor pump (EMP), the demand pump, which runs on the ground when the engines are off and switches on automatically in flight when demand peaks, during gear and flap movement for example. Pulling an engine fire switch closes the fluid supply to that engine's EDP so a fire is not fed with hydraulic fluid.",
        "The center system has no engine-driven pump at all, and that is a direct consequence of the 787's no-bleed design. On earlier widebodies the center system was typically powered by large air-driven pumps running on engine bleed air. The 787 has no bleed air, so the center system uses two large electric motor pumps, each delivering roughly 30 US gallons per minute at 5,000 psi. In normal operation one runs for the entire flight and the other runs only during takeoff and landing, when gear, flaps and steering create the peak demand. These pumps are among the largest electrical loads on the airplane, and in a generator failure the electrical system can shed less essential loads to keep them running.",
        "Each system has its own reservoir, pressurized so the pump inlets are never starved of fluid at altitude, with quantity, temperature and pressure shown on the hydraulic synoptic. Accumulators, gas-charged vessels separated from the fluid by a piston or bladder, store a little fluid under pressure to smooth out pressure ripple and absorb surges when large actuators start or stop. The center system can also isolate parts of itself if it detects a leak, preserving fluid for the users that matter most.",
        "If both engines fail, the electric pumps lose most of their power source. The ram air turbine (RAT), a two-bladed propeller on a strut in the lower fuselage, deploys into the airstream on a spring-loaded actuator, either automatically or when the crew pushes its switch. It drives a generator for essential electrical power and a hydraulic pump that pressurizes the center system's primary flight control actuators, enough to keep the airplane under control down to landing. Once out, it cannot be stowed in flight.",
      ],
      facts: [
        ['Left and right', '1 engine-driven pump + 1 electric pump each'],
        ['Center', '2 electric motor pumps, no engine pump'],
        ['Center pump size', 'About 30 US gal/min at 5,000 psi each'],
        ['Emergency', 'RAT: generator plus center-system hydraulic pump'],
        ['RAT stow', 'Not possible in flight'],
      ],
    },
    gear: {
      title: 'Landing gear',
      summary:
        'Two main gear legs, each with a four-wheel truck, and a twin-wheel nose gear: ten tires in all. The center hydraulic system raises and lowers them, and gravity alone can put them down if it fails.',
      body: [
        "The 787 stands on two main gear legs and a nose gear, designed and built by Messier-Dowty (now Safran Landing Systems). Each main gear ends in a truck, or bogie, with two axles and four wheels, which spreads the airplane's weight over eight main tires so the load per tire stays within what runways and taxiways are built for. The nose gear has two wheels and does the steering. Only the main wheels have brakes.",
        "The tires are radial. The 787-8 uses 50 x 20.0R22 main tires, and the heavier 787-9 and 787-10 use larger 54 x 21.0R23 tires; all three use 40 x 16.0R16 nose tires. Boeing's airport planning data list main tire pressures of 228 psi (787-8), 229 psi (787-9) and 236 psi (787-10), and nose tire pressures between 173 and 187 psi, more than six times the pressure of a car tire. Tires are filled with nitrogen rather than air, so a hot brake cannot set fire to the oxygen inside, and each wheel has fusible plugs that melt and let the tire deflate gently if a heavy stop overheats it, instead of letting it burst.",
        "Gear movement is powered by the center hydraulic system and sequenced by the gear control system. On retraction, the main gear swings inboard into wheel wells in the belly, and the nose gear swings forward into its well under the flight deck; the four-wheel truck is pitched to a set angle so it fits the well. Uplocks catch each leg and the doors close behind it, so the belly is smooth in cruise. On extension the doors open, the uplocks release, the gear swings down, and each leg locks with an over-center brace (a downlock) that holds it rigid under landing loads.",
        "If the center system cannot do the job, the alternate extension system takes over. It uses a dedicated DC-powered electric pump and center-system fluid to release the door and gear uplocks, and nothing else: once unlocked, the gear free-falls under its own weight and the airflow, and the downlocks engage on their own. Gear lowered this way cannot be retracted again in flight.",
      ],
      steps: [
        'Gear lever down: the center hydraulic system pressurizes the gear extension lines.',
        'Gear doors open.',
        'Uplocks release each leg.',
        'Legs swing down under hydraulic force, gravity and air load.',
        'Downlock braces go over center and lock each leg.',
        'Doors close behind the legs; three green indications confirm down and locked.',
        'Alternate: a DC electric pump releases the uplocks and the gear free-falls into place.',
      ],
      facts: [
        ['Wheels', '8 main (two 4-wheel trucks) + 2 nose'],
        ['787-8 main tires', '50 x 20.0R22 at 228 psi'],
        ['787-9 / -10 main tires', '54 x 21.0R23 at 229 / 236 psi'],
        ['Nose tires', '40 x 16.0R16 at 173 to 187 psi'],
        ['Actuation', 'Center hydraulic system'],
        ['Backup', 'Electric uplock release, gravity free-fall'],
      ],
    },
    brakes: {
      title: 'Electric brakes',
      summary:
        'The 787 was the first airliner to brake with electric motors instead of hydraulic pistons. Each of the eight main wheels has carbon brake discs squeezed by four small electric actuators.',
      body: [
        "Each main wheel carries a carbon brake: a stack of carbon rotors keyed to the wheel interleaved with carbon stators keyed to the axle. The stack is both the friction surface and the heat sink. Carbon is used because it is lighter than steel for the same energy absorption and keeps its strength at very high temperatures, and a rejected takeoff at maximum weight can push the stack well beyond 1,000 degrees Celsius. The 787's brakes come from Messier-Bugatti, now Safran Landing Systems.",
        "What is new is how the stack is squeezed. On older jets, hydraulic pistons do it. On the 787, each brake has four electric brake actuators: an electric motor driving a gear train and a ball screw that pushes a ram against the stack. Four electric brake actuator controllers (EBACs) command all eight main brakes, each controlling a fore-and-aft pair of wheels. Brake pedal and autobrake commands go to the controllers by wire, and the actuators clamp with exactly the force they are told to. The parking brake works by locking the actuators in place.",
        "Boeing and Safran chose electric for several reasons. Hydraulic lines no longer have to run down the gear legs to the hottest part of the airplane, so there is no fluid to leak onto brakes that can be glowing hot. Each actuator is monitored continuously, and a faulty one can be swapped as a line-replaceable unit without opening and bleeding a hydraulic system; because there are four per brake, losing one costs only part of that brake's force. Safran puts the weight saving at up to 64 kg per 787-8 and 111 kg per 787-9 compared with hydraulic brakes. The brakes run on the airplane's electrical power, with the main battery as a backup source for braking.",
        "Antiskid and autobrake are functions of the same controllers. Wheel speed sensors let the system detect a wheel starting to lock and relieve clamp force on that pair before it skids, which also protects against landing with brakes applied. Autobrake holds a selected deceleration after touchdown, with several landing levels, a maximum setting, and an RTO (rejected takeoff) mode that applies full braking, limited only by antiskid, if the crew retards the thrust levers above a set speed during the takeoff roll. Carbon wears mainly with the number of applications, not the energy, so at low taxi speeds the system can apply only some of the brakes, alternating between them, to stretch brake life. Brake temperatures are measured and shown on the gear synoptic so crews know how long to cool the brakes after a heavy stop.",
      ],
      facts: [
        ['Supplier', 'Messier-Bugatti (now Safran Landing Systems)'],
        ['Heat sink', 'Carbon rotors and stators'],
        ['Actuators', '4 electromechanical per brake, 32 in all'],
        ['Controllers', '4 EBACs, one per fore-aft wheel pair'],
        ['Weight saved', 'Up to 64 kg (787-8), 111 kg (787-9)'],
        ['Autobrake', 'Landing levels, MAX, and RTO'],
      ],
    },
    steering: {
      title: 'Nose wheel steering',
      summary:
        'Pilots steer on the ground with a small tiller wheel for tight turns and with the rudder pedals for small corrections. The nose wheels turn up to 70 degrees either way, powered by the center hydraulic system.',
      body: [
        "The nose gear is steered by a hydraulic actuator powered by the center hydraulic system. The pilots have two inputs. The tiller, a small wheel beside each pilot's knee, commands the full range, up to 70 degrees either side of center, and is used for taxiing, gate turns and tight corners. The rudder pedals also steer the nose wheels, but only through a few degrees, enough for the fine tracking corrections needed on the runway centerline during the takeoff and landing rolls, where a large steering input at speed would be dangerous.",
        "The commands are blended, so the pilot can hold the pedals for small corrections while using the tiller for larger turns. At 70 degrees of nose wheel angle the 787-8 can turn with its inner main gear only about 2.7 m from the turn center, according to Boeing's airport planning data, though the outer wingtip then sweeps a circle about 40.5 m in radius, which is why ground crews and airport designers care about this number. The main gear does not steer, so in very tight turns the main tires scrub sideways; airlines often limit steering angles to reduce tire wear.",
        "For towing and pushback, the ground crew engages a steering bypass at the nose gear that disconnects the actuator from hydraulic pressure, so the tug can turn the nose wheels freely without fighting it. Exceeding the towing angle limits can damage the steering mechanism, so the limits are part of the ground handling procedures and are monitored during the push.",
      ],
      facts: [
        ['Max nose wheel angle', '70 degrees each side (tiller)'],
        ['Rudder pedals', 'A few degrees, for runway tracking'],
        ['Power', 'Center hydraulic system'],
        ['787-8 wingtip radius at 70 degrees', 'About 40.5 m (133 ft)'],
        ['Towing', 'Steering bypassed for the tug'],
      ],
    },
  },
}
