//! Poses a stage in 3D, orders faces for painting, and draws paper and fold notation as pixels.

use serde::Deserialize;

use crate::geom::{area, bounds, SLIVER, centroid, reflect, reflect_all, Face, FoldKind, Frame, Line, Motion, Stage, Step, V2};
use crate::raster::{hash, mix, scale, Canvas, Rgb};

/// Canvas resolution. The page scales it up with nearest-neighbour sampling for the pixel look.
pub const PIXELS: usize = 256;

/// How many pixels stand in for one pixel of the original 112px design, for sizing ink and marks.
const DENSITY: f64 = PIXELS as f64 / 112.0;
/// Width of fold lines and arrows.
const INK: f64 = 1.6 * DENSITY;

#[derive(Clone, Copy)]
pub struct View {
    pub min: V2,
    pub size: f64,
}

/// A square view that fits every given stage, so the paper never jumps between steps.
pub fn fit_view(stages: &[Stage]) -> View {
    let b = bounds(stages.iter().flat_map(|s| s.faces.iter().chain(&s.after)));
    let size = (b.max.x - b.min.x).max(b.max.y - b.min.y) * 1.3;
    let c = b.center();
    View { min: V2::new(c.x - size / 2.0, c.y - size / 2.0), size }
}

/// Orbit angles in radians; 0, 0 looks straight down at the table like a printed diagram.
#[derive(Clone, Copy)]
pub struct Camera {
    pub yaw: f64,
    pub pitch: f64,
}

#[derive(Deserialize)]
pub struct Dot {
    pub x: f64,
    pub y: f64,
    pub r: f64,
}

pub struct Palette {
    pub stage: Rgb,
    pub stage_dot: Rgb,
    pub paper: Rgb,
    pub paper_back: Rgb,
    pub ink: Rgb,
}

#[derive(Clone, Copy, Debug)]
struct V3 {
    x: f64,
    y: f64,
    z: f64,
}

const UP: V3 = V3 { x: 0.0, y: 0.0, z: 1.0 };

fn flat(p: V2) -> V3 {
    V3 { x: p.x, y: p.y, z: 0.0 }
}

fn ease(t: f64) -> f64 {
    if t < 0.5 {
        4.0 * t * t * t
    } else {
        1.0 - (-2.0 * t + 2.0).powi(3) / 2.0
    }
}

fn orbit(d: V3, cam: Camera) -> V3 {
    let (sy, cy) = cam.yaw.sin_cos();
    let (sp, cp) = cam.pitch.sin_cos();
    let x = d.x * cy + d.z * sy;
    let z = -d.x * sy + d.z * cy;
    V3 { x, y: d.y * cp - z * sp, z: d.y * sp + z * cp }
}

/// Faces that share one plane: their stacking order is their layer order, seen from the plane's front.
struct Sheet {
    normal: V3,
    faces: Vec<(usize, Vec<V3>)>,
}

struct Pose {
    still: Sheet,
    /// The flap being folded, and which side of the table it swings through (1 = toward you).
    flap: Option<(Sheet, f64)>,
}

