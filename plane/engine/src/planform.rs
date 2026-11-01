// The airplane from above as an x-ray on a blueprint, nose up, with each system drawn as light flowing through it:
// fuel to the engines, three hydraulic systems to the actuators, electricity from six generators to the loads, air from
// the ram inlets through the compressors to the cabin, and fly-by-wire signals from the flight deck to every surface.
//
// World is 640 x 640. The airplane is drawn in meters (x to the right of the centerline, y aft from the nose tip) at
// 8.9 world units to the meter, nose tip at (320, 40).

use crate::exterior::{edge_glow, hash};
use crate::flows;
use crate::gfx::{inside, ramp, Canvas};
use crate::pal::*;
use crate::Params;

const S: f32 = 8.9;
const OX: f32 = 320.0;
const OY: f32 = 40.0;
const HALF: f32 = 2.885;

#[inline]
fn at(x: f32, y: f32) -> (f32, f32) {
    (OX + x * S, OY + y * S)
}
fn pts(m: &[(f32, f32)]) -> Vec<(f32, f32)> {
    m.iter().map(|&(x, y)| at(x, y)).collect()
}
fn mirror(m: &[(f32, f32)]) -> Vec<(f32, f32)> {
    m.iter().map(|&(x, y)| (-x, y)).collect()
}

fn fuselage() -> Vec<(f32, f32)> {
    let mut right = Vec::new();
    let mut y: f32 = 0.0;
    while y <= 62.8 {
        let w = if y < 8.0 { HALF * (1.0 - (1.0 - y / 8.0).powi(2)).sqrt() } else if y < 44.0 { HALF } else { HALF - (y - 44.0) / 18.8 * 2.3 };
        right.push((w, y));
        y += 0.5;
    }
    let left: Vec<(f32, f32)> = right.iter().rev().map(|&(x, y)| (-x, y)).collect();
    right.extend(left);
    right
}

const WING: [(f32, f32); 7] = [(2.9, 22.5), (12.0, 28.6), (30.05, 41.0), (30.4, 42.7), (28.4, 43.4), (9.5, 36.4), (2.9, 36.3)];
const STAB: [(f32, f32); 5] = [(1.4, 53.0), (9.7, 59.0), (9.9, 60.6), (8.0, 61.0), (1.4, 60.6)];
const NACELLE: [(f32, f32); 6] = [(8.4, 19.6), (11.4, 19.6), (11.6, 20.4), (11.4, 27.0), (8.4, 27.0), (8.2, 20.4)];

// control surfaces on the right wing and tail; mirrored for the left
const AILERON: [(f32, f32); 4] = [(21.0, 39.4), (26.4, 41.4), (26.4, 42.6), (21.0, 40.9)];
const FLAPERON: [(f32, f32); 4] = [(9.6, 36.4), (12.4, 37.4), (12.4, 39.0), (9.6, 38.0)];
const FLAP_IN: [(f32, f32); 4] = [(3.0, 36.3), (9.4, 36.4), (9.4, 38.4), (3.0, 38.4)];
const FLAP_OUT: [(f32, f32); 4] = [(12.6, 37.5), (20.8, 40.4), (20.8, 42.0), (12.6, 39.2)];
const ELEVATOR: [(f32, f32); 4] = [(1.5, 60.6), (8.0, 61.0), (8.0, 62.2), (1.5, 62.0)];
const SLATS: [(f32, f32); 4] = [(12.2, 28.7), (29.6, 40.6), (29.0, 41.3), (12.0, 29.6)];

fn spoiler(i: usize) -> [(f32, f32); 4] {
    // seven panels per wing, ahead of the flaps
    let x0 = 3.4 + i as f32 * 2.4;
    let y0 = |x: f32| 33.6 + (x - 3.0).max(0.0) * 0.28;
    let x1 = x0 + 2.1;
    [(x0, y0(x0)), (x1, y0(x1)), (x1, y0(x1) + 1.7), (x0, y0(x0) + 1.7)]
}

