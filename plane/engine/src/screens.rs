// The flight deck's screens, drawn as 2D pixel art into small textures every frame, then wrapped onto the screens
// of the 3D flight deck by the diorama's shaders.

use crate::gfx::{hash, ramp, Canvas};
use crate::pal::*;
use std::cell::RefCell;

pub const PFD: usize = 0;
pub const ND: usize = 1;
pub const EICAS: usize = 2;
pub const MFD: usize = 3;
pub const TW: usize = 128;
pub const TH: usize = 104;

thread_local! {
    static TEX: RefCell<Vec<Vec<u32>>> = RefCell::new(vec![vec![0; TW * TH]; 4]);
    static SCRATCH: RefCell<Canvas> = RefCell::new(Canvas::new(TW, TH));
}

/// Redraws all four screens for this moment, with the thrust levers at `thrust`.
pub fn paint(t: f32, thrust: f32) {
    SCRATCH.with(|s| {
        let mut c = s.borrow_mut();
        c.t = t;
        c.camera(TW as f32 / 2.0, TH as f32 / 2.0, 1.0);
        for k in 0..4 {
            c.px.fill(SCREEN);
            match k {
                PFD => pfd(&mut c, 4.0, 4.0, t, thrust),
                ND => nd(&mut c, 4.0, 4.0, t),
                EICAS => eicas(&mut c, 4.0, 4.0, t, thrust),
                _ => mfd(&mut c, t),
            }
            TEX.with(|tx| tx.borrow_mut()[k].copy_from_slice(&c.px));
        }
    });
}

/// The color of screen `k` at (u, v), each 0 to 1 from the top left.
pub fn sample(k: usize, u: f32, v: f32) -> u32 {
    let x = ((u.clamp(0.0, 0.999)) * TW as f32) as usize;
    let y = ((v.clamp(0.0, 0.999)) * TH as f32) as usize;
    TEX.with(|tx| tx.borrow()[k][y * TW + x])
}

fn mfd(c: &mut Canvas, t: f32) {
    // the lower display: a hydraulic synoptic, three systems flowing
    for (k, col) in [HYD_L, HYD_C, HYD_R].iter().enumerate() {
        let x = 24.0 + k as f32 * 36.0;
        c.flow(&[(x, 92.0), (x, 30.0), (x + 20.0, 30.0)], 3.0, *col, *col, 30.0, 16.0, 0.6);
        c.rect(x - 6.0, 92.0, 12.0, 8.0, *col);
    }
    c.text(8.0, 8.0, 2.0, "HYD", SYM_WHITE, 0.0);
    c.text(8.0, 18.0, 1.0, if (t * 0.5).sin() > 0.0 { "PRESS 5000" } else { "QTY NORM" }, SYM_GREEN, 0.0);
}

pub fn pfd(c: &mut Canvas, x: f32, y: f32, t: f32, thrust: f32) {
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

pub fn nd(c: &mut Canvas, x: f32, y: f32, t: f32) {
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

pub fn eicas(c: &mut Canvas, x: f32, y: f32, t: f32, thrust: f32) {
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