fn pose(stage: &Stage, step: &Step, t: f64) -> Pose {
    let e = ease(t);
    let all = |map: &dyn Fn(V2) -> V3| stage.faces.iter().enumerate().map(|(i, f)| (i, f.pts.iter().map(|&p| map(p)).collect())).collect();
    match step {
        Step::Rotate { deg, .. } => {
            let (s, k) = (deg.to_radians() * e).sin_cos();
            let c = bounds(&stage.faces).center();
            let spin = |p: V2| flat(V2::new(c.x + (p.x - c.x) * k - (p.y - c.y) * s, c.y + (p.x - c.x) * s + (p.y - c.y) * k));
            Pose { still: Sheet { normal: UP, faces: all(&spin) }, flap: None }
        }
        Step::Flip { .. } => {
            let cx = bounds(&stage.faces).center().x;
            let (s, k) = (std::f64::consts::PI * e).sin_cos();
            let turn = |p: V2| V3 { x: cx + (p.x - cx) * k, y: p.y, z: (p.x - cx) * s };
            Pose { still: Sheet { normal: V3 { x: -s, y: 0.0, z: k }, faces: all(&turn) }, flap: None }
        }
        _ => {
            let (fold, kind) = step.fold().expect("fold step");
            let f = Frame::new(fold.line, fold.toward);
            let swing = if kind == FoldKind::Crease { (std::f64::consts::PI * e).sin() * 0.97 } else { e };
            let theta = std::f64::consts::PI * swing;
            let side = if kind == FoldKind::Mountain { -1.0 } else { 1.0 };
            let turn = |p: V2| {
                let along = p.sub(f.a).dot(f.u);
                let r = p.sub(f.a).dot(f.n);
                let rc = r * theta.cos();
                V3 { x: f.a.x + f.u.x * along + f.n.x * rc, y: f.a.y + f.u.y * along + f.n.y * rc, z: side * r * theta.sin() }
            };
            let (mut still, mut flap) = (Vec::new(), Vec::new());
            for (i, face) in stage.faces.iter().enumerate() {
                if stage.moving[i] {
                    flap.push((i, face.pts.iter().map(|&p| turn(p)).collect()));
                } else {
                    still.push((i, face.pts.iter().map(|&p| flat(p)).collect()));
                }
            }
            let s = theta.sin() * side;
            let normal = V3 { x: -f.n.x * s, y: -f.n.y * s, z: theta.cos() };
            Pose { still: Sheet { normal: UP, faces: still }, flap: Some((Sheet { normal, faces: flap }, side)) }
        }
    }
}

/// Painter's order. Within a sheet, layers stack bottom-up seen from its front and top-down from
/// behind. The flap sits wholly on one side of the table plane, so it is either entirely in front of
/// or entirely behind the still paper, depending on which side of that plane the camera is.
fn paint_order<'a>(p: &'a Pose, faces: &[Face], cam: Camera) -> Vec<&'a (usize, Vec<V3>)> {
    let facing = |s: &Sheet| orbit(s.normal, cam).z >= 0.0;
    let stack = |s: &'a Sheet| {
        let mut v: Vec<_> = s.faces.iter().collect();
        let front = facing(s);
        v.sort_by(|(i, _), (j, _)| {
            let (a, b) = (faces[*i].layer, faces[*j].layer);
            if front { a.total_cmp(&b) } else { b.total_cmp(&a) }
        });
        v
    };
    let still = stack(&p.still);
    match &p.flap {
        None => still,
        Some((flap, side)) => {
            let flap = stack(flap);
            if (*side > 0.0) == facing(&p.still) {
                still.into_iter().chain(flap).collect()
            } else {
                flap.into_iter().chain(still).collect()
            }
        }
    }
}

/// Rotates a point about a line by `theta`, lifting it toward you when `swing` is 1 and away when -1.
fn hinge(p: V2, f: &Frame, theta: f64, swing: f64) -> V3 {
    let along = p.sub(f.a).dot(f.u);
    let r = p.sub(f.a).dot(f.n);
    let rc = r * theta.cos();
    V3 { x: f.a.x + f.u.x * along + f.n.x * rc, y: f.a.y + f.u.y * along + f.n.y * rc, z: swing * r * theta.sin() }
}

