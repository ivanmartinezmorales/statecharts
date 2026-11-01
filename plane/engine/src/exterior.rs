// The opening shot: a 787-9 on the runway at sunset, from its left side. World is 960 x 540; the airplane is drawn
// in its own meters (x aft from the nose tip, y up from the fuselage centerline) at 8.4 world units to the meter.

use crate::gfx::{inside, ramp, seg_dist, Canvas};
use crate::pal::*;
use crate::Params;

pub const NX: f32 = 760.0;
pub const CY: f32 = 434.0;
pub const S: f32 = 8.4;
const R: f32 = 2.885; // fuselage radius, meters
const RUNWAY: f32 = -5.49; // the runway, meters below the centerline

#[inline]
fn at(mx: f32, my: f32) -> (f32, f32) {
    (NX - mx * S, CY - my * S)
}
fn pts(m: &[(f32, f32)]) -> Vec<(f32, f32)> {
    m.iter().map(|&(x, y)| at(x, y)).collect()
}

pub fn hash(i: u32) -> f32 {
    let mut x = i.wrapping_mul(0x9E37_79B9) ^ 0x85eb_ca6b;
    x ^= x >> 15;
    x = x.wrapping_mul(0x2c1b_3c6d);
    x ^= x >> 12;
    (x & 0xffff) as f32 / 65535.0
}

/// The fuselage's side outline in meters: a rounded nose, a long constant section, a tail cone that sweeps up.
pub fn fuselage() -> Vec<(f32, f32)> {
    let mut top = Vec::new();
    let mut bottom = Vec::new();
    let mut x: f32 = 0.0;
    while x <= 62.8 {
        let t = if x < 7.2 {
            R * (1.0 - (1.0 - x / 7.2).powi(2)).sqrt()
        } else if x < 44.0 {
            R
        } else {
            R - (x - 44.0) / 18.8 * 1.5
        };
        let b = if x < 5.0 {
            -R * (1.0 - (1.0 - x / 5.0).powi(2)).sqrt()
        } else if x < 40.0 {
            -R
        } else {
            let u = (x - 40.0) / 22.8;
            -R + u.powf(1.3) * 3.85
        };
        top.push((x, t));
        bottom.push((x, b));
        x += 0.4;
    }
    top.extend(bottom.into_iter().rev());
    top
}

const WING: [(f32, f32); 7] = [(20.0, -1.6), (23.0, -2.3), (41.5, 0.1), (46.5, 1.7), (45.0, 1.85), (34.5, -0.5), (27.5, -1.9)];
const FIN: [(f32, f32); 5] = [(47.5, 2.6), (51.0, 2.9), (59.6, 11.5), (62.9, 11.5), (62.6, 1.6)];
const STAB: [(f32, f32); 5] = [(53.0, 0.9), (56.0, 1.35), (61.6, 2.4), (62.4, 2.0), (59.0, 0.6)];

/// The parts the tour can light up, by focus number.
pub fn part(i: i32) -> Option<Vec<(f32, f32)>> {
    Some(match i {
        0 => fuselage(),
        1 => WING.to_vec(),
        2 => (0..=20).map(|k| { let a = std::f32::consts::PI * (0.5 + k as f32 / 20.0); (4.2 + 4.2 * a.cos(), 2.6 * a.sin()) }).collect(),
        3 => FIN.to_vec(),
        4 => vec![(15.6, -2.0), (23.6, -2.0), (25.6, -3.6), (23.6, -5.3), (15.6, -5.3)],
        _ => return None,
    })
}

pub fn draw(c: &mut Canvas, p: &Params) {
    let t = c.t;
    c.clear(GROUND[0]);
    sky(c, t);
    city(c, t);
    runway(c, t);
    airplane(c, t, p.anim);
    if let Some(m) = part(p.focus) {
        edge_glow(c, &pts(&m), HIGHLIGHT, 0.45 + 0.25 * (t * 3.0).sin());
    }
}

/// A pulsing line of light around a shape: what the tour is pointing at.
pub fn edge_glow(c: &mut Canvas, poly: &[(f32, f32)], col: u32, k: f32) {
    let (mut x0, mut y0, mut x1, mut y1) = (f32::MAX, f32::MAX, f32::MIN, f32::MIN);
    for &(x, y) in poly {
        x0 = x0.min(x);
        y0 = y0.min(y);
        x1 = x1.max(x);
        y1 = y1.max(y);
    }
    let reach = 3.0 / c.z;
    let n = poly.len();
    c.shine(x0 - reach, y0 - reach, x1 + reach, y1 + reach, |wx, wy, _, _| {
        let mut d = f32::MAX;
        for i in 0..n {
            let (a, b) = (poly[i], poly[(i + 1) % n]);
            d = d.min(seg_dist(wx, wy, a.0, a.1, b.0, b.1).0);
        }
        (d < reach).then(|| (col, k * (1.0 - d / reach)))
    });
}

