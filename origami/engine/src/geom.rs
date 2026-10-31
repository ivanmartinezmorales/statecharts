//! Flat-fold paper simulator. The paper is a set of convex faces lying in the z=0 plane; a fold
//! splits faces along a line and swings one side 180° about it.

use serde::Deserialize;

const EPS: f64 = 1e-6;

#[derive(Clone, Copy, Debug, Default, Deserialize, PartialEq)]
pub struct V2 {
    pub x: f64,
    pub y: f64,
}

impl V2 {
    pub const fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }
    pub fn sub(self, o: V2) -> V2 {
        V2::new(self.x - o.x, self.y - o.y)
    }
    pub fn dot(self, o: V2) -> f64 {
        self.x * o.x + self.y * o.y
    }
    pub fn cross(self, o: V2) -> f64 {
        self.x * o.y - self.y * o.x
    }
    pub fn lerp(self, o: V2, t: f64) -> V2 {
        V2::new(self.x + (o.x - self.x) * t, self.y + (o.y - self.y) * t)
    }
}

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Half {
    Top,
    Bottom,
    Left,
    Right,
}

/// Which layers a fold takes. A face qualifies when every given condition holds.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Only {
    pub half: Option<Half>,
    pub at: Option<f64>,
    pub moved_in: Option<String>,
    #[serde(default)]
    pub not_moved_in: Vec<String>,
}

#[derive(Deserialize)]
pub struct Fold {
    pub id: Option<String>,
    pub line: [V2; 2],
    /// Any point on the side of the line that moves.
    #[serde(rename = "move")]
    pub toward: V2,
    pub only: Option<Only>,
}

#[derive(Clone, Copy, PartialEq)]
pub enum FoldKind {
    Valley,
    Mountain,
    Crease,
}

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Step {
    Valley(Fold),
    Mountain(Fold),
    Crease(Fold),
    Flip { id: Option<String> },
    Rotate { id: Option<String>, deg: f64 },
}

impl Step {
    pub fn fold(&self) -> Option<(&Fold, FoldKind)> {
        match self {
            Step::Valley(f) => Some((f, FoldKind::Valley)),
            Step::Mountain(f) => Some((f, FoldKind::Mountain)),
            Step::Crease(f) => Some((f, FoldKind::Crease)),
            _ => None,
        }
    }

    fn id(&self) -> Option<&str> {
        match self {
            Step::Valley(f) | Step::Mountain(f) | Step::Crease(f) => f.id.as_deref(),
            Step::Flip { id } | Step::Rotate { id, .. } => id.as_deref(),
        }
    }
}

#[derive(Clone)]
pub struct Face {
    pub pts: Vec<V2>,
    /// Where each corner sits on the unfolded sheet.
    pub orig: Vec<V2>,
    pub layer: i32,
    /// Ids of the steps that moved this face.
    pub moved: Vec<String>,
}

/// A step resolved against the paper it acts on, ready to animate.
pub struct Stage {
    /// Faces after splitting along the fold line, before anything moves.
    pub faces: Vec<Face>,
    pub moving: Vec<bool>,
    pub after: Vec<Face>,
}

pub fn area(pts: &[V2]) -> f64 {
    let n = pts.len();
    (0..n)
        .map(|i| {
            let (p, q) = (pts[i], pts[(i + 1) % n]);
            p.x * q.y - q.x * p.y
        })
        .sum::<f64>()
        / 2.0
}

pub fn centroid(pts: &[V2]) -> V2 {
    let n = pts.len() as f64;
    V2::new(pts.iter().map(|p| p.x).sum::<f64>() / n, pts.iter().map(|p| p.y).sum::<f64>() / n)
}

#[derive(Clone, Copy)]
pub struct Bounds {
    pub min: V2,
    pub max: V2,
}

impl Bounds {
    pub fn center(self) -> V2 {
        self.min.lerp(self.max, 0.5)
    }
}

pub fn bounds<'a>(faces: impl IntoIterator<Item = &'a Face>) -> Bounds {
    let mut b = Bounds { min: V2::new(f64::INFINITY, f64::INFINITY), max: V2::new(f64::NEG_INFINITY, f64::NEG_INFINITY) };
    for p in faces.into_iter().flat_map(|f| f.pts.iter()) {
        b.min = V2::new(b.min.x.min(p.x), b.min.y.min(p.y));
        b.max = V2::new(b.max.x.max(p.x), b.max.y.max(p.y));
    }
    b
}

/// A fold line's origin, unit direction, and unit normal pointing at the moving side.
#[derive(Clone, Copy)]
pub struct Frame {
    pub a: V2,
    pub u: V2,
    pub n: V2,
}

impl Frame {
    pub fn new(line: [V2; 2], toward: V2) -> Self {
        let [a, b] = line;
        let d = b.sub(a);
        let len = d.x.hypot(d.y);
        let u = V2::new(d.x / len, d.y / len);
        let side = u.cross(toward.sub(a)).signum();
        Frame { a, u, n: V2::new(-u.y * side, u.x * side) }
    }

    pub fn dist(&self, p: V2) -> f64 {
        p.sub(self.a).dot(self.n)
    }
}

pub fn reflect(p: V2, line: [V2; 2]) -> V2 {
    let [a, b] = line;
    let d = b.sub(a);
    let foot = a.lerp(b, p.sub(a).dot(d) / d.dot(d));
    V2::new(2.0 * foot.x - p.x, 2.0 * foot.y - p.y)
}

