// A small software 3D renderer: flat-shaded triangles with a depth buffer, lit by one key light, shaded through each
// material's color ramp with dithering so it stays pixel art, and outlined where one part meets another.

use crate::gfx::{ramp, Canvas};

#[derive(Clone, Copy)]
pub struct V3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

pub const fn v(x: f32, y: f32, z: f32) -> V3 {
    V3 { x, y, z }
}

impl V3 {
    fn sub(self, o: V3) -> V3 {
        v(self.x - o.x, self.y - o.y, self.z - o.z)
    }
    fn add(self, o: V3) -> V3 {
        v(self.x + o.x, self.y + o.y, self.z + o.z)
    }
    fn cross(self, o: V3) -> V3 {
        v(self.y * o.z - self.z * o.y, self.z * o.x - self.x * o.z, self.x * o.y - self.y * o.x)
    }
    fn dot(self, o: V3) -> f32 {
        self.x * o.x + self.y * o.y + self.z * o.z
    }
    fn norm(self) -> V3 {
        let l = self.dot(self).sqrt().max(1e-6);
        v(self.x / l, self.y / l, self.z / l)
    }
    pub fn scale(self, k: f32) -> V3 {
        v(self.x * k, self.y * k, self.z * k)
    }
}

pub struct Material {
    pub ramp: &'static [u32],
    /// light it gives off, 0 for none
    pub glow: u32,
    pub glow_k: f32,
}

pub struct Part {
    pub tris: Vec<[V3; 3]>,
    pub mat: Material,
    /// where it moves to when the model is fully exploded
    pub apart: V3,
    /// a turn about the x axis per second, for fans and wheels
    pub spin: f32,
}

impl Part {
    pub fn new(mat: Material, apart: V3) -> Part {
        Part { tris: Vec::new(), mat, apart, spin: 0.0 }
    }

    fn quad(&mut self, a: V3, b: V3, c: V3, d: V3) {
        self.tris.push([a, b, c]);
        self.tris.push([a, c, d]);
    }

    /// A tube or solid of revolution along x, from x0 to x1, outer radius r0 to r1, inner radius i0 to i1 (0 for
    /// solid), with end caps.
    #[allow(clippy::too_many_arguments)]
    pub fn lathe(mut self, x0: f32, x1: f32, r0: f32, r1: f32, i0: f32, i1: f32, seg: usize) -> Part {
        let ring = |x: f32, r: f32, k: usize| {
            let a = k as f32 / seg as f32 * std::f32::consts::TAU;
            v(x, a.cos() * r, a.sin() * r)
        };
        for k in 0..seg {
            let n = k + 1;
            self.quad(ring(x0, r0, k), ring(x1, r1, k), ring(x1, r1, n), ring(x0, r0, n));
            if i0 > 0.0 || i1 > 0.0 {
                self.quad(ring(x0, i0, n), ring(x1, i1, n), ring(x1, i1, k), ring(x0, i0, k));
            }
            self.quad(ring(x0, i0, k), ring(x0, r0, k), ring(x0, r0, n), ring(x0, i0, n));
            self.quad(ring(x1, i1, n), ring(x1, r1, n), ring(x1, r1, k), ring(x1, i1, k));
        }
        self
    }

    /// A box centered at c.
    pub fn cube(mut self, c: V3, w: f32, h: f32, d: f32) -> Part {
        let (x0, x1, y0, y1, z0, z1) = (c.x - w / 2.0, c.x + w / 2.0, c.y - h / 2.0, c.y + h / 2.0, c.z - d / 2.0, c.z + d / 2.0);
        let p = |x, y, z| v(x, y, z);
        self.quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1));
        self.quad(p(x1, y0, z0), p(x0, y0, z0), p(x0, y1, z0), p(x1, y1, z0));
        self.quad(p(x0, y1, z1), p(x1, y1, z1), p(x1, y1, z0), p(x0, y1, z0));
        self.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1));
        self.quad(p(x1, y0, z1), p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1));
        self.quad(p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0));
        self
    }

    /// Blades around the x axis: `n` thin twisted plates from radius r0 to r1 at x.
    pub fn blades(mut self, x: f32, r0: f32, r1: f32, chord: f32, n: usize, twist: f32) -> Part {
        for k in 0..n {
            let a = k as f32 / n as f32 * std::f32::consts::TAU;
            let at = |r: f32, s: f32| {
                let tw = twist * (r - r0) / (r1 - r0).max(1e-3);
                let (ca, sa) = ((a + s * 0.12).cos(), (a + s * 0.12).sin());
                v(x + s * chord * (1.0 - tw), ca * r, sa * r)
            };
            self.quad(at(r0, -0.5), at(r0, 0.5), at(r1, 0.5), at(r1, -0.5));
        }
        self
    }

    /// Moves the whole part: a model is built at the origin and placed with this.
    pub fn at(mut self, o: V3) -> Part {
        for t in self.tris.iter_mut() {
            for p in t.iter_mut() {
                *p = p.add(o);
            }
        }
        self
    }

    /// Turns the part a quarter about z, so something built along x stands along y.
    pub fn upright(mut self) -> Part {
        for t in self.tris.iter_mut() {
            for p in t.iter_mut() {
                *p = v(-p.y, p.x, p.z);
            }
        }
        self
    }

    pub fn spinning(mut self, s: f32) -> Part {
        self.spin = s;
        self
    }
}

