// The diorama renderer, isometric: meshes built from boxes, solids of revolution, extrusions and tubes, drawn by a small
// software rasterizer with a depth buffer. Each face is lit by one warm key light and shaded through its material's
// color ramp with ordered dithering, so it stays pixel art; parts get dark outlines where they meet, the focused part
// a gold one; and a tilt-shift blur at the top and bottom of the frame makes it read as a miniature.

use crate::gfx::{ramp, rgb, Canvas};

#[derive(Clone, Copy, Default, Debug)]
pub struct V3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

pub const fn v(x: f32, y: f32, z: f32) -> V3 {
    V3 { x, y, z }
}

impl V3 {
    pub fn add(self, o: V3) -> V3 {
        v(self.x + o.x, self.y + o.y, self.z + o.z)
    }
    pub fn sub(self, o: V3) -> V3 {
        v(self.x - o.x, self.y - o.y, self.z - o.z)
    }
    pub fn mul(self, k: f32) -> V3 {
        v(self.x * k, self.y * k, self.z * k)
    }
    pub fn dot(self, o: V3) -> f32 {
        self.x * o.x + self.y * o.y + self.z * o.z
    }
    pub fn cross(self, o: V3) -> V3 {
        v(self.y * o.z - self.z * o.y, self.z * o.x - self.x * o.z, self.x * o.y - self.y * o.x)
    }
    pub fn len(self) -> f32 {
        self.dot(self).sqrt()
    }
    pub fn norm(self) -> V3 {
        self.mul(1.0 / self.len().max(1e-6))
    }
    pub fn lerp(self, o: V3, t: f32) -> V3 {
        self.add(o.sub(self).mul(t))
    }
}

/// A placement: scale (per axis), then rotation, then translation.
#[derive(Clone, Copy)]
pub struct Xf {
    r: [[f32; 3]; 3],
    s: V3,
    t: V3,
}

impl Xf {
    pub const ID: Xf = Xf { r: [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]], s: v(1.0, 1.0, 1.0), t: v(0.0, 0.0, 0.0) };
    pub fn at(t: V3) -> Xf {
        Xf { t, ..Xf::ID }
    }
    pub fn scale(mut self, s: f32) -> Xf {
        self.s = self.s.mul(s);
        self
    }
    /// Stretches x and y only: a unit square becomes a w by h panel.
    pub fn scale_xy(mut self, w: f32, h: f32) -> Xf {
        self.s = v(self.s.x * w, self.s.y * h, self.s.z);
        self
    }
    /// The same placement, shifted in the world.
    pub fn moved(mut self, by: V3) -> Xf {
        self.t = self.t.add(by);
        self
    }
    /// Moves along the already-turned axes: "a little to the right on this tilted panel".
    pub fn then_local(mut self, o: V3) -> Xf {
        let r = &self.r;
        self.t = self.t.add(v(
            r[0][0] * o.x + r[0][1] * o.y + r[0][2] * o.z,
            r[1][0] * o.x + r[1][1] * o.y + r[1][2] * o.z,
            r[2][0] * o.x + r[2][1] * o.y + r[2][2] * o.z,
        ));
        self
    }
    fn rot(mut self, m: [[f32; 3]; 3]) -> Xf {
        let a = self.r;
        let mut o = [[0.0; 3]; 3];
        for (i, row) in o.iter_mut().enumerate() {
            for (j, cell) in row.iter_mut().enumerate() {
                *cell = (0..3).map(|k| a[i][k] * m[k][j]).sum();
            }
        }
        self.r = o;
        self
    }
    /// Turns about the y (vertical) axis.
    pub fn yaw(self, a: f32) -> Xf {
        let (s, c) = a.sin_cos();
        self.rot([[c, 0.0, s], [0.0, 1.0, 0.0], [-s, 0.0, c]])
    }
    /// Turns about the x axis.
    pub fn roll(self, a: f32) -> Xf {
        let (s, c) = a.sin_cos();
        self.rot([[1.0, 0.0, 0.0], [0.0, c, -s], [0.0, s, c]])
    }
    /// Turns about the z axis.
    pub fn pitch(self, a: f32) -> Xf {
        let (s, c) = a.sin_cos();
        self.rot([[c, -s, 0.0], [s, c, 0.0], [0.0, 0.0, 1.0]])
    }
    pub fn apply(&self, p: V3) -> V3 {
        let r = &self.r;
        let p = v(p.x * self.s.x, p.y * self.s.y, p.z * self.s.z);
        v(
            r[0][0] * p.x + r[0][1] * p.y + r[0][2] * p.z + self.t.x,
            r[1][0] * p.x + r[1][1] * p.y + r[1][2] * p.z + self.t.y,
            r[2][0] * p.x + r[2][1] * p.y + r[2][2] * p.z + self.t.z,
        )
    }
}

