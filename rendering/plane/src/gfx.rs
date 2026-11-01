// The canvas every scene draws on. Shapes are given in world units and filled pixel by pixel through a camera, so
// the art is redrawn crisp at every zoom instead of being scaled. Dithering is anchored to the world, so textures move
// with what they belong to when the camera pans.
//
// Two layers: `px`, the picture, and `light`, what glows. Light is added up in floating point, then blurred into
// `bloom` at half size. The page adds both on top of the picture, brighter than white on an HDR screen.

pub const BAYER: [[f32; 4]; 4] = [
    [0.03125, 0.53125, 0.15625, 0.65625],
    [0.78125, 0.28125, 0.90625, 0.40625],
    [0.21875, 0.71875, 0.09375, 0.59375],
    [0.96875, 0.46875, 0.84375, 0.34375],
];

#[inline]
pub fn bayer(dx: i32, dy: i32) -> f32 {
    BAYER[(dy & 3) as usize][(dx & 3) as usize]
}

#[inline]
pub fn rgb(c: u32) -> [f32; 3] {
    [((c >> 16) & 255) as f32, ((c >> 8) & 255) as f32, (c & 255) as f32]
}

#[inline]
pub fn pack(c: [f32; 3]) -> u32 {
    let k = |v: f32| v.clamp(0.0, 255.0) as u32;
    (k(c[0]) << 16) | (k(c[1]) << 8) | k(c[2])
}

pub fn mix(a: u32, b: u32, t: f32) -> u32 {
    let (a, b) = (rgb(a), rgb(b));
    pack([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t])
}

/// A color from a ramp at `t` (0 to 1), dithered between neighboring stops instead of blended: the pixel-art way.
#[inline]
pub fn ramp(stops: &[u32], t: f32, dx: i32, dy: i32) -> u32 {
    let n = stops.len();
    if n == 1 {
        return stops[0];
    }
    let u = t.clamp(0.0, 1.0) * (n - 1) as f32;
    let i = (u as usize).min(n - 2);
    if u - i as f32 > bayer(dx, dy) { stops[i + 1] } else { stops[i] }
}

/// 0xRRGGBB as the bytes R, G, B, A in memory (little endian), the order ImageData and textures read.
#[inline]
pub fn to_rgba(c: u32) -> u32 {
    0xff00_0000 | ((c & 0xff) << 16) | (c & 0xff00) | ((c >> 16) & 0xff)
}

pub struct Canvas {
    pub w: usize,
    pub h: usize,
    pub px: Vec<u32>,
    pub out: Vec<u32>,
    pub light: Vec<[f32; 3]>,
    pub glow: Vec<u32>,
    pub bloom: Vec<u32>,
    pub bw: usize,
    pub bh: usize,
    pub half: Vec<[f32; 3]>,
    pub gpu_bloom: bool,
    pub bloom_kernel: [f32; 20],
    tmp: Vec<[f32; 3]>,
    pub depth: Vec<f32>,
    pub ids: Vec<u8>,
    // camera: world point at the screen's center, and pixels per world unit
    pub cx: f32,
    pub cy: f32,
    pub z: f32,
    ox: i32,
    oy: i32,
    pub t: f32,
}

impl Canvas {
    pub fn new(w: usize, h: usize) -> Canvas {
        let (bw, bh) = (w.div_ceil(2), h.div_ceil(2));
        Canvas {
            w,
            h,
            px: vec![0; w * h],
            out: vec![0; w * h],
            light: vec![[0.0; 3]; w * h],
            glow: vec![0; w * h],
            bloom: vec![0; bw * bh],
            bw,
            bh,
            half: vec![[0.0; 3]; bw * bh],
            gpu_bloom: false,
            bloom_kernel: bloom_kernel(),
            tmp: vec![[0.0; 3]; bw * bh],
            depth: vec![0.0; w * h],
            ids: vec![0; w * h],
            cx: 0.0,
            cy: 0.0,
            z: 1.0,
            ox: 0,
            oy: 0,
            t: 0.0,
        }
    }