/// Draws the parts, each pushed `explode` of the way to its apart position, turned by yaw and pitch, filling the
/// screen region centered at (ox, oy) pixels from the screen's center, `size` pixels across. `focus` brightens one
/// part; the rest dim a little.
#[allow(clippy::too_many_arguments)]
pub fn render(c: &mut Canvas, parts: &[Part], explode: f32, yaw: f32, pitch: f32, scale: f32, focus: i32, ox: f32, oy: f32, size: f32) {
    let (w, h) = (c.w, c.h);
    c.depth.fill(f32::MAX);
    c.ids.fill(0);
    let (cy_, sy_) = (yaw.cos(), yaw.sin());
    let (cp, sp) = (pitch.cos(), pitch.sin());
    let light = v(-0.45, 0.75, 0.5).norm();
    let f = size * 1.6;
    let dist = 6.0;
    let (hw, hh) = (w as f32 / 2.0 + ox, h as f32 / 2.0 + oy);
    let t = c.t;
    for (pi, part) in parts.iter().enumerate() {
        let off = part.apart.scale(explode * explode * (3.0 - 2.0 * explode));
        let (sa, ca) = ((t * part.spin).sin(), (t * part.spin).cos());
        let lit_focus = focus < 0 || focus as usize == pi;
        for tri in &part.tris {
            let tr = tri.map(|p| {
                // spin about x, explode, scale, then yaw about y and pitch about x
                let p = v(p.x, p.y * ca - p.z * sa, p.y * sa + p.z * ca).add(off).scale(scale);
                let p = v(p.x * cy_ + p.z * sy_, p.y, -p.x * sy_ + p.z * cy_);
                v(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp)
            });
            let mut n = tr[1].sub(tr[0]).cross(tr[2].sub(tr[0])).norm();
            // the camera looks down +z from z = -dist; flip faces that point away so open tubes show both sides
            if n.z > 0.0 {
                n = n.scale(-1.0);
            }
            let lum = (n.dot(light).max(0.0) * 0.8 + 0.2).min(1.0);
            let lum = if lit_focus { lum } else { lum * 0.55 };
            let s: Vec<(f32, f32, f32)> = tr.iter().map(|p| {
                let z = p.z + dist;
                (hw + p.x * f / z, hh - p.y * f / z, z)
            }).collect();
            raster(c, &s, pi as u8 + 1, lum, &part.mat, lit_focus);
        }
    }
    // outlines where parts meet each other or the background
    let mut edge = vec![false; w * h];
    for y in 0..h {
        for x in 0..w {
            let i = y * w + x;
            let id = c.ids[i];
            let r = if x + 1 < w { c.ids[i + 1] } else { id };
            let d = if y + 1 < h { c.ids[i + w] } else { id };
            if id != r || id != d {
                edge[i] = true;
            }
        }
    }
    for (i, e) in edge.iter().enumerate() {
        if *e {
            c.px[i] = 0x0c0818;
        }
    }
}

fn raster(c: &mut Canvas, s: &[(f32, f32, f32)], id: u8, lum: f32, m: &Material, lit: bool) {
    let (w, h) = (c.w as i32, c.h as i32);
    let (a, b, d) = (s[0], s[1], s[2]);
    let area = (b.0 - a.0) * (d.1 - a.1) - (b.1 - a.1) * (d.0 - a.0);
    if area.abs() < 1e-6 {
        return;
    }
    let x0 = a.0.min(b.0).min(d.0).floor().max(0.0) as i32;
    let x1 = a.0.max(b.0).max(d.0).ceil().min(w as f32) as i32;
    let y0 = a.1.min(b.1).min(d.1).floor().max(0.0) as i32;
    let y1 = a.1.max(b.1).max(d.1).ceil().min(h as f32) as i32;
    let glow = if m.glow != 0 && lit { Some(crate::gfx::rgb(m.glow)) } else { None };
    for py in y0..y1 {
        for px in x0..x1 {
            let (x, y) = (px as f32 + 0.5, py as f32 + 0.5);
            let w0 = ((b.0 - x) * (d.1 - y) - (b.1 - y) * (d.0 - x)) / area;
            let w1 = ((d.0 - x) * (a.1 - y) - (d.1 - y) * (a.0 - x)) / area;
            let w2 = 1.0 - w0 - w1;
            if w0 < 0.0 || w1 < 0.0 || w2 < 0.0 {
                continue;
            }
            let z = w0 * a.2 + w1 * b.2 + w2 * d.2;
            let i = (py * w + px) as usize;
            if z < c.depth[i] {
                c.depth[i] = z;
                c.ids[i] = id;
                c.px[i] = ramp(m.ramp, lum, px, py);
                c.light[i] = match glow {
                    Some(g) => [g[0] * m.glow_k, g[1] * m.glow_k, g[2] * m.glow_k],
                    None => [0.0; 3],
                };
            }
        }
    }
}
