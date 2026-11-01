// The fuselage cut across, looking forward: a composite barrel, nine seats abreast, bins overhead, the cargo hold
// below the floor. Conditioned air comes out of the ceiling outlets, falls across the seats in loops and leaves through
// grilles low on the sidewalls, down to the recirculation fans and filters under the floor.
//
// World is 400 x 400, the barrel's center at (200, 200).

use crate::exterior::{edge_glow, hash};
use crate::flows;
use crate::gfx::{ramp, Canvas};
use crate::pal::*;
use crate::Params;

const CX: f32 = 200.0;
const CY: f32 = 200.0;
const R: f32 = 170.0;
const FLOOR: f32 = 236.0;

fn ring(r: f32, a0: f32, a1: f32) -> Vec<(f32, f32)> {
    (0..=24).map(|k| { let a = a0 + (a1 - a0) * k as f32 / 24.0; (CX + a.cos() * r, CY + a.sin() * r) }).collect()
}

fn focus(i: i32) -> Vec<Vec<(f32, f32)>> {
    let rect = |x: f32, y: f32, w: f32, h: f32| vec![(x, y), (x + w, y), (x + w, y + h), (x, y + h)];
    match i {
        0 => vec![rect(36.0, 150.0, 12.0, 30.0), rect(352.0, 150.0, 12.0, 30.0)],
        1 => vec![rect(110.0, 84.0, 180.0, 14.0)],
        2 => vec![rect(150.0, 244.0, 100.0, 24.0)],
        3 => vec![rect(96.0, 274.0, 208.0, 64.0)],
        4 => vec![ring(R + 4.0, 0.0, std::f32::consts::TAU)],
        5 => vec![rect(60.0, 186.0, 280.0, 50.0)],
        _ => vec![],
    }
}

pub fn draw(c: &mut Canvas, p: &Params) {
    let t = c.t;
    // the night outside, at altitude
    c.vramp(-300.0, -300.0, 1000.0, 1000.0, &[0x05031a, 0x0c0830, 0x160d48, 0x241462, 0x3a1c78, 0x6a2a8a]);
    for i in 0..120u32 {
        c.rect(-300.0 + hash(i) * 1000.0, -300.0 + hash(i + 300) * 600.0, 1.0, 1.0, 0xe8e0ff);
    }
    shell(c);
    hold(c);
    cabin(c, t, p.anim);
    if p.flows & flows::AIR != 0 {
        air(c);
    }
    let pulse = 0.5 + 0.3 * (t * 3.2).sin();
    for poly in focus(p.focus) {
        edge_glow(c, &poly, HIGHLIGHT, pulse);
    }
}

fn shell(c: &mut Canvas) {
    // the barrel: carbon fiber plies, wound as one piece, shown as fine layers, with frames inside
    c.fill(CX - R - 8.0, CY - R - 8.0, CX + R + 8.0, CY + R + 8.0, |wx, wy, dx, dy| {
        let d = ((wx - CX).powi(2) + (wy - CY).powi(2)).sqrt();
        if d > R + 6.0 || d < R - 2.0 {
            return None;
        }
        let ply = ((d - R) * 2.0).rem_euclid(1.0);
        Some(if ply < 0.25 { 0x8a86c8 } else { ramp(&COMPOSITE, (d - R + 2.0) / 8.0, dx, dy) })
    });
    // the interior space
    c.fill(CX - R, CY - R, CX + R, CY + R, |wx, wy, dx, dy| {
        let d = ((wx - CX).powi(2) + (wy - CY).powi(2)).sqrt();
        (d < R - 2.0).then(|| ramp(&[0x1a1430, 0x221a3e, 0x2a204c], (wy - CY + R) / (2.0 * R), dx, dy))
    });
    for k in 0..36 {
        let a = k as f32 / 36.0 * std::f32::consts::TAU;
        c.line(CX + a.cos() * (R - 2.0), CY + a.sin() * (R - 2.0), CX + a.cos() * (R - 9.0), CY + a.sin() * (R - 9.0), 1.0, 0x3a3268);
    }
}

fn hold(c: &mut Canvas) {
    // the floor beams, then two cargo containers side by side, their contoured tops following the fuselage
    c.rect_with(30.0, FLOOR, 340.0, 8.0, |_, wy, dx, dy| ramp(&METAL[1..5], 1.0 - (wy - FLOOR) / 8.0, dx, dy));
    for x in [98.0f32, 202.0] {
        let pts = if x < 200.0 { vec![(x + 12.0, 276.0), (x + 100.0, 276.0), (x + 100.0, 336.0), (x, 336.0), (x, 296.0)] } else { vec![(x, 276.0), (x + 88.0, 276.0), (x + 100.0, 296.0), (x + 100.0, 336.0), (x, 336.0)] };
        c.poly_with(&pts, |wx, wy, dx, dy| {
            let ribs = (wx * 0.25).rem_euclid(1.0) < 0.15;
            if ribs { 0x8a8ab0 } else { ramp(&[0x3a3a5a, 0x5a5a80, 0x7a7aa6], 1.0 - (wy - 276.0) / 60.0, dx, dy) }
        });
        c.rect(x + 30.0, 296.0, 40.0, 10.0, LIVERY[3]);
    }
    // the recirculation fans and filters, under the floor between the beams
    c.rect(150.0, 246.0, 100.0, 20.0, 0x2a2848);
    for k in 0..4 {
        let x = 156.0 + k as f32 * 24.0;
        c.rect_with(x, 249.0, 18.0, 14.0, |wx, wy, _, _| if ((wx - wy) * 0.8).rem_euclid(2.0) < 0.6 { 0xe8f0ff } else { 0x9ab0e0 });
    }
}

