// Diorama: the flight deck, cut out of the nose and set on a plinth with its roof off. Two seats, two control
// columns, the main panel with its four live displays, the glareshield and autopilot panel, the pedestal with the
// thrust levers (they move with the tour), the overhead panel, the head-up display glasses and the windscreen.
// Units are tenths of a meter; the crew faces -z.

use crate::d3::{self, lit, mat, shaded, Frame, Mat, Mesh, Px, Xf, V3, v};
use crate::gfx::{hash, ramp, Canvas};
use crate::pal::*;
use crate::screens;
use crate::set::{plinth, BRASS, WOOD};
use crate::Params;
use std::cell::RefCell;
use std::f32::consts::PI;

const TOP: u8 = 0;
const SIDE: u8 = 1;
const TRIM: u8 = 2;
const SHELL: u8 = 3;
const PANELM: u8 = 4;
const PFDM: u8 = 5;
const NDM: u8 = 6;
const EICASM: u8 = 7;
const MFDM: u8 = 8;
const SEAT: u8 = 9;
const CUSHION: u8 = 10;
const METALM: u8 = 11;
const WINDOW: u8 = 12;
const HUDM: u8 = 13;
const OVERHEAD: u8 = 14;
const MCPM: u8 = 15;
const KEYS: u8 = 16;
const LEVER: u8 = 17;
const CARPET: u8 = 18;

const PANEL_RAMP: [u32; 5] = [0x1a1830, 0x24203e, 0x302a4e, 0x3c3460, 0x4a4072];
const SHELL_RAMP: [u32; 5] = [0x4a4486, 0x6a66a8, 0x9a98cc, 0xcfd2f0, 0xf4f6ff];
const SEATS: [u32; 5] = [0x3a0e4a, 0x6a1a6a, 0xa02a7a, 0xd84a8a, 0xff7aa8];
const CUSH: [u32; 4] = [0x6a3a10, 0xb8681a, 0xffa84a, 0xffd88a];

fn floor(px: &Px, _m: &Mat) -> (u32, f32) {
    // a checkered hangar floor in two violets, as if the section were lifted out onto a workbench
    let p = px.p;
    let ch = ((p.x / 6.0).floor() as i32 + (p.z / 6.0).floor() as i32) & 1;
    (ramp(if ch == 0 { &[0x1a1040, 0x24164f] } else { &[0x2a1a5a, 0x34226a] }, px.lum, px.dx, px.dy), 0.0)
}
fn carpet(px: &Px, _m: &Mat) -> (u32, f32) {
    let p = px.p;
    let dot = (p.x * 0.8).rem_euclid(1.0) < 0.3 && (p.z * 0.8).rem_euclid(1.0) < 0.3;
    (if dot { 0x5a3aa0 } else { ramp(&[0x1e1440, 0x2a1c56], px.lum, px.dx, px.dy) }, 0.0)
}