/// Splits a convex face along the frame's line into its (moving side, still side) halves.
fn split(face: &Face, frame: &Frame) -> (Option<Face>, Option<Face>) {
    let (mut pos, mut neg) = (Vec::new(), Vec::new());
    let n = face.pts.len();
    for i in 0..n {
        let j = (i + 1) % n;
        let (p, q) = (face.pts[i], face.pts[j]);
        let (dp, dq) = (frame.dist(p), frame.dist(q));
        let here = (p, face.orig[i]);
        if dp >= -EPS {
            pos.push(here);
        }
        if dp <= EPS {
            neg.push(here);
        }
        if (dp > EPS && dq < -EPS) || (dp < -EPS && dq > EPS) {
            let t = dp / (dp - dq);
            let cut = (p.lerp(q, t), face.orig[i].lerp(face.orig[j], t));
            pos.push(cut);
            neg.push(cut);
        }
    }
    let make = |vs: Vec<(V2, V2)>| {
        let pts: Vec<V2> = vs.iter().map(|v| v.0).collect();
        (vs.len() >= 3 && area(&pts).abs() > 1e-4).then(|| Face { pts, orig: vs.iter().map(|v| v.1).collect(), ..face.clone() })
    };
    (make(pos), make(neg))
}

fn matches(face: &Face, only: &Only) -> bool {
    let c = centroid(&face.orig);
    let at = only.at.unwrap_or(50.0);
    let in_half = match only.half {
        None => true,
        Some(Half::Top) => c.y < at,
        Some(Half::Bottom) => c.y > at,
        Some(Half::Left) => c.x < at,
        Some(Half::Right) => c.x > at,
    };
    let moved = |id: &String| face.moved.contains(id);
    in_half && only.moved_in.as_ref().map_or(true, moved) && !only.not_moved_in.iter().any(moved)
}

fn resolve_fold(faces: &[Face], fold: &Fold, kind: FoldKind, id: &str) -> Stage {
    let frame = Frame::new(fold.line, fold.toward);
    let mut out = Vec::new();
    let mut moving = Vec::new();
    for face in faces {
        match split(face, &frame) {
            (Some(pos), neg) if fold.only.as_ref().map_or(true, |o| matches(&pos, o)) => {
                if let Some(neg) = neg {
                    out.push(neg);
                    moving.push(false);
                }
                out.push(pos);
                moving.push(true);
            }
            _ => {
                out.push(face.clone());
                moving.push(false);
            }
        }
    }
    if kind == FoldKind::Crease {
        return Stage { after: out.clone(), faces: out, moving };
    }

    let layers = || out.iter().map(|f| f.layer);
    let movers = || out.iter().zip(&moving).filter(|(_, m)| **m).map(|(f, _)| f.layer);
    let (top, top_mover) = (layers().max().unwrap_or(0), movers().max().unwrap_or(0));
    let (bottom, bottom_mover) = (layers().min().unwrap_or(0), movers().min().unwrap_or(0));
    let after = out
        .iter()
        .zip(&moving)
        .map(|(f, &m)| {
            if !m {
                return f.clone();
            }
            let layer = if kind == FoldKind::Valley { top + 1 + (top_mover - f.layer) } else { bottom - 1 - (f.layer - bottom_mover) };
            let mut moved = f.moved.clone();
            moved.push(id.to_string());
            Face { pts: f.pts.iter().map(|&p| reflect(p, fold.line)).collect(), layer, moved, orig: f.orig.clone() }
        })
        .collect();
    Stage { faces: out, moving, after }
}

fn resolve(faces: &[Face], step: &Step, id: &str) -> Stage {
    let everything = vec![true; faces.len()];
    let moved = |map: &dyn Fn(V2) -> V2, flip: bool| -> Vec<Face> {
        faces
            .iter()
            .map(|f| Face { pts: f.pts.iter().map(|&p| map(p)).collect(), layer: if flip { -f.layer } else { f.layer }, ..f.clone() })
            .collect()
    };
    match step {
        Step::Flip { .. } => {
            let c = bounds(faces).center();
            Stage { after: moved(&|p| V2::new(2.0 * c.x - p.x, p.y), true), faces: faces.to_vec(), moving: everything }
        }
        Step::Rotate { deg, .. } => {
            let c = bounds(faces).center();
            let (s, k) = deg.to_radians().sin_cos();
            let spin = |p: V2| V2::new(c.x + (p.x - c.x) * k - (p.y - c.y) * s, c.y + (p.x - c.x) * s + (p.y - c.y) * k);
            Stage { after: moved(&spin, false), faces: faces.to_vec(), moving: everything }
        }
        Step::Valley(f) => resolve_fold(faces, f, FoldKind::Valley, id),
        Step::Mountain(f) => resolve_fold(faces, f, FoldKind::Mountain, id),
        Step::Crease(f) => resolve_fold(faces, f, FoldKind::Crease, id),
    }
}

pub fn build_stages(paper: &[V2], steps: &[Step]) -> Vec<Stage> {
    let mut faces = vec![Face { pts: paper.to_vec(), orig: paper.to_vec(), layer: 0, moved: vec![] }];
    steps
        .iter()
        .enumerate()
        .map(|(i, step)| {
            let id = step.id().map_or_else(|| format!("#{i}"), str::to_string);
            let stage = resolve(&faces, step, &id);
            faces = stage.after.clone();
            stage
        })
        .collect()
}