fn sky(c: &mut Canvas, t: f32) {
    let sky: Vec<u32> = SKY.to_vec();
    c.vramp(-900.0, -900.0, 2760.0, 1330.0, &sky);
    // stars in the violet, twinkling
    for i in 0..160u32 {
        let (x, y) = (-400.0 + hash(i) * 1760.0, -300.0 + hash(i + 999) * 360.0);
        let tw = 0.5 + 0.5 * (t * (1.0 + hash(i + 7) * 3.0) + i as f32).sin();
        c.rect(x, y, 1.0 / c.z.max(1.0), 1.0 / c.z.max(1.0), 0xfff2ff);
        if i % 3 == 0 {
            c.glow(x, y, 3.0, 0xffd8ff, 0.4 * tw);
        }
    }
    // the sun on the horizon
    c.glow(190.0, 400.0, 160.0, 0xff8a4a, 0.55);
    c.ball(190.0, 400.0, 44.0, 44.0, &SUN);
    c.glow(190.0, 400.0, 60.0, 0xfff0b0, 1.2);
    for k in 0..5 {
        let y = 376.0 + k as f32 * 9.0;
        c.rect(140.0, y, 100.0, 2.0 + k as f32 * 0.6, SKY[8 - k.min(3)]);
    }
    // two decks of cloud, the far one slow
    for i in 0..18u32 {
        let x = (hash(i * 3) * 1500.0 - 300.0 + t * 2.0).rem_euclid(1500.0) - 300.0;
        let y = 90.0 + hash(i * 5) * 170.0;
        let w = 50.0 + hash(i * 7) * 120.0;
        c.ball(x, y, w, w * 0.16, &CLOUD_FAR);
    }
    for i in 0..10u32 {
        let x = (hash(i * 11) * 1600.0 - 300.0 + t * 5.0).rem_euclid(1600.0) - 300.0;
        let y = 200.0 + hash(i * 13) * 150.0;
        let w = 40.0 + hash(i * 17) * 70.0;
        for k in 0..4 {
            let kx = x + (k as f32 - 1.5) * w * 0.45;
            let ky = y - (if k == 1 || k == 2 { w * 0.22 } else { 0.0 });
            c.ball(kx, ky, w * 0.42, w * 0.28, &CLOUD);
        }
        c.ball(x, y + w * 0.05, w * 0.95, w * 0.14, &CLOUD[..4]);
    }
}

fn city(c: &mut Canvas, t: f32) {
    let base = 432.0;
    let mut x = -400.0;
    let mut i = 0u32;
    while x < 1360.0 {
        let w = 14.0 + hash(i) * 26.0;
        let h = 18.0 + hash(i + 50) * 70.0 * (if i.is_multiple_of(7) { 1.8 } else { 1.0 });
        let col = CITY[(i % 4) as usize];
        c.rect(x, base - h, w, h, col);
        c.rect(x, base - h, w, 1.5, CITY[3]);
        // windows: amber, cyan and pink
        let mut wy = base - h + 4.0;
        while wy < base - 3.0 {
            let mut wx = x + 3.0;
            while wx < x + w - 3.0 {
                let k = (wx * 7.0 + wy * 13.0 + i as f32) as u32;
                if hash(k) > 0.55 {
                    let col = [0xffd36b, 0x7ff0ff, 0xff7ad9][(k % 3) as usize];
                    c.rect(wx, wy, 2.0, 2.0, col);
                    if hash(k + 3) > 0.7 {
                        c.glow(wx + 1.0, wy + 1.0, 5.0, col, 0.35);
                    }
                }
                wx += 5.0;
            }
            wy += 6.0;
        }
        if i % 9 == 4 {
            // a mast with a blinking red light
            c.rect(x + w / 2.0, base - h - 16.0, 1.2, 16.0, CITY[2]);
            if (t * 1.3 + i as f32).sin() > 0.4 {
                c.glow(x + w / 2.0, base - h - 16.0, 8.0, 0xff3a5a, 1.0);
                c.rect(x + w / 2.0 - 0.6, base - h - 17.0, 2.4, 2.0, 0xff5a7a);
            }
        }
        x += w + 1.0 + hash(i + 77) * 6.0;
        i += 1;
    }
}