    pub fn camera(&mut self, cx: f32, cy: f32, z: f32) {
        self.cx = cx;
        self.cy = cy;
        self.z = z.max(0.05);
        self.ox = (cx * self.z - self.w as f32 / 2.0).round() as i32;
        self.oy = (cy * self.z - self.h as f32 / 2.0).round() as i32;
    }

    #[inline]
    pub fn sx(&self, x: f32) -> f32 {
        (x - self.cx) * self.z + self.w as f32 / 2.0
    }
    #[inline]
    pub fn sy(&self, y: f32) -> f32 {
        (y - self.cy) * self.z + self.h as f32 / 2.0
    }

    /// Fills every pixel whose center falls in the world box and for which `f` gives a color. `f` gets the world
    /// point and the world-anchored pixel, for dithering.
    pub fn fill<F: FnMut(f32, f32, i32, i32) -> Option<u32>>(&mut self, x0: f32, y0: f32, x1: f32, y1: f32, mut f: F) {
        let (w, h) = (self.w as i32, self.h as i32);
        let px0 = (self.sx(x0).floor() as i32).max(0);
        let px1 = (self.sx(x1).ceil() as i32).min(w);
        let py0 = (self.sy(y0).floor() as i32).max(0);
        let py1 = (self.sy(y1).ceil() as i32).min(h);
        let inv = 1.0 / self.z;
        let (hw, hh) = (self.w as f32 / 2.0, self.h as f32 / 2.0);
        for py in py0..py1 {
            let wy = (py as f32 + 0.5 - hh) * inv + self.cy;
            let row = py as usize * self.w;
            for px in px0..px1 {
                let wx = (px as f32 + 0.5 - hw) * inv + self.cx;
                if let Some(c) = f(wx, wy, px + self.ox, py + self.oy) {
                    self.px[row + px as usize] = c;
                }
            }
        }
    }

    /// Adds light: like `fill`, but `f` gives a color and a strength, summed into the glow layer.
    pub fn shine<F: FnMut(f32, f32, i32, i32) -> Option<(u32, f32)>>(&mut self, x0: f32, y0: f32, x1: f32, y1: f32, mut f: F) {
        let (w, h) = (self.w as i32, self.h as i32);
        let px0 = (self.sx(x0).floor() as i32).max(0);
        let px1 = (self.sx(x1).ceil() as i32).min(w);
        let py0 = (self.sy(y0).floor() as i32).max(0);
        let py1 = (self.sy(y1).ceil() as i32).min(h);
        let inv = 1.0 / self.z;
        let (hw, hh) = (self.w as f32 / 2.0, self.h as f32 / 2.0);
        for py in py0..py1 {
            let wy = (py as f32 + 0.5 - hh) * inv + self.cy;
            let row = py as usize * self.w;
            for px in px0..px1 {
                let wx = (px as f32 + 0.5 - hw) * inv + self.cx;
                if let Some((c, k)) = f(wx, wy, px + self.ox, py + self.oy) {
                    let c = rgb(c);
                    let l = &mut self.light[row + px as usize];
                    l[0] += c[0] * k;
                    l[1] += c[1] * k;
                    l[2] += c[2] * k;
                }
            }
        }
    }

    // ---- shapes, each with a paint: `fn(world x, world y, dither x, dither y) -> color`

    pub fn rect(&mut self, x: f32, y: f32, w: f32, h: f32, c: u32) {
        self.fill(x, y, x + w, y + h, |wx, wy, _, _| (wx >= x && wx < x + w && wy >= y && wy < y + h).then_some(c));
    }

    pub fn rect_with<F: FnMut(f32, f32, i32, i32) -> u32>(&mut self, x: f32, y: f32, w: f32, h: f32, mut p: F) {
        self.fill(x, y, x + w, y + h, |wx, wy, dx, dy| (wx >= x && wx < x + w && wy >= y && wy < y + h).then(|| p(wx, wy, dx, dy)));
    }

