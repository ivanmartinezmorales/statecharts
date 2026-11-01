// The flight deck, seen from between the two seats: windscreen and head-up displays on top, the glareshield with the
// autopilot's mode control panel, four big displays across the main panel, the pedestal with the thrust levers, and
// the overhead panel above the windscreen (pan up to see it).
//
// World is 640 wide; y runs from -170 (top of the overhead) to 360 (the pedestal's foot).

use crate::exterior::{edge_glow, hash};
use crate::gfx::{ramp, Canvas};
use crate::pal::*;
use crate::Params;

const PANEL: [u32; 5] = [0x1a1830, 0x24203e, 0x302a4e, 0x3c3460, 0x4a4072];

/// Focus areas, by number: PFD, ND, EICAS, HUD, MCP, keypads, pedestal, overhead, yoke.
fn focus(i: i32) -> Vec<(f32, f32, f32, f32)> {
    match i {
        0 => vec![(22.0, 148.0, 120.0, 96.0), (498.0, 148.0, 120.0, 96.0)],
        1 => vec![(148.0, 148.0, 120.0, 96.0)],
        2 => vec![(372.0, 148.0, 120.0, 96.0)],
        3 => vec![(70.0, 28.0, 86.0, 62.0), (484.0, 28.0, 86.0, 62.0)],
        4 => vec![(196.0, 112.0, 248.0, 28.0)],
        5 => vec![(256.0, 300.0, 128.0, 60.0)],
        6 => vec![(262.0, 246.0, 116.0, 56.0)],
        7 => vec![(120.0, -168.0, 400.0, 150.0)],
        8 => vec![(46.0, 250.0, 90.0, 110.0), (504.0, 250.0, 90.0, 110.0)],
        _ => vec![],
    }
}

pub fn draw(c: &mut Canvas, p: &Params) {
    let t = c.t;
    let thrust = p.anim.clamp(0.0, 1.0);
    c.clear(PANEL[0]);
    overhead(c, t);
    windscreen(c, t, thrust);
    hud(c, t);
    glareshield(c, t);
    main_panel(c, t, thrust);
    pedestal(c, t, thrust);
    yokes(c);
    let pulse = 0.5 + 0.3 * (t * 3.2).sin();
    for (x, y, w, h) in focus(p.focus) {
        edge_glow(c, &[(x, y), (x + w, y), (x + w, y + h), (x, y + h)], HIGHLIGHT, pulse);
    }
}

fn bevel(c: &mut Canvas, x: f32, y: f32, w: f32, h: f32) {
    c.rect_with(x, y, w, h, |_, wy, dx, dy| ramp(&PANEL[1..], 1.0 - (wy - y) / h, dx, dy));
    c.rect(x, y, w, 1.0, PANEL[4]);
    c.rect(x, y + h - 1.0, w, 1.0, PANEL[0]);
}

fn screen(c: &mut Canvas, x: f32, y: f32, w: f32, h: f32) {
    c.rect(x - 3.0, y - 3.0, w + 6.0, h + 6.0, 0x0c0a18);
    c.rect(x - 2.0, y - 2.0, w + 4.0, 1.0, 0x3a3460);
    c.rect(x, y, w, h, SCREEN);
    // screens give off a little light of their own
    c.shine(x, y, x + w, y + h, |_, _, _, _| Some((0x4a6aff, 0.04)));
}

