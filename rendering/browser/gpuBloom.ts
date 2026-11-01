import type { BloomInput } from './raster'

const SOURCE = /* wgsl */ `
@group(0) @binding(0) var<storage, read> src: array<f32>;
@group(0) @binding(1) var<storage, read> kernel: array<f32>;
@group(0) @binding(2) var<uniform> size: vec2u;
fn blurred(p: vec2u, axis: vec2i) -> vec3f {
  var sum = vec3f(0);
  for (var j = 0; j < 19; j++) {
    let q = vec2u(clamp(vec2i(p) + axis * (j - 9), vec2i(0), vec2i(size) - 1));
    let i = (q.y * size.x + q.x) * 3;
    sum += vec3f(src[i], src[i + 1], src[i + 2]) * kernel[j];
  }
  return sum / kernel[19];
}`
const HORIZONTAL = SOURCE + /* wgsl */ `
@group(0) @binding(3) var<storage, read_write> dst: array<f32>;
@compute @workgroup_size(8, 8) fn main(@builtin(global_invocation_id) p: vec3u) {
  if (any(p.xy >= size)) { return; }
  let c = blurred(p.xy, vec2i(1, 0));
  let i = (p.y * size.x + p.x) * 3;
  dst[i] = c.r; dst[i + 1] = c.g; dst[i + 2] = c.b;
}`
const VERTICAL = SOURCE + /* wgsl */ `
@group(0) @binding(3) var dst: texture_storage_2d<rgba8unorm, write>;
@compute @workgroup_size(8, 8) fn main(@builtin(global_invocation_id) p: vec3u) {
  if (any(p.xy >= size)) { return; }
  // Match Rust's final clamp and truncation, after both float blur passes.
  let c = floor(clamp(blurred(p.xy, vec2i(0, 1)) * 1.2, vec3f(0), vec3f(255))) / 255.0;
  textureStore(dst, p.xy, vec4f(c, 1));
}`

export async function createGpuBloom(device: GPUDevice) {
  const [horizontal, vertical] = await Promise.all([HORIZONTAL, VERTICAL].map(code =>
    device.createComputePipelineAsync({ layout: 'auto', compute: { module: device.createShaderModule({ code }), entryPoint: 'main' } }),
  ))
  const kernel = device.createBuffer({ size: 80, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
  const size = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
  let buffers: GPUBuffer[] = []
  let groups: GPUBindGroup[] = []
  let width = 0, height = 0
  return {
    resize(w: number, h: number, target: GPUTexture) {
      width = w; height = h
      buffers.forEach(b => b.destroy())
      buffers = [0, 1].map(() => device.createBuffer({ size: w * h * 12, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }))
      device.queue.writeBuffer(size, 0, new Uint32Array([w, h, 0, 0]))
      groups = [horizontal, vertical].map((pipeline, i) => device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: buffers[i] } },
          { binding: 1, resource: { buffer: kernel } },
          { binding: 2, resource: { buffer: size } },
          { binding: 3, resource: i === 0 ? { buffer: buffers[1] } : target.createView() },
        ],
      }))
    },
    encode(encoder: GPUCommandEncoder, input: BloomInput) {
      device.queue.writeBuffer(buffers[0], 0, input.light)
      device.queue.writeBuffer(kernel, 0, input.kernel)
      for (const [i, pipeline] of [horizontal, vertical].entries()) {
        const pass = encoder.beginComputePass()
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, groups[i])
        pass.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8))
        pass.end()
      }
    },
    destroy() {
      buffers.forEach(b => b.destroy())
      kernel.destroy(); size.destroy()
    },
  }
}
