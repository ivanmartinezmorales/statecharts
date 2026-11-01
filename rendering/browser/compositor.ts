// Puts the engine's three layers on screen. With WebGPU, the picture is drawn with hard pixel edges and the glow and
// bloom are added on top in a float canvas with extended tone mapping, so on an HDR display the system flows glow
// brighter than white. Without WebGPU, the same layers are stacked as 2D canvases with screen blending.

import type { RasterLayers } from './raster'
import { createGpuBloom } from './gpuBloom'

export type Surface = HTMLCanvasElement | OffscreenCanvas
export type Viewport = { width: number; height: number; dpr: number; hdr: boolean }
export type Compositor = { present: () => void | Promise<void>; resize: (view: Viewport) => void; destroy: () => void; hdr: boolean; kind: 'webgpu' | '2d' }

const SHADER = /* wgsl */ `
struct U { size: vec2f, view: vec2f, core: f32, bloom: f32, extended: f32, pad: f32 }
@group(0) @binding(0) var pic: texture_2d<f32>;
@group(0) @binding(1) var glo: texture_2d<f32>;
@group(0) @binding(2) var blo: texture_2d<f32>;
@group(0) @binding(3) var smp: sampler;
@group(0) @binding(4) var<uniform> u: U;

@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let p = array(vec2f(-1, -3), vec2f(-1, 1), vec2f(3, 1));
  return vec4f(p[i], 0, 1);
}

fn lin(c: vec3f) -> vec3f { return pow(c, vec3f(2.2)); }
fn enc(c: vec3f) -> vec3f { return pow(max(c, vec3f(0)), vec3f(1.0 / 2.2)); }

@fragment fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = pos.xy / u.view;
  let px = vec2i(floor(uv * u.size));
  let base = lin(textureLoad(pic, px, 0).rgb);
  let core = lin(textureLoad(glo, px, 0).rgb);
  let soft = lin(textureSampleLevel(blo, smp, uv, 0).rgb);
  var c = base + core * u.core + soft * u.bloom;
  if (u.extended < 0.5) { c = c / (1.0 + max(c - vec3f(1.0), vec3f(0)) * 0.6); }
  return vec4f(enc(c), 1);
}`

export async function createCompositor(canvas: Surface, layers2d: Surface[], engine: RasterLayers, view: Viewport, force2d = false): Promise<Compositor> {
  if (!force2d) {
    const gpu = await webgpu(canvas, engine, view).catch(() => null)
    if (gpu) return gpu
  }
  engine.setGpuBloom(false)
  return canvas2d(layers2d, engine)
}

async function webgpu(canvas: Surface, engine: RasterLayers, view: Viewport): Promise<Compositor | null> {
  if (!navigator.gpu) return null
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) return null
  const device = await adapter.requestDevice()
  let cleanup = () => device.destroy()
  try {
    const ctx = canvas.getContext('webgpu') as GPUCanvasContext | null
    if (!ctx) { device.destroy(); return null }
    const hdr = view.hdr
    const format: GPUTextureFormat = hdr ? 'rgba16float' : navigator.gpu.getPreferredCanvasFormat()
    ctx.configure({ device, format, alphaMode: 'opaque', toneMapping: { mode: hdr ? 'extended' : 'standard' } } as GPUCanvasConfiguration)

    const module = device.createShaderModule({ code: SHADER })
    const pipeline = await device.createRenderPipelineAsync({ layout: 'auto', vertex: { module, entryPoint: 'vs' }, fragment: { module, entryPoint: 'fs', targets: [{ format }] } })
    const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' })
    const uniforms = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
    const blur = await createGpuBloom(device)
    let failure: string | undefined
    void device.lost.then(info => { failure = info.message || 'WebGPU device lost' })
    device.addEventListener('uncapturederror', event => { failure = (event as GPUUncapturedErrorEvent).error.message })
    let tex: GPUTexture[] = []
    let group: GPUBindGroup | null = null

    const resize = (view: Viewport) => {
      canvas.width = Math.max(1, Math.round(view.width * view.dpr))
      canvas.height = Math.max(1, Math.round(view.height * view.dpr))
      const { w, h, bw, bh } = engine.size()
      tex.forEach((t) => t.destroy())
      const make = (width: number, height: number, bloom = false) => device.createTexture({ size: [width, height], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | (bloom ? GPUTextureUsage.STORAGE_BINDING : 0) })
      tex = [make(w, h), make(w, h), make(bw, bh, true)]
      blur.resize(bw, bh, tex[2])
      group = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: tex[0].createView() },
          { binding: 1, resource: tex[1].createView() },
          { binding: 2, resource: tex[2].createView() },
          { binding: 3, resource: sampler },
          { binding: 4, resource: { buffer: uniforms } },
        ],
      })
    }
    cleanup = () => {
      engine.setGpuBloom(false)
      blur.destroy()
      tex.forEach(t => t.destroy())
      uniforms.destroy()
      ctx.unconfigure()
      device.destroy()
    }
    resize(view)
    engine.setGpuBloom(true)

    return {
      kind: 'webgpu',
      hdr,
      resize,
      destroy: cleanup,
      present() {
        if (failure) throw new Error(failure)
        if (!group) return
        const { w, h } = engine.size()
        const l = engine.layers()
        device.queue.writeTexture({ texture: tex[0] }, l.picture, { bytesPerRow: w * 4 }, [w, h])
        device.queue.writeTexture({ texture: tex[1] }, l.glow, { bytesPerRow: w * 4 }, [w, h])
        // an HDR screen gets light above white; an ordinary one gets it rolled off gently
        device.queue.writeBuffer(uniforms, 0, new Float32Array([w, h, canvas.width, canvas.height, hdr ? 1.1 : 0.7, hdr ? 1.5 : 0.9, hdr ? 1 : 0, 0]))
        const enc = device.createCommandEncoder()
        blur.encode(enc, engine.bloomInput())
        const pass = enc.beginRenderPass({ colorAttachments: [{ view: ctx!.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] })
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, group)
        pass.draw(3)
        pass.end()
        device.queue.submit([enc.finish()])
        return device.queue.onSubmittedWorkDone()
      },
    }
  } catch (error) {
    cleanup()
    throw error
  }
}

function canvas2d(layers: Surface[], engine: RasterLayers): Compositor {
  const [pic, glow, bloom] = layers
  const ctx = layers.map((c) => c.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null)
  if (ctx.some(c => !c)) throw new Error('Canvas 2D is unavailable')
  const resize = () => {
    const { w, h, bw, bh } = engine.size()
    pic.width = glow.width = w
    pic.height = glow.height = h
    bloom.width = bw
    bloom.height = bh
  }
  resize()
  return {
    kind: '2d',
    hdr: false,
    destroy() {},
    resize,
    present() {
      const { w, h, bw, bh } = engine.size()
      const l = engine.layers()
      ctx[0]!.putImageData(new ImageData(l.picture, w, h), 0, 0)
      ctx[1]!.putImageData(new ImageData(l.glow, w, h), 0, 0)
      ctx[2]!.putImageData(new ImageData(l.bloom, bw, bh), 0, 0)
    },
  }
}
