// A high-bypass turbofan cut in half along its axis, front to the left. Air comes in, most of it goes around the core
// through the bypass duct (cool, blue), the rest is squeezed by the compressors, burned in the combustor (white hot)
// and expanded through the turbines (orange to red), which turn the shafts that drive the fan and compressors.
//
// World is 640 x 300, the axis on y = 150. Radii are in world units.

use crate::exterior::{edge_glow, hash};
use crate::flows;
use crate::gfx::{ramp, Canvas};
use crate::pal::*;
use crate::Params;

const AX: f32 = 150.0;

// stations along the axis
const FAN: f32 = 96.0;
const SPLIT: f32 = 126.0;
const LPC: (f32, f32) = (128.0, 168.0);
const HPC: (f32, f32) = (176.0, 278.0);
const COMB: (f32, f32) = (282.0, 332.0);
const HPT: (f32, f32) = (336.0, 360.0);
const LPT: (f32, f32) = (366.0, 462.0);
const BYPASS_EXIT: f32 = 430.0;

/// The core annulus at x: inner and outer radius.
fn core(x: f32) -> (f32, f32) {
    let lerp = |a: f32, b: f32, u: f32| a + (b - a) * u.clamp(0.0, 1.0);
    if x < LPC.1 {
        (lerp(28.0, 30.0, (x - SPLIT) / 40.0), lerp(48.0, 46.0, (x - SPLIT) / 40.0))
    } else if x < HPC.1 {
        let u = (x - HPC.0) / (HPC.1 - HPC.0);
        (lerp(30.0, 33.0, u), lerp(46.0, 38.0, u))
    } else if x < COMB.1 {
        (31.0, 47.0)
    } else if x < LPT.1 {
        let u = (x - HPT.0) / (LPT.1 - HPT.0);
        (lerp(31.0, 30.0, u), lerp(42.0, 64.0, u))
    } else {
        let u = (x - LPT.1) / 40.0;
        (lerp(30.0, 18.0, u), lerp(64.0, 58.0, u))
    }
}

pub fn draw(c: &mut Canvas, p: &Params) {
    let t = c.t;
    backdrop(c);
    let rev = p.anim.clamp(0.0, 1.0);
    nacelle(c, rev);
    core_case(c);
    stages(c, t);
    shafts(c, t);
    combustor(c, t);
    accessories(c, t);
    if p.flows & flows::BYPASS != 0 {
        bypass_flow(c, t, rev);
    }
    if p.flows & flows::CORE != 0 {
        core_flow(c, t);
    }
    let pulse = 0.5 + 0.3 * (t * 3.2).sin();
    for poly in focus(p.focus) {
        edge_glow(c, &poly, HIGHLIGHT, pulse);
        let m: Vec<(f32, f32)> = poly.iter().map(|&(x, y)| (x, 2.0 * AX - y)).collect();
        edge_glow(c, &m, HIGHLIGHT, pulse);
    }
}

fn band(x0: f32, x1: f32, r0: f32, r1: f32) -> Vec<(f32, f32)> {
    vec![(x0, AX - r1), (x1, AX - r1), (x1, AX - r0), (x0, AX - r0)]
}

fn focus(i: i32) -> Vec<Vec<(f32, f32)>> {
    match i {
        0 => vec![band(FAN - 6.0, FAN + 8.0, 22.0, 99.0)],
        1 => vec![band(LPC.0, LPC.1, 27.0, 50.0)],
        2 => vec![band(HPC.0, HPC.1, 29.0, 47.0)],
        3 => vec![band(COMB.0, COMB.1, 29.0, 50.0)],
        4 => vec![band(HPT.0, HPT.1, 29.0, 45.0)],
        5 => vec![band(LPT.0, LPT.1, 28.0, 66.0)],
        6 => vec![vec![(BYPASS_EXIT, AX - 104.0), (BYPASS_EXIT + 14.0, AX - 92.0), (480.0, AX - 66.0), (600.0, AX - 2.0), (480.0, AX - 20.0)]],
        7 => vec![band(300.0, 380.0, 100.0, 118.0)],
        8 => vec![band(FAN, LPT.1, 0.0, 16.0)],
        9 => vec![band(200.0, 236.0, 112.0, 124.0)],
        10 => vec![band(170.0, 260.0, 52.0, 66.0)],
        _ => vec![],
    }
}

