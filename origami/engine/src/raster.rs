//! A tiny software rasterizer with hard pixel edges: no anti-aliasing, on purpose.

use crate::geom::V2;

pub type Rgb = [f64; 3];

pub fn rgb(hex: u32) -> Rgb {
    [((hex >> 16) & 0xff) as f64, ((hex >> 8) & 0xff) as f64, (hex & 0xff) as f64]
}

pub fn mix(a: Rgb, b: Rgb, t: f64) -> Rgb {
    [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

pub fn scale(c: Rgb, k: f64) -> Rgb {
    [c[0] * k, c[1] * k, c[2] * k]
}

/// Stable per-pixel noise in [0, 1), the same formula the JS banner used.
pub fn hash(x: usize, y: usize) -> f64 {
    let n = (x as f64 * 127.1 + y as f64 * 311.7).sin() * 43758.5453;
    n - n.floor()
}

pub struct Canvas {
    pub size: usize,
    pub px: Vec<u8>,
}

impl Canvas {
    pub fn new(size: usize) -> Self {
        Self { size, px: vec![0; size * size * 4] }
    }

    fn index(&self, x: i64, y: i64) -> Option<usize> {
        let n = self.size as i64;
        (x >= 0 && y >= 0 && x < n && y < n).then(|| (y as usize * self.size + x as usize) * 4)
    }

    pub fn get(&self, x: i64, y: i64) -> Option<Rgb> {
        self.index(x, y).map(|i| [self.px[i] as f64, self.px[i + 1] as f64, self.px[i + 2] as f64])
    }

    pub fn set(&mut self, x: i64, y: i64, c: Rgb) {
        if let Some(i) = self.index(x, y) {
            self.px[i] = c[0].clamp(0.0, 255.0) as u8;
            self.px[i + 1] = c[1].clamp(0.0, 255.0) as u8;
            self.px[i + 2] = c[2].clamp(0.0, 255.0) as u8;
            self.px[i + 3] = 255;
        }
    }

    pub fn blend(&mut self, x: i64, y: i64, c: Rgb, alpha: f64) {
        if let Some(under) = self.get(x, y) {
            self.set(x, y, mix(under, c, alpha));
        }
    }

    /// Fills a polygon by sampling pixel centers (even-odd), calling `shade` for each covered pixel.
    pub fn fill(&mut self, pts: &[V2], mut shade: impl FnMut(&mut Self, i64, i64)) {
        if pts.len() < 3 {
            return;
        }
        let min_y = pts.iter().map(|p| p.y).fold(f64::INFINITY, f64::min).floor().max(0.0) as i64;
        let max_y = pts.iter().map(|p| p.y).fold(f64::NEG_INFINITY, f64::max).ceil().min(self.size as f64) as i64;
        let mut xs = Vec::with_capacity(8);
        for y in min_y..max_y {
            let cy = y as f64 + 0.5;
            xs.clear();
            for (i, a) in pts.iter().enumerate() {
                let b = pts[(i + 1) % pts.len()];
                if (a.y <= cy) != (b.y <= cy) {
                    xs.push(a.x + (cy - a.y) / (b.y - a.y) * (b.x - a.x));
                }
            }
            xs.sort_by(|a, b| a.total_cmp(b));
            for pair in xs.chunks_exact(2) {
                let from = (pair[0] - 0.5).ceil().max(0.0) as i64;
                let to = (pair[1] - 0.5).floor().min(self.size as f64 - 1.0) as i64;
                for x in from..=to {
                    shade(self, x, y);
                }
            }
        }
    }

    /// A one-pixel line. `dash` alternates on and off lengths in pixels; empty means solid.
    pub fn line(&mut self, a: V2, b: V2, dash: &[u32], c: Rgb, alpha: f64) {
        let (mut x, mut y) = (a.x.floor() as i64, a.y.floor() as i64);
        let (x1, y1) = (b.x.floor() as i64, b.y.floor() as i64);
        let (dx, dy) = ((x1 - x).abs(), -(y1 - y).abs());
        let (sx, sy) = (if x < x1 { 1 } else { -1 }, if y < y1 { 1 } else { -1 });
        let mut err = dx + dy;
        let period: u32 = dash.iter().sum();
        let mut step = 0u32;
        loop {
            if period == 0 || on_dash(dash, step % period) {
                self.blend(x, y, c, alpha);
            }
            if x == x1 && y == y1 {
                break;
            }
            let e2 = 2 * err;
            if e2 >= dy {
                err += dy;
                x += sx;
            }
            if e2 <= dx {
                err += dx;
                y += sy;
            }
            step += 1;
        }
    }

    pub fn disc(&mut self, c: V2, r: f64, color: Rgb) {
        let (x0, x1) = ((c.x - r).floor() as i64, (c.x + r).ceil() as i64);
        let (y0, y1) = ((c.y - r).floor() as i64, (c.y + r).ceil() as i64);
        for y in y0..=y1 {
            for x in x0..=x1 {
                let (px, py) = (x as f64 + 0.5 - c.x, y as f64 + 0.5 - c.y);
                if px * px + py * py <= r * r {
                    self.set(x, y, color);
                }
            }
        }
    }
}

fn on_dash(dash: &[u32], mut at: u32) -> bool {
    for (i, len) in dash.iter().enumerate() {
        if at < *len {
            return i % 2 == 0;
        }
        at -= len;
    }
    true
}