// the four screens and the autopilot panel: (u, v) from each screen's top left corner, which `screen_quad` puts at
// the mesh's local origin, one unit wide and tall
fn uv(px: &Px) -> (f32, f32) {
    (px.p.x, 1.0 - px.p.y)
}
fn pfd(px: &Px, _m: &Mat) -> (u32, f32) {
    let (u, v) = uv(px);
    (screens::sample(screens::PFD, u, v), 0.35)
}
fn nd(px: &Px, _m: &Mat) -> (u32, f32) {
    let (u, v) = uv(px);
    (screens::sample(screens::ND, u, v), 0.35)
}
fn eicas(px: &Px, _m: &Mat) -> (u32, f32) {
    let (u, v) = uv(px);
    (screens::sample(screens::EICAS, u, v), 0.35)
}
fn mfd(px: &Px, _m: &Mat) -> (u32, f32) {
    let (u, v) = uv(px);
    (screens::sample(screens::MFD, u, v), 0.35)
}
fn mcp(px: &Px, _m: &Mat) -> (u32, f32) {
    // windows of amber digits and rows of mode buttons, some lit green
    let (u, v) = uv(px);
    let cell = ((u * 12.0) as i32, (v * 3.0) as i32);
    let (fu, fv) = ((u * 12.0).fract(), (v * 3.0).fract());
    if cell.1 == 0 && cell.0 % 3 != 2 && fu > 0.1 && fv > 0.2 && fv < 0.8 {
        let digit = (hash((cell.0 * 7) as u32 + (fu * 4.0) as u32) * 10.0) as u32;
        return (if digit > 3 { SYM_AMBER } else { 0x3a2a10 }, 0.4);
    }
    if cell.1 == 2 && fu > 0.15 && fu < 0.85 && fv > 0.3 && fv < 0.7 {
        let on = matches!(cell.0, 1 | 4 | 7) || (cell.0 == 9 && (px.t * 2.0).sin() > 0.0);
        return (if on { SYM_GREEN } else { 0x2a2440 }, if on { 0.6 } else { 0.0 });
    }
    (ramp(&PANEL_RAMP[1..], px.lum, px.dx, px.dy), 0.0)
}
fn overhead(px: &Px, _m: &Mat) -> (u32, f32) {
    // push-button annunciators in a grid: most dark, some lit blue, a few amber
    let p = px.p;
    let (cx, cz) = ((p.x / 2.2).floor() as i32, (p.z / 2.0).floor() as i32);
    let (fx, fz) = ((p.x / 2.2).rem_euclid(1.0), (p.z / 2.0).rem_euclid(1.0));
    if fx > 0.15 && fx < 0.85 && fz > 0.2 && fz < 0.8 {
        let k = hash((cx * 131 + cz * 17) as u32);
        let col = if k > 0.86 { SYM_AMBER } else if k > 0.58 { 0x6ab8ff } else { 0x2a2448 };
        return (col, if k > 0.58 { 0.5 } else { 0.0 });
    }
    (ramp(&[0x2a2448, 0x342c56, 0x403664], px.lum, px.dx, px.dy), 0.0)
}
fn window(px: &Px, _m: &Mat) -> (u32, f32) {
    // the sunset outside, with the runway's lights ahead
    let p = px.p;
    let u = ((p.y - 14.0) / 7.0).clamp(0.0, 1.0);
    let base = ramp(&SKY[3..], 1.0 - u, px.dx, px.dy);
    if u < 0.12 && ((p.x * 1.3 + px.t * 6.0).rem_euclid(5.0)) < 0.4 {
        return (0xfff1a0, 0.6);
    }
    (base, 0.18)
}
fn keys(px: &Px, _m: &Mat) -> (u32, f32) {
    let p = px.p;
    if (p.x * 1.4).rem_euclid(1.0) < 0.7 && (p.z * 1.6).rem_euclid(1.0) < 0.6 {
        let lit = hash(((p.x * 1.4) as i32 * 31 + (p.z * 1.6) as i32) as u32) > 0.75;
        return (if lit { 0x6a8aff } else { 0x3a3460 }, if lit { 0.4 } else { 0.0 });
    }
    (0x1e1a34, 0.0)
}

pub static MATS: [Mat; 19] = [
    shaded(&PANEL_RAMP, floor),
    mat(&WOOD),
    mat(&BRASS),
    mat(&SHELL_RAMP),
    mat(&PANEL_RAMP),
    shaded(&PANEL_RAMP, pfd),
    shaded(&PANEL_RAMP, nd),
    shaded(&PANEL_RAMP, eicas),
    shaded(&PANEL_RAMP, mfd),
    mat(&SEATS),
    mat(&CUSH),
    mat(&METAL),
    shaded(&SKY, window),
    Mat { ramp: &[0x2a8a4a, 0x5aff8a], glow: SYM_GREEN, k: 0.0, sheer: 2, shader: None },
    shaded(&PANEL_RAMP, overhead),
    shaded(&PANEL_RAMP, mcp),
    shaded(&PANEL_RAMP, keys),
    lit(&METAL, 0xffe27a, 0.0),
    shaded(&PANEL_RAMP, carpet),
];

/// A screen: a unit square in its own x-y plane. It is drawn through its placement rather than baked, so its
/// shader still sees the square's own (u, v).
fn unit(mat_: u8) -> Mesh {
    let mut q = Mesh::new();
    q.quad(v(0.0, 0.0, 0.0), v(1.0, 0.0, 0.0), v(1.0, 1.0, 0.0), v(0.0, 1.0, 0.0), mat_);
    q
}

// focusable parts
pub const PFD_ID: u8 = 20;
pub const ND_ID: u8 = 21;
pub const EICAS_ID: u8 = 22;
pub const HUD_ID: u8 = 23;
pub const MCP_ID: u8 = 24;
pub const KEYS_ID: u8 = 25;
pub const PEDESTAL_ID: u8 = 26;
pub const OVERHEAD_ID: u8 = 27;
pub const YOKE_ID: u8 = 28;

/// The main panel leans back toward the crew.
const LEAN: f32 = 0.32;