fn backdrop(c: &mut Canvas) {
    let bg = [0x0b0624, 0x120a33, 0x1a0f44, 0x241455];
    c.rect_with(-500.0, -400.0, 1640.0, 1100.0, |wx, wy, dx, dy| {
        let r = ((wy - AX).abs() / 260.0).min(1.0);
        let stripe = ((wx + wy * 0.5) / 18.0).rem_euclid(1.0) < 0.08;
        let base = ramp(&bg, 1.0 - r, dx, dy);
        if stripe && (dx + dy) % 3 == 0 { 0x2a1a60 } else { base }
    });
    // the axis, a dashed center line as on a drawing
    let mut x = -100.0;
    while x < 740.0 {
        c.rect(x, AX - 0.4, 10.0, 0.8, 0x5a4ab0);
        x += 16.0;
    }
}

fn nacelle(c: &mut Canvas, rev: f32) {
    let shell = [0x2a2860, 0x45428a, 0x6c6cb4, 0xa4a8dc, 0xdfe4ff, 0xffffff];
    let slide = rev * 34.0;
    for s in [-1.0f32, 1.0] {
        let y = |r: f32| AX + s * r;
        // inlet lip and fan case
        let front = [(40.0, y(104.0)), (48.0, y(116.0)), (70.0, y(120.0)), (300.0, y(118.0)), (300.0, y(102.0)), (70.0, y(100.0)), (46.0, y(102.0))];
        c.poly_with(&front, |_, wy, dx, dy| ramp(&shell, 1.0 - ((wy - AX).abs() - 100.0) / 20.0, dx, dy));
        // the translating cowl, which slides back to open the reverser's cascades
        let cowl = [(300.0 + slide, y(118.0)), (404.0 + slide, y(112.0)), (BYPASS_EXIT + slide, y(104.0)), (BYPASS_EXIT + slide, y(100.0)), (300.0 + slide, y(102.0))];
        c.poly_with(&cowl, |_, wy, dx, dy| ramp(&shell, 1.0 - ((wy - AX).abs() - 100.0) / 20.0, dx, dy));
        // chevrons on its back edge
        for k in 0..3 {
            let r = 101.0 + k as f32 * 1.4;
            c.poly(&[(BYPASS_EXIT + slide, y(r)), (BYPASS_EXIT + slide + 7.0, y(r + 0.7)), (BYPASS_EXIT + slide, y(r + 1.4))], shell[3]);
        }
        if slide > 1.0 {
            // the cascade vanes now open to the airstream
            let mut x = 302.0;
            while x < 300.0 + slide {
                c.line(x, y(103.0), x + 3.0, y(117.0), 1.2, 0x8a7ad8);
                x += 4.0;
            }
            // blocker doors folded down across the bypass duct
            c.line(304.0, y(100.0), 324.0 - 18.0 * (1.0 - rev), y(100.0 - 46.0 * rev), 2.0, 0x9a98c8);
        }
        // livery stripe on the fan cowl
        c.rect(150.0, y(if s > 0.0 { 118.0 } else { 120.0 }) , 22.0, 2.0, LIVERY[4]);
    }
    // spinner, with its painted swirl
    let t = c.t;
    c.poly_with(&[(60.0, AX), (FAN, AX - 26.0), (FAN, AX + 26.0)], |wx, wy, dx, dy| {
        let a = (wy - AX).atan2(wx - 60.0) * 6.0 - t * 12.0;
        if a.sin() > 0.85 { 0x1a1240 } else { ramp(&METAL, 1.0 - (wy - AX + 26.0) / 52.0, dx, dy) }
    });
}

