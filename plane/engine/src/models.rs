// Exploded 3D models of the parts the tour opens up: the turbofan, a main landing gear, the lithium-ion battery and a
// box of composite wing. Each part has a place it flies to when the model comes apart, and focus numbers follow the
// order of the parts here.

use crate::gfx::{ramp, Canvas};
use crate::pal::*;
use crate::three::{render, v, Material, Part};
use crate::Params;
use std::cell::RefCell;

const CARBON: [u32; 5] = [0x1a1838, 0x2e2c5c, 0x4a4a8a, 0x8a8ad0, 0xd8dcff];
const STEEL: [u32; 5] = [0x2a2a44, 0x4a4a6e, 0x7a7a9e, 0xb0b0cc, 0xe8e8f8];
const WARM: [u32; 4] = [0x4a4486, 0x7a76b8, 0xb0b0e0, 0xe8ecff];
const TURBINE: [u32; 4] = [0x5a3a5a, 0x8a5a6a, 0xc08a7a, 0xffc0a0];
const SHAFT: [u32; 4] = [0x3a1a7a, 0x6a2ac8, 0xa04aff, 0xd8a0ff];
const CELL: [u32; 4] = [0x2a3a8a, 0x4a6ad8, 0x8aa8ff, 0xd8e4ff];
const COPPER: [u32; 4] = [0x6a2a10, 0xb05a20, 0xff9a4a, 0xffd0a0];
const BOARD: [u32; 3] = [0x0a4a2a, 0x1a8a4a, 0x5aff8a];
const SKINC: [u32; 5] = [0x2a2a40, 0x3c3c58, 0x52526e, 0x7a7a9a, 0xa8a8c8];
const FUELM: [u32; 4] = [0x8a4214, 0xc06018, 0xff8a24, 0xffc06a];
const RUBBER: [u32; 4] = [0x120c1c, 0x231a30, 0x382c48, 0x4a3e5c];
const HOTM: [u32; 5] = [0x6a1020, 0xc0242a, 0xff5a1f, 0xff9a2a, 0xffd86a];

fn mat(ramp: &'static [u32]) -> Material {
    Material { ramp, glow: 0, glow_k: 0.0 }
}
fn lit(ramp: &'static [u32], glow: u32, k: f32) -> Material {
    Material { ramp, glow, glow_k: k }
}

fn engine() -> Vec<Part> {
    let mut booster = Part::new(mat(&STEEL), v(-0.55, 0.0, 0.0));
    for k in 0..3 {
        let x = -1.2 + k as f32 * 0.1;
        booster = booster.lathe(x, x + 0.06, 0.56, 0.56, 0.28, 0.28, 18);
    }
    let mut hpc = Part::new(mat(&WARM), v(-0.2, 0.0, 0.0));
    for k in 0..8 {
        let x = -0.8 + k as f32 * 0.09;
        let r = 0.5 - k as f32 * 0.015;
        hpc = hpc.lathe(x, x + 0.05, r, r, 0.24, 0.24, 18);
    }
    let mut hpt = Part::new(lit(&HOTM, 0xff5a2a, 0.35), v(0.6, 0.0, 0.0));
    for k in 0..2 {
        let x = 0.42 + k as f32 * 0.08;
        hpt = hpt.lathe(x, x + 0.05, 0.45, 0.45, 0.2, 0.2, 18);
    }
    let mut lpt = Part::new(mat(&TURBINE), v(1.0, 0.0, 0.0));
    for k in 0..5 {
        let x = 0.62 + k as f32 * 0.13;
        let r = 0.45 + k as f32 * 0.07;
        lpt = lpt.lathe(x, x + 0.07, r, r, 0.22, 0.22, 20);
    }
    vec![
        Part::new(mat(&SKIN), v(-1.4, 0.0, 0.0)).lathe(-2.0, -1.55, 0.02, 0.32, 0.0, 0.0, 16),
        Part::new(mat(&CARBON), v(-1.0, 0.0, 0.0)).lathe(-1.55, -1.35, 0.32, 0.32, 0.0, 0.0, 16).blades(-1.45, 0.32, 1.3, 0.3, 18, 0.5).spinning(2.5),
        Part::new(mat(&SKIN), v(0.0, 1.9, 0.0)).lathe(-1.7, -0.6, 1.42, 1.42, 1.34, 1.34, 28),
        booster,
        hpc,
        Part::new(lit(&HOT, 0xff8a3a, 0.9), v(0.25, 0.0, 0.0)).lathe(-0.05, 0.35, 0.52, 0.52, 0.3, 0.3, 20),
        hpt,
        lpt,
        Part::new(mat(&SHAFT), v(0.0, -1.2, 0.0)).lathe(-1.5, 1.4, 0.07, 0.07, 0.0, 0.0, 10).lathe(-0.8, 0.56, 0.14, 0.14, 0.1, 0.1, 12),
        Part::new(mat(&METAL), v(1.6, 0.0, 0.0)).lathe(1.35, 2.0, 0.35, 0.02, 0.0, 0.0, 16),
    ]
}

