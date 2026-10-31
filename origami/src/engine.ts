import init, { Diagram, pixels } from '../engine/pkg/origami_engine.js';
import type { Model } from './models';

/** Orbit angles in radians; 0, 0 looks straight down at the table like a printed diagram. */
export interface Camera {
  yaw: number;
  pitch: number;
}

/** Loads the WebAssembly fold engine. Call once before drawing anything. */
export const ready = init();

const hex = (css: CSSStyleDeclaration, name: string) => parseInt(css.getPropertyValue(name).trim().slice(1), 16);

/** A canvas that shows one model, folded and rasterized by the wasm engine. */
export class PaperCanvas {
  private readonly diagram: Diagram;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly image: ImageData;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly model: Model,
    /** Frame only the finished model, for thumbnails. */
    finishedOnly = false,
  ) {
    const { paper, whiteUp, steps, dots } = model;
    this.diagram = new Diagram(JSON.stringify({ paper, whiteUp, steps, dots }), finishedOnly);
    canvas.width = canvas.height = pixels();
    this.ctx = canvas.getContext('2d')!;
    this.image = this.ctx.createImageData(canvas.width, canvas.height);
  }

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
    this.image.data.set(frame);
    this.ctx.putImageData(this.image, 0, 0);
  }
}
