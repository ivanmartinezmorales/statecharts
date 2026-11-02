// Four dioramas of parts that come apart: the turbofan's spools, a main landing gear, the lithium-ion battery and a
// box of composite wing, each on its own plinth. Every piece has a place it flies to as the model explodes, and focus
// numbers follow the order of the pieces.

use crate::d3::{self, lit, mat, shaded, Frame, Mat, Mesh, Px, Xf, V3, v};
use crate::gfx::{ramp, Canvas};
use crate::pal::*;
use crate::set::{plinth, BRASS, WOOD};
use crate::Params;
use std::cell::RefCell;
use std::f32::consts::{PI, TAU};

const STEEL: [u32; 5] = [0x2a2a44, 0x4a4a6e, 0x7a7a9e, 0xb0b0cc, 0xe8e8f8];
const CARBON: [u32; 5] = [0x1a1838, 0x2e2c5c, 0x4a4a8a, 0x8a8ad0, 0xd8dcff];
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
const TOPR: [u32; 4] = [0x2a1a5a, 0x34226a, 0x3e2a78, 0x4a3488];

/// The fan seen face on: a disc painted with swept blades that turn, which reads far better at diorama size than
/// a cluster of thin plates.
fn fan_face(px: &Px, m: &Mat) -> (u32, f32) {
    let p = px.p;
    let r = (p.y * p.y + p.z * p.z).sqrt();
    let a = p.z.atan2(p.y) / TAU * 22.0 + r * 0.08 - px.t * 1.5;
    let blade = a.rem_euclid(1.0) < 0.62;
    let lum = if blade { px.lum } else { px.lum * 0.35 };
    (ramp(m.ramp, lum, px.dx, px.dy), 0.0)
}

pub static MATS: [Mat; 18] = [
    mat(&TOPR),
    mat(&WOOD),
    mat(&BRASS),
    mat(&STEEL),
    mat(&CARBON),
    mat(&WARM),
    lit(&HOT, 0xff8a3a, 0.9),
    lit(&HOTM, 0xff5a2a, 0.35),
    mat(&TURBINE),
    mat(&SHAFT),
    mat(&SKIN),
    mat(&RUBBER),
    lit(&CELL, 0x4a8aff, 0.15),
    lit(&COPPER, 0xff9a4a, 0.2),
    lit(&BOARD, 0x5aff8a, 0.3),
    mat(&SKINC),
    lit(&FUELM, FUEL, 0.45),
    shaded(&CARBON, fan_face),
];
const TOP: u8 = 0;
const SIDE: u8 = 1;
const TRIM: u8 = 2;
const ST: u8 = 3;
const CB: u8 = 4;
const WM: u8 = 5;
const HT: u8 = 6;
const HM: u8 = 7;
const TB: u8 = 8;
const SH: u8 = 9;
const SK: u8 = 10;
const RB: u8 = 11;
const CL: u8 = 12;
const CU: u8 = 13;
const BD: u8 = 14;
const SC: u8 = 15;
const FU: u8 = 16;
const FAN: u8 = 17;

/// A piece: its mesh (centered where it sits assembled) and the offset it flies to when apart.
type Piece = (Mesh, V3);
/// A piece as drawn: its mesh, where it flies to, and where its mount meets it.
type Placed = (Mesh, V3, V3);

fn lathe(x0: f32, x1: f32, r0: f32, r1: f32, i0: f32, i1: f32, m: u8) -> Mesh {
    let mut o = Mesh::new();
    o.lathe(x0, x1, r0, r1, i0, i1, 20, 0.0, TAU, m);
    o
}