/// What a material's shader sees for one pixel.
pub struct Px {
    /// the point on the part, in the mesh's own coordinates
    pub p: V3,
    /// how lit the face is, 0 to 1
    pub lum: f32,
    pub t: f32,
    pub dx: i32,
    pub dy: i32,
    pub anim: f32,
}

/// A shader returns the pixel's color and how much light it gives off.
pub type Shader = fn(&Px, &Mat) -> (u32, f32);

pub struct Mat {
    pub ramp: &'static [u32],
    /// color of the light it gives off (0 for none) and how strong
    pub glow: u32,
    pub k: f32,
    /// 0 is solid; 1 draws every other pixel, 2 one in four: see-through, the pixel-art way
    pub sheer: u8,
    pub shader: Option<Shader>,
}

pub const fn mat(ramp: &'static [u32]) -> Mat {
    Mat { ramp, glow: 0, k: 0.0, sheer: 0, shader: None }
}
pub const fn lit(ramp: &'static [u32], glow: u32, k: f32) -> Mat {
    Mat { ramp, glow, k, sheer: 0, shader: None }
}
pub const fn sheer(ramp: &'static [u32], level: u8) -> Mat {
    Mat { ramp, glow: 0, k: 0.0, sheer: level, shader: None }
}
pub const fn shaded(ramp: &'static [u32], shader: Shader) -> Mat {
    Mat { ramp, glow: 0, k: 0.0, sheer: 0, shader: Some(shader) }
}

#[derive(Clone, Copy)]
pub struct Tri {
    pub p: [V3; 3],
    pub mat: u8,
}

#[derive(Default)]
pub struct Mesh {
    pub tris: Vec<Tri>,
}

