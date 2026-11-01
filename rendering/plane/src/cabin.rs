// Diorama: a slice of the cabin, a dollhouse cut out of the fuselage. Six rows of nine seats with someone in each,
// bins overhead, mood lighting, windows on the far wall that dim on cue, the floor beams and the cargo hold with
// its containers below. Conditioned air comes out over the seats in loops and leaves low on the walls.
// Units are tenths of a meter; the barrel's axis runs along x at height AXIS.

use crate::d3::{self, lit, mat, shaded, spark, Frame, Mat, Mesh, Px, Xf, V3, v};
use crate::flows;
use crate::gfx::{hash, mix, ramp, Canvas};
use crate::pal::*;
use crate::set::{plinth, BRASS, WOOD};
use crate::Params;
use std::cell::RefCell;
use std::f32::consts::{PI, TAU};

const AXIS: f32 = 31.0;
const R: f32 = 29.0;
const FLOOR: f32 = 24.5;
// the barrel is cut open toward the viewer (+z) and over the top
const A0: f32 = 1.75;
const A1: f32 = 5.35;

const TOP: u8 = 0;
const SIDE: u8 = 1;
const TRIM: u8 = 2;
const SHELLM: u8 = 3;
const FLOORM: u8 = 4;
const SEATM: u8 = 5;
const BIN: u8 = 6;
const WINDOWM: u8 = 7;
const CARGO: u8 = 8;
const MOOD: u8 = 9;
const HEAD: u8 = 10;
const SHIRT: u8 = 11;
const FAN: u8 = 12;
const BEAM: u8 = 13;
const CUSHION: u8 = 14;

fn shell(px: &Px, _m: &Mat) -> (u32, f32) {
    // carbon fiber plies on the cut edge, lining panels inside
    let p = px.p;
    let r = ((p.y - AXIS).powi(2) + p.z.powi(2)).sqrt();
    if r > R - 0.4 {
        let ply = (r * 6.0).rem_euclid(1.0) < 0.3;
        return (if ply { 0x8a86c8 } else { ramp(&COMPOSITE, px.lum, px.dx, px.dy) }, 0.0);
    }
    (ramp(&[0x8a84b8, 0xb8b2dc, 0xe0dcf4, 0xf4f2ff], px.lum, px.dx, px.dy), 0.0)
}
fn window(px: &Px, _m: &Mat) -> (u32, f32) {
    // the evening outside, darkening to deep blue as the glass is dimmed
    let dim = px.anim;
    let u = ((px.p.y - 34.0) / 5.0).clamp(0.0, 1.0);
    let sky = ramp(&SKY[4..], 1.0 - u, px.dx, px.dy);
    (mix(sky, 0x0a1440, dim * 0.9), 0.35 * (1.0 - dim))
}
fn floor(px: &Px, _m: &Mat) -> (u32, f32) {
    let p = px.p;
    // carpet down the aisles, a pattern of tiny diamonds
    let d = ((p.x * 0.7).rem_euclid(1.0) - 0.5).abs() + ((p.z * 0.7).rem_euclid(1.0) - 0.5).abs() < 0.2;
    (if d { 0x6a3ac8 } else { ramp(&[0x2a1a5a, 0x3a2470], px.lum, px.dx, px.dy) }, 0.0)
}
fn mood(px: &Px, _m: &Mat) -> (u32, f32) {
    let col = mix(0xff6ad5, 0x7a6aff, (px.t * 0.3 + px.p.x * 0.05).sin() * 0.5 + 0.5);
    (col, 0.7)
}