fn core_case(c: &mut Canvas) {
    // the splitter and the core's casing, which divides the bypass duct from the core
    let case = [0x3a3470, 0x5a52a0, 0x8078c8, 0xb0a8ee];
    for s in [-1.0f32, 1.0] {
        let mut outer = Vec::new();
        let mut inner = Vec::new();
        let mut x = SPLIT;
        while x <= 480.0 {
            let (_, ro) = core(x);
            let cowl = if x < 300.0 { ro + 6.0 + (x - SPLIT) * 0.04 } else { ro + 13.0 - (x - 300.0) * 0.03 };
            outer.push((x, AX + s * cowl));
            inner.push((x, AX + s * (ro + 1.0)));
            x += 6.0;
        }
        outer.extend(inner.into_iter().rev());
        c.poly_with(&outer, |_, wy, dx, dy| ramp(&case, ((wy - AX).abs() - 40.0) / 30.0, dx, dy));
        // inner hub the blades sit on
        let mut hub = vec![(SPLIT, AX)];
        let mut x = SPLIT;
        while x <= 480.0 {
            hub.push((x, AX + s * core(x).0));
            x += 6.0;
        }
        hub.push((480.0, AX));
        c.poly_with(&hub, |_, wy, dx, dy| ramp(&[0x1e1840, 0x2c2458, 0x3a3070], (wy - AX).abs() / 34.0, dx, dy));
    }
    // the exhaust plug and core nozzle
    c.poly_with(&[(470.0, AX - 30.0), (600.0, AX), (470.0, AX + 30.0)], |_, wy, dx, dy| ramp(&METAL, 1.0 - (wy - AX + 30.0) / 60.0, dx, dy));
}

#[allow(clippy::too_many_arguments)]
fn stage_bar(c: &mut Canvas, x: f32, w: f32, r0: f32, r1: f32, rotor: bool, t: f32, stops: &[u32]) {
    for s in [-1.0f32, 1.0] {
        let (y0, y1) = if s < 0.0 { (AX - r1, AX - r0) } else { (AX + r0, AX + r1) };
        c.rect_with(x, y0, w, y1 - y0, |_, wy, dx, dy| {
            // rotors shimmer as blades pass; stators hold still
            let u = ((wy - AX).abs() - r0) / (r1 - r0);
            let shimmer = if rotor { ((wy * 0.9 + t * 40.0).sin() * 0.5 + 0.5) * 0.4 } else { 0.0 };
            ramp(stops, (0.3 + 0.5 * u + shimmer).min(1.0), dx, dy)
        });
    }
}

fn stages(c: &mut Canvas, t: f32) {
    let blade = [0x4a4486, 0x7a76b8, 0xb0b0e0, 0xe8ecff];
    let hot = [0x6a2a3a, 0x9a3a3a, 0xd0604a, 0xffb07a];
    // the fan: wide carbon fiber blades, drawn as a sweeping blur when spinning
    for s in [-1.0f32, 1.0] {
        c.poly_with(&[(FAN - 6.0, AX + s * 26.0), (FAN + 4.0, AX + s * 26.0), (FAN + 10.0, AX + s * 99.0), (FAN - 2.0, AX + s * 99.0)], |wx, wy, dx, dy| {
            let sweep = ((wy - AX).abs() * 0.18 - t * 30.0 + wx * 0.2).sin() * 0.5 + 0.5;
            ramp(&[0x1a1838, 0x2e2c5c, 0x4a4a8a, 0x8a8ad0, 0xd8dcff], sweep * 0.8 + 0.1, dx, dy)
        });
        // titanium leading edge
        c.line(FAN - 6.0, AX + s * 26.0, FAN - 2.0, AX + s * 99.0, 1.4, 0xe8ecff);
    }
    // fan outlet guide vanes in the bypass duct
    for s in [-1.0f32, 1.0] {
        c.line(150.0, AX + s * 56.0, 158.0, AX + s * 99.0, 2.0, 0x6a62b0);
    }
    for k in 0..4 {
        let x = LPC.0 + 2.0 + k as f32 * 10.0;
        let (r0, r1) = core(x);
        stage_bar(c, x, 4.0, r0, r1, true, t, &blade);
        stage_bar(c, x + 5.0, 3.0, r0, r1, false, t, &blade[..3]);
    }
    for k in 0..10 {
        let x = HPC.0 + k as f32 * 10.2;
        let (r0, r1) = core(x);
        let warm = [blade[0], blade[1], mix_warm(k), blade[3]];
        stage_bar(c, x, 4.0, r0, r1, true, t, &warm);
        stage_bar(c, x + 5.0, 3.0, r0, r1, false, t, &warm[..3]);
    }
    for k in 0..2 {
        let x = HPT.0 + k as f32 * 12.0;
        let (r0, r1) = core(x);
        stage_bar(c, x, 3.0, r0, r1, false, t, &hot[..3]);
        stage_bar(c, x + 4.0, 5.0, r0, r1, true, t, &hot);
    }
    for k in 0..7 {
        let x = LPT.0 + k as f32 * 13.5;
        let (r0, r1) = core(x);
        stage_bar(c, x, 3.0, r0, r1, false, t, &blade[..3]);
        stage_bar(c, x + 4.0, 6.0, r0, r1, true, t, &[0x5a3a5a, 0x8a5a6a, 0xc08a7a, 0xffc0a0]);
    }
}

