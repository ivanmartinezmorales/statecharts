// The things every diorama shares: the room they float in (a sunset with drifting lights, turning with the camera)
// and the plinth each one stands on.

use crate::d3::{Cam, Mesh, v};
use crate::gfx::{hash, ramp, Canvas};
use crate::pal::*;

/// The backdrop: a banded sunset that turns as the camera orbits, soft bokeh lights and a few stars.
pub fn room(c: &mut Canvas, cam: &Cam, t: f32) {
    let (w, h) = (c.w, c.h);
    let pitch = cam.pitch;
    let turn = cam.yaw;
    let waves: Vec<f32> = (0..w).map(|x| (x as f32 / w as f32 * 3.0 + turn * 2.0).sin() * 0.03).collect();
    for y in 0..h {
        // looking down at a diorama shows more of the dark top of the sky
        let u = (y as f32 / h as f32 + 0.35 - pitch * 0.45).clamp(0.0, 1.0);
        for (x, wave) in waves.iter().enumerate() {
            let wave = wave + u;
            c.px[y * w + x] = ramp(&SKY, wave.clamp(0.0, 1.0), x as i32, y as i32);
        }
    }
    let scale = h as f32 / 270.0;
    for i in 0..26u32 {
        let x = ((hash(i) - turn * 0.25).rem_euclid(1.0)) * w as f32;
        let y = (hash(i + 40) * 0.8 + pitch * 0.2) * h as f32;
        let r = (6.0 + hash(i + 80) * 22.0) * scale;
        let col = [0xff6ad5, 0xffc65e, 0x5af2ff, 0xc88aff][(i % 4) as usize];
        let tw = 0.5 + 0.5 * (t * (0.3 + hash(i + 5)) + i as f32).sin();
        let save = (c.cx, c.cy, c.z);
        c.camera(w as f32 / 2.0, h as f32 / 2.0, 1.0);
        c.glow(x, y, r, col, 0.12 + 0.1 * tw);
        if i % 3 == 0 {
            c.rect(x, y * 0.6, 1.0, 1.0, 0xfff2ff);
        }
        c.camera(save.0, save.1, save.2);
    }
}

/// A plinth: a slab with its top at y = 0, a darker lip, and a brass trim line, w along x and d along z.
pub fn plinth(m: &mut Mesh, w: f32, d: f32, h: f32, top: u8, side: u8, trim: u8) {
    m.cube(v(0.0, -h * 0.35, 0.0), v(w, h * 0.7, d), side);
    m.cube(v(0.0, -h * 0.72, 0.0), v(w + 1.2, h * 0.08, d + 1.2), trim);
    m.cube(v(0.0, -h * 0.88, 0.0), v(w + 2.0, h * 0.24, d + 2.0), side);
    // the top surface sits a hair above the slab, so it can carry its own shader
    m.quad(v(-w / 2.0, 0.01, d / 2.0), v(w / 2.0, 0.01, d / 2.0), v(w / 2.0, 0.01, -d / 2.0), v(-w / 2.0, 0.01, -d / 2.0), top);
}

/// Ramps for plinth sides and trim, shared.
pub const WOOD: [u32; 5] = [0x1e0e2a, 0x2c1438, 0x3c1c48, 0x4e2658, 0x60306a];
pub const BRASS: [u32; 4] = [0x6a3a10, 0xb06a1a, 0xffb84a, 0xfff0b0];