fn engine() -> Vec<Piece> {
    let mut booster = Mesh::new();
    for k in 0..3 {
        let x = -12.0 + k as f32;
        booster.lathe(x, x + 0.6, 5.6, 5.6, 2.8, 2.8, 18, 0.0, TAU, ST);
    }
    let mut hpc = Mesh::new();
    for k in 0..8 {
        let x = -8.0 + k as f32 * 0.9;
        let r = 5.0 - k as f32 * 0.15;
        hpc.lathe(x, x + 0.5, r, r, 2.4, 2.4, 18, 0.0, TAU, WM);
    }
    let mut hpt = Mesh::new();
    for k in 0..2 {
        let x = 4.2 + k as f32 * 0.8;
        hpt.lathe(x, x + 0.5, 4.5, 4.5, 2.0, 2.0, 18, 0.0, TAU, HM);
    }
    let mut lpt = Mesh::new();
    for k in 0..5 {
        let x = 6.2 + k as f32 * 1.3;
        let r = 4.5 + k as f32 * 0.7;
        lpt.lathe(x, x + 0.7, r, r, 2.2, 2.2, 20, 0.0, TAU, TB);
    }
    let mut fan = lathe(-15.5, -13.5, 3.2, 3.2, 0.0, 0.0, CB);
    fan.lathe(-15.0, -14.0, 13.0, 13.0, 3.2, 3.2, 40, 0.0, TAU, FAN);
    let mut shafts = lathe(-15.0, 14.0, 0.7, 0.7, 0.0, 0.0, SH);
    shafts.put(&lathe(-8.0, 5.6, 1.4, 1.4, 1.0, 1.0, SH), &Xf::ID);
    vec![
        (lathe(-20.0, -15.5, 0.2, 3.2, 0.0, 0.0, SK), v(-14.0, 0.0, 0.0)),
        (fan, v(-10.0, 0.0, 0.0)),
        (lathe(-17.0, -6.0, 14.2, 14.2, 13.4, 13.4, SK), v(-2.0, 0.0, -20.0)),
        (booster, v(-5.5, 0.0, 0.0)),
        (hpc, v(-2.0, 0.0, 0.0)),
        (lathe(-0.5, 3.5, 5.2, 5.2, 3.0, 3.0, HT), v(2.5, 0.0, 0.0)),
        (hpt, v(6.0, 0.0, 0.0)),
        (lpt, v(10.0, 0.0, 0.0)),
        (shafts, v(0.0, -4.0, 17.0)),
        (lathe(13.5, 20.0, 3.5, 0.2, 0.0, 0.0, ST), v(16.0, 0.0, 0.0)),
    ]
}

fn gear() -> Vec<Piece> {
    // the truck runs fore and aft; each of its two axles carries a wheel on either side
    let axle = |m: u8, r: f32, i: f32, w: f32, z: f32| {
        let mut o = Mesh::new();
        for x in [-6.0f32, 6.0] {
            o.put(&lathe(-w, w, r, r, i, i, m), &Xf::at(v(x, -5.5, z)).yaw(PI / 2.0));
        }
        o
    };
    let mut brakes = axle(HM, 3.0, 1.2, 1.4, -3.4);
    brakes.put(&axle(HM, 3.0, 1.2, 1.4, 3.4), &Xf::ID);
    let mut strut = Mesh::new();
    strut.put(&lathe(0.0, 15.0, 1.6, 1.6, 0.0, 0.0, ST), &Xf::at(v(0.0, 2.5, 0.0)).pitch(PI / 2.0));
    let mut piston = Mesh::new();
    piston.put(&lathe(-5.5, 3.0, 1.0, 1.0, 0.0, 0.0, SK), &Xf::ID.pitch(PI / 2.0));
    let mut links = Mesh::new();
    links.cube(v(1.7, 0.0, 0.0), v(0.6, 3.6, 0.8), ST).cube(v(1.7, -3.0, 0.0), v(0.6, 3.0, 0.8), ST);
    let mut truck = Mesh::new();
    truck.cube(v(0.0, -5.5, 0.0), v(16.0, 1.6, 1.8), ST);
    let mut brace = Mesh::new();
    brace.cube(v(-4.0, 9.0, 0.0), v(0.8, 11.0, 0.8), ST);
    vec![
        (strut, v(0.0, 12.0, 0.0)),
        (piston, v(0.0, 5.0, 0.0)),
        (links, v(6.0, 4.0, 0.0)),
        (truck, v(0.0, -2.0, 0.0)),
        (axle(RB, 4.5, 2.0, 1.8, -3.4), v(0.0, 0.0, -10.0)),
        (axle(RB, 4.5, 2.0, 1.8, 3.4), v(0.0, 0.0, 10.0)),
        (brakes, v(0.0, -2.5, 0.0)),
        (brace, v(-8.0, 4.0, 0.0)),
    ]
}