    pub fn poly(&mut self, pts: &[(f32, f32)], c: u32) {
        self.poly_with(pts, |_, _, _, _| c);
    }

    pub fn poly_with<F: FnMut(f32, f32, i32, i32) -> u32>(&mut self, pts: &[(f32, f32)], mut p: F) {
        let (mut x0, mut y0, mut x1, mut y1) = (f32::MAX, f32::MAX, f32::MIN, f32::MIN);
        for &(x, y) in pts {
            x0 = x0.min(x);
            y0 = y0.min(y);
            x1 = x1.max(x);
            y1 = y1.max(y);
        }
        self.fill(x0, y0, x1, y1, |wx, wy, dx, dy| inside(pts, wx, wy).then(|| p(wx, wy, dx, dy)));
    }

    /// A thick line with square-ish ends.
    pub fn line(&mut self, x0: f32, y0: f32, x1: f32, y1: f32, width: f32, c: u32) {
        let r = width / 2.0;
        self.fill(x0.min(x1) - r, y0.min(y1) - r, x0.max(x1) + r, y0.max(y1) + r, |wx, wy, _, _| {
            (seg_dist(wx, wy, x0, y0, x1, y1).0 <= r).then_some(c)
        });
    }

    // ---- light

    /// A soft round glow, strongest at its center.
    pub fn glow(&mut self, cx: f32, cy: f32, r: f32, c: u32, k: f32) {
        // light stays a light when you zoom in on it, instead of swelling to fill the screen
        let r = r.min(30.0 / self.z);
        self.shine(cx - r, cy - r, cx + r, cy + r, |wx, wy, _, _| {
            let d = ((wx - cx).powi(2) + (wy - cy).powi(2)).sqrt() / r;
            (d < 1.0).then(|| (c, k * (1.0 - d).powi(2)))
        });
    }

    /// Light along a path: a lit core, and pulses travelling along it at `speed` world units a second. The line
    /// itself is painted in `core` so it reads even without the glow.
    #[allow(clippy::too_many_arguments)]
    pub fn flow(&mut self, pts: &[(f32, f32)], width: f32, core: u32, light: u32, speed: f32, spacing: f32, k: f32) {
        let t = self.t;
        let r = (width / 2.0).max(0.6 / self.z);
        let mut start = 0.0;
        for p in pts.windows(2) {
            let ((ax, ay), (bx, by)) = (p[0], p[1]);
            let len = ((bx - ax).powi(2) + (by - ay).powi(2)).sqrt();
            let pad = r + 2.0 / self.z;
            self.fill(ax.min(bx) - r, ay.min(by) - r, ax.max(bx) + r, ay.max(by) + r, |wx, wy, _, _| {
                (seg_dist(wx, wy, ax, ay, bx, by).0 <= r).then_some(core)
            });
            let s0 = start;
            self.shine(ax.min(bx) - pad, ay.min(by) - pad, ax.max(bx) + pad, ay.max(by) + pad, |wx, wy, _, _| {
                let (d, u) = seg_dist(wx, wy, ax, ay, bx, by);
                if d > pad {
                    return None;
                }
                let s = s0 + u * len;
                let phase = ((s - t * speed) / spacing).rem_euclid(1.0);
                let pulse = (1.0 - phase * 3.0).max(0.0);
                let fall = (1.0 - d / pad).max(0.0);
                Some((light, k * fall * (0.35 + 1.4 * pulse)))
            });
            start += len;
        }
    }

    // ---- the end of a frame: light into glow and bloom

