// Diorama: a turbofan on its transport stand in a hangar corner, with a quarter of it cut away to show the inside.
// Cool bypass air streams around the core; core air is squeezed through the compressor stages, burns white hot in
// the combustor and cools through the turbines. The fan turns; the reverser's cowl slides back on cue.
// Units are tenths of a meter, the engine's axis along x at height AXIS, intake toward +x.

use crate::d3::{self, lit, mat, shaded, spark, Frame, Mat, Mesh, Px, Xf, V3, v};
use crate::flows;
use crate::gfx::{hash, mix, ramp, Canvas};
use crate::pal::*;
use crate::set::{plinth, BRASS, WOOD};
use crate::Params;
use std::cell::RefCell;
use std::f32::consts::{PI, TAU};

const AXIS: f32 = 22.0;
// the cut: a quarter facing the viewer (up and toward +z) is left open
const A0: f32 = 1.95;
const A1: f32 = 0.25 + TAU;

const TOP: u8 = 0;
const SIDE: u8 = 1;
const TRIM: u8 = 2;
const COWL: u8 = 3;
const CARBON: u8 = 4;
const STAGE: u8 = 5;
const WARM: u8 = 6;
const HOTM: u8 = 7;
const TURB: u8 = 8;
const LPSHAFT: u8 = 9;
const HPSHAFT: u8 = 10;
const STEEL: u8 = 11;
const STAND: u8 = 12;
const FADECM: u8 = 13;
const GEN: u8 = 14;
const CASCADE: u8 = 15;
const CUTM: u8 = 16;

const COWL_RAMP: [u32; 6] = [0x2a2860, 0x45428a, 0x6c6cb4, 0xa4a8dc, 0xdfe4ff, 0xffffff];

fn hangar(px: &Px, _m: &Mat) -> (u32, f32) {
    let p = px.p;
    // a painted hangar floor with hazard stripes around its edge
    let edge = (p.x.abs() - 36.0).max(p.z.abs() - 18.0);
    if edge > -3.0 && edge < 0.0 {
        let s = ((p.x + p.z) * 0.5).rem_euclid(2.0) < 1.0;
        return (if s { 0xffc63a } else { 0x1a1420 }, 0.0);
    }
    (ramp(&[0x2a2448, 0x342c56, 0x403664], 0.4 + px.lum * 0.4, px.dx, px.dy), 0.0)
}
fn cowl(px: &Px, m: &Mat) -> (u32, f32) {
    // a stripe of livery around the fan cowl
    if (12.0..15.0).contains(&px.p.x) {
        return (ramp(&LIVERY[2..], px.lum, px.dx, px.dy), 0.0);
    }
    (ramp(m.ramp, px.lum, px.dx, px.dy), 0.0)
}
fn cut(px: &Px, _m: &Mat) -> (u32, f32) {
    // the core casing, hatched like a section drawing
    let h = (px.p.x + px.p.y + px.p.z).rem_euclid(1.2) < 0.4;
    (if h { 0xff6ad5 } else { 0x6a2a8a }, if h { 0.08 } else { 0.0 })
}
fn combustor(px: &Px, _m: &Mat) -> (u32, f32) {
    let f = ((px.p.x * 1.3 + px.t * 9.0).sin() + (px.p.y * 2.0 - px.t * 7.0).sin()) * 0.12;
    (ramp(&HOT, 0.55 + f + px.lum * 0.25, px.dx, px.dy), 0.9)
}

pub static MATS: [Mat; 17] = [
    shaded(&COWL_RAMP, hangar),
    mat(&WOOD),
    mat(&BRASS),
    shaded(&COWL_RAMP, cowl),
    mat(&[0x1a1838, 0x2e2c5c, 0x4a4a8a, 0x8a8ad0, 0xd8dcff]),
    mat(&[0x4a4486, 0x7a76b8, 0xb0b0e0, 0xe8ecff]),
    mat(&[0x6a4a6a, 0xa07a8a, 0xe0b0a0, 0xffe0c0]),
    shaded(&HOT, combustor),
    lit(&[0x5a2a3a, 0x9a3a3a, 0xd0604a, 0xffb07a], 0xff6a2a, 0.25),
    lit(&[0x3a1a7a, 0x6a2ac8, 0xa04aff, 0xd8a0ff], 0xa04aff, 0.2),
    lit(&[0x0a5a6a, 0x1a8a9a, 0x3ac8d8, 0xa0f4ff], 0x3ac8d8, 0.2),
    mat(&METAL),
    mat(&[0x6a4a10, 0xb08a1a, 0xffc63a, 0xffe89a]),
    lit(&[0x1a4a3a, 0x2a8a5a, 0x5affa0], 0x5aff8a, 0.3),
    lit(&[0x0a4a6a, 0x1a8ac8, 0x5ae8ff], ELECTRIC, 0.2),
    mat(&[0x3a2a8a, 0x6a5ad8, 0xa898ff]),
    shaded(&COWL_RAMP, cut),
];

