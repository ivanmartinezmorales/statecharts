export type BloomInput = { light: Float32Array; kernel: Float32Array }

/** Views remain valid until the next draw or resize. Bloom input contains unclamped light. */
export type RasterLayers = {
  size(): { w: number; h: number; bw: number; bh: number }
  layers(): { picture: Uint8ClampedArray; glow: Uint8ClampedArray; bloom: Uint8ClampedArray }
  setGpuBloom(enabled: boolean): void
  bloomInput(): BloomInput
}