    pub fn finish(&mut self) {
        let (w, h, bw, bh) = (self.w, self.h, self.bw, self.bh);
        for (o, p) in self.out.iter_mut().zip(self.px.iter()) {
            *o = to_rgba(*p);
        }
        for (g, l) in self.glow.iter_mut().zip(self.light.iter()) {
            *g = to_rgba(pack(*l));
        }
        // half size, then a wide blur, twice for a soft falloff
        for y in 0..bh {
            for x in 0..bw {
                let mut s = [0.0; 3];
                for (dx, dy) in [(0, 0), (1, 0), (0, 1), (1, 1)] {
                    let (xx, yy) = ((2 * x + dx).min(w - 1), (2 * y + dy).min(h - 1));
                    let l = self.light[yy * w + xx];
                    s[0] += l[0];
                    s[1] += l[1];
                    s[2] += l[2];
                }
                self.half[y * bw + x] = [s[0] / 4.0, s[1] / 4.0, s[2] / 4.0];
            }
        }
        if self.gpu_bloom {
            return;
        }
        blur::<false>(&self.half, &mut self.tmp, bw, bh, &self.bloom_kernel);
        blur::<true>(&self.tmp, &mut self.half, bw, bh, &self.bloom_kernel);
        for (b, l) in self.bloom.iter_mut().zip(self.half.iter()) {
            *b = to_rgba(pack([l[0] * 1.2, l[1] * 1.2, l[2] * 1.2]));
        }
    }

    /// Darkens toward a color, for fades between scenes.
    pub fn fade(&mut self, to: u32, k: f32) {
        if k <= 0.0 {
            return;
        }
        for p in self.px.iter_mut() {
            *p = mix(*p, to, k);
        }
        for l in self.light.iter_mut() {
            let s = 1.0 - k;
            *l = [l[0] * s, l[1] * s, l[2] * s];
        }
    }
}

/// Gaussian weights followed by their sum, shared with the GPU blur.
fn bloom_kernel() -> [f32; 20] {
    let r: i32 = 9;
    let sigma = r as f32 / 2.0;
    let mut k = [0.0; 20];
    for (j, weight) in k[..19].iter_mut().enumerate() {
        let i = j as i32 - r;
        *weight = (-(i * i) as f32 / (2.0 * sigma * sigma)).exp();
    }
    k[19] = k[..19].iter().sum();
    k
}

fn blur<const VERTICAL: bool>(src: &[[f32; 3]], dst: &mut [[f32; 3]], w: usize, h: usize, kernel: &[f32; 20]) {
    let r = 9;
    let k = &kernel[..19];
    let n = kernel[19];
    let stride = if VERTICAL { w } else { 1 };
    let length = if VERTICAL { h } else { w };
    for y in 0..h {
        for x in 0..w {
            let mut s = [0.0; 3];
            let axis = if VERTICAL { y } else { x };
            if axis >= r as usize && axis + (r as usize) < length {
                let start = y * w + x - r as usize * stride;
                for (j, wgt) in k.iter().enumerate() {
                    let v = src[start + j * stride];
                    s[0] += v[0] * wgt;
                    s[1] += v[1] * wgt;
                    s[2] += v[2] * wgt;
                }
            } else {
                for (j, wgt) in k.iter().enumerate() {
                    let o = j as i32 - r;
                    let at = (axis as i32 + o).clamp(0, length as i32 - 1) as usize;
                    let i = if VERTICAL { at * w + x } else { y * w + at };
                    let v = src[i];
                    s[0] += v[0] * wgt;
                    s[1] += v[1] * wgt;
                    s[2] += v[2] * wgt;
                }
            }
            dst[y * w + x] = [s[0] / n, s[1] / n, s[2] / n];
        }
    }
}