fn overhead(c: &mut Canvas, t: f32) {
    // the overhead panel: systems in columns, each with its switches and lights
    c.rect_with(100.0, -170.0, 440.0, 160.0, |_, wy, dx, dy| ramp(&[0x2a2448, 0x342c56, 0x403664], (wy + 170.0) / 160.0, dx, dy));
    let cols = ["ELEC", "HYD", "FUEL", "AIR", "ANTI ICE", "LIGHTS"];
    for (i, name) in cols.iter().enumerate() {
        let x = 112.0 + i as f32 * 70.0;
        c.rect(x, -162.0, 64.0, 144.0, 0x231e3e);
        c.text(x + 4.0, -158.0, 1.0, name, SYM_WHITE, 0.0);
        for row in 0..6 {
            for col in 0..3 {
                let (bx, by) = (x + 6.0 + col as f32 * 19.0, -146.0 + row as f32 * 21.0);
                let k = (i * 31 + row * 7 + col) as u32;
                // push-button annunciators: some lit ON in blue, some lit in amber, most dark
                let lit = hash(k);
                let col_on = if lit > 0.82 { SYM_AMBER } else if lit > 0.55 { 0x6ab8ff } else { 0x3a3458 };
                c.rect(bx, by, 14.0, 12.0, 0x141024);
                c.rect(bx + 1.0, by + 1.0, 12.0, 5.0, col_on);
                c.rect(bx + 1.0, by + 7.0, 12.0, 4.0, if lit > 0.3 { 0x2a3a6a } else { 0x2a2440 });
                if lit > 0.55 {
                    c.glow(bx + 7.0, by + 3.0, 7.0, col_on, 0.5);
                }
            }
        }
        // a few guarded switches and knobs at the foot of each column
        c.ball(x + 32.0, -26.0, 5.0, 5.0, &METAL[1..5]);
        c.line(x + 32.0, -26.0, x + 32.0 + (t * 0.3 + i as f32).cos() * 4.0, -30.0, 1.0, 0xffffff);
    }
    c.rect(100.0, -12.0, 440.0, 4.0, 0x0c0a18);
}

fn windscreen(c: &mut Canvas, t: f32, thrust: f32) {
    let sky: Vec<u32> = SKY[2..].to_vec();
    c.vramp(0.0, -8.0, 640.0, 120.0, &sky);
    // clouds sliding by, faster with more thrust
    for i in 0..12u32 {
        let x = (hash(i) * 900.0 - t * (8.0 + 60.0 * thrust)).rem_euclid(900.0) - 130.0;
        let y = 8.0 + hash(i + 40) * 50.0;
        c.ball(x, y, 26.0 + hash(i + 2) * 30.0, 6.0, &CLOUD);
    }
    // the runway ahead, in perspective, its center line rushing at you
    let horizon = 86.0;
    c.vramp(0.0, horizon, 640.0, 30.0, &GROUND[1..]);
    c.poly(&[(300.0, horizon), (340.0, horizon), (520.0, 116.0), (120.0, 116.0)], 0x3a2f55);
    let mut k = 0.0;
    while k < 1.0 {
        let u = (k + t * (0.15 + thrust * 0.9)).rem_euclid(1.0);
        let y = horizon + u * u * 30.0;
        let w = 1.0 + u * 6.0;
        c.rect(320.0 - w / 2.0, y, w, 1.0 + u * 3.0, 0xf0e8ff);
        for side in [-1.0f32, 1.0] {
            let x = 320.0 + side * (20.0 + u * u * 180.0);
            c.rect(x, y, 2.0, 1.0, 0xfff1a0);
            c.glow(x, y, 4.0 + u * 6.0, 0xfff1a0, 0.6);
        }
        k += 0.125;
    }
    // window frames
    for x in [0.0f32, 158.0, 314.0, 476.0, 634.0] {
        c.rect(x - 4.0, -8.0, 12.0, 120.0, 0x15122a);
    }
    c.rect(0.0, -8.0, 640.0, 6.0, 0x15122a);
}

fn hud(c: &mut Canvas, t: f32) {
    for x0 in [70.0f32, 484.0] {
        c.shine(x0, 28.0, x0 + 86.0, 90.0, |_, _, _, _| Some((0x88ffaa, 0.05)));
        c.rect(x0, 26.0, 86.0, 2.0, 0x3a3460);
        let g = SYM_GREEN;
        let cx = x0 + 43.0;
        // horizon, pitch ladder, flight path vector, speed and altitude boxes
        let roll = (t * 0.4).sin() * 0.06;
        for k in -2..=2 {
            let y = 60.0 + k as f32 * 12.0 + roll * 30.0;
            let w = if k == 0 { 70.0 } else { 22.0 };
            c.line(cx - w / 2.0, y - roll * w / 2.0, cx + w / 2.0, y + roll * w / 2.0, 1.0, g);
        }
        c.ellipse(cx, 56.0, 3.0, 3.0, g);
        c.ellipse(cx, 56.0, 1.8, 1.8, SCREEN);
        c.line(cx - 9.0, 56.0, cx - 3.0, 56.0, 1.0, g);
        c.line(cx + 3.0, 56.0, cx + 9.0, 56.0, 1.0, g);
        c.rect(x0 + 4.0, 52.0, 16.0, 8.0, SCREEN);
        c.text(x0 + 5.0, 54.0, 1.0, "152", g, 0.0);
        c.text(x0 + 64.0, 54.0, 1.0, "1500", g, 0.0);
        c.shine(x0, 28.0, x0 + 86.0, 90.0, |_, _, _, _| None);
        c.glow(cx, 56.0, 40.0, g, 0.25);
    }
}