fn gear() -> Vec<Part> {
    let wheel = |p: Part, x: f32, z: f32| p.lathe(-0.18, 0.18, 0.45, 0.45, 0.2, 0.2, 18).at(v(x, -0.55, z));
    let brake = |p: Part, x: f32, z: f32| p.lathe(-0.14, 0.14, 0.3, 0.3, 0.12, 0.12, 14).at(v(x, -0.55, z));
    let mut left = Part::new(mat(&RUBBER), v(-1.0, 0.0, 0.0));
    let mut right = Part::new(mat(&RUBBER), v(1.0, 0.0, 0.0));
    let mut brakes = Part::new(lit(&HOTM, 0xff6a2a, 0.5), v(0.0, -0.7, 0.0));
    for z in [-0.6f32, 0.6] {
        left = wheel(left, -0.34, z);
        right = wheel(right, 0.34, z);
        brakes = brake(brake(brakes, -0.34, z), 0.34, z);
    }
    vec![
        Part::new(mat(&STEEL), v(0.0, 1.2, 0.0)).lathe(0.0, 1.5, 0.16, 0.16, 0.0, 0.0, 14).upright().at(v(0.0, 0.25, 0.0)),
        Part::new(mat(&METAL), v(0.0, 0.5, 0.0)).lathe(-0.55, 0.3, 0.1, 0.1, 0.0, 0.0, 12).upright(),
        Part::new(mat(&STEEL), v(0.6, 0.4, 0.0)).cube(v(0.17, 0.0, 0.0), 0.06, 0.36, 0.08).cube(v(0.17, -0.3, 0.0), 0.06, 0.3, 0.08),
        Part::new(mat(&STEEL), v(0.0, -0.2, 0.0)).cube(v(0.0, -0.55, 0.0), 0.18, 0.16, 1.6),
        left,
        right,
        brakes,
        Part::new(mat(&STEEL), v(-0.8, 0.4, 0.0)).cube(v(-0.4, 0.9, 0.0), 0.08, 1.1, 0.08),
    ]
}

fn battery() -> Vec<Part> {
    let mut cells = Part::new(lit(&CELL, 0x4a8aff, 0.15), v(0.0, 0.8, 0.0));
    for x in [-0.72f32, -0.24, 0.24, 0.72] {
        for z in [-0.27f32, 0.27] {
            cells = cells.cube(v(x, 0.0, z), 0.42, 0.8, 0.5);
        }
    }
    vec![
        Part::new(mat(&STEEL), v(0.0, -0.4, 0.0))
            .cube(v(0.0, -0.5, 0.0), 2.0, 0.08, 1.2)
            .cube(v(0.0, 0.0, -0.6), 2.0, 1.0, 0.06)
            .cube(v(0.0, 0.0, 0.6), 2.0, 1.0, 0.06)
            .cube(v(-1.0, 0.0, 0.0), 0.06, 1.0, 1.2)
            .cube(v(1.0, 0.0, 0.0), 0.06, 1.0, 1.2),
        Part::new(mat(&STEEL), v(0.0, 1.9, 0.0)).cube(v(0.0, 0.55, 0.0), 2.06, 0.08, 1.26),
        cells,
        Part::new(lit(&COPPER, 0xff9a4a, 0.2), v(0.0, 1.15, 0.0)).cube(v(0.0, 0.43, -0.27), 1.9, 0.04, 0.08).cube(v(0.0, 0.43, 0.27), 1.9, 0.04, 0.08),
        Part::new(lit(&BOARD, 0x5aff8a, 0.3), v(0.0, 1.45, 0.0)).cube(v(0.0, 0.48, 0.0), 1.2, 0.03, 0.5),
        Part::new(mat(&METAL), v(0.7, 0.0, 0.0)).lathe(1.0, 1.6, 0.08, 0.08, 0.05, 0.05, 10).at(v(0.0, 0.2, 0.0)),
    ]
}