fn mix_warm(k: usize) -> u32 {
    crate::gfx::mix(0xb0b0e0, 0xffb07a, k as f32 / 10.0)
}

fn shafts(c: &mut Canvas, t: f32) {
    // low pressure shaft: fan to low pressure turbine, inside the high pressure shaft
    c.rect_with(FAN, AX - 5.0, LPT.1 - FAN + 10.0, 10.0, |wx, _, dx, dy| {
        let spin = ((wx * 0.5 - t * 20.0).sin() * 0.5 + 0.5) * 0.5;
        ramp(&[0x3a1a7a, 0x6a2ac8, 0xa04aff, 0xd8a0ff], 0.3 + spin, dx, dy)
    });
    for s in [-1.0f32, 1.0] {
        c.rect_with(HPC.0, AX + if s < 0.0 { -14.0 } else { 6.0 }, HPT.1 - HPC.0, 8.0, |wx, _, dx, dy| {
            let spin = ((wx * 0.7 - t * 34.0).sin() * 0.5 + 0.5) * 0.5;
            ramp(&[0x0a5a6a, 0x1a8a9a, 0x3ac8d8, 0xa0f4ff], 0.3 + spin, dx, dy)
        });
    }
}

fn combustor(c: &mut Canvas, t: f32) {
    for s in [-1.0f32, 1.0] {
        let (y0, y1) = if s < 0.0 { (AX - 47.0, AX - 31.0) } else { (AX + 31.0, AX + 47.0) };
        c.rect_with(COMB.0, y0, COMB.1 - COMB.0, y1 - y0, |wx, wy, dx, dy| {
            let flick = ((wx * 0.4 + t * 18.0).sin() + (wy * 0.7 - t * 11.0).sin()) * 0.15;
            let u = ((wx - COMB.0) / (COMB.1 - COMB.0) * 1.2 + flick).clamp(0.0, 1.0);
            ramp(&HOT, 1.0 - (u - 0.45).abs(), dx, dy)
        });
        // the liner, peppered with cooling holes
        for (r, k) in [(47.0f32, 0), (31.0, 1)] {
            let y = AX + s * r;
            c.rect(COMB.0, y - 0.8, COMB.1 - COMB.0, 1.6, 0x8a4a5a);
            let mut x = COMB.0 + 2.0 + k as f32 * 2.0;
            while x < COMB.1 {
                c.rect(x, y - 0.4, 1.0, 0.8, 0x1a0c18);
                x += 4.0;
            }
        }
        // fuel nozzles, and the flame's glow
        c.rect(COMB.0 - 6.0, AX + s * 39.0 - 2.0, 8.0, 4.0, 0xc0c8e8);
        c.glow(COMB.0 + 22.0, AX + s * 39.0, 30.0, 0xff9a3a, 0.55 + 0.1 * (t * 13.0).sin());
        c.glow(COMB.0 + 18.0, AX + s * 39.0, 10.0, 0xfff4d0, 0.8);
    }
}