/// Even-odd point in polygon.
pub fn inside(pts: &[(f32, f32)], x: f32, y: f32) -> bool {
    let mut c = false;
    let n = pts.len();
    let mut j = n - 1;
    for i in 0..n {
        let ((xi, yi), (xj, yj)) = (pts[i], pts[j]);
        if (yi > y) != (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi {
            c = !c;
        }
        j = i;
    }
    c
}

/// Distance from a point to a segment, and how far along the segment (0 to 1) the nearest point is.
#[inline]
pub fn seg_dist(px: f32, py: f32, ax: f32, ay: f32, bx: f32, by: f32) -> (f32, f32) {
    let (vx, vy) = (bx - ax, by - ay);
    let l2 = vx * vx + vy * vy;
    let u = if l2 > 0.0 { (((px - ax) * vx + (py - ay) * vy) / l2).clamp(0.0, 1.0) } else { 0.0 };
    let (qx, qy) = (ax + u * vx - px, ay + u * vy - py);
    ((qx * qx + qy * qy).sqrt(), u)
}

// A 3 x 5 pixel font for the screens and panels: rows top to bottom, three bits each, the left pixel highest.
fn glyph(ch: char) -> u16 {
    let rows: [u8; 5] = match ch.to_ascii_uppercase() {
        '0' => [7, 5, 5, 5, 7], '1' => [2, 6, 2, 2, 7], '2' => [7, 1, 7, 4, 7], '3' => [7, 1, 7, 1, 7], '4' => [5, 5, 7, 1, 1],
        '5' => [7, 4, 7, 1, 7], '6' => [7, 4, 7, 5, 7], '7' => [7, 1, 1, 1, 1], '8' => [7, 5, 7, 5, 7], '9' => [7, 5, 7, 1, 7],
        'A' => [2, 5, 7, 5, 5], 'B' => [6, 5, 6, 5, 6], 'C' => [3, 4, 4, 4, 3], 'D' => [6, 5, 5, 5, 6], 'E' => [7, 4, 6, 4, 7],
        'F' => [7, 4, 6, 4, 4], 'G' => [3, 4, 5, 5, 3], 'H' => [5, 5, 7, 5, 5], 'I' => [7, 2, 2, 2, 7], 'J' => [1, 1, 1, 5, 2],
        'K' => [5, 5, 6, 5, 5], 'L' => [4, 4, 4, 4, 7], 'M' => [5, 7, 7, 5, 5], 'N' => [6, 5, 5, 5, 5], 'O' => [2, 5, 5, 5, 2],
        'P' => [6, 5, 6, 4, 4], 'Q' => [2, 5, 5, 6, 3], 'R' => [6, 5, 6, 5, 5], 'S' => [3, 4, 2, 1, 6], 'T' => [7, 2, 2, 2, 2],
        'U' => [5, 5, 5, 5, 7], 'V' => [5, 5, 5, 5, 2], 'W' => [5, 5, 7, 7, 5], 'X' => [5, 5, 2, 5, 5], 'Y' => [5, 5, 2, 2, 2],
        'Z' => [7, 1, 2, 4, 7], '.' => [0, 0, 0, 0, 2], '/' => [1, 1, 2, 4, 4], '-' => [0, 0, 7, 0, 0], ':' => [0, 2, 0, 2, 0],
        _ => [0; 5],
    };
    rows.iter().fold(0u16, |m, r| (m << 3) | *r as u16)
}

impl Canvas {
    /// Pixel text, each font pixel `s` world units, top left at (x, y). Lit text also glows.
    pub fn text(&mut self, x: f32, y: f32, s: f32, msg: &str, c: u32, glow: f32) {
        for (i, ch) in msg.chars().enumerate() {
            let g = glyph(ch);
            let gx = x + i as f32 * 4.0 * s;
            for row in 0..5 {
                for col in 0..3 {
                    if g >> (14 - (row * 3 + col)) & 1 == 1 {
                        self.rect(gx + col as f32 * s, y + row as f32 * s, s, s, c);
                    }
                }
            }
            if glow > 0.0 && ch != ' ' {
                self.glow(gx + 1.5 * s, y + 2.5 * s, 4.0 * s, c, glow);
            }
        }
    }
}

/// A repeatable pseudo-random number in 0..1 for an integer: placement of stars, windows, clouds.
pub fn hash(i: u32) -> f32 {
    let mut x = i.wrapping_mul(0x9E37_79B9) ^ 0x85eb_ca6b;
    x ^= x >> 15;
    x = x.wrapping_mul(0x2c1b_3c6d);
    x ^= x >> 12;
    (x & 0xffff) as f32 / 65535.0
}