fn battery() -> Vec<Piece> {
    let mut case = Mesh::new();
    case.cube(v(0.0, -5.0, 0.0), v(20.0, 0.8, 12.0), ST)
        .cube(v(0.0, 0.0, -6.0), v(20.0, 10.0, 0.6), ST)
        .cube(v(0.0, 0.0, 6.0), v(20.0, 10.0, 0.6), ST)
        .cube(v(-10.0, 0.0, 0.0), v(0.6, 10.0, 12.0), ST)
        .cube(v(10.0, 0.0, 0.0), v(0.6, 10.0, 12.0), ST);
    let mut lid = Mesh::new();
    lid.cube(v(0.0, 5.5, 0.0), v(20.6, 0.8, 12.6), ST);
    let mut cells = Mesh::new();
    for x in [-7.2f32, -2.4, 2.4, 7.2] {
        for z in [-2.7f32, 2.7] {
            cells.cube(v(x, 0.0, z), v(4.2, 8.0, 5.0), CL);
        }
    }
    let mut bars = Mesh::new();
    bars.cube(v(0.0, 4.3, -2.7), v(19.0, 0.4, 0.8), CU).cube(v(0.0, 4.3, 2.7), v(19.0, 0.4, 0.8), CU);
    let mut board = Mesh::new();
    board.cube(v(0.0, 4.8, 0.0), v(12.0, 0.3, 5.0), BD);
    let mut vent = Mesh::new();
    vent.put(&lathe(10.0, 16.0, 0.8, 0.8, 0.5, 0.5, ST), &Xf::at(v(0.0, 2.0, 0.0)));
    vec![
        (case, v(0.0, -4.0, 0.0)),
        (lid, v(0.0, 19.0, 0.0)),
        (cells, v(0.0, 8.0, 0.0)),
        (bars, v(0.0, 11.5, 0.0)),
        (board, v(0.0, 14.5, 0.0)),
        (vent, v(7.0, 0.0, 0.0)),
    ]
}

fn wing() -> Vec<Piece> {
    let mut ribs = Mesh::new();
    for x in [-11.0f32, -3.7, 3.7, 11.0] {
        ribs.cube(v(x, 0.0, 0.0), v(0.5, 6.8, 13.6), ST);
    }
    let cube = |c: V3, s: V3, m: u8| {
        let mut o = Mesh::new();
        o.cube(c, s, m);
        o
    };
    vec![
        (cube(v(0.0, 3.6, 0.0), v(26.0, 0.5, 14.0), SC), v(0.0, 11.0, 0.0)),
        (cube(v(0.0, -3.6, 0.0), v(26.0, 0.5, 14.0), SC), v(0.0, -11.0, 0.0)),
        (cube(v(0.0, 0.0, -7.0), v(26.0, 7.0, 0.6), SC), v(0.0, 0.0, -7.0)),
        (cube(v(0.0, 0.0, 7.0), v(26.0, 7.0, 0.6), SC), v(0.0, 0.0, 7.0)),
        (ribs, v(0.0, 0.0, 0.0)),
        (cube(v(0.0, 0.0, 0.0), v(24.0, 6.0, 13.0), FU), v(0.0, 0.0, 0.0)),
        (cube(v(0.0, 0.0, -10.0), v(26.0, 2.5, 3.0), SK), v(0.0, 0.0, -10.0)),
        (cube(v(0.0, -0.5, 10.5), v(26.0, 1.6, 5.0), SK), v(0.0, -3.0, 10.0)),
    ]
}