fn cabin(c: &mut Canvas, t: f32, dim: f32) {
    // sidewalls with a window each side: the outside sky, tinted as the electrochromic glass darkens
    for x in [36.0f32, 352.0] {
        let glass = crate::gfx::mix(0x6a2a8a, 0x0a1a5a, dim.clamp(0.0, 1.0));
        c.rect(x - 2.0, 148.0, 16.0, 34.0, 0xd8d4ec);
        c.rect_with(x, 150.0, 12.0, 30.0, |_, wy, dx, dy| ramp(&[crate::gfx::mix(glass, 0x000000, 0.5), glass, crate::gfx::mix(glass, 0xffffff, 0.2)], 1.0 - (wy - 150.0) / 30.0, dx, dy));
        c.glow(x + 6.0, 165.0, 14.0, glass, 0.3 * (1.0 - dim));
    }
    // overhead bins and the ceiling, washed in the cabin's mood lighting
    let mood = crate::gfx::mix(0xff6ad5, 0x7a6aff, (t * 0.2).sin() * 0.5 + 0.5);
    for (x, w) in [(64.0f32, 80.0f32), (160.0, 80.0), (256.0, 80.0)] {
        c.rect_with(x, 100.0, w, 30.0, |_, wy, dx, dy| ramp(&[0xb8b4d8, 0xd8d4ec, 0xf0eeff], 1.0 - (wy - 100.0) / 30.0, dx, dy));
        c.rect(x, 128.0, w, 2.0, 0x8a86b0);
    }
    c.rect(110.0, 86.0, 180.0, 10.0, 0xe0dcf4);
    for k in 0..9 {
        c.rect(116.0 + k as f32 * 20.0, 94.0, 8.0, 2.0, 0x2a2848);
    }
    c.shine(60.0, 60.0, 340.0, 100.0, |_, _, _, _| Some((mood, 0.25)));
    c.glow(200.0, 80.0, 90.0, mood, 0.35);
    // nine seats across, 3-3-3, each with someone in it
    let seats = [74.0f32, 98.0, 122.0, 164.0, 188.0, 212.0, 254.0, 278.0, 302.0];
    for (i, &x) in seats.iter().enumerate() {
        c.rect_with(x - 10.0, 192.0, 20.0, 34.0, |_, wy, dx, dy| ramp(&[0x2a1a6a, 0x4a26a0, 0x6a3ac8], 1.0 - (wy - 192.0) / 34.0, dx, dy));
        c.rect(x - 11.0, 214.0, 22.0, 6.0, 0x3a2290);
        c.rect(x - 8.0, 196.0, 16.0, 3.0, 0xe8e4ff);
        let skin = [0xf0c8a0, 0xc08a60, 0x8a5a3a, 0xe0b090, 0x6a3a2a][(hash(i as u32 + 5) * 5.0) as usize % 5];
        let shirt = [0xff6a8a, 0x4ad8ff, 0xffd84a, 0x7aff8a, 0xff9a4a, 0xc88aff][(hash(i as u32 + 9) * 6.0) as usize % 6];
        c.rect(x - 7.0, 198.0, 14.0, 16.0, shirt);
        c.ball(x, 186.0, 6.0, 7.0, &[crate::gfx::mix(skin, 0x000000, 0.35), skin, crate::gfx::mix(skin, 0xffffff, 0.3)]);
        c.rect(x - 6.0, 179.0, 12.0, 3.0, [0x1a1010, 0x4a2a1a, 0xe0c060, 0x2a1a3a][i % 4]);
        // the seatback screen in front of them glows
        c.glow(x, 210.0, 6.0, 0x6ac8ff, 0.3);
    }
    c.rect_with(30.0, 226.0, 340.0, 10.0, |wx, _, dx, dy| ramp(&[0x2a1a4a, 0x3a2266, 0x5a2a7a], (wx * 0.1).sin() * 0.5 + 0.5, dx, dy));
}

fn air(c: &mut Canvas) {
    // each outlet sends air down in a loop across its seats and out low on the sidewall
    for (side, x0) in [(-1.0f32, 120.0f32), (1.0, 280.0)] {
        for k in 0..3 {
            let off = k as f32 * 22.0;
            let pts: Vec<(f32, f32)> = (0..=16)
                .map(|j| {
                    let u = j as f32 / 16.0;
                    let x = x0 + side * (u * (70.0 + off));
                    let y = 98.0 + (u * std::f32::consts::PI).sin() * 30.0 + u * u * 112.0;
                    (x, y)
                })
                .collect();
            c.flow(&pts, 1.2, 0x6a8ad8, AIR, 46.0, 30.0, 0.9);
        }
        // out through the sidewall grille, down to the floor
        let gx = if side < 0.0 { 46.0 } else { 354.0 };
        c.flow(&[(gx, 226.0), (gx, 250.0), (200.0 + side * 40.0, 256.0)], 1.4, 0x6a8ad8, AIR, 40.0, 24.0, 0.8);
    }
    // fresh and filtered air rising back up the risers to the ceiling
    for x in [56.0f32, 344.0] {
        c.flow(&[(200.0, 252.0), (x, 268.0), (x, 140.0), (if x < 200.0 { 120.0 } else { 280.0 }, 96.0)], 1.4, 0x8ab0ff, AIR_CORE, 40.0, 24.0, 0.9);
    }
}