fn accessories(c: &mut Canvas, t: f32) {
    // the FADEC on the fan case, and the accessory gearbox with the starter generators on the core
    c.rect_with(200.0, AX - 124.0, 36.0, 12.0, |_, _, dx, dy| ramp(&[0x2a5a4a, 0x3a8a6a, 0x5ac08a], 0.5, dx, dy));
    for k in 0..4 {
        c.rect(204.0 + k as f32 * 8.0, AX - 121.0, 4.0, 6.0, if (t * 4.0 + k as f32).sin() > 0.0 { 0x7aff9a } else { 0x2a6a4a });
    }
    c.glow(218.0, AX - 118.0, 12.0, 0x5aff8a, 0.5);
    c.rect_with(176.0, AX + 54.0, 80.0, 10.0, |_, _, dx, dy| ramp(&METAL[1..4], 0.5, dx, dy));
    for gx in [192.0f32, 236.0] {
        c.ball(gx, AX + 62.0, 9.0, 9.0, &[0x1a6a8a, 0x2aa0c8, 0x6ae8ff]);
        c.glow(gx, AX + 62.0, 12.0, ELECTRIC, 0.6);
    }
}

fn bypass_flow(c: &mut Canvas, t: f32, rev: f32) {
    for i in 0..220u32 {
        let r = 54.0 + hash(i) * 44.0;
        let s = if i % 2 == 0 { -1.0 } else { 1.0 };
        let speed = 120.0 + hash(i + 3) * 40.0;
        let x = 40.0 + (hash(i + 9) * 600.0 + t * speed).rem_euclid(600.0);
        let (mut px, mut py) = (x, AX + s * r);
        if rev > 0.5 && x > 300.0 {
            // reversed: the fan air is turned out and forward through the cascades
            let u = (x - 300.0) / 300.0;
            px = 330.0 - u * 140.0;
            py = AX + s * (118.0 + u * 90.0);
        } else if x > BYPASS_EXIT {
            py = AX + s * (r * (1.0 - (x - BYPASS_EXIT) / 900.0));
        }
        c.rect(px, py, 3.0, 1.0, 0x9ad8ff);
        c.glow(px, py, 4.0, COLD[2], 0.3);
    }
}

fn core_flow(c: &mut Canvas, t: f32) {
    for i in 0..170u32 {
        let s = if i % 2 == 0 { -1.0 } else { 1.0 };
        let u = (hash(i + 21) + t * 0.22).rem_euclid(1.0);
        let x = SPLIT + u * (640.0 - SPLIT);
        let (r0, r1) = core(x.min(500.0));
        let r = r0 + (r1 - r0) * (0.15 + 0.7 * hash(i + 5));
        let r = if x > 500.0 { r * (1.0 - (x - 500.0) / 400.0) } else { r };
        // temperature along the core: cold air, compressed and warmer, burning, then cooling as it expands
        let heat = if x < COMB.0 {
            (x - SPLIT) / (COMB.0 - SPLIT) * 0.35
        } else if x < COMB.1 {
            0.35 + (x - COMB.0) / (COMB.1 - COMB.0) * 0.65
        } else {
            (1.0 - (x - COMB.1) / 300.0 * 0.7).max(0.3)
        };
        let col = if heat < 0.35 { crate::gfx::mix(COLD[2], 0xffd0a0, heat / 0.35) } else { HOT[((heat * 5.0) as usize).min(5)] };
        let k = 0.25 + heat * heat * 1.1;
        let y = AX + s * r;
        c.rect(x, y, 2.5, 1.0, col);
        c.glow(x, y, 2.0 + heat * 3.0, col, k);
    }
}