impl Mesh {
    pub fn new() -> Mesh {
        Mesh { tris: Vec::new() }
    }
    pub fn tri(&mut self, a: V3, b: V3, c: V3, m: u8) -> &mut Mesh {
        self.tris.push(Tri { p: [a, b, c], mat: m });
        self
    }
    pub fn quad(&mut self, a: V3, b: V3, c: V3, d: V3, m: u8) -> &mut Mesh {
        self.tri(a, b, c, m).tri(a, c, d, m)
    }
    /// A box centered at c with size s.
    pub fn cube(&mut self, c: V3, s: V3, m: u8) -> &mut Mesh {
        let (x0, x1, y0, y1, z0, z1) = (c.x - s.x / 2.0, c.x + s.x / 2.0, c.y - s.y / 2.0, c.y + s.y / 2.0, c.z - s.z / 2.0, c.z + s.z / 2.0);
        self.quad(v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1), m)
            .quad(v(x1, y0, z0), v(x0, y0, z0), v(x0, y1, z0), v(x1, y1, z0), m)
            .quad(v(x0, y1, z1), v(x1, y1, z1), v(x1, y1, z0), v(x0, y1, z0), m)
            .quad(v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1), m)
            .quad(v(x1, y0, z1), v(x1, y0, z0), v(x1, y1, z0), v(x1, y1, z1), m)
            .quad(v(x0, y0, z0), v(x0, y0, z1), v(x0, y1, z1), v(x0, y1, z0), m)
    }
    /// A solid or tube of revolution about the x axis from x0 to x1, outer radius r0 to r1, inner i0 to i1 (0 for
    /// solid), swept from angle a0 to a1 (a full turn, or less to cut it open), with the cut faces filled.
    #[allow(clippy::too_many_arguments)]
    pub fn lathe(&mut self, x0: f32, x1: f32, r0: f32, r1: f32, i0: f32, i1: f32, seg: usize, a0: f32, a1: f32, m: u8) -> &mut Mesh {
        let at = |x: f32, r: f32, k: usize| {
            let a = a0 + (a1 - a0) * k as f32 / seg as f32;
            v(x, a.cos() * r, a.sin() * r)
        };
        for k in 0..seg {
            let n = k + 1;
            self.quad(at(x0, r0, k), at(x1, r1, k), at(x1, r1, n), at(x0, r0, n), m);
            if i0 > 0.0 || i1 > 0.0 {
                self.quad(at(x0, i0, n), at(x1, i1, n), at(x1, i1, k), at(x0, i0, k), m);
            }
            self.quad(at(x0, i0, k), at(x0, r0, k), at(x0, r0, n), at(x0, i0, n), m);
            self.quad(at(x1, i1, n), at(x1, r1, n), at(x1, r1, k), at(x1, i1, k), m);
        }
        if (a1 - a0).abs() < std::f32::consts::TAU - 1e-3 {
            for k in [0, seg] {
                self.quad(at(x0, i0, k), at(x1, i1, k), at(x1, r1, k), at(x0, r0, k), m);
            }
        }
        self
    }
    /// A profile (x, r) pairs turned about the x axis: noses, nacelles, spinners.
    pub fn turn(&mut self, profile: &[(f32, f32)], seg: usize, a0: f32, a1: f32, m: u8) -> &mut Mesh {
        for w in profile.windows(2) {
            self.lathe(w[0].0, w[1].0, w[0].1, w[1].1, 0.0, 0.0, seg, a0, a1, m);
        }
        self
    }
    /// A flat convex outline in the x-z plane, extruded from y0 to y1.
    pub fn slab(&mut self, outline: &[(f32, f32)], y0: f32, y1: f32, m: u8) -> &mut Mesh {
        let n = outline.len();
        let top = |i: usize| v(outline[i].0, y1, outline[i].1);
        let bot = |i: usize| v(outline[i].0, y0, outline[i].1);
        for i in 1..n - 1 {
            self.tri(top(0), top(i), top(i + 1), m).tri(bot(0), bot(i + 1), bot(i), m);
        }
        for i in 0..n {
            let j = (i + 1) % n;
            self.quad(bot(i), bot(j), top(j), top(i), m);
        }
        self
    }
    /// A round tube along a path: pipes, struts, cables.
    pub fn tube(&mut self, path: &[V3], r: f32, seg: usize, m: u8) -> &mut Mesh {
        for w in path.windows(2) {
            let (a, b) = (w[0], w[1]);
            let d = b.sub(a).norm();
            let up = if d.y.abs() > 0.9 { v(1.0, 0.0, 0.0) } else { v(0.0, 1.0, 0.0) };
            let s = d.cross(up).norm();
            let u = s.cross(d);
            let ring = |c: V3, k: usize| {
                let ang = k as f32 / seg as f32 * std::f32::consts::TAU;
                c.add(s.mul(ang.cos() * r)).add(u.mul(ang.sin() * r))
            };
            for k in 0..seg {
                self.quad(ring(a, k), ring(b, k), ring(b, k + 1), ring(a, k + 1), m);
            }
        }
        self
    }
    /// Thin blades around the x axis at x, from radius r0 to r1.
    #[allow(clippy::too_many_arguments)]
    pub fn blades(&mut self, x: f32, r0: f32, r1: f32, chord: f32, n: usize, twist: f32, m: u8) -> &mut Mesh {
        for k in 0..n {
            let a = k as f32 / n as f32 * std::f32::consts::TAU;
            let at = |r: f32, s: f32| {
                let tw = twist * (r - r0) / (r1 - r0).max(1e-3);
                let ang = a + s * 0.14;
                v(x + s * chord * (1.0 - tw), ang.cos() * r, ang.sin() * r)
            };
            self.quad(at(r0, -0.5), at(r0, 0.5), at(r1, 0.5), at(r1, -0.5), m);
        }
        self
    }
    /// Adds another mesh, placed.
    pub fn put(&mut self, o: &Mesh, xf: &Xf) -> &mut Mesh {
        for t in &o.tris {
            self.tris.push(Tri { p: t.p.map(|p| xf.apply(p)), mat: t.mat });
        }
        self
    }
}

/// The isometric camera: an orthographic view down at a fixed angle, so parallel edges stay parallel and boxes draw
/// with the classic 2:1 pixel stair-steps. It turns about a target (yaw) and zooms by `dist`, which sets how many
/// world units fit in the frame, as a lens at that distance would.
#[derive(Clone, Copy)]
pub struct Cam {
    pub yaw: f32,
    pub pitch: f32,
    eye: V3,
    right: V3,
    up: V3,
    fwd: V3,
    /// screen pixels per world unit
    k: f32,
    hw: f32,
    hh: f32,
}

