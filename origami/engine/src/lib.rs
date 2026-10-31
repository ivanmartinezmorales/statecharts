//! Origami fold engine, compiled to WebAssembly. Takes a model as JSON and renders any moment of
//! any step, from any camera angle, as a small RGBA pixel buffer.

mod geom;
mod raster;
mod scene;

use serde::Deserialize;
use wasm_bindgen::prelude::*;

use geom::{build_stages, Stage, Step, V2};
use raster::{rgb, Canvas};
use scene::{draw, fit_view, mat, Camera, Dot, Frame2d, Palette, View, PIXELS};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Model {
    paper: Vec<V2>,
    white_up: bool,
    steps: Vec<Step>,
    #[serde(default)]
    dots: Vec<Dot>,
}

/// Width and height of every rendered frame, in pixels.
#[wasm_bindgen]
pub fn pixels() -> usize {
    PIXELS
}

#[wasm_bindgen]
pub struct Diagram {
    model: Model,
    stages: Vec<Stage>,
    view: View,
    canvas: Canvas,
    mat: Option<([u32; 2], Canvas)>,
}

#[wasm_bindgen]
impl Diagram {
    /// Parses a model and folds it through every step. With `fit_finished`, the view frames only
    /// the finished model, which suits thumbnails; otherwise it frames every step.
    #[wasm_bindgen(constructor)]
    pub fn new(json: &str, fit_finished: bool) -> Result<Diagram, JsError> {
        let model: Model = serde_json::from_str(json).map_err(|e| JsError::new(&format!("model: {e}")))?;
        if model.steps.is_empty() || model.paper.len() < 3 {
            return Err(JsError::new("model: needs a paper shape and at least one step"));
        }
        let stages = build_stages(&model.paper, &model.steps);
        let view = fit_view(if fit_finished { &stages[stages.len() - 1..] } else { &stages });
        Ok(Diagram { model, stages, view, canvas: Canvas::new(PIXELS), mat: None })
    }

    #[wasm_bindgen(getter)]
    pub fn steps(&self) -> usize {
        self.stages.len()
    }

    /// Draws step `step` at fold progress `t` (0 to 1) and returns RGBA pixels. Colors are 0xRRGGBB.
    #[allow(clippy::too_many_arguments)]
    pub fn render(
        &mut self,
        step: usize,
        t: f64,
        yaw: f64,
        pitch: f64,
        show_dots: bool,
        stage: u32,
        stage_dot: u32,
        paper: u32,
        paper_back: u32,
        ink: u32,
    ) -> Vec<u8> {
        let i = step.min(self.stages.len() - 1);
        let pal = Palette { stage: rgb(stage), stage_dot: rgb(stage_dot), paper: rgb(paper), paper_back: rgb(paper_back), ink: rgb(ink) };
        if self.mat.as_ref().map_or(true, |(key, _)| *key != [stage, stage_dot]) {
            self.mat = Some(([stage, stage_dot], mat(&pal)));
        }
        self.canvas.px.copy_from_slice(&self.mat.as_ref().expect("mat").1.px);
        let frame = Frame2d {
            stage: &self.stages[i],
            step: &self.model.steps[i],
            t: t.clamp(0.0, 1.0),
            view: self.view,
            white_up: self.model.white_up,
            cam: Camera { yaw, pitch },
            dots: if show_dots { &self.model.dots } else { &[] },
        };
        draw(&mut self.canvas, &frame, &pal);
        self.canvas.px.clone()
    }

    /// The folded faces after `step`, as JSON, for checking the engine against a reference.
    pub fn faces(&self, step: usize) -> String {
        let faces: Vec<String> = self.stages[step.min(self.stages.len() - 1)]
            .after
            .iter()
            .map(|f| {
                let pts: Vec<String> = f.pts.iter().map(|p| format!("[{},{}]", p.x, p.y)).collect();
                format!("{{\"layer\":{},\"pts\":[{}]}}", f.layer, pts.join(","))
            })
            .collect();
        format!("[{}]", faces.join(","))
    }
}
