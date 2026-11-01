// Diorama: a stretch of runway at dusk on its plinth, the 787-9 on it, a control tower and terminal behind, trees
// on the grass, and every light on the field glowing.

use crate::d3::{self, lit, mat, shaded, spark, Frame, Mat, Mesh, Px, Xf, V3, v};
use crate::gfx::{hash, ramp, Canvas};
use crate::pal::{LIVERY, METAL as METAL_RAMP, SKIN as SKIN_RAMP};
use crate::plane3d as p3;
use crate::set::{plinth, BRASS, WOOD};
use crate::Params;
use std::cell::RefCell;
use std::f32::consts::TAU;

// the airplane's roles first (shared with plane3d), then the field's
const TOP: u8 = 8;
const SIDE: u8 = 9;
const TRIM: u8 = 10;
const TOWER: u8 = 11;
const GLASSY: u8 = 12;
const TREE: u8 = 13;
const BUILDING: u8 = 14;
const SOCK: u8 = 15;

const GREY: [u32; 4] = [0x1a1430, 0x2a2244, 0x3a3258, 0x4a4270];
const TREES: [u32; 5] = [0x0a2a2a, 0x10443a, 0x1a6a4a, 0x3a9a5a, 0x8ad86a];
const TOWERS: [u32; 5] = [0x3a3460, 0x5a5288, 0x8078b0, 0xb8b0dc, 0xe8e4ff];
const BELLY: [u32; 9] = [0x3a2266, 0x5c2f80, 0x8e4590, 0x6a6aa4, 0x9aa2cc, 0xc8d0ec, 0xeef2ff, 0xffffff, 0xffffff];

pub fn skin(px: &Px, _m: &Mat) -> (u32, f32) {
    let p = px.p;
    let side = p.z.abs();
    // cabin windows, lit from inside
    if side > 1.9 && (0.55..1.05).contains(&p.y) && (-24.0..25.0).contains(&p.x) {
        let door = [17.0f32, 8.0, -14.5, -23.5].iter().any(|d| (p.x - d).abs() < 0.8);
        if !door && (p.x * 1.0204).rem_euclid(1.0) < 0.42 {
            return (0xffcf7a, 0.55);
        }
    }
    // flight deck windows
    if (26.6..29.3).contains(&p.x) && p.y > 0.9 && p.y < 2.0 - (p.x - 26.6) * 0.2 && side > 0.4 {
        return (ramp(&[0x2a1a5a, 0x6a2a8a, 0xe0508a, 0xffa860], (p.y - 0.9) / 1.1, px.dx, px.dy), 0.1);
    }
    // a sweep of livery low on the body
    let band = -0.7 - (p.x * 0.11).sin() * 0.3;
    if p.y < band && p.y > band - 1.2 && side > 0.5 {
        return (ramp(&LIVERY, (31.4 - p.x) / 62.8, px.dx, px.dy), 0.0);
    }
    // white above, sunset bounced up onto the belly below
    let warm = ((-p.y - 1.0) / 1.9).clamp(0.0, 1.0);
    (ramp(&BELLY, (px.lum * (1.0 - warm * 0.5) + 0.12).min(1.0) * 0.8 + 0.2 * (1.0 - warm), px.dx, px.dy), 0.0)
}

pub fn fin(px: &Px, _m: &Mat) -> (u32, f32) {
    let p = px.p;
    let u = ((p.y - 2.0) / 9.0).clamp(0.0, 1.0);
    // a halftone of stars rising up the fin, over a gradient of the livery
    let (gx, gy) = ((p.x * 1.6).rem_euclid(1.0), (p.y * 1.6).rem_euclid(1.0));
    let r = 0.12 + 0.22 * u;
    if (gx - 0.5).powi(2) + (gy - 0.5).powi(2) < r * r {
        return (0xffd27a, 0.15);
    }
    (ramp(&LIVERY, u * 0.85 + px.lum * 0.15, px.dx, px.dy), 0.0)
}

pub fn nacelle(px: &Px, _m: &Mat) -> (u32, f32) {
    let x = px.p.x - p3::ENGINE_AT[0].x;
    if (1.3..2.1).contains(&x) {
        return (ramp(&LIVERY[2..], px.lum, px.dx, px.dy), 0.0);
    }
    (ramp(&SKIN_RAMP, px.lum, px.dx, px.dy), 0.0)
}

