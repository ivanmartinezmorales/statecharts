import type { Chapter } from './types'

export const cabin: Chapter = {
  id: 'cabin',
  title: 'The cabin',
  intro:
    "Much of what passengers notice on a 787, lower cabin altitude, damper air, bigger windows that dim at the touch of a button, follows from two engineering decisions: a carbon fiber fuselage, and air that is compressed by electric motors instead of being bled from the engines.",
  entries: {
    air: {
      title: 'Where the air comes from',
      summary:
        "Most airliners take hot compressed air from their engines to supply the cabin. The 787 doesn't: it pulls outside air in through its own inlets and compresses it with four electric compressors.",
      body: [
        "On nearly every other jet airliner, cabin air is bleed air: hot, high-pressure air tapped from the engines' compressors, cooled and fed to the cabin. The 787 has no bleed air system (apart from engine inlet anti-icing, which still uses engine air). Instead, outside air enters through dedicated inlets on the lower fuselage, separate from the ram air inlets that cool the packs, and is compressed by cabin air compressors (CACs): four electrically driven centrifugal compressors, two feeding each of the two air conditioning packs. The motors run at variable speed, so the compressors deliver only the pressure and flow the cabin needs at that moment, instead of whatever the engine happens to provide. Boeing's case for the no-bleed design was efficiency: an engine running a bleed system is always giving up more energy than the cabin actually needs.",
        "Compressing air heats it, so the air leaving the CACs is hot. It passes through an ozone converter and then into a pack, the air conditioning unit, which is an air cycle machine: the air is cooled in heat exchangers by ram air drawn through the belly, then expanded through a turbine, which drops its temperature sharply while the turbine's work drives the machine's own compressor and fan. Water condensed out along the way is removed. The packs on the 787 come from Hamilton Sundstrand (now Collins Aerospace). On the ground, when there is little ram airflow, fans pull cooling air through the heat exchangers.",
        "The cold pack air goes to a mix manifold, where it meets roughly an equal amount of cabin air that has been recirculated through HEPA filters. Recirculating half the air keeps cabin humidity and temperature steadier and reduces the energy the airplane spends compressing outside air, while still bringing in a large flow of fresh air. From the manifold, separate ducts serve each temperature zone of the cabin and the flight deck; a small amount of warm trim air is added to each zone's duct so each zone can be held at its own temperature.",
        "Air enters the cabin through outlets running along the ceiling and upper sidewalls and flows down and across in a circular pattern, leaving through grilles low on the sidewalls near the floor. The flow is designed to move across the cabin rather than along it, so the air around a given row largely stays near that row instead of traveling the length of the airplane. From under the floor, part of the air is drawn back for recirculation and the rest leaves through the outflow valves, which is also how the cabin is pressurized.",
      ],
      steps: [
        'Outside air enters dedicated inlets on the lower fuselage.',
        'Four electric cabin air compressors (two per pack) compress and heat it.',
        'An ozone converter breaks down ozone in the hot compressed air.',
        'Each pack cools it with ram air heat exchangers and an air cycle machine, and removes water.',
        'The mix manifold blends it with roughly equal parts HEPA-filtered recirculated cabin air.',
        'Trim air sets each zone to its own temperature.',
        'Ceiling and sidewall outlets deliver it; it flows down and across the cabin to floor-level grilles.',
        'Part is recirculated and the rest leaves through the outflow valves.',
      ],
      facts: [
        ['Air source', 'Outside air, no engine bleed'],
        ['Compressors', '4 electric CACs, 2 per pack'],
        ['Packs', '2 air cycle machines'],
        ['Recirculated', 'Roughly half, HEPA-filtered'],
        ['Flow pattern', 'Ceiling to floor, across rather than along the cabin'],
      ],
    },
    pressurization: {
      title: 'Pressurization',
      summary:
        'At its 43,000 ft ceiling, the 787 keeps the cabin at the air pressure of 6,000 ft. Most older jets are certified to let it rise to 8,000 ft.',
      body: [
        "An airplane is pressurized by pumping air in faster than it is allowed to leak out. On the 787 the compressors push air in, and motorized outflow valves in the lower fuselage control how fast it leaves. The cabin pressure controller schedules a cabin altitude for each phase of flight, climbing the cabin gently as the airplane climbs and bringing it back to the destination's field elevation before landing, and positions the outflow valves to hold it. Pressure relief valves protect the structure if the controller fails: positive relief valves open if the inside-outside difference becomes too high, and negative relief valves let air in if outside pressure ever exceeds inside pressure, as in a rapid descent.",
        "Regulations allow a cabin altitude of up to 8,000 ft in normal operation, and most earlier airliners reach close to that at cruise. The 787 holds a maximum of 6,000 ft at its 43,000 ft ceiling. The standard atmosphere's pressure at 6,000 ft is about 11.8 psi and at 43,000 ft about 2.4 psi, so the fuselage holds a difference of roughly 9.4 psi across its skin at the top of its envelope. Holding an 8,000 ft cabin at the same altitude would need only about 8.6 psi.",
        "A larger differential stretches the fuselage more on every flight, and every flight is one pressure cycle. In an aluminum fuselage, those cycles grow fatigue cracks, which is why metal airplanes are designed and inspected around a fatigue life, and why raising the differential costs either structural weight or inspection burden. Carbon fiber reinforced plastic is far more resistant to this kind of tension-tension fatigue and does not corrode, so the 787 could take the higher differential without the penalties a metal fuselage would carry.",
        "The benefit is physiological. Air at 8,000 ft has about 74 percent of sea level pressure, and less oxygen pressure in the lungs means less oxygen in the blood. A Boeing-funded study published in the New England Journal of Medicine in 2007 put 502 people in an altitude chamber for a simulated 20-hour flight: blood oxygen saturation fell by up to 4.4 percentage points at 8,000 ft, and complaints of discomfort were more frequent at 7,000 to 8,000 ft than at all lower altitudes combined, becoming apparent after 3 to 9 hours. Gas trapped in the body also expands as pressure falls: about 25 percent at 6,000 ft and about 35 percent at 8,000 ft, which is part of why ears, sinuses and stomachs feel better at the lower cabin altitude.",
      ],
      facts: [
        ['Max cabin altitude', '6,000 ft (older jets: up to 8,000 ft)'],
        ['Max certified altitude', '43,000 ft'],
        ['Differential at ceiling', 'About 9.4 psi (computed from the standard atmosphere)'],
        ['Pressure control', 'Motorized outflow valves'],
        ['Blood oxygen drop at 8,000 ft', 'Up to 4.4 points (NEJM 2007)'],
      ],
    },
    humidity: {
      title: 'Humidity',
      summary:
        'Air at cruise altitude holds almost no water, so cabins are very dry. A carbon fiber fuselage does not corrode, which lets the 787 tolerate a little more moisture than a metal jet.',
      body: [
        "Outside air at 35,000 to 43,000 ft is around minus 50 degrees Celsius or colder and holds almost no water vapor. Warmed to cabin temperature, its relative humidity is close to zero. The only real source of moisture in a cabin is the passengers themselves, through breath and skin, which is why a full cabin is damper than an empty one and why typical airliner cabins sit in the low single digits to low teens of percent relative humidity on long flights. Dry air dries out eyes, throats and skin, and contributes to the tired feeling after a long flight.",
        "Metal airplanes are kept dry partly on purpose. The fuselage skin at cruise is extremely cold, and moisture in the cabin air condenses and freezes on it, behind the insulation blankets. When the airplane descends the ice melts and the water runs down the inside of the skin, collecting in the lower fuselage. In an aluminum airframe that water drives corrosion, and wet insulation also adds weight and can drip onto electrical equipment.",
        "A carbon fiber fuselage does not corrode, which removes the main reason to keep the air as dry as possible. Boeing stated a target of a steady 10 to 15 percent relative humidity in the 787 cabin, compared with roughly 3 to 12 percent on earlier airplanes. Condensation still has to be managed, so a zonal drying system from CTT Systems, standard on the 787, removes moisture from the space between the cabin lining and the skin in the crown, preventing it from building up in the insulation.",
        "Active humidifiers, also from CTT, are offered as options for the flight deck and crew rest areas, and some operators add humidification to premium cabins, typically aiming for around 20 to 25 percent relative humidity in those spaces. Adding water to the air costs weight (the water has to be carried) and makes condensation control more important, so humidification is a choice each operator makes rather than a default.",
      ],
      facts: [
        ['787 cabin target', 'About 10 to 15% relative humidity'],
        ['Typical older jets', 'About 3 to 12%'],
        ['Main moisture source', 'Passengers'],
        ['Standard equipment', 'CTT zonal drying system'],
        ['Optional', 'Humidifiers for flight deck, crew rest, some premium cabins'],
      ],
    },
    windows: {
      title: 'Dimmable windows',
      summary:
        'The 787 has the largest passenger windows of any widebody in service, and instead of pull-down shades they darken electrically, from clear to a deep tint, at the press of a button.',
      body: [
        "The 787's cabin windows are about 47 cm tall and 27 cm wide (the commonly quoted figure is 18.4 by 10.7 inches, though Boeing's own published figures vary slightly), much larger than the roughly 38 by 25 cm windows of a 777. They are also mounted higher in the fuselage wall, so passengers away from the window seat can still see the horizon. Cutting large holes in a pressurized fuselage creates stress concentrations around each opening; the carbon fiber barrel's strength and fatigue resistance made the larger cutouts practical.",
        "There are no window shades. Each window is an electrochromic assembly supplied with Gentex technology, with the window assemblies built by PPG Aerospace: between two glass panes is a thin layer of gel containing two kinds of dye molecules, and the inner faces of the glass carry a transparent electrically conductive coating. When a small voltage (on the order of a volt) is applied across the gel, one dye is reduced at one electrode and the other oxidized at the opposite electrode, and both take on color. Raising the voltage makes more colored molecules and a darker window. When the voltage is removed, the colored molecules react with each other in the gel and return to their clear forms.",
        "Passengers choose among five settings with a button below the window, and cabin crew have a master control that can set one window, a section or the whole cabin. The change is not instant: darkening fully can take up to about a minute, and clearing up to about three minutes. The early windows bottomed out at a deep blue tint that still let some light through, which passengers trying to sleep noticed, and Gentex later developed a darker formulation that can reach nearly black.",
      ],
      facts: [
        ['Size', 'About 47 x 27 cm (18.4 x 10.7 in)'],
        ['Technology', 'Gentex electrochromic gel'],
        ['Window assemblies', 'PPG Aerospace'],
        ['Settings', '5 levels, plus crew master control'],
        ['Time to full dark', 'Up to about 1 minute (clearing up to about 3)'],
      ],
    },
    filtration: {
      title: 'Clean air and a smoother ride',
      summary:
        'Recirculated air passes through hospital-grade HEPA filters, an added gas filter removes odors and irritants, and ozone is destroyed before the air reaches the cabin. The flight controls even work to damp out turbulence.',
      body: [
        "Recirculated cabin air passes through HEPA (high efficiency particulate air) filters, which capture at least 99.97 percent of particles at 0.3 microns, the size that is hardest to catch; larger and smaller particles, including bacteria and virus-carrying droplets, are caught at even higher rates. Combined with the high air exchange rate and the across-the-cabin flow pattern, this is why the air in a modern airliner cabin is among the most thoroughly filtered indoor air people breathe.",
        "HEPA filters do nothing for gases, so the 787 adds a gaseous filtration system, supplied by Donaldson, to remove gaseous irritants and odors (volatile organic compounds, for example) along with particulates. Ozone is handled separately. At cruise altitudes, especially at high latitudes, outside air can carry enough ozone to irritate the lungs and eyes, and the regulations (14 CFR 25.832) set limits on cabin ozone concentration. Catalytic ozone converters, which break ozone down into ordinary oxygen and work best on hot air, treat the compressed air before it reaches the packs.",
        "The no-bleed design also removes a contamination path. Bleed air on other airliners comes from inside the engine, where a failing oil seal can let oil vapor into the cabin supply, the cause of so-called fume events. Air for the 787's cabin is drawn from outside and compressed by separate electric compressors, so it never passes through the engine's core.",
        "Comfort is also about motion. The 787's fly-by-wire flight control system includes a gust suppression function (Boeing calls it Smoother Ride Technology): sensors detect the airplane being pushed up or down by turbulence, and the flight computers move control surfaces to counter the vertical acceleration. It cannot remove turbulence, but it reduces the up-and-down motion felt in the cabin, which is the motion most associated with airsickness.",
      ],
      facts: [
        ['Particle filters', 'HEPA, at least 99.97% at 0.3 microns'],
        ['Gas filtration', 'Donaldson gaseous filtration system'],
        ['Ozone', 'Catalytic converters, limits in 14 CFR 25.832'],
        ['Engine oil path', 'None: no bleed air'],
        ['Turbulence', 'Gust suppression by the flight controls'],
      ],
    },
  },
}