fn wing() -> Vec<Part> {
    let mut ribs = Part::new(mat(&STEEL), v(0.0, 0.0, 0.0));
    for x in [-1.1f32, -0.37, 0.37, 1.1] {
        ribs = ribs.cube(v(x, 0.0, 0.0), 0.05, 0.68, 1.36);
    }
    vec![
        Part::new(mat(&SKINC), v(0.0, 1.1, 0.0)).cube(v(0.0, 0.36, 0.0), 2.6, 0.05, 1.4),
        Part::new(mat(&SKINC), v(0.0, -1.1, 0.0)).cube(v(0.0, -0.36, 0.0), 2.6, 0.05, 1.4),
        Part::new(mat(&SKINC), v(0.0, 0.0, -0.7)).cube(v(0.0, 0.0, -0.7), 2.6, 0.7, 0.06),
        Part::new(mat(&SKINC), v(0.0, 0.0, 0.7)).cube(v(0.0, 0.0, 0.7), 2.6, 0.7, 0.06),
        ribs,
        Part::new(lit(&FUELM, FUEL, 0.45), v(0.0, 0.0, 0.0)).cube(v(0.0, 0.0, 0.0), 2.4, 0.6, 1.3),
        Part::new(mat(&SKIN), v(0.0, 0.0, -1.0)).cube(v(0.0, 0.0, -1.0), 2.6, 0.25, 0.3),
        Part::new(mat(&SKIN), v(0.0, -0.3, 1.0)).cube(v(0.0, -0.05, 1.05), 2.6, 0.16, 0.5),
    ]
}

thread_local! {
    // built once per model, then only drawn
    static CACHE: RefCell<Option<(u32, Vec<Part>)>> = const { RefCell::new(None) };
}

pub fn draw(c: &mut Canvas, p: &Params) {
    let t = c.t;
    // a stage: a deep gradient, a floor grid in perspective, a spotlight
    c.clear(NIGHT);
    let (w, h) = (c.w as f32, c.h as f32);
    for y in 0..c.h {
        for x in 0..c.w {
            let (fx, fy) = (x as f32 / w, y as f32 / h);
            let r = ((fx - 0.5).powi(2) * 2.0 + (fy - 0.45).powi(2) * 3.0).sqrt();
            let mut col = ramp(&[0x0a0420, 0x140838, 0x220e52, 0x34146a, 0x4a1c80], 1.0 - r * 1.3, x as i32, y as i32);
            if fy > 0.72 {
                let depth = (fy - 0.72) / 0.28;
                let gx = ((fx - 0.5) / (0.2 + depth) * 10.0 + t * 0.0).rem_euclid(1.0);
                let gy = (1.0 / (0.05 + depth) * 0.6 - t * 0.5).rem_euclid(1.0);
                if gx < 0.06 || gy < 0.08 {
                    col = 0x5a2a9a;
                }
            }
            c.px[y * c.w + x] = col;
        }
    }
    let model = p.model;
    let (explode, yaw, pitch, focus) = (p.explode, p.yaw + (t * 0.3).sin() * 0.35, p.pitch, p.focus);
    CACHE.with(|cache| {
        let mut cache = cache.borrow_mut();
        if cache.as_ref().map(|(m, _)| *m) != Some(model) {
            let parts = match model {
                0 => engine(),
                1 => gear(),
                2 => battery(),
                _ => wing(),
            };
            *cache = Some((model, parts));
        }
        let parts = &cache.as_ref().unwrap().1;
        let scale = match model {
            0 => 0.55 - explode * 0.12,
            1 => 0.95 - explode * 0.2,
            2 => 0.85 - explode * 0.25,
            _ => 0.62 - explode * 0.14,
        };
        // the page passes the free part of the screen: its center offset in cx, cy and its size relative to the screen in zoom
        let size = c.w.min(c.h) as f32 * p.zoom.clamp(0.2, 1.5);
        render(c, parts, explode, yaw, pitch, scale, focus, p.cx, p.cy, size);
    });
}