fn field(px: &Px, _m: &Mat) -> (u32, f32) {
    let p = px.p;
    let (d, e) = (px.dx, px.dy);
    let z = p.z.abs();
    if z > 13.5 {
        // grass, mown in stripes
        let stripe = ((p.x / 4.0).floor() as i32 & 1) as f32 * 0.15;
        return (ramp(&TREES[..4], 0.35 + stripe + hash((p.x * 3.0) as u32 ^ (p.z * 7.0) as u32) * 0.15, d, e), 0.0);
    }
    if (11.6..12.1).contains(&z) || (z < 0.25 && p.x.rem_euclid(9.0) < 5.0) {
        return (0xe8e0ff, 0.0);
    }
    // touchdown zone bars at the far end
    if p.x < -36.0 && p.x > -46.0 && (2.0..9.0).contains(&z) && (z * 1.3).rem_euclid(1.0) < 0.55 {
        return (0xe8e0ff, 0.0);
    }
    let n = hash((p.x * 4.0) as i32 as u32 ^ ((p.z * 4.0) as i32 as u32) << 8);
    (ramp(&[0x1e1530, 0x281d3e, 0x33264c, 0x3e305a], 0.3 + n * 0.4, d, e), 0.0)
}

fn windows(px: &Px, m: &Mat) -> (u32, f32) {
    let p = px.p;
    let lit_win = (p.y * 1.4).rem_euclid(1.0) < 0.5 && (p.x * 1.1 + p.z * 1.1).rem_euclid(1.0) < 0.55;
    if lit_win && hash((p.y * 1.4) as u32 * 31 + ((p.x + p.z) * 1.1) as u32) > 0.35 {
        return ([0xffd36b, 0x7ff0ff, 0xff7ad9][((p.x + p.z) as i32).rem_euclid(3) as usize], 0.6);
    }
    (ramp(m.ramp, px.lum, px.dx, px.dy), 0.0)
}

pub static MATS: [Mat; 16] = [
    shaded(&SKIN_RAMP, skin),
    mat(&SKIN_RAMP),
    shaded(&SKIN_RAMP, nacelle),
    mat(&METAL_RAMP),
    mat(&crate::pal::TIRE),
    shaded(&LIVERY, fin),
    mat(&crate::pal::DARK),
    mat(&METAL_RAMP),
    shaded(&GREY, field),
    mat(&WOOD),
    mat(&BRASS),
    mat(&TOWERS),
    lit(&[0x2a6a8a, 0x5ad8ff, 0xc8f8ff], 0x5ae8ff, 0.5),
    mat(&TREES),
    shaded(&TOWERS, windows),
    lit(&[0xc0401a, 0xff7a2a, 0xffb060], 0xff7a2a, 0.15),
];

pub const PLINTH: (f32, f32) = (110.0, 64.0);

fn scenery() -> Vec<(u8, Mesh)> {
    let mut base = Mesh::new();
    plinth(&mut base, PLINTH.0, PLINTH.1, 5.0, TOP, SIDE, TRIM);
    let mut field = Mesh::new();
    // the control tower: a shaft, a glass cab, a roof with an antenna
    field.lathe(0.0, 16.0, 1.6, 1.2, 0.0, 0.0, 12, 0.0, TAU, TOWER);
    let mut cab = Mesh::new();
    cab.lathe(16.0, 19.0, 2.6, 3.0, 0.0, 0.0, 10, 0.0, TAU, GLASSY).lathe(19.0, 19.8, 3.2, 1.2, 0.0, 0.0, 10, 0.0, TAU, TOWER);
    field.put(&cab, &Xf::ID);
    let mut tower = Mesh::new();
    tower.put(&field, &Xf::at(v(-32.0, 0.0, -24.0)).pitch(std::f32::consts::PI / 2.0));
    // the terminal, long and low with lit windows
    tower.cube(v(10.0, 3.0, -27.0), v(44.0, 6.0, 7.0), BUILDING);
    tower.cube(v(10.0, 6.3, -27.0), v(46.0, 0.6, 8.0), TOWER);
    // trees on the grass
    for i in 0..14u32 {
        let x = -50.0 + hash(i) * 100.0;
        let z = if i % 2 == 0 { 17.0 + hash(i + 9) * 12.0 } else { -16.0 - hash(i + 9) * 4.0 };
        if z < 0.0 && x > -12.0 && x < 34.0 {
            continue;
        }
        let s = 1.5 + hash(i + 3) * 1.5;
        let mut t = Mesh::new();
        t.turn(&[(0.0, 0.25 * s), (1.2 * s, 0.25 * s), (1.2 * s, 1.6 * s), (3.4 * s, 0.9 * s), (5.2 * s, 0.05)], 8, 0.0, TAU, TREE);
        tower.put(&t, &Xf::at(v(x, 0.0, z)).pitch(std::f32::consts::PI / 2.0));
    }
    // a windsock on its pole
    tower.tube(&[v(40.0, 0.0, 20.0), v(40.0, 5.0, 20.0)], 0.12, 6, TOWER);
    let mut sock = Mesh::new();
    sock.turn(&[(0.0, 0.5), (3.0, 0.25)], 8, 0.0, TAU, SOCK);
    tower.put(&sock, &Xf::at(v(40.0, 4.8, 20.0)).yaw(0.6));
    vec![(1, base), (2, tower)]
}