/// Poses and orders a compound fold. Each moving face works through its lines one after another,
/// so a petal's sides fold in before they swing up. Faces paint in stack order: where they were for
/// the first half of the move, where they land for the second.
fn compound_pose(stage: &Stage, motion: &[Option<Motion>], t: f64, cam: Camera) -> Vec<(usize, Vec<V3>)> {
    let e = ease(t);
    let mut posed: Vec<(usize, Vec<V3>, f64)> = stage
        .faces
        .iter()
        .enumerate()
        .map(|(i, face)| match &motion[i] {
            None => (i, face.pts.iter().map(|&p| flat(p)).collect(), face.layer),
            Some(m) => {
                let k = m.over.len();
                let at = e * k as f64;
                let seg = (at.floor() as usize).min(k - 1);
                let local = at - seg as f64;
                let pts: Vec<V2> = face.pts.iter().map(|&p| reflect_all(p, &m.over[..seg])).collect();
                let frame = Frame::new(m.over[seg], centroid(&pts));
                let theta = std::f64::consts::PI * local;
                let key = if e < 0.5 { face.layer } else { stage.after[i].layer };
                (i, pts.iter().map(|&p| hinge(p, &frame, theta, m.swing)).collect(), key)
            }
        })
        .collect();
    posed.sort_by(|a, b| a.2.total_cmp(&b.2));
    if orbit(UP, cam).z < 0.0 {
        posed.reverse();
    }
    posed.into_iter().map(|(i, pts, _)| (i, pts)).collect()
}

pub struct Frame2d<'a> {
    pub stage: &'a Stage,
    pub step: &'a Step,
    pub t: f64,
    pub view: View,
    pub white_up: bool,
    pub cam: Camera,
    pub dots: &'a [Dot],
}

/// The dotted folding mat the paper sits on.
pub fn mat(pal: &Palette) -> Canvas {
    let mut c = Canvas::new(PIXELS);
    for y in 0..PIXELS {
        for x in 0..PIXELS {
            let dot = (x + 8) % 16 < 2 && (y + 8) % 16 < 2;
            let m = if dot { 1.0 } else { hash(x, y) * 0.1 };
            c.set(x as i64, y as i64, mix(pal.stage, pal.stage_dot, m));
        }
    }
    c
}

pub fn draw(canvas: &mut Canvas, f: &Frame2d, pal: &Palette) {
    let px = PIXELS as f64 / f.view.size;
    // Orbit around the paper itself so it spins in place instead of swinging around the frame.
    let pivot = bounds(&f.stage.faces).center();
    let project = |p: V3| {
        let r = orbit(V3 { x: p.x - pivot.x, y: p.y - pivot.y, z: p.z }, f.cam);
        let s = (f.view.size * 3.0) / (f.view.size * 3.0 - r.z);
        V2::new((pivot.x + r.x * s - f.view.min.x) * px, (pivot.y + r.y * s - f.view.min.y) * px)
    };

    let (order, still_normal) = match &f.stage.motion {
        Some(motion) => (compound_pose(f.stage, motion, f.t, f.cam), UP),
        None => {
            let p = pose(f.stage, f.step, f.t);
            let order = paint_order(&p, &f.stage.faces, f.cam).into_iter().cloned().collect();
            (order, p.still.normal)
        }
    };
    for (i, pts) in &order {
        let face = &f.stage.faces[*i];
        if area(&face.pts).abs() <= SLIVER {
            continue;
        }
        let scr: Vec<V2> = pts.iter().map(|&q| project(q)).collect();
        let (a, a0) = (area(&scr), area(&face.orig));
        let color_up = (a.signum() == a0.signum()) != f.white_up;
        let light = (a / (a0 * px * px)).abs().min(1.0);
        let base = scale(if color_up { pal.paper } else { pal.paper_back }, (58.0 + 42.0 * light).round() / 100.0);
        canvas.fill(&scr, |c, x, y| c.set(x, y, scale(base, 0.95 + 0.06 * hash(x as usize, y as usize))));
        for (k, &q) in scr.iter().enumerate() {
            canvas.line(q, scr[(k + 1) % scr.len()], &[], [0.0; 3], 0.4);
        }
    }

    if !f.dots.is_empty() && orbit(still_normal, f.cam).z > 0.0 {
        for d in f.dots {
            canvas.disc(project(flat(V2::new(d.x, d.y))), (d.r * px).max(1.2 * DENSITY), [22.0; 3]);
        }
    }

    if f.t < 0.34 {
        notation(canvas, f, pal.ink, 1.0 - f.t * 3.0, &project);
    }
}

