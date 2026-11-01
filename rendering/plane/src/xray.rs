// Diorama: the 787 as an x-ray on a blueprint plinth. The skin is drawn in see-through pixels so the systems inside
// show: the fuel tanks, the pumps, the electronics bays, the cabin air compressors, the APU, the control surfaces;
// and each system's flow runs through the airplane as light: fuel to the engines, three hydraulic systems to the
// actuators, electricity from the generators to the loads, air to the cabin, fly-by-wire commands to the surfaces.

use crate::d3::{self, lit, mat, shaded, sheer, spark, Frame, Mat, Mesh, Px, Xf, V3, v};
use crate::flows;
use crate::gfx::{ramp, Canvas};
use crate::pal::*;
use crate::plane3d as p3;
use crate::set::{plinth, BRASS, WOOD};
use crate::Params;
use std::cell::RefCell;
use std::f32::consts::TAU;

const VIOLET: [u32; 5] = [0x2a2080, 0x3c2ea4, 0x5242c4, 0x7060e0, 0x9a8aff];
const PALE: [u32; 4] = [0x5a50c8, 0x7a70e0, 0xa098ff, 0xd0c8ff];
const SURF: [u32; 4] = [0x4a2ab8, 0x6a3ad8, 0x9a5af0, 0xc8a0ff];
const TANK: [u32; 4] = [0x6a2a10, 0xb04a14, 0xff7a1a, 0xffb050];

fn blueprint(px: &Px, _m: &Mat) -> (u32, f32) {
    let p = px.p;
    let (gx, gz) = (p.x.rem_euclid(4.0), p.z.rem_euclid(4.0));
    if gx < 0.18 || gz < 0.18 {
        return (0x3a46c8, 0.05);
    }
    if (p.x.rem_euclid(1.0) < 0.06 || p.z.rem_euclid(1.0) < 0.06) && (px.dx + px.dy) % 2 == 0 {
        return (0x232a8a, 0.0);
    }
    (ramp(&[0x0d0a3a, 0x130f4e, 0x1a1660], 0.5 + 0.3 * ((p.x * 0.05).sin() * (p.z * 0.05).cos()), px.dx, px.dy), 0.0)
}

// 0 to 7 are the airplane's roles from plane3d, drawn here as an x-ray
const TOP: u8 = 8;
const SIDE: u8 = 9;
const TRIM: u8 = 10;
const SURFACE: u8 = 11;
const FUELM: u8 = 12;
const BAY: u8 = 13;
const BOX: u8 = 14;

pub static MATS: [Mat; 15] = [
    sheer(&PALE, 1),
    sheer(&VIOLET, 1),
    mat(&VIOLET),
    mat(&PALE),
    mat(&VIOLET),
    sheer(&PALE, 1),
    mat(&DARK),
    mat(&PALE),
    shaded(&VIOLET, blueprint),
    mat(&WOOD),
    mat(&BRASS),
    mat(&SURF),
    lit(&TANK, FUEL, 0.25),
    lit(&[0x0a3a5a, 0x1a6a8a, 0x3ab8d8, 0x9af4ff], ELECTRIC, 0.4),
    mat(&[0x3a3a8a, 0x5a5ab8, 0x8a8ae0]),
];

/// From the old top-down drawing's coordinates (meters right of the centerline, meters aft of the nose) and a height.
fn pf(right: f32, aft: f32, up: f32) -> V3 {
    v(31.4 - aft, up, right)
}

// control surfaces on the right wing and tail, as (right, aft) outlines; mirrored for the left
const AILERON: [(f32, f32); 4] = [(21.0, 39.4), (26.4, 41.4), (26.4, 42.6), (21.0, 40.9)];
const FLAPERON: [(f32, f32); 4] = [(9.6, 36.4), (12.4, 37.4), (12.4, 39.0), (9.6, 38.0)];
const FLAP_IN: [(f32, f32); 4] = [(3.0, 36.3), (9.4, 36.4), (9.4, 38.4), (3.0, 38.4)];
const FLAP_OUT: [(f32, f32); 4] = [(12.6, 37.5), (20.8, 40.4), (20.8, 42.0), (12.6, 39.2)];
const ELEVATOR: [(f32, f32); 4] = [(1.5, 60.6), (8.0, 61.0), (8.0, 62.2), (1.5, 62.0)];
const SLATS: [(f32, f32); 4] = [(12.2, 28.7), (29.6, 40.6), (29.0, 41.3), (12.0, 29.6)];