/// Highlightable parts, by focus number.
fn part(i: i32) -> Vec<Vec<(f32, f32)>> {
    let both = |m: &[(f32, f32)]| vec![m.to_vec(), mirror(m)];
    match i {
        0 => both(&AILERON),
        1 => both(&FLAPERON),
        2 => (0..7).flat_map(|k| both(&spoiler(k))).collect(),
        3 => both(&ELEVATOR),
        4 => vec![vec![(-0.3, 56.0), (0.3, 56.0), (0.3, 62.6), (-0.3, 62.6)]],
        5 => [both(&FLAP_IN), both(&FLAP_OUT)].concat(),
        6 => both(&SLATS),
        7 => both(&STAB),
        8 => [both(&[(3.8, 31.2), (5.8, 31.2), (5.8, 34.8), (3.8, 34.8)]), vec![vec![(-0.6, 5.8), (0.6, 5.8), (0.6, 7.2), (-0.6, 7.2)]]].concat(),
        9 => [both(&tank()), vec![center_tank()]].concat(),
        10 => vec![vec![(-2.0, 8.2), (2.0, 8.2), (2.0, 11.8), (-2.0, 11.8)], vec![(-2.2, 37.0), (2.2, 37.0), (2.2, 41.5), (-2.2, 41.5)]],
        11 => vec![vec![(-0.8, 59.5), (0.8, 59.5), (0.8, 62.2), (-0.8, 62.2)]],
        12 => both(&[(0.6, 26.0), (2.4, 26.0), (2.4, 30.0), (0.6, 30.0)]),
        13 => both(&NACELLE),
        _ => vec![],
    }
}

fn tank() -> Vec<(f32, f32)> {
    vec![(3.0, 25.0), (12.0, 30.4), (26.0, 39.8), (25.6, 40.8), (12.0, 35.6), (3.0, 34.4)]
}
fn center_tank() -> Vec<(f32, f32)> {
    vec![(-2.6, 24.0), (2.6, 24.0), (2.6, 34.0), (-2.6, 34.0)]
}

pub fn draw(c: &mut Canvas, p: &Params) {
    blueprint(c);
    airframe(c);
    let pulse = 0.55 + 0.35 * (c.t * 3.2).sin();
    for poly in part(p.focus) {
        let w = pts(&poly);
        // the part outlined in light and checkered gold, under the flows so it never hides them
        c.poly_with(&w, |_, _, dx, dy| if (dx + dy) % 2 == 0 { 0xffe27a } else { 0x8a6ad8 });
        edge_glow(c, &w, HIGHLIGHT, pulse);
    }
    let f = p.flows;
    if f & flows::FUEL != 0 {
        fuel(c);
    }
    if f & flows::HYDRAULIC != 0 {
        hydraulics(c);
    }
    if f & flows::ELECTRIC != 0 {
        electric(c);
    }
    if f & flows::AIR != 0 {
        air(c);
    }
    if f & flows::SIGNAL != 0 {
        signals(c);
    }
}

fn blueprint(c: &mut Canvas) {
    let deep = [0x0d0a2e, 0x130f3e, 0x1a144f, 0x221a5e];
    c.rect_with(-600.0, -600.0, 1840.0, 1840.0, |wx, wy, dx, dy| {
        let r = (((wx - 320.0).powi(2) + (wy - 320.0).powi(2)).sqrt() / 520.0).min(1.0);
        let base = ramp(&deep, 1.0 - r, dx, dy);
        let (gx, gy) = (wx.rem_euclid(32.0), wy.rem_euclid(32.0));
        if gx < 0.7 || gy < 0.7 {
            0x2c2a7a
        } else if (wx.rem_euclid(8.0) < 0.5 || wy.rem_euclid(8.0) < 0.5) && (dx + dy) % 2 == 0 {
            0x201c62
        } else {
            base
        }
    });
    // a compass rose and scale ticks, for the blueprint feel
    let (rx, ry) = (90.0, 560.0);
    for k in 0..16 {
        let a = k as f32 * std::f32::consts::TAU / 16.0;
        let l = if k % 4 == 0 { 34.0 } else { 18.0 };
        c.line(rx, ry, rx + a.sin() * l, ry - a.cos() * l, if k % 4 == 0 { 2.0 } else { 1.0 }, if k == 0 { 0xff6ad5 } else { 0x5a54c8 });
    }
    c.ellipse(rx, ry, 4.0, 4.0, 0xff6ad5);
    for k in 0..12 {
        let x = 470.0 + k as f32 * 12.0;
        c.rect(x, 600.0, 1.0, if k % 5 == 0 { 8.0 } else { 4.0 }, 0x5a54c8);
    }
    c.rect(470.0, 608.0, 133.0, 1.0, 0x5a54c8);
}