fn runway(c: &mut Canvas, t: f32) {
    c.vramp(-900.0, 432.0, 2760.0, 600.0, &GROUND);
    let (_, ry) = at(0.0, RUNWAY);
    c.vramp(-400.0, ry - 10.0, 1760.0, 34.0, &TARMAC);
    // centerline, edge lights, touchdown marks
    let mut x = -400.0;
    while x < 1360.0 {
        c.rect(x, ry + 6.0, 14.0, 1.5, 0xe8e0ff);
        x += 28.0;
    }
    for k in 0..80 {
        let lx = -400.0 + k as f32 * 22.0;
        for (ly, col) in [(ry - 10.0, 0xfff1a0), (ry + 23.0, 0xfff1a0), (ry + 40.0, 0x4fb6ff)] {
            c.rect(lx, ly, 2.0, 1.5, col);
            c.glow(lx + 1.0, ly + 0.7, 6.0, col, 0.7);
        }
    }
    // approach lights racing toward the threshold
    for k in 0..12 {
        let lx = 900.0 + k as f32 * 18.0;
        let on = ((t * 2.0 - k as f32 * 0.12).rem_euclid(1.0)) < 0.15;
        c.rect(lx, ry + 5.0, 3.0, 2.0, 0xffffff);
        if on {
            c.glow(lx + 1.5, ry + 6.0, 10.0, 0xffffff, 1.6);
        }
    }
}