// focusable parts
pub const FAN: u8 = 20;
pub const BOOSTER: u8 = 21;
pub const HPC: u8 = 22;
pub const COMBUSTOR: u8 = 23;
pub const HPT: u8 = 24;
pub const LPT: u8 = 25;
pub const NOZZLE: u8 = 26;
pub const REVERSER: u8 = 27;
pub const SHAFTS: u8 = 28;
pub const FADEC: u8 = 29;
pub const GEARBOX: u8 = 30;

/// A ring of rotor or stator, cut open like everything else.
fn ring(m: &mut Mesh, x: f32, w: f32, r0: f32, r1: f32, mat_: u8) {
    m.lathe(x, x + w, r1, r1, r0, r0, 20, A0, A1, mat_);
}

fn build() -> Vec<(u8, Mesh)> {
    let mut out = Vec::new();
    let mut base = Mesh::new();
    plinth(&mut base, 80.0, 44.0, 5.0, TOP, SIDE, TRIM);
    // the transport stand: two cradles on a frame with casters
    for x in [-14.0f32, 10.0] {
        base.cube(v(x, 6.5, 0.0), v(3.0, 11.0, 3.0), STAND);
        base.cube(v(x, 1.2, 0.0), v(4.0, 1.6, 30.0), STAND);
        for z in [-14.0f32, 14.0] {
            let mut w = Mesh::new();
            w.lathe(-0.6, 0.6, 1.2, 1.2, 0.0, 0.0, 10, 0.0, TAU, STEEL);
            base.put(&w, &Xf::at(v(x, 1.2, z)).yaw(PI / 2.0));
        }
    }
    base.cube(v(-2.0, 1.5, 0.0), v(28.0, 1.0, 3.0), STAND);
    out.push((1, base));
    let at = Xf::at(v(0.0, AXIS, 0.0));
    let place = |m: Mesh| {
        let mut o = Mesh::new();
        o.put(&m, &at);
        o
    };
    // the nacelle: inlet lip and fan case (cut), then the core's tail casing
    let mut nac = Mesh::new();
    nac.lathe(24.0, 22.0, 15.6, 16.6, 14.4, 14.6, 28, A0, A1, COWL);
    nac.lathe(22.0, 8.0, 16.6, 16.8, 14.6, 14.6, 28, A0, A1, COWL);
    nac.lathe(-12.0, -26.0, 9.6, 8.0, 8.6, 7.2, 24, A0, A1, COWL);
    out.push((2, place(nac)));
    let mut fan = Mesh::new();
    fan.turn(&[(23.0, 0.1), (20.0, 2.4), (17.5, 3.0)], 16, 0.0, TAU, STEEL);
    out.push((FAN, place(fan)));
    // booster, high pressure compressor, combustor, turbines: rings stepping down, then up
    let mut b = Mesh::new();
    for k in 0..4 {
        ring(&mut b, 12.0 - k as f32 * 1.6, 0.7, 3.4, 6.6, STAGE);
    }
    out.push((BOOSTER, place(b)));
    let mut h = Mesh::new();
    for k in 0..10 {
        let x = 5.0 - k as f32 * 1.05;
        ring(&mut h, x, 0.5, 3.2, 5.8 - k as f32 * 0.18, if k > 5 { WARM } else { STAGE });
    }
    out.push((HPC, place(h)));
    let mut comb = Mesh::new();
    comb.lathe(-6.0, -10.5, 6.4, 6.4, 3.4, 3.4, 22, A0, A1, HOTM);
    out.push((COMBUSTOR, place(comb)));
    let mut hpt = Mesh::new();
    for k in 0..2 {
        ring(&mut hpt, -11.2 - k as f32 * 1.3, 0.8, 3.2, 6.0, TURB);
    }
    out.push((HPT, place(hpt)));
    let mut lpt = Mesh::new();
    for k in 0..6 {
        ring(&mut lpt, -14.0 - k as f32 * 1.8, 1.0, 3.2, 6.4 + k as f32 * 0.4, TURB);
    }
    out.push((LPT, place(lpt)));
    let mut casing = Mesh::new();
    casing.lathe(13.0, -12.0, 7.4, 8.4, 7.0, 7.9, 24, A0, A1, CUTM);
    out.push((3, place(casing)));
    // shafts: low pressure inside high pressure
    let mut sh = Mesh::new();
    sh.lathe(-26.0, 18.0, 1.0, 1.0, 0.0, 0.0, 10, 0.0, TAU, LPSHAFT);
    sh.lathe(-13.0, 6.0, 2.0, 2.0, 1.3, 1.3, 12, 0.0, TAU, HPSHAFT);
    out.push((SHAFTS, place(sh)));
    let mut plug = Mesh::new();
    plug.turn(&[(-24.0, 4.4), (-30.0, 2.8), (-34.0, 0.2)], 16, 0.0, TAU, STEEL);
    out.push((NOZZLE, place(plug)));
    // the FADEC on the fan case, the gearbox and starter generators below the core
    let mut fadec = Mesh::new();
    fadec.cube(v(14.0, AXIS - 17.6, 4.0), v(4.0, 1.4, 3.0), FADECM);
    out.push((FADEC, fadec));
    let mut gb = Mesh::new();
    gb.cube(v(4.0, AXIS - 10.6, 0.0), v(9.0, 1.6, 3.0), STEEL);
    for x in [1.0f32, 7.0] {
        let mut g = Mesh::new();
        g.lathe(-1.2, 1.2, 1.4, 1.4, 0.0, 0.0, 10, 0.0, TAU, GEN);
        gb.put(&g, &Xf::at(v(x, AXIS - 12.4, 0.0)).yaw(PI / 2.0));
    }
    out.push((GEARBOX, gb));
    out
}

