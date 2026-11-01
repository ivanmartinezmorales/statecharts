// Renders one frame natively and writes it as a BMP, glow and bloom added on top: for looking at dioramas without a
// browser. `./snap.sh out.png <scene> <tx> <ty> <tz> <yaw> <pitch> <dist> [explode focus flows anim]`
use std::io::Write;

fn main() {
    let a: Vec<f32> = std::env::args().skip(1).map(|s| s.parse().unwrap()).collect();
    let (w, h) = (640usize, 360usize);
    plane_engine::resize(w as u32, h as u32);
    let p = plane_engine::params();
    for i in 0..16 {
        unsafe { *p.add(i) = if i == 8 { -1.0 } else { 0.0 } };
    }
    for (i, v) in a.iter().enumerate() {
        unsafe { *p.add(i) = *v };
    }
    plane_engine::frame(2.3);
    let (pic, glow, bloom) = (plane_engine::picture(), plane_engine::glow(), plane_engine::bloom());
    let bw = plane_engine::bloom_width() as usize;
    let mut out = Vec::with_capacity(w * h * 3);
    for y in (0..h).rev() {
        for x in 0..w {
            let (c, g, b) = unsafe { (*pic.add(y * w + x), *glow.add(y * w + x), *bloom.add((y / 2) * bw + x / 2)) };
            for k in [2, 1, 0] {
                let ch = |v: u32| ((v >> (8 * k)) & 255) as f32;
                out.push((ch(c) + ch(g) * 0.6 + ch(b) * 0.9).min(255.0) as u8);
            }
        }
    }
    let size = 54 + out.len() as u32;
    let mut head = Vec::new();
    head.extend(b"BM");
    for v in [size, 0, 54, 40, w as u32, h as u32] {
        head.extend(v.to_le_bytes());
    }
    head.extend(1u16.to_le_bytes());
    head.extend(24u16.to_le_bytes());
    for v in [0u32, out.len() as u32, 2835, 2835, 0, 0] {
        head.extend(v.to_le_bytes());
    }
    let mut o = std::io::stdout().lock();
    o.write_all(&head).unwrap();
    o.write_all(&out).unwrap();
}