fn glareshield(c: &mut Canvas, t: f32) {
    bevel(c, 0.0, 108.0, 640.0, 36.0);
    // the mode control panel: speed, heading, altitude and vertical speed windows, the mode buttons between them
    c.rect(196.0, 112.0, 248.0, 28.0, 0x2e2a4a);
    let windows = [(204.0, "152"), (262.0, "HDG 274"), (330.0, "FL370"), (396.0, "V/S"),];
    for (x, v) in windows {
        c.rect(x, 116.0, 38.0, 9.0, 0x0a0812);
        c.text(x + 2.0, 118.0, 1.0, v, SYM_AMBER, 0.35);
    }
    for k in 0..12 {
        let x = 202.0 + k as f32 * 20.0;
        let on = matches!(k, 1 | 4 | 7) || (k == 9 && (t * 2.0).sin() > 0.0);
        c.rect(x, 130.0, 12.0, 6.0, 0x4a4470);
        c.rect(x + 2.0, 131.0, 8.0, 1.5, if on { SYM_GREEN } else { 0x2a2440 });
        if on {
            c.glow(x + 6.0, 131.5, 6.0, SYM_GREEN, 0.6);
        }
    }
    for x in [244.0f32, 316.0, 384.0] {
        c.ball(x, 120.0, 5.0, 5.0, &METAL);
    }
    // the two EFIS control panels at the sides, and the master warning lights
    for x in [40.0f32, 520.0] {
        c.rect(x, 114.0, 80.0, 24.0, 0x2e2a4a);
        c.ball(x + 16.0, 126.0, 7.0, 7.0, &METAL[1..]);
        c.ball(x + 62.0, 126.0, 7.0, 7.0, &METAL[1..]);
        let warn = (t * 1.7).sin() > 0.6;
        c.rect(x + 30.0, 118.0, 20.0, 7.0, if warn { 0xff3040 } else { 0x5a1a24 });
        c.rect(x + 30.0, 128.0, 20.0, 7.0, 0x6a4a1a);
        if warn {
            c.glow(x + 40.0, 121.5, 12.0, 0xff3040, 1.2);
        }
    }
}

fn main_panel(c: &mut Canvas, t: f32, thrust: f32) {
    bevel(c, 0.0, 144.0, 640.0, 104.0);
    for (x, kind) in [(22.0f32, 0), (148.0, 1), (372.0, 2), (498.0, 0)] {
        screen(c, x, 148.0, 120.0, 96.0);
        match kind {
            0 => pfd(c, x, 148.0, t, thrust),
            1 => nd(c, x, 148.0, t),
            _ => eicas(c, x, 148.0, t, thrust),
        }
    }
    // between them: the standby instrument, the gear lever and the autobrake selector
    screen(c, 286.0, 152.0, 34.0, 34.0);
    c.rect_with(286.0, 152.0, 34.0, 17.0, |_, wy, dx, dy| ramp(&ADI_SKY, (wy - 152.0) / 17.0, dx, dy));
    c.rect_with(286.0, 169.0, 34.0, 17.0, |_, wy, dx, dy| ramp(&ADI_GROUND, (wy - 169.0) / 17.0, dx, dy));
    c.rect(296.0, 168.0, 14.0, 2.0, SYM_AMBER);
    c.rect(330.0, 152.0, 24.0, 60.0, 0x2e2a4a);
    c.rect(340.0, 160.0, 4.0, 30.0, METAL[3]);
    c.ball(342.0, 190.0, 6.0, 5.0, &[0x8a8a9a, 0xd0d0e0, 0xffffff]);
    for k in 0..3 {
        let on = k as f32 <= thrust * 3.0;
        c.rect(331.0 + k as f32 * 7.0, 200.0, 5.0, 5.0, if on { SYM_GREEN } else { 0x2a3a2a });
        if on {
            c.glow(333.0 + k as f32 * 7.0, 202.0, 5.0, SYM_GREEN, 0.7);
        }
    }
    c.ball(300.0, 222.0, 8.0, 8.0, &METAL);
    c.text(286.0, 236.0, 1.0, "AUTOBRK", SYM_WHITE, 0.0);
}