fn airplane(c: &mut Canvas, t: f32, _anim: f32) {
    let body = pts(&fuselage());
    let (gx, gy) = at(30.0, RUNWAY);
    // its shadow on the runway
    c.ellipse(gx, gy + 2.0, 37.0 * S / 1.4, 3.0, 0x140a24);

    gear(c);
    // the near wing, behind the engine
    let wing = pts(&WING);
    c.poly_with(&wing, |wx, wy, dx, dy| {
        let (mx, my) = ((NX - wx) / S, (CY - wy) / S);
        let u = ((my + 2.3) / 4.2).clamp(0.0, 1.0);
        ramp(&SKIN[1..6], u * 0.8 + 0.1 * ((mx * 0.7).sin() * 0.5 + 0.5), dx, dy)
    });
    c.path(&pts(&[(23.0, -2.3), (41.5, 0.1), (46.5, 1.7)]), 1.2, SKIN[6]);
    c.path(&pts(&[(27.5, -1.9), (34.5, -0.5), (45.0, 1.85)]), 1.0, SKIN[1]);
    // the fuselage, shaded as a cylinder, with sunset bounced onto its belly
    let belly = [0x3a2266, 0x5c2f80, 0x8e4590, 0x6a6aa4, 0x9aa2cc, 0xc8d0ec, 0xeef2ff, 0xffffff, 0xeef2ff];
    c.poly_with(&body, |_, wy, dx, dy| {
        let my = (CY - wy) / S;
        ramp(&belly, ((my + R) / (2.0 * R)).clamp(0.0, 1.0), dx, dy)
    });
    // livery: a sweep of color low on the body, nose to tail
    let (l0, t0) = at(62.8, R);
    let (l1, t1) = at(0.0, -R);
    c.fill(l0, t0, l1, t1, |wx, wy, dx, dy| {
        let (mx, my) = ((NX - wx) / S, (CY - wy) / S);
        let band = -1.2 + (mx * 0.12).sin() * 0.25 - (mx / 62.8) * 0.6;
        (my < band && my > band - 1.1 - mx * 0.02 && inside(&body, wx, wy)).then(|| ramp(&LIVERY, mx / 62.8, dx, dy))
    });
    // panel seams, doors, the windows lit from inside
    for &d in &[7.8f32, 16.8, 38.6, 57.2] {
        let (x0, y0) = at(d, 1.9);
        let (x1, y1) = at(d + 1.07, -0.1);
        c.rect(x1, y0, x0 - x1, y1 - y0, SKIN[5]);
        for (a, b) in [((x1, y0), (x0, y0)), ((x0, y0), (x0, y1)), ((x0, y1), (x1, y1)), ((x1, y1), (x1, y0))] {
            c.hair(a.0, a.1, b.0, b.1, SKIN[2]);
        }
    }
    let mut wxm = 9.4;
    while wxm < 57.0 {
        if !(16.6..18.2).contains(&wxm) && !(38.4..39.9).contains(&wxm) {
            let (x, y) = at(wxm, 1.25);
            c.rect(x - 1.2, y, 2.4, 3.6, 0xffcf7a);
            c.rect(x - 1.2, y, 2.4, 0.9, 0xfff2c8);
            c.glow(x, y + 1.8, 3.6, 0xffb35a, 0.5);
        }
        wxm += 0.98;
    }
    for x in [44.0f32, 52.0] {
        let (a, b) = (at(x, R), at(x, -R));
        c.hair(a.0, a.1, b.0, b.1, SKIN[3]);
    }
    // the flight deck windows, with the sunset in them
    let win = pts(&[(2.6, 0.9), (6.2, 0.9), (6.4, 2.2), (4.3, 2.3), (3.2, 1.9)]);
    c.poly_with(&win, |_, wy, dx, dy| ramp(&[0x2a1a5a, 0x6a2a8a, 0xe0508a, 0xffa860], ((CY - wy) / S - 0.9) / 1.4, dx, dy));
    for x in [4.2f32, 5.3] {
        let (a, b) = (at(x, 2.3), at(x, 0.9));
        c.hair(a.0, a.1, b.0, b.1, DARK[1]);
    }
    let (rx, ry) = at(0.25, 0.0);
    c.hair(rx, ry - 2.6 * S, rx + 0.6 * S, ry + 2.0 * S, SKIN[3]);
    // the belly fairing over the wing box
    let (fx, fy) = at(29.0, -2.6);
    c.ball(fx, fy, 7.5 * S, 0.75 * S, &BELLY);
    // tail: the fin in livery, a halftone of stars on it, the stabilizer, the APU exhaust
    let fin = pts(&FIN);
    c.poly_with(&fin, |wx, wy, dx, dy| {
        let (mx, my) = ((NX - wx) / S, (CY - wy) / S);
        let base = ramp(&LIVERY, (my - 2.0) / 9.5, dx, dy);
        let (gx, gy) = ((mx * 2.2).rem_euclid(1.0), (my * 2.2).rem_euclid(1.0));
        let r = 0.18 + 0.2 * ((my - 2.0) / 9.5);
        if (gx - 0.5).powi(2) + (gy - 0.5).powi(2) < r * r { 0xffd27a } else { base }
    });
    c.path(&pts(&[(59.6, 11.5), (62.9, 11.5)]), 1.4, SKIN[6]);
    c.path(&pts(&[(58.0, 3.0), (61.2, 10.8)]), 1.0, LIVERY[0]);
    let stab = pts(&STAB);
    c.poly_with(&stab, |_, wy, dx, dy| ramp(&SKIN[2..7], ((CY - wy) / S - 0.6) / 1.8, dx, dy));
    let (ax, ay) = at(62.75, 1.15);
    c.rect(ax - 2.0, ay - 2.0, 3.0, 4.0, DARK[0]);
    engine(c, t);
    lights(c, t);
}

fn engine(c: &mut Canvas, t: f32) {
    // pylon up into the wing
    c.poly_with(&pts(&[(17.5, -2.1), (24.5, -2.1), (26.5, -2.6), (24.0, -2.9), (17.5, -2.6)]), |_, _, dx, dy| ramp(&SKIN[2..5], 0.5, dx, dy));
    // the nacelle: a rounded inlet lip, the fan cowl, chevrons at its back edge, then the core cowl and plug
    let nac: Vec<(f32, f32)> = {
        let mut v = vec![(23.8, -2.0)];
        let mut k = 0;
        while k <= 12 {
            // chevrons: a sawtooth down the back of the fan cowl
            let y = -2.0 - k as f32 * 0.275;
            v.push((if k % 2 == 0 { 23.8 } else { 24.4 }, y));
            k += 1;
        }
        v.extend([(23.8, -5.3), (16.6, -5.35), (15.8, -5.0), (15.6, -3.65), (15.8, -2.3), (16.6, -1.95)]);
        v
    };
    let nac = pts(&nac);
    c.poly_with(&nac, |_, wy, dx, dy| ramp(&[0x2e2a5e, 0x4e4a86, 0x8a8ec0, 0xc8d0ee, 0xffffff, 0xd8def4], ((CY - wy) / S + 5.35) / 3.4, dx, dy));
    // a ring of livery around the cowl
    c.poly_with(&pts(&[(18.6, -1.97), (19.6, -1.96), (19.6, -5.34), (18.6, -5.35)]), |_, wy, dx, dy| ramp(&LIVERY[2..7], ((CY - wy) / S + 5.35) / 3.4, dx, dy));
    let lip = pts(&[(15.6, -2.3), (16.3, -2.0), (16.3, -5.3), (15.6, -5.0)]);
    c.poly_with(&lip, |_, wy, dx, dy| ramp(&METAL, ((CY - wy) / S + 5.3) / 3.3, dx, dy));
    // core cowl and exhaust plug, hot shimmer behind
    c.poly_with(&pts(&[(24.2, -2.75), (26.2, -3.05), (26.4, -4.05), (24.2, -4.4)]), |_, wy, dx, dy| ramp(&METAL[1..5], ((CY - wy) / S + 4.4) / 1.7, dx, dy));
    c.poly(&pts(&[(26.2, -3.2), (27.6, -3.55), (26.2, -3.9)]), METAL[3]);
    let (hx, hy) = at(27.4, -3.55);
    let shimmer = 0.4 + 0.2 * (t * 9.0).sin();
    c.glow(hx, hy, 14.0, 0xff7a3a, shimmer);
}