thread_local! {
    static CACHE: RefCell<[Option<Vec<Placed>>; 4]> = const { RefCell::new([None, None, None, None]) };
}

/// The height each model floats at above its plinth, and how much room its plinth gives it.
const LIFT: [f32; 4] = [15.5, 12.0, 10.0, 12.0];
const BASE: [(f32, f32); 4] = [(76.0, 72.0), (44.0, 48.0), (44.0, 36.0), (52.0, 48.0)];

fn draw_model(c: &mut Canvas, fr: &mut Frame, origin: V3, p: Option<&Params>, k: usize) {
    fr.mats = &MATS;
    let explode = p.map_or(0.0, |p| p.explode);
    let ease = explode * explode * (3.0 - 2.0 * explode);
    let mut base = Mesh::new();
    plinth(&mut base, BASE[k].0, BASE[k].1, 4.0, TOP, SIDE, TRIM);
    d3::draw(c, fr, &base, &Xf::at(origin), 1);
    let at = origin.add(v(0.0, LIFT[k], 0.0));
    CACHE.with(|cache| {
        let mut cache = cache.borrow_mut();
        let pieces = cache[k].get_or_insert_with(|| {
            let parts = match k {
                0 => engine(),
                1 => gear(),
                2 => battery(),
                _ => wing(),
            };
            parts.into_iter().map(|(mesh, apart)| {
                let foot = foot(&mesh);
                (mesh, apart, foot)
            }).collect()
        });
        let mut rods = Mesh::new();
        for (i, (mesh, apart, foot)) in pieces.iter().enumerate() {
            let off = apart.mul(ease);
            d3::draw(c, fr, mesh, &Xf::at(at.add(off)), 10 + i as u8);
            // a display rod from the plinth to the piece's underside, like the mounts in a museum case
            let top = LIFT[k] + foot.y + off.y;
            if top > 0.8 {
                let (x, z) = (foot.x + off.x, foot.z + off.z);
                rods.tube(&[v(x, 0.0, z), v(x, top, z)], 0.3, 6, TRIM);
                rods.cube(v(x, 0.15, z), v(1.8, 0.3, 1.8), TRIM);
            }
        }
        d3::draw(c, fr, &rods, &Xf::at(origin), 9);
    });
}

/// Where a piece's mount meets it: under the middle of its outline, at its lowest point.
fn foot(m: &Mesh) -> V3 {
    let (mut lo, mut hi) = (v(f32::MAX, f32::MAX, f32::MAX), v(f32::MIN, f32::MIN, f32::MIN));
    for t in &m.tris {
        for p in t.p {
            lo = v(lo.x.min(p.x), lo.y.min(p.y), lo.z.min(p.z));
            hi = v(hi.x.max(p.x), hi.y.max(p.y), hi.z.max(p.z));
        }
    }
    v((lo.x + hi.x) / 2.0, lo.y, (lo.z + hi.z) / 2.0)
}

pub fn draw_engine(c: &mut Canvas, fr: &mut Frame, o: V3, p: Option<&Params>) {
    draw_model(c, fr, o, p, 0);
}
pub fn draw_gear(c: &mut Canvas, fr: &mut Frame, o: V3, p: Option<&Params>) {
    draw_model(c, fr, o, p, 1);
}
pub fn draw_battery(c: &mut Canvas, fr: &mut Frame, o: V3, p: Option<&Params>) {
    draw_model(c, fr, o, p, 2);
}
pub fn draw_wing(c: &mut Canvas, fr: &mut Frame, o: V3, p: Option<&Params>) {
    draw_model(c, fr, o, p, 3);
}

/// Focus numbers are piece numbers.
pub fn focus_id(f: i32) -> u8 {
    if f < 0 { 0 } else { 10 + f as u8 }
}
