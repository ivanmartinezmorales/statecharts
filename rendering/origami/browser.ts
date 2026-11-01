import init, { Diagram, pixels } from './pkg/origami_engine.js';
import type { PaperModel } from './model';

/** Orbit angles in radians; 0, 0 looks straight down at the table like a printed diagram. */
export interface Camera {
  yaw: number;
  pitch: number;
}

/** Loads the WebAssembly fold engine. Call once before drawing anything. */
let memory: WebAssembly.Memory;
export const ready = init().then(exports => { memory = exports.memory; });

const hex = (css: CSSStyleDeclaration, name: string) => parseInt(css.getPropertyValue(name).trim().slice(1), 16);

/** A canvas that shows one model, folded and rasterized by the wasm engine. */
export class PaperCanvas {
  private readonly diagram: Diagram;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly model: PaperModel,
    /** Frame only the finished model, for thumbnails. */
    finishedOnly = false,
  ) {
    const { paper, whiteUp, steps, dots } = model;
    this.diagram = new Diagram(JSON.stringify({ paper, whiteUp, steps, dots }), finishedOnly);
    canvas.width = canvas.height = pixels();
    this.ctx = canvas.getContext('2d')!;
  }

  destroy() { this.diagram.free(); }

  draw(step: number, t: number, cam: Camera, showDots: boolean) {
    // Read from the canvas so a tile or workspace can set its own --paper.
    const css = getComputedStyle(this.canvas);
    const frame = this.diagram.render(
      step,
      t,
      cam.yaw,
      cam.pitch,
      showDots,
      hex(css, '--stage'),
      hex(css, '--stage-dot'),
      hex(css, '--paper'),
      hex(css, '--paper-back'),
      hex(css, '--ink'),
    );
    const data = new Uint8ClampedArray(memory.buffer, frame, this.canvas.width * this.canvas.height * 4);
    this.ctx.putImageData(new ImageData(data, this.canvas.width, this.canvas.height), 0, 0);
  }
}