/// The field's pieces and the airplane's, each as (part id, mesh).
type Parts = (Vec<(u8, Mesh)>, Vec<(u8, Mesh)>);

thread_local! {
    static MESHES: RefCell<Option<Parts>> = const { RefCell::new(None) };
}

pub fn draw(c: &mut Canvas, fr: &mut Frame, origin: V3, p: Option<&Params>) {
    fr.mats = &MATS;
    MESHES.with(|m| {
        let mut m = m.borrow_mut();
        let (field, plane) = m.get_or_insert_with(|| (scenery(), p3::parts()));
        for (id, mesh) in field.iter() {
            d3::draw(c, fr, mesh, &Xf::at(origin), *id);
        }
        let at = Xf::at(origin.add(v(0.0, p3::GROUND, 0.0)));
        for (id, mesh) in plane.iter() {
            d3::draw(c, fr, mesh, &at, *id);
        }
    });
    lights(c, fr, origin);
    let _ = p;
}

fn lights(c: &mut Canvas, fr: &Frame, o: V3) {
    let t = fr.t;
    let cam = &fr.cam;
    // edge lights down both sides, and the approach lights racing toward the threshold
    for k in 0..14 {
        let x = -52.0 + k as f32 * 8.0;
        for z in [12.8f32, -12.8] {
            spark(c, cam, o.add(v(x, 0.2, z)), 0.8, 0xfff1a0, 0.8);
        }
    }
    for k in 0..6 {
        let x = 53.0 - k as f32 * 2.0;
        let on = ((t * 2.0 - k as f32 * 0.15).rem_euclid(1.0)) < 0.18;
        spark(c, cam, o.add(v(x, 0.3, 0.0)), 1.6, 0xffffff, if on { 2.2 } else { 0.2 });
    }
    // the airplane's own lights: red beacons flashing, nav lights on the wingtips, the tower's beacon
    let g = p3::GROUND;
    let beat = (t * 1.1).rem_euclid(1.0) < 0.12;
    for y in [p3::R + 0.15, -p3::R - 0.35] {
        spark(c, cam, o.add(v(4.0, g + y, 0.0)), 3.0, 0xff3040, if beat { 2.4 } else { 0.4 });
    }
    spark(c, cam, o.add(v(-12.0, g - 1.0, 30.0)), 1.5, 0x4aff7a, 1.2);
    spark(c, cam, o.add(v(-12.0, g - 1.0, -30.0)), 1.5, 0xff3a4a, 1.2);
    if (t * 1.1 + 0.5).rem_euclid(1.0) < 0.06 {
        spark(c, cam, o.add(v(-31.4, g + 1.6, 0.0)), 4.0, 0xffffff, 2.6);
    }
    spark(c, cam, o.add(v(-32.0, 20.4, -24.0)), 2.0, 0xff3a5a, if (t * 0.8).sin() > 0.3 { 1.6 } else { 0.2 });
    // landing lights on the nose gear
    spark(c, cam, o.add(v(24.4, g - 3.4, 0.0)), 4.0, 0xfff4d8, 1.6);
}

/// Part ids on this diorama the tour can point at, by focus number.
pub fn focus_id(f: i32) -> u8 {
    match f {
        0 => p3::FUSELAGE,
        1 => p3::WINGS,
        2 => p3::NOSE,
        3 => p3::TAIL,
        4 => p3::ENGINES,
        5 => p3::GEAR,
        _ => 0,
    }
}