fn spoiler(i: usize) -> [(f32, f32); 4] {
    let x0 = 3.4 + i as f32 * 2.4;
    let y0 = |x: f32| 33.6 + (x - 3.0).max(0.0) * 0.28;
    let x1 = x0 + 2.1;
    [(x0, y0(x0)), (x1, y0(x1)), (x1, y0(x1) + 1.7), (x0, y0(x0) + 1.7)]
}

/// A flat surface panel from a (right, aft) outline, both sides, lying on the wing's top.
fn panel(m: &mut Mesh, o: &[(f32, f32)], y: f32, mat: u8) {
    for s in [1.0f32, -1.0] {
        let pts: Vec<(f32, f32)> = o.iter().map(|&(r, a)| (31.4 - a, r * s)).collect();
        let lift = y + o[0].0 * 0.1;
        m.slab(&pts, lift, lift + 0.12, mat);
    }
}

// focusable part ids
pub const AILERONS: u8 = 30;
pub const FLAPERONS: u8 = 31;
pub const SPOILERS: u8 = 32;
pub const ELEVATORS: u8 = 33;
pub const RUDDER: u8 = 34;
pub const FLAPS: u8 = 35;
pub const SLATS_ID: u8 = 36;
pub const TANKS: u8 = 37;
pub const BAYS: u8 = 38;
pub const APU: u8 = 39;
pub const CACS: u8 = 40;
pub const PUMPS: u8 = 41;
pub const COMPUTERS: u8 = 42;

fn insides() -> Vec<(u8, Mesh)> {
    let mut v_ = Vec::new();
    let mut m = Mesh::new();
    panel(&mut m, &AILERON, -1.3, SURFACE);
    v_.push((AILERONS, m));
    let mut m = Mesh::new();
    panel(&mut m, &FLAPERON, -1.3, SURFACE);
    v_.push((FLAPERONS, m));
    let mut m = Mesh::new();
    for k in 0..7 {
        panel(&mut m, &spoiler(k), -1.2, SURFACE);
    }
    v_.push((SPOILERS, m));
    let mut m = Mesh::new();
    panel(&mut m, &FLAP_IN, -1.35, SURFACE);
    panel(&mut m, &FLAP_OUT, -1.35, SURFACE);
    v_.push((FLAPS, m));
    let mut m = Mesh::new();
    panel(&mut m, &SLATS, -1.3, SURFACE);
    v_.push((SLATS_ID, m));
    let mut m = Mesh::new();
    panel(&mut m, &ELEVATOR, 1.0, SURFACE);
    v_.push((ELEVATORS, m));
    let mut m = Mesh::new();
    m.cube(v(-28.6, 7.0, 0.0), v(3.0, 8.4, 0.5), SURFACE);
    v_.push((RUDDER, m));
    // fuel tanks: each wing between the spars, and the center tank in the wing box
    let mut m = Mesh::new();
    for s in [1.0f32, -1.0] {
        let o: Vec<(f32, f32)> = [(3.0, 25.0), (12.0, 30.4), (26.0, 39.8), (25.6, 40.8), (12.0, 35.6), (3.0, 34.4)].iter().map(|&(r, a)| (31.4 - a, r * s)).collect();
        m.slab(&o, -1.75, -1.35, FUELM);
    }
    m.cube(pf(0.0, 29.0, -2.0), v(10.0, 1.4, 5.0), FUELM);
    v_.push((TANKS, m));
    // the forward and aft electronics bays under the floor
    let mut m = Mesh::new();
    m.cube(pf(0.0, 10.0, -1.6), v(3.6, 1.6, 3.6), BAY);
    m.cube(pf(0.0, 39.2, -1.6), v(4.4, 1.6, 4.0), BAY);
    v_.push((BAYS, m));
    let mut m = Mesh::new();
    m.cube(pf(0.0, 60.6, 0.4), v(2.4, 1.2, 1.2), BOX);
    v_.push((APU, m));
    let mut m = Mesh::new();
    for s in [1.0f32, -1.0] {
        for k in 0..2 {
            let c = pf(1.5 * s, 26.6 + k as f32 * 1.8, -2.1);
            let mut cyl = Mesh::new();
            cyl.lathe(-0.6, 0.6, 0.55, 0.55, 0.0, 0.0, 10, 0.0, TAU, BOX);
            m.put(&cyl, &Xf::at(c).yaw(std::f32::consts::PI / 2.0));
        }
    }
    v_.push((CACS, m));
    let mut m = Mesh::new();
    for p in [pf(6.0, 33.5, -1.6), pf(-6.0, 33.5, -1.6), pf(0.0, 30.0, -2.4)] {
        m.cube(p, v(0.9, 0.7, 0.9), BOX);
    }
    v_.push((PUMPS, m));
    let mut m = Mesh::new();
    m.cube(pf(0.0, 10.0, -0.5), v(1.6, 0.6, 1.2), BOX);
    v_.push((COMPUTERS, m));
    v_
}