/// The deck's parts, baked; and its screens, each drawn through its own placement.
type Parts = (Vec<(u8, Mesh)>, Vec<(u8, Mesh, Xf)>);

fn build() -> Parts {
    let mut out = Vec::new();
    let mut screens = Vec::new();
    let mut base = Mesh::new();
    plinth(&mut base, 64.0, 56.0, 5.0, TOP, SIDE, TRIM);
    base.cube(v(0.0, 0.5, -2.0), v(34.0, 1.0, 34.0), CARPET);
    out.push((1, base));
    // the nose shell, cut down to a tub so the deck is a dollhouse
    let mut shell = Mesh::new();
    // only the lower part, a tub around the floor, so it never stands between the camera and the crew's view
    shell.lathe(-14.0, 14.0, 20.0, 20.0, 19.0, 19.0, 24, PI * 1.12, PI * 1.88, SHELL);
    let mut sh = Mesh::new();
    sh.put(&shell, &Xf::at(v(0.0, 16.0, 0.0)).yaw(PI / 2.0));
    out.push((2, sh));
    // the main panel and its displays
    let mut panel = Mesh::new();
    let lean = Xf::at(v(0.0, 8.0, -15.0)).roll(-LEAN);
    let mut slab = Mesh::new();
    slab.cube(v(0.0, 3.4, 0.0), v(34.0, 7.0, 1.0), PANELM);
    panel.put(&slab, &lean);
    out.push((3, panel));
    let screen_at = |x: f32| Xf::at(v(0.0, 8.0, -15.0)).roll(-LEAN).then_local(v(x, 0.6, 0.55)).scale(6.0);
    for (x, id, m) in [(-15.5f32, PFD_ID, PFDM), (-8.6, ND_ID, NDM), (2.6, EICAS_ID, EICASM), (9.5, PFD_ID, PFDM)] {
        screens.push((id, unit(m), screen_at(x)));
    }
    // the glareshield, with the autopilot's panel on its face
    let mut glare = Mesh::new();
    glare.cube(v(0.0, 15.6, -16.0), v(36.0, 1.6, 4.0), PANELM);
    out.push((4, glare));
    screens.push((MCP_ID, unit(MCPM), Xf::at(v(-8.0, 14.85, -13.95)).scale_xy(16.0, 1.5)));
    // the windscreen beyond: four panes leaning back
    let mut win = Mesh::new();
    for (x0, x1) in [(-17.0f32, -9.0f32), (-8.4, -0.4), (0.4, 8.4), (9.0, 17.0)] {
        win.quad(v(x0, 16.6, -18.5), v(x1, 16.6, -18.5), v(x1 * 0.9, 21.4, -15.0), v(x0 * 0.9, 21.4, -15.0), WINDOW);
    }
    for x in [-17.4f32, -8.7, 0.0, 8.7, 17.4] {
        win.tube(&[v(x, 16.4, -18.6), v(x * 0.9, 21.6, -15.0)], 0.35, 6, PANELM);
    }
    out.push((5, win));
    // the head-up display glasses, folded down in front of each seat
    let mut hud = Mesh::new();
    for x in [-8.0f32, 8.0] {
        hud.quad(v(x - 2.5, 15.8, -12.0), v(x + 2.5, 15.8, -12.0), v(x + 2.5, 19.2, -12.8), v(x - 2.5, 19.2, -12.8), HUDM);
    }
    out.push((HUD_ID, hud));
    // the pedestal between the seats
    let mut ped = Mesh::new();
    ped.cube(v(0.0, 4.5, -8.0), v(6.0, 7.0, 10.0), PANELM);
    ped.cube(v(0.0, 8.2, -10.0), v(5.6, 0.4, 5.0), PANELM);
    out.push((PEDESTAL_ID, ped));
    let mut keysm = Mesh::new();
    keysm.cube(v(-1.6, 8.2, -5.6), v(2.4, 0.5, 3.0), KEYS);
    keysm.cube(v(1.6, 8.2, -5.6), v(2.4, 0.5, 3.0), KEYS);
    out.push((KEYS_ID, keysm));
    screens.push((KEYS_ID, unit(MFDM), Xf::at(v(-2.6, 8.0, -13.0)).roll(-0.9).scale(5.2)));
    // the overhead panel, sloping up from the windscreen
    let mut over = Mesh::new();
    over.quad(v(-9.0, 21.6, -14.0), v(9.0, 21.6, -14.0), v(9.0, 23.0, -4.0), v(-9.0, 23.0, -4.0), OVERHEAD);
    out.push((OVERHEAD_ID, over));
    // two seats in maximalist upholstery
    let mut seats = Mesh::new();
    for x in [-8.0f32, 8.0] {
        seats.cube(v(x, 3.0, 2.0), v(6.0, 2.0, 6.0), SEAT);
        seats.cube(v(x, 3.9, 2.0), v(5.4, 0.6, 5.4), CUSHION);
        seats.cube(v(x, 8.0, 5.2), v(6.0, 9.0, 1.6), SEAT);
        seats.cube(v(x, 13.2, 5.2), v(3.6, 2.0, 1.4), CUSHION);
        seats.cube(v(x - 3.4, 5.4, 2.0), v(0.8, 0.8, 5.0), SEAT);
        seats.cube(v(x + 3.4, 5.4, 2.0), v(0.8, 0.8, 5.0), SEAT);
        seats.tube(&[v(x, 1.0, 2.0), v(x, 2.0, 2.0)], 1.0, 8, METALM);
    }
    out.push((6, seats));
    // the control columns and wheels, and the rudder pedals
    let mut yoke = Mesh::new();
    for x in [-8.0f32, 8.0] {
        yoke.tube(&[v(x, 1.0, -9.0), v(x, 7.0, -8.0), v(x, 9.0, -6.5)], 0.5, 8, METALM);
        yoke.cube(v(x, 9.2, -6.3), v(6.0, 1.2, 0.8), SEAT);
        yoke.cube(v(x - 3.2, 10.0, -6.3), v(1.0, 2.4, 0.9), SEAT);
        yoke.cube(v(x + 3.2, 10.0, -6.3), v(1.0, 2.4, 0.9), SEAT);
        yoke.cube(v(x - 1.5, 1.6, -12.0), v(1.2, 1.2, 2.4), METALM);
        yoke.cube(v(x + 1.5, 1.6, -12.0), v(1.2, 1.2, 2.4), METALM);
    }
    out.push((YOKE_ID, yoke));
    (out, screens)
}

