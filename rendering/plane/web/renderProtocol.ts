import type { Frame, V3 } from './engine'
import type { RenderSize } from './renderSession'

export type RenderRequest =
  | { type: 'init'; canvases: OffscreenCanvas[]; size: RenderSize }
  | { type: 'frame'; frame: Frame; t: number; size: RenderSize }

export type RenderResponse =
  | { type: 'ready'; origins: V3[]; kind: 'webgpu' | '2d'; hdr: boolean }
  | { type: 'frame'; ms: number }
  | { type: 'error'; message: string }