fn head(canvas: &mut Canvas, tip: V2, from: V2, open: bool, ink: Rgb, alpha: f64) {
    let d = (tip.x - from.x).hypot(tip.y - from.y).max(1e-9);
    let (ux, uy) = ((tip.x - from.x) / d, (tip.y - from.y) / d);
    let size = 4.5 * DENSITY;
    let l = V2::new(tip.x - ux * size - uy * size * 0.6, tip.y - uy * size + ux * size * 0.6);
    let r = V2::new(tip.x - ux * size + uy * size * 0.6, tip.y - uy * size - ux * size * 0.6);
    if open {
        canvas.stroke(&[l, tip, r], INK, &[], ink, alpha);
    } else {
        canvas.fill(&[l, tip, r], |c, x, y| c.blend(x, y, ink, alpha));
    }
}

fn notation(canvas: &mut Canvas, f: &Frame2d, ink: Rgb, alpha: f64, project: &dyn Fn(V3) -> V2) {
    let arc = |canvas: &mut Canvas, pts: Vec<V3>, open: bool, both: bool| {
        let s: Vec<V2> = pts.into_iter().map(project).collect();
        canvas.stroke(&s, INK, &[], ink, alpha);
        let n = s.len();
        head(canvas, s[n - 1], s[n.saturating_sub(3)], open, ink, alpha);
        if both {
            head(canvas, s[0], s[2.min(n - 1)], open, ink, alpha);
        }
    };

    if let Some(motion) = &f.stage.motion {
        compound_notation(canvas, f, motion, ink, alpha, project, &arc);
        return;
    }

    let Some((fold, kind)) = f.step.fold() else {
        let b = bounds(&f.stage.faces);
        let flip = matches!(f.step, Step::Flip { .. });
        let r = f.view.size * if flip { 0.08 } else { 0.4 };
        let at = if flip { V2::new(b.max.x + r * 0.4, b.min.y) } else { centroid(&[b.min, b.max]) };
        let pi = std::f64::consts::PI;
        let (a0, a1) = if flip { (pi * 0.9, pi * 2.4) } else { (-pi / 2.0 - 0.5, -pi / 2.0 + 0.5) };
        let backwards = matches!(f.step, Step::Rotate { deg, .. } if *deg < 0.0);
        let pts = (0..=20)
            .map(|k| {
                let t = k as f64 / 20.0;
                let ang = if backwards { a1 - (a1 - a0) * t } else { a0 + (a1 - a0) * t };
                flat(V2::new(at.x + r * ang.cos(), at.y + r * ang.sin()))
            })
            .collect();
        arc(canvas, pts, false, false);
        return;
    };

    let frame = Frame::new(fold.line, fold.toward);
    let [a, b] = fold.line;
    let ext = f.view.size * 0.04;
    let l0 = project(flat(V2::new(a.x - frame.u.x * ext, a.y - frame.u.y * ext)));
    let l1 = project(flat(V2::new(b.x + frame.u.x * ext, b.y + frame.u.y * ext)));
    canvas.stroke(&[l0, l1], INK, &dashes(kind == FoldKind::Mountain), ink, alpha);

    let movers: Vec<V2> = f.stage.faces.iter().zip(&f.stage.moving).filter(|(_, m)| **m).flat_map(|(face, _)| face.pts.iter().copied()).collect();
    let from = if movers.is_empty() { fold.toward } else { centroid(&movers) };
    let to = reflect(from, fold.line);
    let span = (to.x - from.x).hypot(to.y - from.y);
    let side = if kind == FoldKind::Mountain { -1.0 } else { 1.0 };
    let ctrl = V3 { x: (from.x + to.x) / 2.0 + frame.u.x * span * 0.3, y: (from.y + to.y) / 2.0 + frame.u.y * span * 0.3, z: side * span * 0.6 };
    let (p0, p2) = (flat(from), flat(to));
    let curve = (0..=16)
        .map(|k| {
            let t = k as f64 / 16.0;
            let m = |a: f64, b: f64, c: f64| (1.0 - t).powi(2) * a + 2.0 * (1.0 - t) * t * b + t * t * c;
            V3 { x: m(p0.x, ctrl.x, p2.x), y: m(p0.y, ctrl.y, p2.y), z: m(p0.z, ctrl.z, p2.z) }
        })
        .collect();
    arc(canvas, curve, kind == FoldKind::Mountain, kind == FoldKind::Crease);
}