fn gear(c: &mut Canvas) {
    let tire = |c: &mut Canvas, mx: f32, r: f32| {
        let (x, y) = at(mx, RUNWAY + r);
        c.ball(x, y, r * S, r * S, &TIRE);
        c.ball(x, y, r * S * 0.5, r * S * 0.5, &METAL[1..5]);
        c.ellipse(x, y, r * S * 0.18, r * S * 0.18, DARK[0]);
    };
    // nose gear: strut, torque links, twin wheels
    let (a, b) = (at(7.6, -R + 0.2), at(7.6, RUNWAY + 0.55));
    c.line(a.0, a.1, b.0, b.1, 0.32 * S, METAL[3]);
    c.line(a.0 + 1.0, a.1, b.0 + 1.0, b.1, 0.12 * S, METAL[5]);
    tire(c, 7.6, 0.55);
    // main gear: a long oleo strut, a side brace, a four-wheel truck (two wheels seen)
    let (a, b) = (at(32.0, -R + 0.3), at(32.0, RUNWAY + 0.75));
    c.line(a.0, a.1, b.0, b.1, 0.42 * S, METAL[2]);
    c.line(a.0 - 1.0, a.1, b.0 - 1.0, b.1 - 6.0, 0.14 * S, METAL[5]);
    let (p, q) = (at(30.5, -R - 0.2), at(32.0, -4.0));
    c.line(p.0, p.1, q.0, q.1, 0.18 * S, METAL[1]);
    let (l, r) = (at(31.0, RUNWAY + 0.7), at(33.0, RUNWAY + 0.7));
    c.line(l.0, l.1, r.0, r.1, 0.3 * S, METAL[2]);
    tire(c, 31.15, 0.66);
    tire(c, 32.85, 0.66);
}

fn lights(c: &mut Canvas, t: f32) {
    // red anti-collision beacons, top and bottom, flashing
    let beat = (t * 1.1).rem_euclid(1.0);
    for (mx, my) in [(27.0, R + 0.15), (24.0, -R - 0.15)] {
        let (x, y) = at(mx, my);
        c.rect(x - 1.0, y - 1.0, 2.0, 2.0, 0xff3040);
        if beat < 0.12 {
            c.glow(x, y, 26.0, 0xff2a3a, 2.2);
        }
    }
    // white strobe on the tail cone
    let (x, y) = at(62.7, 1.6);
    if (t * 1.1 + 0.5).rem_euclid(1.0) < 0.06 {
        c.glow(x, y, 12.0, 0xffffff, 2.2);
    }
    // landing and taxi lights on the nose gear
    let (x, y) = at(7.2, -3.9);
    c.rect(x - 1.5, y - 1.0, 3.0, 2.0, 0xffffff);
    c.glow(x, y, 18.0, 0xfff4d8, 1.6);
    c.shine(x - 260.0, y - 10.0, x, y + 60.0, |wx, wy, _, _| {
        let dxw = x - wx;
        let spread = dxw * 0.12 + 2.0;
        let dyw = wy - y - dxw * 0.07;
        (dxw > 0.0 && dyw.abs() < spread).then(|| (0xfff0c8, 0.22 * (1.0 - dxw / 260.0) * (1.0 - dyw.abs() / spread)))
    });
    // the logo light washing the fin
    let (fx, fy) = at(55.5, 4.0);
    c.glow(fx, fy, 36.0, 0xffe0f0, 0.35);
}