thread_local! {
    static MESHES: RefCell<Option<Parts>> = const { RefCell::new(None) };
}

pub fn draw(c: &mut Canvas, fr: &mut Frame, origin: V3, p: Option<&Params>) {
    fr.mats = &MATS;
    let thrust = fr.anim.clamp(0.0, 1.0);
    screens::paint(fr.t, thrust);
    let at = Xf::at(origin);
    MESHES.with(|m| {
        let mut m = m.borrow_mut();
        let (parts, screens) = m.get_or_insert_with(build);
        // see-through glass last
        for (id, mesh) in parts.iter().filter(|(id, _)| *id != HUD_ID) {
            d3::draw(c, fr, mesh, &at, *id);
        }
        for (id, mesh, xf) in screens.iter() {
            d3::draw(c, fr, mesh, &xf.moved(origin), *id);
        }
        // the thrust levers, forward with the tour's thrust
        let mut lev = Mesh::new();
        for x in [-0.9f32, 0.9] {
            let tip = v(x, 9.0 + thrust * 0.6, -9.0 - thrust * 2.6);
            lev.tube(&[v(x, 8.3, -10.6), tip], 0.22, 6, METALM);
            lev.cube(tip, v(1.4, 0.7, 0.8), LEVER);
        }
        d3::draw(c, fr, &lev, &at, PEDESTAL_ID);
        for (id, mesh) in parts.iter().filter(|(id, _)| *id == HUD_ID) {
            d3::draw(c, fr, mesh, &at, *id);
        }
    });
    // the head-up symbology glowing on the glass
    for x in [-8.0f32, 8.0] {
        let a = origin.add(v(x - 1.6, 17.6, -12.4));
        let b = origin.add(v(x + 1.6, 17.6, -12.4));
        d3::flow(c, &fr.cam, &[a, b], 0.08, SYM_GREEN, SYM_GREEN, 0.0, 0.7);
        d3::spark(c, &fr.cam, origin.add(v(x, 17.2, -12.4)), 0.6, SYM_GREEN, 0.8);
    }
    let _ = p;
}

pub fn focus_id(f: i32) -> u8 {
    match f {
        0 => PFD_ID,
        1 => ND_ID,
        2 => EICAS_ID,
        3 => HUD_ID,
        4 => MCP_ID,
        5 => KEYS_ID,
        6 => PEDESTAL_ID,
        7 => OVERHEAD_ID,
        8 => YOKE_ID,
        _ => 0,
    }
}