fn airframe(c: &mut Canvas) {
    let skin = [0x241f6a, 0x2d2880, 0x383295, 0x463eaa, 0x5850c0];
    let body = pts(&fuselage());
    let wings = [pts(&WING), pts(&mirror(&WING))];
    let stabs = [pts(&STAB), pts(&mirror(&STAB))];
    // wings and tail first, then the body over them, each lit across its width
    for w in wings.iter().chain(stabs.iter()) {
        c.poly_with(w, |wx, wy, dx, dy| {
            let ribs = ((wx - OX).abs() / S * 1.15).rem_euclid(1.0) < 0.09;
            if ribs { skin[4] } else { ramp(&skin, 0.3 + 0.4 * (((wy - OY) / S * 0.37).sin() * 0.5 + 0.5), dx, dy) }
        });
        outline(c, w, 0x8a82ff);
    }
    // spars: front and rear, the wing's backbone
    for sx in [1.0f32, -1.0] {
        c.path(&pts(&[(2.9 * sx, 24.4), (12.0 * sx, 30.2), (29.0 * sx, 40.9)]), 1.2, 0x6a62e0);
        c.path(&pts(&[(2.9 * sx, 35.0), (12.0 * sx, 36.0), (27.0 * sx, 41.6)]), 1.2, 0x6a62e0);
    }
    c.poly_with(&body, |_, wy, dx, dy| {
        let frame = ((wy - OY) / S * 1.6).rem_euclid(1.0) < 0.1;
        if frame { skin[3] } else { ramp(&skin, 0.55, dx, dy) }
    });
    // floor beams and the keel, faint
    c.line(OX, OY + 6.0 * S, OX, OY + 58.0 * S, 1.0, 0x4a42b8);
    outline(c, &body, 0xa69eff);
    // nacelles, with the fan face seen through the cowl
    for n in [pts(&NACELLE), pts(&mirror(&NACELLE))] {
        c.poly_with(&n, |_, wy, dx, dy| ramp(&[0x2a2470, 0x3a3290, 0x4a42b0], (wy - OY - 19.6 * S) / (7.4 * S), dx, dy));
        outline(c, &n, 0xb8b0ff);
    }
    for sx in [1.0f32, -1.0] {
        let (fx, fy) = at(9.9 * sx, 20.8);
        c.ellipse(fx, fy, 1.4 * S, 0.5 * S, 0x5a52c8);
        for k in 0..18 {
            let a = k as f32 / 18.0 * std::f32::consts::TAU + c.t * 4.0;
            c.hair(fx, fy, fx + a.cos() * 1.35 * S, fy + a.sin() * 0.45 * S, 0x8a82ff);
        }
    }
    // control surfaces in a brighter violet, so they read as hinged parts
    let surf = [&AILERON[..], &FLAPERON, &FLAP_IN, &FLAP_OUT, &ELEVATOR, &SLATS];
    for s in surf {
        for poly in [pts(s), pts(&mirror(s))] {
            c.poly_with(&poly, |_, _, dx, dy| ramp(&[0x4a3ab8, 0x5c48d0], 0.5, dx, dy));
            outline(c, &poly, 0xc8b8ff);
        }
    }
    for k in 0..7 {
        for poly in [pts(&spoiler(k)), pts(&mirror(&spoiler(k)))] {
            c.poly(&poly, 0x3e34a4);
            outline(c, &poly, 0x9a8cff);
        }
    }
    // windows down each side, the flight deck windows at the front
    let mut y = 9.0;
    while y < 57.0 {
        for sx in [1.0f32, -1.0] {
            let (x, yy) = at(HALF * 0.86 * sx, y);
            c.rect(x - 0.6, yy, 1.2, 1.4, 0xffd36b);
        }
        y += 0.98;
    }
    c.poly(&pts(&[(-1.6, 3.2), (1.6, 3.2), (2.2, 4.8), (-2.2, 4.8)]), 0x6ad8ff);
}