/// The plinth, the systems inside, and the airplane's skin.
type Parts = (Mesh, Vec<(u8, Mesh)>, Vec<(u8, Mesh)>);

thread_local! {
    static MESHES: RefCell<Option<Parts>> = const { RefCell::new(None) };
}

pub const HEIGHT: f32 = 6.0;

pub fn draw(c: &mut Canvas, fr: &mut Frame, origin: V3, p: Option<&Params>) {
    fr.mats = &MATS;
    let at = Xf::at(origin.add(v(0.0, HEIGHT, 0.0)));
    MESHES.with(|m| {
        let mut m = m.borrow_mut();
        let (base, inside, plane) = m.get_or_insert_with(|| {
            let mut b = Mesh::new();
            plinth(&mut b, 84.0, 84.0, 4.0, TOP, SIDE, TRIM);
            (b, insides(), p3::parts())
        });
        d3::draw(c, fr, base, &Xf::at(origin), 1);
        // the tanks only light up when fuel is the subject; otherwise they would drown out the other systems
        let fuel_on = p.is_some_and(|p| p.flows & flows::FUEL != 0 || p.focus == 9);
        for (id, mesh) in inside.iter().filter(|(id, _)| *id != TANKS || fuel_on) {
            d3::draw(c, fr, mesh, &at, *id);
        }
        // the skin last, see-through, over everything inside it
        for (id, mesh) in plane.iter() {
            d3::draw(c, fr, mesh, &at, *id);
        }
    });
    let f = p.map_or(0, |p| p.flows);
    let o = origin.add(v(0.0, HEIGHT, 0.0));
    let w = |pts: &[(f32, f32, f32)]| -> Vec<V3> { pts.iter().map(|&(r, a, h)| o.add(pf(r, a, h))).collect() };
    let cam = fr.cam;
    let run = |c: &mut Canvas, pts: &[(f32, f32, f32)], col: u32, core: u32, speed: f32| d3::flow(c, &cam, &w(pts), 0.5, core, col, speed, 1.0);
    if f & flows::FUEL != 0 {
        for s in [1.0f32, -1.0] {
            run(c, &[(6.0 * s, 33.5, -1.6), (8.6 * s, 30.0, -1.7), (9.9 * s, 27.0, -2.6)], FUEL, FUEL_CORE, 6.0);
            run(c, &[(18.0 * s, 38.0, -1.2), (12.0 * s, 33.8, -1.5), (9.9 * s, 28.4, -1.8), (9.9 * s, 27.0, -2.6)], FUEL, FUEL_CORE, 6.0);
            run(c, &[(0.0, 31.0, -2.2), (4.0 * s, 31.0, -1.9), (8.6 * s, 30.0, -1.7)], FUEL, FUEL_CORE, 5.0);
            spark(c, &cam, o.add(pf(25.0 * s, 41.3, -1.0)), 1.0, FUEL, 0.8);
        }
    }
    if f & flows::HYDRAULIC != 0 {
        for (s, col) in [(-1.0f32, HYD_L), (1.0, HYD_R)] {
            run(c, &[(9.9 * s, 24.4, -2.6), (9.9 * s, 28.4, -1.7), (12.0 * s, 34.2, -1.4), (23.5 * s, 39.4, -0.9)], col, 0xeaffd8, 7.0);
            run(c, &[(9.9 * s, 28.4, -1.7), (3.4 * s, 30.0, -1.8), (1.6 * s, 34.0, -1.8), (1.6 * s, 56.0, 0.2), (5.0 * s, 60.6, 1.0)], col, 0xeaffd8, 7.0);
        }
        for s in [1.0f32, -1.0] {
            run(c, &[(0.0, 30.0, -2.4), (4.8 * s, 31.4, -2.6), (4.8 * s, 33.0, -3.2)], HYD_C, 0xe0f8ff, 6.0);
            run(c, &[(0.0, 30.0, -2.4), (6.0 * s, 34.0, -1.6), (16.0 * s, 37.4, -1.2)], HYD_C, 0xe0f8ff, 6.0);
        }
        run(c, &[(0.0, 30.0, -2.4), (0.0, 7.0, -2.4)], HYD_C, 0xe0f8ff, 6.0);
        run(c, &[(0.0, 30.0, -2.4), (0.0, 58.0, 0.5)], HYD_C, 0xe0f8ff, 6.0);
    }
    if f & flows::ELECTRIC != 0 {
        for s in [1.0f32, -1.0] {
            run(c, &[(9.9 * s, 23.4, -2.6), (9.9 * s, 28.4, -1.7), (4.0 * s, 33.0, -1.6), (1.2 * s, 38.0, -1.6)], ELECTRIC, ELECTRIC_CORE, 10.0);
            run(c, &[(1.0 * s, 39.0, -1.6), (1.6 * s, 28.0, -2.1)], ELECTRIC, ELECTRIC_CORE, 10.0);
            run(c, &[(4.0 * s, 33.0, -1.6), (12.2 * s, 29.4, -1.3), (28.0 * s, 40.2, -0.6)], 0xff8af0, 0xffe0fa, 9.0);
        }
        run(c, &[(0.0, 60.2, 0.4), (0.0, 41.5, -1.4)], ELECTRIC, ELECTRIC_CORE, 10.0);
        run(c, &[(0.0, 37.0, -1.6), (0.0, 11.8, -1.6)], ELECTRIC, ELECTRIC_CORE, 10.0);
    }
    if f & flows::AIR != 0 {
        for s in [1.0f32, -1.0] {
            run(c, &[(2.4 * s, 25.0, -2.8), (1.6 * s, 28.0, -2.1), (0.8 * s, 31.0, -1.6)], AIR, AIR_CORE, 5.0);
            run(c, &[(0.8 * s, 31.0, -1.6), (1.8 * s, 31.0, 1.8), (1.8 * s, 9.0, 1.8)], AIR, AIR_CORE, 5.0);
            run(c, &[(1.8 * s, 31.0, 1.8), (1.8 * s, 55.0, 1.6)], AIR, AIR_CORE, 5.0);
        }
    }
    if f & flows::SIGNAL != 0 {
        run(c, &[(0.0, 4.6, 0.8), (0.0, 10.0, -0.5)], SIGNAL, SIGNAL_CORE, 14.0);
        for s in [1.0f32, -1.0] {
            run(c, &[(0.6 * s, 11.0, -0.8), (0.6 * s, 33.0, -1.0), (6.0 * s, 35.4, -1.3), (23.5 * s, 40.6, -0.9)], SIGNAL, SIGNAL_CORE, 14.0);
            run(c, &[(6.0 * s, 35.4, -1.3), (6.0 * s, 37.3, -1.3)], SIGNAL, SIGNAL_CORE, 14.0);
            run(c, &[(11.0 * s, 36.8, -1.2), (11.0 * s, 37.8, -1.2)], SIGNAL, SIGNAL_CORE, 14.0);
            run(c, &[(0.6 * s, 33.0, -1.0), (0.6 * s, 58.0, 0.6), (4.5 * s, 61.0, 1.0)], SIGNAL, SIGNAL_CORE, 14.0);
        }
        run(c, &[(0.0, 58.0, 0.8), (0.0, 59.5, 6.0)], SIGNAL, SIGNAL_CORE, 14.0);
    }
}

pub fn focus_id(f: i32) -> u8 {
    match f {
        0 => AILERONS,
        1 => FLAPERONS,
        2 => SPOILERS,
        3 => ELEVATORS,
        4 => RUDDER,
        5 => FLAPS,
        6 => SLATS_ID,
        7 => p3::TAIL,
        8 => p3::GEAR,
        9 => TANKS,
        10 => BAYS,
        11 => APU,
        12 => CACS,
        13 => p3::ENGINES,
        14 => PUMPS,
        15 => COMPUTERS,
        _ => 0,
    }
}