fn pfd(c: &mut Canvas, x: f32, y: f32, t: f32, thrust: f32) {
    let (cx, cy) = (x + 60.0, y + 50.0);
    let pitch = thrust * 10.0 + (t * 0.5).sin() * 1.5;
    let roll = (t * 0.35).sin() * 0.08;
    // attitude: sky and ground split by a tilted horizon
    c.rect_with(x + 24.0, y + 14.0, 72.0, 66.0, |wx, wy, dx, dy| {
        let h = (wy - cy - pitch) - (wx - cx) * roll;
        if h < 0.0 { ramp(&ADI_SKY, 1.0 + h / 40.0, dx, dy) } else { ramp(&ADI_GROUND, 1.0 - h / 40.0, dx, dy) }
    });
    for k in -3..=3 {
        let yy = cy + pitch + k as f32 * 8.0;
        let w = if k == 0 { 72.0 } else if k % 2 == 0 { 20.0 } else { 10.0 };
        c.line(cx - w / 2.0, yy - roll * w / 2.0, cx + w / 2.0, yy + roll * w / 2.0, 1.0, SYM_WHITE);
    }
    // the airplane symbol and flight director
    c.rect(cx - 16.0, cy - 1.0, 10.0, 3.0, 0x0a0a0a);
    c.rect(cx + 6.0, cy - 1.0, 10.0, 3.0, 0x0a0a0a);
    c.rect(cx - 15.0, cy, 8.0, 1.0, SYM_WHITE);
    c.rect(cx + 7.0, cy, 8.0, 1.0, SYM_WHITE);
    c.rect(cx - 1.0, cy - 1.0, 2.0, 2.0, SYM_WHITE);
    c.line(cx - 20.0, cy - 3.0, cx + 20.0, cy - 3.0, 1.0, SYM_MAGENTA);
    c.line(cx + 2.0, cy - 22.0, cx + 2.0, cy + 18.0, 1.0, SYM_MAGENTA);
    // speed tape, altitude tape, with their moving numbers
    for (tx, val, step) in [(x + 2.0, 140.0 + thrust * 40.0, 10.0), (x + 98.0, 1500.0 + thrust * 800.0, 100.0)] {
        c.rect(tx, y + 14.0, 20.0, 66.0, 0x2a2a3a);
        let off = (val / step).fract() * 10.0;
        for k in -3..=3 {
            let yy = cy + k as f32 * 10.0 + off;
            c.rect(tx + 14.0, yy, 6.0, 1.0, SYM_WHITE);
        }
        c.rect(tx, cy - 5.0, 20.0, 10.0, 0x000000);
        c.text(tx + 1.0, cy - 2.0, 1.0, &format!("{}", val as i32), SYM_WHITE, 0.3);
    }
    c.rect(x + 2.0, y + 40.0, 4.0, 2.0, SYM_MAGENTA);
    // mode annunciations along the top, heading arc along the bottom
    c.rect(x + 24.0, y + 2.0, 72.0, 9.0, 0x14141e);
    c.text(x + 26.0, y + 4.0, 1.0, if thrust > 0.5 { "THR REF" } else { "SPD" }, SYM_GREEN, 0.3);
    c.text(x + 62.0, y + 4.0, 1.0, "LNAV", SYM_GREEN, 0.3);
    c.rect_with(x + 30.0, y + 84.0, 60.0, 10.0, |wx, _, _, _| if ((wx - x + t * 3.0) * 0.5).rem_euclid(4.0) < 0.5 { SYM_WHITE } else { 0x2a2a3a });
    c.glow(cx, cy, 50.0, 0x4a8aff, 0.12);
}