pub static MATS: [Mat; 15] = [
    shaded(&WOOD, floor),
    mat(&WOOD),
    mat(&BRASS),
    shaded(&COMPOSITE, shell),
    shaded(&WOOD, floor),
    mat(&[0x2a1a6a, 0x4a26a0, 0x6a3ac8, 0x8a5ae0]),
    mat(&[0xb8b4d8, 0xd8d4ec, 0xf0eeff]),
    shaded(&SKY, window),
    mat(&[0x3a3a5a, 0x5a5a80, 0x7a7aa6, 0xa0a0c8]),
    shaded(&SKY, mood),
    mat(&[0x8a5a3a, 0xc08a60, 0xf0c8a0]),
    mat(&[0xa02a6a, 0xff4a8a, 0xff9ac0]),
    lit(&[0x9ab0e0, 0xe8f0ff], AIR, 0.2),
    mat(&METAL),
    mat(&[0x6a3a10, 0xb8681a, 0xffa84a]),
];

pub const WINDOWS: u8 = 20;
pub const OUTLETS: u8 = 21;
pub const FILTERS: u8 = 22;
pub const HOLD: u8 = 23;
pub const BARREL: u8 = 24;
pub const SEATS: u8 = 25;

fn build() -> Vec<(u8, Mesh)> {
    let mut out = Vec::new();
    let mut base = Mesh::new();
    plinth(&mut base, 70.0, 70.0, 5.0, TOP, SIDE, TRIM);
    out.push((1, base));
    // the barrel, cut open, laid along x
    let mut b = Mesh::new();
    b.lathe(-24.0, 24.0, R, R, R - 1.6, R - 1.6, 40, A0, A1, SHELLM);
    let mut barrel = Mesh::new();
    barrel.put(&b, &Xf::at(v(0.0, AXIS, 0.0)));
    for x in [-24.0f32, -16.0, -8.0, 0.0, 8.0, 16.0, 24.0] {
        let mut f = Mesh::new();
        f.lathe(x - 0.3, x + 0.3, R - 1.4, R - 1.4, R - 2.4, R - 2.4, 40, A0, A1, BEAM);
        barrel.put(&f, &Xf::at(v(0.0, AXIS, 0.0)));
    }
    out.push((BARREL, barrel));
    // the floor and its beams, the hold below
    let mut fl = Mesh::new();
    fl.cube(v(0.0, FLOOR - 0.4, 0.0), v(48.0, 0.8, 50.0), FLOORM);
    for x in [-20.0f32, -10.0, 0.0, 10.0, 20.0] {
        fl.cube(v(x, FLOOR - 1.8, 0.0), v(0.8, 2.2, 50.0), BEAM);
    }
    out.push((2, fl));
    let mut hold = Mesh::new();
    for x in [-15.0f32, 0.0, 15.0] {
        for z in [-8.0f32, 8.0] {
            hold.cube(v(x, 13.0, z), v(13.0, 14.0, 14.0), CARGO);
            hold.cube(v(x, 13.0, z + 7.05), v(9.0, 3.0, 0.2), SHIRT);
        }
    }
    out.push((HOLD, hold));
    // recirculation fans and filters under the floor, near the far wall
    let mut filt = Mesh::new();
    for x in [-8.0f32, 8.0] {
        let mut f = Mesh::new();
        f.lathe(-1.6, 1.6, 2.6, 2.6, 0.0, 0.0, 12, 0.0, TAU, FAN);
        filt.put(&f, &Xf::at(v(x, 21.0, -18.0)));
    }
    out.push((FILTERS, filt));
    // nine seats across, 3-3-3, six rows, someone in each seat
    let mut seats = Mesh::new();
    let mut people = Mesh::new();
    let zs = [-20.0f32, -16.0, -12.0, -4.0, 0.0, 4.0, 12.0, 16.0, 20.0];
    for row in 0..6 {
        let x = -19.0 + row as f32 * 7.6;
        for (k, &z) in zs.iter().enumerate() {
            seats.cube(v(x, FLOOR + 2.4, z), v(3.6, 1.2, 3.4), SEATM);
            seats.cube(v(x - 1.6, FLOOR + 5.0, z), v(0.8, 6.0, 3.4), SEATM);
            seats.cube(v(x - 1.2, FLOOR + 7.6, z), v(0.6, 1.2, 2.2), CUSHION);
            if hash(row * 9 + k as u32) > 0.12 {
                people.cube(v(x - 0.2, FLOOR + 5.0, z), v(1.8, 3.6, 2.4), SHIRT);
                let mut head = Mesh::new();
                head.turn(&[(-1.0, 0.1), (-0.6, 0.85), (0.4, 0.9), (1.0, 0.1)], 8, 0.0, TAU, HEAD);
                people.put(&head, &Xf::at(v(x - 0.2, FLOOR + 8.0, z)).pitch(PI / 2.0));
            }
        }
    }
    out.push((SEATS, seats));
    out.push((3, people));
    // bins over the seats, the ceiling strip with its mood lighting and air outlets
    let mut bins = Mesh::new();
    for z in [-17.5f32, 0.0, 17.5] {
        bins.cube(v(0.0, 45.0, z), v(48.0, 4.0, if z == 0.0 { 10.0 } else { 7.0 }), BIN);
    }
    out.push((4, bins));
    let mut strip = Mesh::new();
    strip.cube(v(0.0, 48.6, -9.0), v(48.0, 0.6, 1.4), MOOD);
    strip.cube(v(0.0, 48.6, 9.0), v(48.0, 0.6, 1.4), MOOD);
    out.push((OUTLETS, strip));
    // windows on the far wall
    let mut win = Mesh::new();
    for row in 0..6 {
        let x = -20.0 + row as f32 * 7.6;
        win.quad(v(x - 1.3, 34.0, -26.9), v(x + 1.3, 34.0, -26.9), v(x + 1.3, 39.0, -26.4), v(x - 1.3, 39.0, -26.4), WINDOWM);
    }
    out.push((WINDOWS, win));
    out
}

