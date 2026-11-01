//! Flat-fold paper simulator. The paper is a set of convex faces lying in the z=0 plane. A simple
//! fold splits faces along a line and swings one side 180° about it. A compound fold (squash, petal,
//! reverse, collapse) moves several groups of faces at once, each reflected across its own lines.

use serde::Deserialize;

const EPS: f64 = 1e-6;
/// Faces smaller than this (in square paper units) are slivers left by cuts, not paper.
pub const SLIVER: f64 = 0.01;

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

pub type Line = [V2; 2];

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Half {
    Top,
    Bottom,
    Left,
    Right,
}

/// The front or back half of the layers a part would move, split at their median.
#[derive(Clone, Copy, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Layers {
    Front,
    Back,
}

/// Which faces a fold takes. A face qualifies when every given condition holds.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Only {
    pub half: Option<Half>,
    pub at: Option<f64>,
    pub moved_in: Option<String>,
    #[serde(default)]
    pub not_moved_in: Vec<String>,
    /// A polygon on the unfolded sheet the face must lie in.
    #[serde(default)]
    pub within: Vec<V2>,
    pub layers: Option<Layers>,
}

#[derive(Deserialize)]
pub struct Fold {
    pub id: Option<String>,
    pub line: Line,
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

/// Which way a part swings out of the table on its way: toward you, or away.
#[derive(Clone, Copy, Default, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Swing {
    #[default]
    Up,
    Down,
}

/// Where a moved part lands in the stack of layers.
#[derive(Clone, Copy, Default, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Stack {
    /// On top of everything.
    #[default]
    Top,
    /// Under everything.
    Bottom,
    /// Between the layers it was cut from, as in an inside reverse fold.
    Inside,
    /// Where it already was.
    Place,
}

/// One group of faces in a compound fold.
#[derive(Deserialize)]
pub struct Part {
    /// Matching faces are cut along this line; the pieces on `side` belong to the part.
    pub line: Line,
    pub side: V2,
    pub only: Option<Only>,
    /// The lines the part is reflected across, in order. Empty means just `line`.
    #[serde(default)]
    pub over: Vec<Line>,
    #[serde(default)]
    pub swing: Swing,
    #[serde(default)]
    pub stack: Stack,
}

#[derive(Deserialize)]
pub struct Compound {
    pub id: Option<String>,
    pub parts: Vec<Part>,
}

#[derive(Clone, Copy, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Direction {
    Inside,
    Outside,
}

/// A reverse fold: the flap's front layers and back layers fold opposite ways along one line.
#[derive(Deserialize)]
pub struct Reverse {
    pub id: Option<String>,
    pub direction: Direction,
    pub line: Line,
    #[serde(rename = "move")]
    pub toward: V2,
    pub only: Option<Only>,
}

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Step {
    Valley(Fold),
    Mountain(Fold),
    Crease(Fold),
    Flip { id: Option<String> },
    Rotate { id: Option<String>, deg: f64 },
    Squash(Compound),
    Petal(Compound),
    Collapse(Compound),
    Reverse(Reverse),
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
            Step::Squash(c) | Step::Petal(c) | Step::Collapse(c) => c.id.as_deref(),
            Step::Reverse(r) => r.id.as_deref(),
        }
    }
}

#[derive(Clone)]
pub struct Face {
    pub pts: Vec<V2>,
    /// Where each corner sits on the unfolded sheet.
    pub orig: Vec<V2>,
    pub layer: f64,
    /// Ids of the steps that moved this face.
    pub moved: Vec<String>,
}

/// How one face moves during a compound fold.
#[derive(Clone)]
pub struct Motion {
    /// Lines it is reflected across, in order.
    pub over: Vec<Line>,
    /// 1 swings toward you, -1 away.
    pub swing: f64,
}