impl Cam {
    pub fn new(target: V3, yaw: f32, pitch: f32, dist: f32, w: usize, h: usize) -> Cam {
        let (sp, cp) = pitch.sin_cos();
        let (sy, cy) = yaw.sin_cos();
        let back = v(cp * sy, sp, cp * cy);
        // far back, so every depth is positive; orthographic, so the distance does not change the size
        let eye = target.add(back.mul(4000.0));
        let fwd = back.mul(-1.0);
        let right = fwd.cross(v(0.0, 1.0, 0.0)).norm();
        let up = right.cross(fwd);
        let k = h as f32 * 1.561 / dist.max(1.0);
        let mut cam = Cam { yaw, pitch, eye, right, up, fwd, k, hw: w as f32 / 2.0, hh: h as f32 / 2.0 };
        // keep the world's origin on a whole pixel, so edges do not shimmer as the camera pans
        if let Some((x, y, _)) = cam.project(v(0.0, 0.0, 0.0)) {
            cam.hw -= x - x.round();
            cam.hh -= y - y.round();
        }
        cam
    }
    pub fn eye(&self) -> V3 {
        self.eye
    }
    /// A world point on screen: pixel x, pixel y and depth.
    pub fn project(&self, p: V3) -> Option<(f32, f32, f32)> {
        let d = p.sub(self.eye);
        Some((self.hw + d.dot(self.right) * self.k, self.hh - d.dot(self.up) * self.k, d.dot(self.fwd)))
    }
    /// How many screen pixels one world unit covers: the same everywhere in an isometric view.
    pub fn scale_at(&self, _p: V3) -> f32 {
        self.k
    }
}

/// Everything the renderer needs for one frame.
pub struct Frame<'a> {
    pub cam: Cam,
    pub t: f32,
    pub anim: f32,
    pub light: V3,
    pub mats: &'a [Mat],
}

/// Draws a mesh placed by `xf` as part `id` (1 to 255), so outlines and focus can find it.
pub fn draw(c: &mut Canvas, fr: &Frame, mesh: &Mesh, xf: &Xf, id: u8) {
    let (w, h) = (c.w as i32, c.h as i32);
    let ambient = 0.22;
    for tri in &mesh.tris {
        let wp = tri.p.map(|p| xf.apply(p));
        let s = [fr.cam.project(wp[0]), fr.cam.project(wp[1]), fr.cam.project(wp[2])];
        let [Some(a), Some(b), Some(d)] = s else { continue };
        let area = (b.0 - a.0) * (d.1 - a.1) - (b.1 - a.1) * (d.0 - a.0);
        if area.abs() < 1e-4 {
            continue;
        }
        let mut n = wp[1].sub(wp[0]).cross(wp[2].sub(wp[0])).norm();
        // two-sided: cut-open parts show their insides
        if n.dot(fr.cam.eye().sub(wp[0])) < 0.0 {
            n = n.mul(-1.0);
        }
        let lum = (ambient + (1.0 - ambient) * n.dot(fr.light).max(0.0)).min(1.0);
        let m = &fr.mats[tri.mat as usize];
        let glow = if m.glow != 0 { Some(rgb(m.glow)) } else { None };
        let x0 = a.0.min(b.0).min(d.0).floor().max(0.0) as i32;
        let x1 = (a.0.max(b.0).max(d.0).ceil() as i32).min(w);
        let y0 = a.1.min(b.1).min(d.1).floor().max(0.0) as i32;
        let y1 = (a.1.max(b.1).max(d.1).ceil() as i32).min(h);
        for py in y0..y1 {
            for px in x0..x1 {
                if m.sheer == 1 && (px + py) % 2 == 0 || m.sheer == 2 && (px % 2 != 0 || py % 2 != 0) {
                    continue;
                }
                let (x, y) = (px as f32 + 0.5, py as f32 + 0.5);
                let w0 = ((b.0 - x) * (d.1 - y) - (b.1 - y) * (d.0 - x)) / area;
                let w1 = ((d.0 - x) * (a.1 - y) - (d.1 - y) * (a.0 - x)) / area;
                let w2 = 1.0 - w0 - w1;
                if w0 < 0.0 || w1 < 0.0 || w2 < 0.0 {
                    continue;
                }
                let z = w0 * a.2 + w1 * b.2 + w2 * d.2;
                let i = (py * w + px) as usize;
                if z >= c.depth[i] {
                    continue;
                }
                // see-through surfaces leave depth and ids alone, so what is behind still outlines; draw them last
                if m.sheer == 0 {
                    c.depth[i] = z;
                    c.ids[i] = id;
                }
                let (col, k) = match m.shader {
                    Some(sh) => {
                        let p = tri.p[0].mul(w0).add(tri.p[1].mul(w1)).add(tri.p[2].mul(w2));
                        sh(&Px { p, lum, t: fr.t, dx: px, dy: py, anim: fr.anim }, m)
                    }
                    None => (ramp(m.ramp, lum, px, py), m.k),
                };
                c.px[i] = col;
                if m.sheer > 0 {
                    continue;
                }
                c.light[i] = match glow {
                    Some(g) if k > 0.0 => [g[0] * k, g[1] * k, g[2] * k],
                    _ if k > 0.0 => {
                        let g = rgb(col);
                        [g[0] * k, g[1] * k, g[2] * k]
                    }
                    _ => [0.0; 3],
                };
            }
        }
    }
}