thread_local! {
    static MESHES: RefCell<Option<Vec<(u8, Mesh)>>> = const { RefCell::new(None) };
}

pub fn draw(c: &mut Canvas, fr: &mut Frame, origin: V3, p: Option<&Params>) {
    fr.mats = &MATS;
    let t = fr.t;
    let rev = fr.anim.clamp(0.0, 1.0);
    let o = Xf::at(origin);
    MESHES.with(|m| {
        let mut m = m.borrow_mut();
        let parts = m.get_or_insert_with(build);
        for (id, mesh) in parts.iter() {
            d3::draw(c, fr, mesh, &o, *id);
        }
    });
    // the fan's blades, turning; the translating cowl, sliding aft to open the reverser's cascades
    let axis = origin.add(v(0.0, AXIS, 0.0));
    let mut blades = Mesh::new();
    blades.blades(19.0, 3.0, 14.2, 2.4, 22, 0.55, CARBON);
    d3::draw(c, fr, &blades, &Xf::at(axis).roll(t * 3.0), FAN);
    let mut cowl = Mesh::new();
    cowl.lathe(8.0 - rev * 5.0, -8.0 - rev * 5.0, 16.8, 15.6, 14.6, 14.2, 28, A0, A1, COWL);
    if rev > 0.05 {
        cowl.lathe(8.0, 8.0 - rev * 5.0, 16.2, 16.2, 14.8, 14.8, 28, A0, A1, CASCADE);
    }
    d3::draw(c, fr, &cowl, &Xf::at(axis), REVERSER);
    let f = p.map_or(flows::CORE | flows::BYPASS, |p| p.flows);
    let cam = fr.cam;
    let at = |x: f32, r: f32, a: f32| axis.add(v(x, a.cos() * r, a.sin() * r));
    // air: particles in the open quarter, so they read against the cut
    if f & flows::BYPASS != 0 {
        for i in 0..120u32 {
            let a = 0.55 + hash(i) * 1.1;
            let r = 9.0 + hash(i + 3) * 5.2;
            let x = 26.0 - (hash(i + 9) * 70.0 + t * (18.0 + hash(i + 5) * 6.0)).rem_euclid(70.0);
            let (x, r) = if rev > 0.5 && x < 6.0 { (6.0 + (6.0 - x) * 0.6, r + (6.0 - x) * 0.9) } else { (x, r * (1.0 - ((-8.0 - x).max(0.0) / 60.0))) };
            spark(c, &cam, at(x, r, a), 0.35, COLD[2], 0.35);
        }
    }
    if f & flows::CORE != 0 {
        for i in 0..110u32 {
            let a = 0.55 + hash(i + 50) * 1.1;
            let u = (hash(i + 21) + t * 0.18).rem_euclid(1.0);
            let x = 13.0 - u * 50.0;
            let r = 3.6 + hash(i + 7) * 2.6;
            // temperature along the core: compressed and warming, burning, then cooling through the turbines
            let heat = if x > -6.0 { (13.0 - x) / 19.0 * 0.35 } else if x > -10.5 { 0.35 + (-6.0 - x) / 4.5 * 0.65 } else { (1.0 - (-10.5 - x) / 30.0 * 0.7).max(0.3) };
            let col = if heat < 0.35 { mix(COLD[2], 0xffd0a0, heat / 0.35) } else { HOT[((heat * 5.0) as usize).min(5)] };
            spark(c, &cam, at(x, r, a), 0.3 + heat * 0.5, col, 0.3 + heat * heat);
        }
    }
}

pub fn focus_id(f: i32) -> u8 {
    match f {
        0 => FAN,
        1 => BOOSTER,
        2 => HPC,
        3 => COMBUSTOR,
        4 => HPT,
        5 => LPT,
        6 => NOZZLE,
        7 => REVERSER,
        8 => SHAFTS,
        9 => FADEC,
        10 => GEARBOX,
        _ => 0,
    }
}
