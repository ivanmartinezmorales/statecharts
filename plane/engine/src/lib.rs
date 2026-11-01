// The 787 tour's renderer. The page sets a few numbers (which scene, where the camera is, how far apart the exploded
// parts are, which systems are flowing) and asks for a frame; the engine draws it into its own memory, and the page
// reads the picture, the glow and the bloom straight out of that memory. Buffers are reused frame to frame, and there
// are no dependencies.

mod cabin;
mod deck;
mod exterior;
mod gfx;
mod models;
mod pal;
mod planform;
mod three;
mod turbofan;

use gfx::Canvas;
use std::cell::RefCell;
use std::ptr::addr_of_mut;

/// What the page asks for, read fresh each frame from `PARAMS`.
pub struct Params {
    pub scene: u32,
    pub cx: f32,
    pub cy: f32,
    pub zoom: f32,
    /// 0 is assembled, 1 is fully apart
    pub explode: f32,
    /// the part to light up, or -1
    pub focus: i32,
    /// which system flows glow, a bit each: see `flows`
    pub flows: u32,
    pub model: u32,
    pub yaw: f32,
    pub pitch: f32,
    /// a scene's own animation, 0 to 1: thrust levers forward, gear down, a window dimming
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

static mut PARAMS: [f32; 16] = [0.0; 16];

thread_local! {
    static CANVAS: RefCell<Option<Canvas>> = const { RefCell::new(None) };
}

#[no_mangle]
pub extern "C" fn params() -> *mut f32 {
    addr_of_mut!(PARAMS) as *mut f32
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
        cx: p[1],
        cy: p[2],
        zoom: p[3],
        explode: p[4],
        focus: p[5] as i32,
        flows: p[6] as u32,
        model: p[7] as u32,
        yaw: p[8],
        pitch: p[9],
        anim: p[10],
        fade: p[11],
    };
    with(|c| {
        c.t = t;
        c.camera(p.cx, p.cy, p.zoom);
        // light is summed during a frame, so every frame starts dark
        c.light.fill([0.0; 3]);
        match p.scene {
            0 => exterior::draw(c, &p),
            1 => deck::draw(c, &p),
            2 => planform::draw(c, &p),
            3 => turbofan::draw(c, &p),
            4 => cabin::draw(c, &p),
            _ => models::draw(c, &p),
        }
        c.fade(pal::NIGHT, p.fade);
        c.finish();
    });
}
