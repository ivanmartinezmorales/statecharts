// The 787 tour's renderer: a row of pixel-art dioramas, each a miniature on its own plinth, and a camera that orbits
// them and flies between them. The page sets the camera and a few numbers (which diorama has the focus, what is
// lit up, how far apart the exploded parts are, which systems are flowing) and asks for a frame; the engine draws it
// into its own memory, and the page reads the picture, the glow and the bloom straight out of that memory.

mod cabin;
mod d3;
mod flightdeck;
mod gfx;
mod pal;
mod plane3d;
mod runway;
mod screens;
mod set;
mod turbofan;
mod xray;

use d3::{Cam, Frame, V3, v};
use gfx::Canvas;
use std::cell::RefCell;
use std::ptr::addr_of_mut;

/// What the page asks for, read fresh each frame from `PARAMS`.
pub struct Params {
    /// the diorama the tour is on: focus, flows, explode and anim apply to it
    pub scene: u32,
    pub target: V3,
    pub yaw: f32,
    pub pitch: f32,
    pub dist: f32,
    /// 0 is assembled, 1 is fully apart
    pub explode: f32,
    /// the part to light up, or -1
    pub focus: i32,
    /// which system flows glow, a bit each: see `flows`
    pub flows: u32,
    /// a diorama's own animation, 0 to 1: thrust levers forward, a window dimming, the reverser open
    pub anim: f32,
    pub fade: f32,
}

pub mod flows {
    pub const FUEL: u32 = 1;
    pub const HYDRAULIC: u32 = 2;
    pub const ELECTRIC: u32 = 4;
    pub const AIR: u32 = 8;
    pub const SIGNAL: u32 = 16;
    pub const CORE: u32 = 32;
    pub const BYPASS: u32 = 64;
}

type Draw = fn(&mut Canvas, &mut Frame, V3, Option<&Params>);
type Focus = fn(i32) -> u8;

/// The dioramas: where each stands in the world (a row along x), how to draw it, and its focusable parts.
const SETS: [(V3, Draw, Focus); 5] = [
    (v(0.0, 0.0, 0.0), runway::draw, runway::focus_id),
    (v(200.0, 0.0, 0.0), xray::draw, xray::focus_id),
    (v(400.0, 0.0, 0.0), flightdeck::draw, flightdeck::focus_id),
    (v(600.0, 0.0, 0.0), turbofan::draw, turbofan::focus_id),
    (v(800.0, 0.0, 0.0), cabin::draw, cabin::focus_id),
];
pub const ORIGINS: [V3; SETS.len()] = {
    let mut o = [v(0.0, 0.0, 0.0); SETS.len()];
    let mut i = 0;
    while i < SETS.len() {
        o[i] = SETS[i].0;
        i += 1;
    }
    o
};
static mut ORIGIN_TABLE: [f32; 3 * ORIGINS.len()] = [0.0; 3 * ORIGINS.len()];
static mut PARAMS: [f32; 16] = [0.0; 16];

thread_local! {
    static CANVAS: RefCell<Option<Canvas>> = const { RefCell::new(None) };
}

#[no_mangle]
pub extern "C" fn params() -> *mut f32 {
    addr_of_mut!(PARAMS) as *mut f32
}

/// The dioramas' positions, x y z each, so the page can aim the camera without keeping its own copy.
#[no_mangle]
pub extern "C" fn origins() -> *const f32 {
    let t = addr_of_mut!(ORIGIN_TABLE) as *mut f32;
    for (i, o) in ORIGINS.iter().enumerate() {
        unsafe {
            *t.add(3 * i) = o.x;
            *t.add(3 * i + 1) = o.y;
            *t.add(3 * i + 2) = o.z;
        }
    }
    t
}

#[no_mangle]
pub extern "C" fn origin_count() -> u32 {
    ORIGINS.len() as u32
}

#[no_mangle]
pub extern "C" fn resize(w: u32, h: u32) {
    CANVAS.with(|c| *c.borrow_mut() = Some(Canvas::new(w.max(1) as usize, h.max(1) as usize)));
}

fn with<R>(f: impl FnOnce(&mut Canvas) -> R) -> R {
    CANVAS.with(|c| f(c.borrow_mut().as_mut().expect("resize first")))
}

#[no_mangle]
pub extern "C" fn picture() -> *const u32 {
    with(|c| c.out.as_ptr())
}
#[no_mangle]
pub extern "C" fn glow() -> *const u32 {
    with(|c| c.glow.as_ptr())
}
#[no_mangle]
pub extern "C" fn bloom() -> *const u32 {
    with(|c| c.bloom.as_ptr())
}
#[no_mangle]
pub extern "C" fn bloom_width() -> u32 {
    with(|c| c.bw as u32)
}
#[no_mangle]
pub extern "C" fn bloom_height() -> u32 {
    with(|c| c.bh as u32)
}

#[no_mangle]
pub extern "C" fn frame(t: f32) {
    // a copy, so no reference to the static is ever held
    let p = unsafe { PARAMS };
    let p = Params {
        scene: p[0] as u32,
        target: v(p[1], p[2], p[3]),
        yaw: p[4],
        pitch: p[5],
        dist: p[6].max(1.0),
        explode: p[7],
        focus: p[8] as i32,
        flows: p[9] as u32,
        anim: p[10],
        fade: p[11],
    };
    with(|c| {
        c.t = t;
        c.light.fill([0.0; 3]);
        let cam = Cam::new(p.target, p.yaw, p.pitch, p.dist, c.w, c.h);
        set::room(c, &cam, t);
        d3::begin(c);
        let mut fr = Frame { cam, t, anim: 0.0, light: v(-0.55, 0.7, 0.45).norm(), mats: &runway::MATS };
        let mut focus = 0;
        for (i, &(o, draw, focus_of)) in SETS.iter().enumerate() {
            if !in_view(&cam, o, c.w, c.h) {
                continue;
            }
            let here = i as u32 == p.scene;
            fr.anim = if here { p.anim } else { 0.0 };
            draw(c, &mut fr, o, here.then_some(&p));
            if here {
                focus = focus_of(p.focus);
            }
        }
        d3::finish(c, focus, 0.5 + 0.3 * (t * 3.2).sin());
        c.fade(pal::NIGHT, p.fade);
        c.finish();
    });
}

/// Whether a diorama could be on screen: its center within a generous margin of the frame.
fn in_view(cam: &Cam, o: V3, w: usize, h: usize) -> bool {
    match cam.project(o) {
        Some((x, y, z)) => {
            let r = 90.0 * cam.scale_at(o).max(0.0) + 40.0;
            let _ = z;
            x > -r && x < w as f32 + r && y > -r && y < h as f32 + r
        }
        None => false,
    }
}