fn nd(c: &mut Canvas, x: f32, y: f32, t: f32) {
    let (cx, cy) = (x + 60.0, y + 86.0);
    // weather radar returns: green, yellow, red, magenta at the cores
    for i in 0..5u32 {
        let (wx, wy) = (x + 20.0 + hash(i) * 80.0, y + 16.0 + hash(i + 9) * 40.0);
        let r = 8.0 + hash(i + 3) * 10.0;
        c.fill(wx - r, wy - r, wx + r, wy + r, |px, py, dx, dy| {
            let d = ((px - wx).powi(2) + (py - wy).powi(2)).sqrt() / r + ((px * 0.7).sin() + (py * 0.9).cos()) * 0.08;
            (d < 1.0 && (dx + dy) % 2 == 0).then(|| [0xff5cf0, 0xff3030, 0xffe040, 0x30c040][((d * 4.0) as usize).min(3)])
        });
    }
    // the compass arc, the route in magenta with its waypoints, the airplane at the bottom
    for k in 0..40 {
        let a = -1.1 + k as f32 * 2.2 / 40.0;
        let (sx, sy) = (cx + a.sin() * 70.0, cy - a.cos() * 70.0);
        c.rect(sx, sy, 1.0, if k % 5 == 0 { 3.0 } else { 1.5 }, SYM_WHITE);
    }
    let route = [(cx, cy), (cx + 6.0, cy - 30.0), (cx - 10.0, cy - 58.0), (cx + 24.0, cy - 80.0)];
    for w in route.windows(2) {
        c.line(w[0].0, w[0].1, w[1].0, w[1].1, 1.0, SYM_MAGENTA);
    }
    for (i, &(px, py)) in route.iter().enumerate().skip(1) {
        c.poly(&[(px, py - 3.0), (px + 3.0, py), (px, py + 3.0), (px - 3.0, py)], SYM_CYAN);
        c.text(px + 5.0, py - 2.0, 1.0, ["", "CAMRN", "NANTU", "50N50"][i], SYM_CYAN, 0.0);
    }
    c.glow(route[1].0, route[1].1, 8.0, SYM_MAGENTA, 0.8 + 0.4 * (t * 2.0).sin());
    c.poly(&[(cx, cy - 6.0), (cx + 4.0, cy + 4.0), (cx - 4.0, cy + 4.0)], SYM_WHITE);
    c.text(x + 4.0, y + 4.0, 1.0, "GS 482", SYM_WHITE, 0.0);
    c.text(x + 84.0, y + 4.0, 1.0, "TRK", SYM_GREEN, 0.0);
}

fn eicas(c: &mut Canvas, x: f32, y: f32, t: f32, thrust: f32) {
    // N1 and EGT for each engine as round dials, with the needle, a green arc and the number
    for (k, ex) in [x + 28.0, x + 74.0].iter().enumerate() {
        for (row, (val, label)) in [(0.25 + thrust * 0.7, "N1"), (0.2 + thrust * 0.55, "EGT")].iter().enumerate() {
            let (cx, cy) = (*ex, y + 24.0 + row as f32 * 34.0);
            let r = 13.0;
            for j in 0..24 {
                let a = std::f32::consts::PI * (0.75 + 1.25 * j as f32 / 24.0);
                let col = if j > 20 { 0xff3030 } else if j > 17 { SYM_AMBER } else { 0x4a4a5a };
                c.rect(cx + a.cos() * r, cy + a.sin() * r, 1.2, 1.2, col);
            }
            let wobble = (t * 3.0 + k as f32).sin() * 0.01;
            let a = std::f32::consts::PI * (0.75 + 1.25 * (val + wobble));
            c.fill(cx - r, cy - r, cx + r, cy + r, |px, py, _, _| {
                let ang = (py - cy).atan2(px - cx).rem_euclid(std::f32::consts::TAU);
                let d = ((px - cx).powi(2) + (py - cy).powi(2)).sqrt();
                let from = std::f32::consts::PI * 0.75;
                (d < r - 1.0 && ang >= from && ang <= a.max(from)).then_some(0x1c2a3a)
            });
            c.line(cx, cy, cx + a.cos() * r, cy + a.sin() * r, 1.2, SYM_WHITE);
            c.rect(cx + 2.0, cy + 3.0, 16.0, 7.0, 0x0a0a0a);
            c.text(cx + 3.0, cy + 4.0, 1.0, &format!("{:.1}", val * 100.0), SYM_WHITE, 0.2);
            c.text(cx - 18.0, cy - 14.0, 1.0, label, SYM_CYAN, 0.0);
        }
    }
    // the crew alert list and the fuel, flaps and gear summary
    c.rect(x + 4.0, y + 76.0, 112.0, 1.0, 0x3a3a4a);
    c.text(x + 6.0, y + 80.0, 1.0, "FUEL 48.2", SYM_WHITE, 0.0);
    c.text(x + 60.0, y + 80.0, 1.0, if thrust > 0.2 { "FLAPS 15" } else { "FLAPS UP" }, SYM_GREEN, 0.3);
    c.text(x + 6.0, y + 88.0, 1.0, "BRAKE TEMP", SYM_AMBER, if (t * 2.0).sin() > 0.0 { 0.4 } else { 0.0 });
}

