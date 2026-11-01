// The 787-9 in 3D, in meters: nose toward +x, up +y, right wing toward +z, the fuselage centerline on the x axis.
// Materials are roles (skin, wing, glass...), so the same airplane can be drawn painted on the runway or as an
// x-ray on the blueprint just by swapping the material table.

use crate::d3::{v, Mesh, Xf, V3};
use std::f32::consts::{PI, TAU};

pub const SKIN: u8 = 0;
pub const WING: u8 = 1;
pub const ENGINE: u8 = 2;
pub const METAL: u8 = 3;
pub const TIRE: u8 = 4;
pub const FIN: u8 = 5;
pub const DARK: u8 = 6;
pub const LIP: u8 = 7;

pub const R: f32 = 2.885;
/// The fuselage centerline's height above the ground with the gear down.
pub const GROUND: f32 = 5.45;

/// Parts the tour can point at, by id.
pub const FUSELAGE: u8 = 10;
pub const WINGS: u8 = 11;
pub const TAIL: u8 = 12;
pub const ENGINES: u8 = 13;
pub const GEAR: u8 = 14;
pub const NOSE: u8 = 15;

pub fn fuselage() -> Mesh {
    let mut m = Mesh::new();
    // the barrel and nose, turned about the centerline
    let nose: Vec<(f32, f32)> = (0..=10).map(|k| {
        let u = k as f32 / 10.0;
        (31.4 - 7.2 * u, R * (1.0 - (1.0 - u).powi(2)).sqrt().max(0.06))
    }).collect();
    let mut prof: Vec<(f32, f32)> = nose.into_iter().skip(1).collect();
    prof.insert(0, (31.4, 0.06));
    prof.extend([(12.0, R), (-12.6, R)]);
    m.turn(&prof, 28, 0.0, TAU, SKIN);
    // the tail cone sweeps up
    let cone: Vec<(f32, f32)> = (0..=8).map(|k| {
        let u = k as f32 / 8.0;
        (-18.8 * u, R - (R - 0.45) * u.powf(1.4))
    }).collect();
    let mut tail = Mesh::new();
    tail.turn(&cone, 24, 0.0, TAU, SKIN);
    m.put(&tail, &Xf::at(v(-12.6, 0.0, 0.0)).pitch(-0.085));
    // the belly fairing over the wing box
    let mut fair = Mesh::new();
    fair.turn(&[(9.0, 0.2), (6.0, 1.3), (-2.0, 1.45), (-7.0, 0.9), (-9.0, 0.2)], 16, PI, TAU, SKIN);
    m.put(&fair, &Xf::at(v(0.0, -2.05, 0.0)));
    m
}

pub fn nose() -> Mesh {
    let mut m = Mesh::new();
    m.turn(&[(31.42, 0.05), (31.0, 1.0), (30.0, 1.8), (29.4, 2.05)], 20, 0.0, TAU, SKIN);
    m
}

pub fn wings() -> Mesh {
    let mut m = Mesh::new();
    let outline = [(8.9, 2.6), (-9.6, 30.0), (-12.0, 29.7), (-5.0, 9.5), (-4.9, 2.6)];
    let mut right = Mesh::new();
    right.slab(&outline, -0.25, 0.25, WING);
    // the raked tip, and the flap track fairings under the trailing edge
    for z in [6.0f32, 12.0, 17.0, 22.0] {
        let x = -5.0 - (z - 9.5).max(0.0) * 0.21;
        right.cube(v(x - 0.4, -0.45, z), v(2.6, 0.5, 0.35), WING);
    }
    let dihedral = 0.1;
    m.put(&right, &Xf::at(v(0.0, -1.6, 0.0)).roll(-dihedral));
    m.put(&mirror(&right), &Xf::at(v(0.0, -1.6, 0.0)).roll(dihedral));
    m
}