/// Bends an arrow from `from` to `to`, lifted off the table so it reads as a fold over or under.
fn fold_arrow(from: V2, to: V2, along: V2, lift: f64) -> Vec<V3> {
    let span = (to.x - from.x).hypot(to.y - from.y);
    let ctrl = V3 { x: (from.x + to.x) / 2.0 + along.x * span * 0.3, y: (from.y + to.y) / 2.0 + along.y * span * 0.3, z: lift * span * 0.6 };
    let (p0, p2) = (flat(from), flat(to));
    (0..=16)
        .map(|k| {
            let t = k as f64 / 16.0;
            let m = |a: f64, b: f64, c: f64| (1.0 - t).powi(2) * a + 2.0 * (1.0 - t) * t * b + t * t * c;
            V3 { x: m(p0.x, ctrl.x, p2.x), y: m(p0.y, ctrl.y, p2.y), z: m(p0.z, ctrl.z, p2.z) }
        })
        .collect()
}

/// Draws a polyline arrow: points, open head, heads at both ends.
type Arc<'a> = dyn Fn(&mut Canvas, Vec<V3>, bool, bool) + 'a;

/// One crease line and arrow per distinct line in a compound fold.
fn compound_notation(
    canvas: &mut Canvas,
    f: &Frame2d,
    motion: &[Option<Motion>],
    ink: Rgb,
    alpha: f64,
    project: &dyn Fn(V3) -> V2,
    arc: &Arc,
) {
    let same = |a: &Line, b: &Line| a.iter().zip(b).all(|(p, q)| (p.x - q.x).abs() < 1e-6 && (p.y - q.y).abs() < 1e-6);
    let mut lines: Vec<(Line, f64)> = Vec::new();
    for m in motion.iter().flatten() {
        if !lines.iter().any(|(l, _)| same(l, &m.over[0])) {
            lines.push((m.over[0], m.swing));
        }
    }
    for (line, swing) in lines {
        let group: Vec<usize> = (0..motion.len()).filter(|&i| motion[i].as_ref().is_some_and(|m| same(&m.over[0], &line))).collect();
        let from = centroid(&group.iter().flat_map(|&i| f.stage.faces[i].pts.iter().copied()).collect::<Vec<_>>());
        let to = centroid(&group.iter().flat_map(|&i| f.stage.after[i].pts.iter().copied()).collect::<Vec<_>>());
        let frame = Frame::new(line, from);
        let ext = f.view.size * 0.03;
        let [a, b] = line;
        let l0 = project(flat(V2::new(a.x - frame.u.x * ext, a.y - frame.u.y * ext)));
        let l1 = project(flat(V2::new(b.x + frame.u.x * ext, b.y + frame.u.y * ext)));
        canvas.stroke(&[l0, l1], INK, &dashes(swing < 0.0), ink, alpha);
        if (to.x - from.x).hypot(to.y - from.y) > 1.0 {
            arc(canvas, fold_arrow(from, to, frame.u, swing), swing < 0.0, false);
        }
    }
}

/// Valley folds are dashes; mountain folds are dash-dot, as on printed diagrams.
fn dashes(mountain: bool) -> Vec<f64> {
    let d = if mountain { vec![4.0, 2.2, 1.2, 2.2] } else { vec![3.4, 2.2] };
    d.into_iter().map(|v| v * DENSITY).collect()
}