fn pedestal(c: &mut Canvas, t: f32, thrust: f32) {
    c.rect_with(250.0, 244.0, 140.0, 130.0, |_, wy, dx, dy| ramp(&PANEL, 1.0 - (wy - 244.0) / 130.0, dx, dy));
    // speedbrake on the left, two thrust levers, flap lever on the right with its gate
    let lever_y = 296.0 - thrust * 40.0;
    c.rect(268.0, 250.0, 8.0, 46.0, 0x141024);
    c.rect(266.0, 262.0, 12.0, 6.0, METAL[2]);
    for x in [302.0f32, 330.0] {
        c.rect(x + 3.0, 250.0, 4.0, 50.0, 0x141024);
        c.line(x + 5.0, 300.0, x + 5.0, lever_y, 3.0, METAL[3]);
        c.rect_with(x - 4.0, lever_y - 6.0, 18.0, 8.0, |_, wy, dx, dy| ramp(&METAL, 1.0 - (wy - lever_y + 6.0) / 8.0, dx, dy));
        // the reverse thrust levers riding on top
        c.rect(x + 1.0, lever_y + 2.0, 8.0, 3.0, 0x6a6a8a);
    }
    c.glow(318.0, lever_y - 2.0, 18.0, HIGHLIGHT, 0.15 * thrust);
    c.rect(362.0, 250.0, 6.0, 46.0, 0x141024);
    for k in 0..6 {
        c.rect(358.0, 252.0 + k as f32 * 8.0, 4.0, 1.0, SYM_WHITE);
    }
    let fy = 252.0 + (if thrust > 0.1 { 3.0 } else { 0.0 }) * 8.0;
    c.rect(356.0, fy, 18.0, 6.0, 0xd8d8e8);
    // fuel control switches
    for x in [306.0f32, 334.0] {
        c.rect(x, 306.0, 6.0, 10.0, 0x1a1428);
        c.rect(x + 1.0, 304.0, 4.0, 6.0, 0xd03040);
    }
    // the two keypads and the lower display between them
    for x in [256.0f32, 352.0] {
        c.rect(x, 322.0, 32.0, 38.0, 0x1e1a34);
        for row in 0..5 {
            for col in 0..4 {
                let lit = hash((x as u32) * 7 + row * 4 + col) > 0.7 && (t * 1.3 + row as f32).sin() > 0.0;
                c.rect(x + 2.0 + col as f32 * 7.5, 324.0 + row as f32 * 7.0, 6.0, 5.0, if lit { 0x6a8aff } else { 0x3a3460 });
            }
        }
    }
    screen(c, 292.0, 322.0, 56.0, 38.0);
    // a hydraulic synoptic on it: three systems, three lines
    for (k, col) in [HYD_L, HYD_C, HYD_R].iter().enumerate() {
        let x = 300.0 + k as f32 * 16.0;
        c.flow(&[(x, 356.0), (x, 330.0), (x + 8.0, 330.0)], 1.5, *col, *col, 20.0, 10.0, 0.6);
    }
}

fn yokes(c: &mut Canvas) {
    for cx in [90.0f32, 550.0] {
        // the column rising from the floor, the wheel's two horns
        c.rect_with(cx - 5.0, 300.0, 10.0, 60.0, |_, wy, dx, dy| ramp(&METAL[..4], 1.0 - (wy - 300.0) / 60.0, dx, dy));
        c.rect_with(cx - 34.0, 280.0, 68.0, 16.0, |_, wy, dx, dy| ramp(&[0x1a1428, 0x2a2240, 0x3a3058, 0x4a4070], 1.0 - (wy - 280.0) / 16.0, dx, dy));
        c.rect(cx - 44.0, 262.0, 12.0, 34.0, 0x2a2240);
        c.rect(cx + 32.0, 262.0, 12.0, 34.0, 0x2a2240);
        c.rect(cx - 6.0, 284.0, 12.0, 8.0, 0x5a4a8a);
        // the autopilot disconnect and the mic switch
        c.rect(cx - 42.0, 264.0, 6.0, 3.0, 0xd03040);
        c.rect(cx + 36.0, 264.0, 6.0, 3.0, 0xd03040);
        c.text(cx - 9.0, 286.0, 1.0, "787", 0xc0b8ff, 0.0);
    }
}