pub fn tail() -> Mesh {
    let mut m = Mesh::new();
    let stab = [(-21.4, 1.2), (-27.6, 9.8), (-29.6, 9.9), (-29.8, 1.2)];
    let mut s = Mesh::new();
    s.slab(&stab, -0.15, 0.15, WING);
    m.put(&s, &Xf::at(v(0.0, 0.9, 0.0)));
    m.put(&mirror(&s), &Xf::at(v(0.0, 0.9, 0.0)));
    let mut fin = Mesh::new();
    fin.slab(&[(-16.0, 0.0), (-27.0, 9.2), (-30.4, 9.2), (-30.6, 0.0)], -0.22, 0.22, FIN);
    // stand the fin up: its outline's z becomes height
    m.put(&fin, &Xf::at(v(0.0, 2.1, 0.0)).roll(-PI / 2.0));
    m
}

/// One engine and its pylon, at the origin; place it under each wing.
pub fn engine() -> Mesh {
    let mut m = Mesh::new();
    m.turn(&[(3.6, 1.62), (3.3, 1.78), (1.0, 1.82), (-2.6, 1.62), (-3.4, 1.35)], 22, 0.0, TAU, ENGINE);
    m.lathe(3.62, 3.3, 1.62, 1.62, 1.42, 1.42, 22, 0.0, TAU, LIP);
    m.lathe(3.1, 3.05, 1.42, 1.42, 0.0, 0.0, 22, 0.0, TAU, DARK);
    m.turn(&[(-3.4, 1.0), (-4.6, 0.85), (-5.2, 0.3)], 16, 0.0, TAU, METAL);
    // the pylon up into the wing
    m.cube(v(-0.6, 1.9, 0.0), v(5.6, 0.9, 0.45), WING);
    m
}

/// Where the two engines sit: forward of the wing, below it.
pub const ENGINE_AT: [V3; 2] = [v(8.0, -3.6, 9.9), v(8.0, -3.6, -9.9)];

pub fn gear() -> Mesh {
    let mut m = Mesh::new();
    let wheel = |m: &mut Mesh, at: V3, r: f32| {
        let mut w = Mesh::new();
        w.lathe(-0.2, 0.2, r, r, 0.0, 0.0, 14, 0.0, TAU, TIRE);
        w.lathe(-0.22, 0.22, r * 0.5, r * 0.5, 0.0, 0.0, 10, 0.0, TAU, METAL);
        m.put(&w, &Xf::at(at).yaw(PI / 2.0));
    };
    for z in [4.8f32, -4.8] {
        m.tube(&[v(-1.0, -2.4, z), v(-1.0, -GROUND + 0.7, z)], 0.22, 8, METAL);
        m.tube(&[v(0.4, -2.2, z * 0.7), v(-1.0, -3.8, z)], 0.1, 6, METAL);
        m.cube(v(-1.0, -GROUND + 0.7, z), v(2.2, 0.25, 0.3), METAL);
        for x in [-1.8f32, -0.2] {
            for dz in [-0.45f32, 0.45] {
                wheel(&mut m, v(x, -GROUND + 0.66, z + dz), 0.66);
            }
        }
    }
    m.tube(&[v(23.8, -2.6, 0.0), v(23.8, -GROUND + 0.55, 0.0)], 0.16, 8, METAL);
    for dz in [-0.32f32, 0.32] {
        wheel(&mut m, v(23.8, -GROUND + 0.55, dz), 0.55);
    }
    m
}

fn mirror(m: &Mesh) -> Mesh {
    let mut o = Mesh::new();
    for t in &m.tris {
        let p = t.p.map(|p| v(p.x, p.y, -p.z));
        o.tri(p[0], p[2], p[1], t.mat);
    }
    o
}

/// The whole airplane, as (part id, mesh) pairs.
pub fn parts() -> Vec<(u8, Mesh)> {
    let mut engines = Mesh::new();
    for at in ENGINE_AT {
        engines.put(&engine(), &Xf::at(at));
    }
    vec![(FUSELAGE, fuselage()), (NOSE, nose()), (WINGS, wings()), (TAIL, tail()), (ENGINES, engines), (GEAR, gear())]
}