fn outline(c: &mut Canvas, poly: &[(f32, f32)], col: u32) {
    for i in 0..poly.len() {
        let (a, b) = (poly[i], poly[(i + 1) % poly.len()]);
        c.hair(a.0, a.1, b.0, b.1, col);
    }
}

/// A flowing line in meters.
fn run(c: &mut Canvas, m: &[(f32, f32)], width: f32, col: u32, core: u32, speed: f32) {
    let w = pts(m);
    c.flow(&w, width, core, col, speed, 26.0, 0.8);
}

fn fuel(c: &mut Canvas) {
    let t = c.t;
    // the tanks: fuel sloshing gently, lit from within
    for poly in [pts(&tank()), pts(&mirror(&tank())), pts(&center_tank())] {
        c.poly_with(&poly, |wx, wy, dx, dy| {
            let wave = ((wx * 0.08 + t * 1.4).sin() + (wy * 0.06 - t).sin()) * 0.25 + 0.5;
            ramp(&[0x5a2a10, 0x8a4214, 0xc06018, 0xff8a24], wave, dx, dy)
        });
        let (mut x0, mut y0, mut x1, mut y1) = (f32::MAX, f32::MAX, f32::MIN, f32::MIN);
        for &(x, y) in &poly {
            x0 = x0.min(x);
            y0 = y0.min(y);
            x1 = x1.max(x);
            y1 = y1.max(y);
        }
        c.shine(x0, y0, x1, y1, |wx, wy, _, _| inside(&poly, wx, wy).then_some((FUEL, 0.05)));
    }
    // boost pumps feed each engine; the crossfeed manifold runs across the center tank
    for sx in [1.0f32, -1.0] {
        run(c, &[(6.0 * sx, 33.5), (8.6 * sx, 30.0), (9.9 * sx, 27.0)], 1.8, FUEL, FUEL_CORE, 34.0);
        run(c, &[(18.0 * sx, 38.0), (12.0 * sx, 33.8), (9.9 * sx, 28.4), (9.9 * sx, 27.0)], 1.4, FUEL, FUEL_CORE, 34.0);
        run(c, &[(0.0, 31.0), (4.0 * sx, 31.0), (8.6 * sx, 30.0)], 1.6, FUEL, FUEL_CORE, 30.0);
        // the jettison nozzles near each wingtip
        let (jx, jy) = at(25.0 * sx, 41.3);
        c.glow(jx, jy, 6.0, FUEL, 0.6);
    }
    for (x, y) in [(6.0f32, 33.5), (-6.0, 33.5), (1.4, 32.6), (-1.4, 32.6)] {
        let (px, py) = at(x, y);
        c.ellipse(px, py, 3.0, 3.0, FUEL_CORE);
        c.glow(px, py, 9.0, FUEL, 1.2);
    }
    // the nitrogen generator inerting the center tank
    let (nx, ny) = at(0.0, 28.0);
    c.rect(nx - 6.0, ny - 4.0, 12.0, 8.0, 0x7ab0ff);
    run(c, &[(0.0, 28.5), (0.0, 25.0), (-2.0, 25.0)], 1.0, 0x9ad0ff, 0xe0f0ff, 16.0);
}