thread_local! {
    static MESHES: RefCell<Option<Vec<(u8, Mesh)>>> = const { RefCell::new(None) };
}

pub fn draw(c: &mut Canvas, fr: &mut Frame, origin: V3, p: Option<&Params>) {
    fr.mats = &MATS;
    let o = Xf::at(origin);
    MESHES.with(|m| {
        let mut m = m.borrow_mut();
        let parts = m.get_or_insert_with(build);
        for (id, mesh) in parts.iter() {
            d3::draw(c, fr, mesh, &o, *id);
        }
    });
    let f = p.map_or(flows::AIR, |p| p.flows);
    if f & flows::AIR != 0 {
        let cam = fr.cam;
        // each outlet sends air down in a loop over its seats and out low on the wall, then under the floor to
        // the fans and filters, and back up
        for x in [-15.0f32, 0.0, 15.0] {
            for side in [-1.0f32, 1.0] {
                let pts: Vec<V3> = (0..=14).map(|j| {
                    let u = j as f32 / 14.0;
                    let z = side * (9.0 + u * 16.0);
                    let y = 48.0 - (u * PI).sin() * 6.0 - u * u * 20.0;
                    origin.add(v(x, y, z))
                }).collect();
                d3::flow(c, &cam, &pts, 0.25, 0x6a8ad8, AIR, 8.0, 0.9);
            }
            d3::flow(c, &cam, &[origin.add(v(x, FLOOR + 1.0, -25.0)), origin.add(v(x, 21.0, -22.0)), origin.add(v(x * 0.5, 21.0, -18.0))], 0.3, 0x6a8ad8, AIR, 7.0, 0.8);
        }
        for x in [-8.0f32, 8.0] {
            d3::flow(c, &cam, &[origin.add(v(x, 21.0, -18.0)), origin.add(v(x, 21.0, -26.0)), origin.add(v(x, 44.0, -26.0)), origin.add(v(x, 48.0, -9.0))], 0.3, 0x8ab0ff, AIR_CORE, 7.0, 0.9);
            spark(c, &cam, origin.add(v(x, 21.0, -15.2)), 1.2, AIR, 0.8);
        }
    }
}

pub fn focus_id(f: i32) -> u8 {
    match f {
        0 => WINDOWS,
        1 => OUTLETS,
        2 => FILTERS,
        3 => HOLD,
        4 => BARREL,
        5 => SEATS,
        _ => 0,
    }
}