/// Starts a frame's 3D pass: nothing in front yet.
pub fn begin(c: &mut Canvas) {
    c.depth.fill(f32::MAX);
    c.ids.fill(0);
}

/// Ends it: a dark outline wherever one part meets another or the background, gold around the focused part, and the
/// tilt-shift blur above and below the middle of the frame.
pub fn finish(c: &mut Canvas, focus: u8, pulse: f32) {
    let (w, h) = (c.w, c.h);
    let mut edge = vec![0u8; w * h];
    for y in 0..h {
        for x in 0..w {
            let i = y * w + x;
            let id = c.ids[i];
            let r = if x + 1 < w { c.ids[i + 1] } else { id };
            let d = if y + 1 < h { c.ids[i + w] } else { id };
            if id != r || id != d {
                let near = c.depth[i].min(if x + 1 < w { c.depth[i + 1] } else { f32::MAX }).min(if y + 1 < h { c.depth[i + w] } else { f32::MAX });
                if near < f32::MAX {
                    edge[i] = if focus != 0 && (id == focus || r == focus || d == focus) { 2 } else { 1 };
                }
            }
        }
    }
    for (i, e) in edge.iter().enumerate() {
        match e {
            1 => c.px[i] = crate::gfx::mix(c.px[i], 0x0c0618, 0.75),
            2 => {
                c.px[i] = 0xffe27a;
                let l = &mut c.light[i];
                l[0] += 255.0 * pulse;
                l[1] += 226.0 * pulse;
                l[2] += 122.0 * pulse;
            }
            _ => {}
        }
    }
    tilt_shift(c);
}

fn tilt_shift(c: &mut Canvas) {
    let (w, h) = (c.w, c.h);
    let src = c.px.clone();
    for y in 1..h - 1 {
        let off = ((y as f32 / h as f32 - 0.52).abs() * 2.0 - 0.5).max(0.0) / 0.5;
        if off <= 0.0 {
            continue;
        }
        let k = (off * 0.7).min(0.7);
        for x in 1..w - 1 {
            let i = y * w + x;
            let mut s = [0.0f32; 3];
            for j in [i - 1, i + 1, i - w, i + w] {
                let p = rgb(src[j]);
                s[0] += p[0];
                s[1] += p[1];
                s[2] += p[2];
            }
            let me = rgb(src[i]);
            let b = [s[0] / 4.0, s[1] / 4.0, s[2] / 4.0];
            c.px[i] = crate::gfx::pack([me[0] + (b[0] - me[0]) * k, me[1] + (b[1] - me[1]) * k, me[2] + (b[2] - me[2]) * k]);
        }
    }
}

#[allow(clippy::too_many_arguments)]
/// A flow of light along a path in the world: projected, then drawn as a glowing line on screen.
pub fn flow(c: &mut Canvas, cam: &Cam, path: &[V3], width: f32, core: u32, light: u32, speed: f32, k: f32) {
    let pts: Vec<(f32, f32)> = path.iter().filter_map(|p| cam.project(*p).map(|(x, y, _)| (x, y))).collect();
    if pts.len() < 2 {
        return;
    }
    let s = cam.scale_at(path[0]);
    let save = (c.cx, c.cy, c.z);
    c.camera(c.w as f32 / 2.0, c.h as f32 / 2.0, 1.0);
    c.flow(&pts, (width * s).max(1.0), core, light, speed * s, (6.0 * s).max(10.0), k);
    c.camera(save.0, save.1, save.2);
}

/// A point of light in the world.
pub fn spark(c: &mut Canvas, cam: &Cam, p: V3, r: f32, col: u32, k: f32) {
    if let Some((x, y, _)) = cam.project(p) {
        let s = cam.scale_at(p);
        let save = (c.cx, c.cy, c.z);
        c.camera(c.w as f32 / 2.0, c.h as f32 / 2.0, 1.0);
        c.rect(x - 0.5, y - 0.5, 1.0, 1.0, col);
        c.glow(x, y, (r * s).clamp(2.0, 40.0), col, k);
        c.camera(save.0, save.1, save.2);
    }
}