fn hydraulics(c: &mut Canvas) {
    // left and right: engine-driven pumps out along each wing to its surfaces, aft to the tail
    for (sx, col) in [(-1.0f32, HYD_L), (1.0, HYD_R)] {
        let core = 0xeaffd8;
        run(c, &[(9.9 * sx, 24.4), (9.9 * sx, 28.4), (12.0 * sx, 34.2), (23.5 * sx, 39.4)], 1.6, col, core, 40.0);
        run(c, &[(12.0 * sx, 34.2), (11.0 * sx, 37.0)], 1.2, col, core, 40.0);
        run(c, &[(9.9 * sx, 28.4), (3.4 * sx, 30.0), (1.6 * sx, 34.0), (1.6 * sx, 56.0), (5.0 * sx, 60.6)], 1.4, col, core, 40.0);
        let (ex, ey) = at(9.9 * sx, 24.4);
        c.ellipse(ex, ey, 3.4, 3.4, col);
        c.glow(ex, ey, 11.0, col, 1.3);
    }
    // center: electric pumps in the belly, to the gear, the flaps' neighbors and the tail
    let col = HYD_C;
    for sx in [1.0f32, -1.0] {
        run(c, &[(0.0, 30.0), (4.8 * sx, 31.4), (4.8 * sx, 33.0)], 1.4, col, 0xe0f8ff, 36.0);
        run(c, &[(0.0, 30.0), (6.0 * sx, 34.0), (16.0 * sx, 37.4)], 1.2, col, 0xe0f8ff, 36.0);
    }
    run(c, &[(0.0, 30.0), (0.0, 7.0)], 1.4, col, 0xe0f8ff, 36.0);
    run(c, &[(0.0, 30.0), (-0.4, 58.0)], 1.4, col, 0xe0f8ff, 36.0);
    let (px, py) = at(0.0, 30.0);
    c.ellipse(px, py, 3.6, 3.6, col);
    c.glow(px, py, 12.0, col, 1.4);
}

fn electric(c: &mut Canvas) {
    // two starter generators on each engine and two on the APU feed the aft electronics bay; from there power goes
    // to the cabin air compressors, the brakes, the wing ice protection, the hydraulic pumps and the forward bay
    let (core, col) = (ELECTRIC_CORE, ELECTRIC);
    for sx in [1.0f32, -1.0] {
        run(c, &[(9.9 * sx, 23.4), (9.9 * sx, 28.4), (4.0 * sx, 33.0), (1.2 * sx, 38.0)], 1.6, col, core, 60.0);
        run(c, &[(1.0 * sx, 39.0), (1.6 * sx, 28.0)], 1.2, col, core, 60.0);
        run(c, &[(1.2 * sx, 39.0), (4.8 * sx, 33.0)], 1.0, col, core, 60.0);
        // the wing's leading edge heater mats
        run(c, &[(4.0 * sx, 33.0), (12.2 * sx, 29.4), (28.0 * sx, 40.2)], 0.9, 0xff8af0, 0xffe0fa, 50.0);
        for g in [22.4f32, 24.2] {
            let (gx, gy) = at(10.6 * sx, g);
            c.rect(gx - 3.0, gy - 2.0, 6.0, 4.0, core);
            c.glow(gx, gy, 9.0, col, 1.3);
        }
    }
    run(c, &[(0.0, 60.2), (0.0, 41.5)], 1.6, col, core, 60.0);
    run(c, &[(0.0, 37.0), (0.0, 11.8)], 1.4, col, core, 60.0);
    for (x, y, w, h) in [(-2.2f32, 37.0f32, 4.4f32, 4.5f32), (-2.0, 8.2, 4.0, 3.6)] {
        let (bx, by) = at(x, y);
        c.rect(bx, by, w * S, h * S, 0x1e5a8a);
        for k in 0..6 {
            c.rect(bx + 2.0 + k as f32 * w * S / 6.5, by + 3.0, 2.0, h * S - 6.0, 0x5af2ff);
        }
        c.glow(bx + w * S / 2.0, by + h * S / 2.0, 22.0, col, 0.7);
    }
    let (ax, ay) = at(0.0, 60.8);
    c.ellipse(ax, ay, 5.0, 5.0, core);
    c.glow(ax, ay, 14.0, col, 1.5);
}