/// A step resolved against the paper it acts on, ready to animate.
pub struct Stage {
    /// Faces after splitting along the fold lines, before anything moves.
    pub faces: Vec<Face>,
    pub moving: Vec<bool>,
    /// For compound folds, how each face moves (None when it stays).
    pub motion: Option<Vec<Option<Motion>>>,
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
    pub fn new(line: Line, toward: V2) -> Self {
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

pub fn reflect(p: V2, line: Line) -> V2 {
    let [a, b] = line;
    let d = b.sub(a);
    let foot = a.lerp(b, p.sub(a).dot(d) / d.dot(d));
    V2::new(2.0 * foot.x - p.x, 2.0 * foot.y - p.y)
}

/// Reflects a point across each line in turn.
pub fn reflect_all(p: V2, lines: &[Line]) -> V2 {
    lines.iter().fold(p, |p, &l| reflect(p, l))
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

fn inside_polygon(p: V2, poly: &[V2]) -> bool {
    let mut hit = false;
    for i in 0..poly.len() {
        let (a, b) = (poly[i], poly[(i + 1) % poly.len()]);
        if (a.y > p.y) != (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x {
            hit = !hit;
        }
    }
    hit
}

/// Every condition except `layers`, which depends on the other faces moving with this one.
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
    in_half
        && only.moved_in.as_ref().is_none_or(moved)
        && !only.not_moved_in.iter().any(moved)
        && (only.within.is_empty() || inside_polygon(c, &only.within))
}

/// The layer value splitting a set of faces into a front half and a back half.
fn median_layer(layers: &mut [f64]) -> f64 {
    layers.sort_by(f64::total_cmp);
    let n = layers.len();
    (layers[(n - 1) / 2] + layers[n / 2]) / 2.0
}

fn in_layers(layer: f64, median: f64, which: Option<Layers>) -> bool {
    match which {
        None => true,
        Some(Layers::Front) => layer > median,
        Some(Layers::Back) => layer <= median,
    }
}

fn resolve_fold(faces: &[Face], fold: &Fold, kind: FoldKind, id: &str) -> Stage {
    let frame = Frame::new(fold.line, fold.toward);
    let mut out = Vec::new();
    let mut moving = Vec::new();
    for face in faces {
        match split(face, &frame) {
            (Some(pos), neg) if fold.only.as_ref().is_none_or(|o| matches(&pos, o)) => {
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
    if let Some(which) = fold.only.as_ref().and_then(|o| o.layers) {
        let mut ls: Vec<f64> = out.iter().zip(&moving).filter(|(_, m)| **m).map(|(f, _)| f.layer).collect();
        if !ls.is_empty() {
            let median = median_layer(&mut ls);
            for (f, m) in out.iter().zip(moving.iter_mut()) {
                *m = *m && in_layers(f.layer, median, Some(which));
            }
        }
    }
    if kind == FoldKind::Crease {
        return Stage { after: out.clone(), faces: out, moving, motion: None };
    }

    let extreme = |pick: fn(f64, f64) -> f64, only_moving: bool| {
        out.iter().zip(&moving).filter(|(_, m)| **m || !only_moving).map(|(f, _)| f.layer).reduce(pick).unwrap_or(0.0)
    };
    let (top, top_mover) = (extreme(f64::max, false), extreme(f64::max, true));
    let (bottom, bottom_mover) = (extreme(f64::min, false), extreme(f64::min, true));
    let after = out
        .iter()
        .zip(&moving)
        .map(|(f, &m)| {
            if !m {
                return f.clone();
            }
            let layer = if kind == FoldKind::Valley { top + 1.0 + (top_mover - f.layer) } else { bottom - 1.0 - (f.layer - bottom_mover) };
            let mut moved = f.moved.clone();
            moved.push(id.to_string());
            Face { pts: f.pts.iter().map(|&p| reflect(p, fold.line)).collect(), layer, moved, orig: f.orig.clone() }
        })
        .collect();
    Stage { faces: out, moving, motion: None, after }
}

/// A face during a compound fold: the piece, and which part (if any) moves it.
struct Piece {
    face: Face,
    part: Option<usize>,
    swing: f64,
    stack: Stack,
    /// The still piece it was cut from, for faces that move.
    sibling: Option<usize>,
    uid: usize,
}

fn resolve_compound(faces: &[Face], parts: &[Part], id: &str) -> Stage {
    let mut uid = 0;
    let mut pieces: Vec<Piece> = faces
        .iter()
        .map(|f| {
            uid += 1;
            Piece { face: f.clone(), part: None, swing: 0.0, stack: Stack::Place, sibling: None, uid }
        })
        .collect();

    for (pi, part) in parts.iter().enumerate() {
        let frame = Frame::new(part.line, part.side);
        let mut next = Vec::with_capacity(pieces.len() + 4);
        let mut candidates = Vec::new();
        for p in pieces {
            if p.part.is_some() {
                next.push(p);
                continue;
            }
            match split(&p.face, &frame) {
                (Some(pos), neg) if part.only.as_ref().is_none_or(|o| matches(&pos, o)) => {
                    let sibling = neg.map(|neg| {
                        uid += 1;
                        next.push(Piece { face: neg, part: None, swing: 0.0, stack: Stack::Place, sibling: None, uid });
                        uid
                    });
                    uid += 1;
                    candidates.push(next.len());
                    next.push(Piece { face: pos, part: None, swing: 0.0, stack: Stack::Place, sibling, uid });
                }
                _ => next.push(p),
            }
        }
        pieces = next;
        let which = part.only.as_ref().and_then(|o| o.layers);
        let mut ls: Vec<f64> = candidates.iter().map(|&i| pieces[i].face.layer).collect();
        let median = if ls.is_empty() { 0.0 } else { median_layer(&mut ls) };
        for i in candidates {
            if in_layers(pieces[i].face.layer, median, which) {
                let p = &mut pieces[i];
                p.part = Some(pi);
                p.swing = if part.swing == Swing::Up { 1.0 } else { -1.0 };
                p.stack = part.stack;
            }
        }
    }
    finish_compound(pieces, parts.iter().map(|p| if p.over.is_empty() { vec![p.line] } else { p.over.clone() }).collect(), id)
}

/// A reverse fold is one cut; the front half of the flap's layers folds one way, the back half the other.
fn resolve_reverse(faces: &[Face], r: &Reverse, id: &str) -> Stage {
    let part = Part { line: r.line, side: r.toward, only: None, over: vec![], swing: Swing::Up, stack: Stack::Place };
    let only = r.only.as_ref();
    let mut stage_pieces = Vec::new();
    let frame = Frame::new(part.line, part.side);
    let mut uid = 0;
    let mut candidates = Vec::new();
    for f in faces {
        match split(f, &frame) {
            (Some(pos), neg) if only.is_none_or(|o| matches(&pos, o)) => {
                let sibling = neg.map(|neg| {
                    uid += 1;
                    stage_pieces.push(Piece { face: neg, part: None, swing: 0.0, stack: Stack::Place, sibling: None, uid });
                    uid
                });
                uid += 1;
                candidates.push(stage_pieces.len());
                stage_pieces.push(Piece { face: pos, part: None, swing: 0.0, stack: Stack::Place, sibling, uid });
            }
            _ => {
                uid += 1;
                stage_pieces.push(Piece { face: f.clone(), part: None, swing: 0.0, stack: Stack::Place, sibling: None, uid });
            }
        }
    }
    let which = only.and_then(|o| o.layers);
    let mut ls: Vec<f64> = candidates.iter().map(|&i| stage_pieces[i].face.layer).collect();
    if !ls.is_empty() {
        let median = median_layer(&mut ls);
        let mut flap: Vec<f64> = candidates.iter().map(|&i| stage_pieces[i].face.layer).filter(|&l| in_layers(l, median, which)).collect();
        let split_at = if flap.is_empty() { median } else { median_layer(&mut flap) };
        for i in candidates {
            let p = &mut stage_pieces[i];
            if !in_layers(p.face.layer, median, which) {
                continue;
            }
            let front = p.face.layer > split_at;
            p.part = Some(0);
            (p.swing, p.stack) = match (r.direction, front) {
                (Direction::Inside, true) => (-1.0, Stack::Inside),
                (Direction::Inside, false) => (1.0, Stack::Inside),
                (Direction::Outside, true) => (1.0, Stack::Top),
                (Direction::Outside, false) => (-1.0, Stack::Bottom),
            };
        }
    }
    finish_compound(stage_pieces, vec![vec![r.line]], id)
}

/// Moves every claimed piece and decides where it lands in the stack.
fn finish_compound(pieces: Vec<Piece>, over: Vec<Vec<Line>>, id: &str) -> Stage {
    let layers: Vec<f64> = pieces.iter().map(|p| p.face.layer).collect();
    let mut new_layer = layers.clone();
    let (mut top, mut bottom) = (layers.iter().copied().fold(f64::NEG_INFINITY, f64::max), layers.iter().copied().fold(f64::INFINITY, f64::min));

    // Top, bottom and in-place parts, one group at a time in part order.
    for (part, lines) in over.iter().enumerate() {
        let odd = lines.len() % 2 == 1;
        for stack in [Stack::Top, Stack::Bottom, Stack::Place] {
            let group: Vec<usize> = (0..pieces.len()).filter(|&i| pieces[i].part == Some(part) && pieces[i].stack == stack).collect();
            if group.is_empty() {
                continue;
            }
            let lo = group.iter().map(|&i| layers[i]).fold(f64::INFINITY, f64::min);
            let hi = group.iter().map(|&i| layers[i]).fold(f64::NEG_INFINITY, f64::max);
            for &i in &group {
                let l = layers[i];
                new_layer[i] = match (stack, odd) {
                    (Stack::Top, true) => top + 1.0 + (hi - l),
                    (Stack::Top, false) => top + 1.0 + (l - lo),
                    (Stack::Bottom, true) => bottom - 1.0 - (l - lo),
                    (Stack::Bottom, false) => bottom - 1.0 - (hi - l),
                    (_, true) => lo + hi - l,
                    _ => l,
                };
            }
            let placed = group.iter().map(|&i| new_layer[i]);
            match stack {
                Stack::Top => top = placed.fold(top, f64::max),
                Stack::Bottom => bottom = placed.fold(bottom, f64::min),
                _ => {}
            }
        }
    }

    // Inside parts slide between the outermost layers they were cut from. One reflection turns the
    // point inside out, so the layer that was in front ends up at the back.
    let mut inside: Vec<usize> = (0..pieces.len()).filter(|&i| pieces[i].part.is_some() && pieces[i].stack == Stack::Inside).collect();
    if !inside.is_empty() {
        let siblings: Vec<f64> = inside
            .iter()
            .filter_map(|&i| pieces[i].sibling)
            .filter_map(|uid| pieces.iter().find(|p| p.uid == uid))
            .map(|p| p.face.layer)
            .collect();
        let lo = siblings.iter().copied().fold(f64::INFINITY, f64::min);
        let hi = siblings.iter().copied().fold(f64::NEG_INFINITY, f64::max);
        let reflections = |i: usize| pieces[i].part.map_or(0, |k| over[k].len());
        inside.sort_by(|&a, &b| if reflections(a) % 2 == 1 { layers[b].total_cmp(&layers[a]) } else { layers[a].total_cmp(&layers[b]) });
        let n = inside.len() as f64;
        for (k, &i) in inside.iter().enumerate() {
            new_layer[i] = if hi > lo { lo + (hi - lo) * (k as f64 + 1.0) / (n + 1.0) } else { layers[i] };
        }
    }

    let mut faces = Vec::with_capacity(pieces.len());
    let mut moving = Vec::with_capacity(pieces.len());
    let mut motion = Vec::with_capacity(pieces.len());
    let mut after = Vec::with_capacity(pieces.len());
    for (i, p) in pieces.into_iter().enumerate() {
        let lines = p.part.map(|k| over[k].clone());
        let mut a = p.face.clone();
        if let Some(lines) = &lines {
            a.pts = a.pts.iter().map(|&q| reflect_all(q, lines)).collect();
            a.layer = new_layer[i];
            a.moved.push(id.to_string());
        }
        moving.push(lines.is_some());
        motion.push(lines.map(|over| Motion { over, swing: p.swing }));
        faces.push(p.face);
        after.push(a);
    }
    Stage { faces, moving, motion: Some(motion), after }
}

fn resolve(faces: &[Face], step: &Step, id: &str) -> Stage {
    let everything = vec![true; faces.len()];
    let moved = |map: &dyn Fn(V2) -> V2, flip: bool| -> Vec<Face> {
        faces
            .iter()
            .map(|f| Face { pts: f.pts.iter().map(|&p| map(p)).collect(), layer: if flip { 0.0 - f.layer } else { f.layer }, ..f.clone() })
            .collect()
    };
    match step {
        Step::Flip { .. } => {
            let c = bounds(faces).center();
            Stage { after: moved(&|p| V2::new(2.0 * c.x - p.x, p.y), true), faces: faces.to_vec(), moving: everything, motion: None }
        }
        Step::Rotate { deg, .. } => {
            let c = bounds(faces).center();
            let (s, k) = deg.to_radians().sin_cos();
            let spin = |p: V2| V2::new(c.x + (p.x - c.x) * k - (p.y - c.y) * s, c.y + (p.x - c.x) * s + (p.y - c.y) * k);
            Stage { after: moved(&spin, false), faces: faces.to_vec(), moving: everything, motion: None }
        }
        Step::Valley(f) => resolve_fold(faces, f, FoldKind::Valley, id),
        Step::Mountain(f) => resolve_fold(faces, f, FoldKind::Mountain, id),
        Step::Crease(f) => resolve_fold(faces, f, FoldKind::Crease, id),
        Step::Squash(c) | Step::Petal(c) | Step::Collapse(c) => resolve_compound(faces, &c.parts, id),
        Step::Reverse(r) => resolve_reverse(faces, r, id),
    }
}

pub fn build_stages(paper: &[V2], steps: &[Step]) -> Vec<Stage> {
    let mut faces = vec![Face { pts: paper.to_vec(), orig: paper.to_vec(), layer: 0.0, moved: vec![] }];
    steps
        .iter()
        .enumerate()
        .map(|(i, step)| {
            let id = step.id().map_or_else(|| format!("#{i}"), str::to_string);
            let stage = resolve(&faces, step, &id);
            // Cuts that graze a vertex can leave zero-width slivers; drop them before the next step.
            faces = stage.after.iter().filter(|f| area(&f.pts).abs() > SLIVER).cloned().collect();
            stage
        })
        .collect()
}