fn air(c: &mut Canvas) {
    // ram air inlets on the belly feed four electric compressors, then the packs, then a duct the length of the
    // cabin with an outlet at every row
    let (core, col) = (AIR_CORE, AIR);
    for sx in [1.0f32, -1.0] {
        run(c, &[(2.4 * sx, 25.0), (1.6 * sx, 28.0), (0.8 * sx, 31.0)], 1.6, col, core, 30.0);
        let (ix, iy) = at(2.4 * sx, 25.0);
        c.glow(ix, iy, 8.0, col, 1.0);
        for k in 0..2 {
            let (cx, cy) = at(1.5 * sx, 26.6 + k as f32 * 1.8);
            c.ellipse(cx, cy, 4.0, 4.0, 0x2a4a9a);
            for a in 0..6 {
                let ang = a as f32 * 1.047 + c.t * 9.0 * sx;
                c.hair(cx, cy, cx + ang.cos() * 3.6, cy + ang.sin() * 3.6, core);
            }
        }
        run(c, &[(0.8 * sx, 31.0), (1.8 * sx, 31.0), (1.8 * sx, 9.0)], 1.2, col, core, 30.0);
        run(c, &[(1.8 * sx, 31.0), (1.8 * sx, 55.0)], 1.2, col, core, 30.0);
        let mut y = 10.0;
        while y < 55.0 {
            let (ox, oy) = at(1.8 * sx, y);
            let (tx, _) = at(2.6 * sx, y);
            c.shine(ox.min(tx), oy - 1.5, ox.max(tx), oy + 1.5, |_, _, _, _| Some((col, 0.25)));
            y += 1.96;
        }
    }
    // the outflow valves letting cabin air out at the back keep the pressure where it is set
    let (vx, vy) = at(0.0, 56.0);
    c.glow(vx, vy, 10.0, col, 0.4 + 0.3 * (c.t * 2.0).sin().abs());
}

fn signals(c: &mut Canvas) {
    // the flight deck's controls are read into the forward bay's computers, which send commands to the actuators'
    // electronics out along each wing and back to the tail; the pulses show the commands going out
    let (core, col) = (SIGNAL_CORE, SIGNAL);
    run(c, &[(0.0, 4.6), (0.0, 9.0)], 1.0, col, core, 90.0);
    for sx in [1.0f32, -1.0] {
        run(c, &[(0.6 * sx, 11.0), (0.6 * sx, 33.0), (6.0 * sx, 35.4), (23.5 * sx, 40.6)], 1.0, col, core, 90.0);
        run(c, &[(6.0 * sx, 35.4), (6.0 * sx, 37.3)], 0.8, col, core, 90.0);
        run(c, &[(11.0 * sx, 36.8), (11.0 * sx, 37.8)], 0.8, col, core, 90.0);
        run(c, &[(17.0 * sx, 38.4), (16.8 * sx, 39.8)], 0.8, col, core, 90.0);
        run(c, &[(12.0 * sx, 33.0), (20.0 * sx, 36.2), (20.0 * sx, 35.0)], 0.7, col, core, 90.0);
        run(c, &[(0.6 * sx, 33.0), (0.6 * sx, 58.0), (4.5 * sx, 61.0)], 1.0, col, core, 90.0);
    }
    run(c, &[(0.0, 58.0), (0.0, 60.0)], 0.8, col, core, 90.0);
    // the computers themselves
    let (fx, fy) = at(0.0, 10.0);
    c.rect(fx - 7.0, fy - 5.0, 14.0, 10.0, 0x5a2a9a);
    for k in 0..3 {
        c.rect(fx - 5.0 + k as f32 * 4.0, fy - 3.0, 2.0, 6.0, core);
    }
    c.glow(fx, fy, 16.0, col, 0.9);
    // stray sparkle along the bus, a nod to data in flight
    for i in 0..30u32 {
        let y = 11.0 + (hash(i) * 47.0 + c.t * 9.0).rem_euclid(47.0);
        let (x, yy) = at(0.6 * if i % 2 == 0 { 1.0 } else { -1.0 }, y);
        c.glow(x, yy, 3.0, core, 0.4);
    }
}
