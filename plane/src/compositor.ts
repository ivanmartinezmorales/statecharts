// Puts the engine's three layers on screen. With WebGPU, the picture is drawn with hard pixel edges and the glow and
// bloom are added on top in a float canvas with extended tone mapping, so on an HDR display the system flows glow
// brighter than white. Without WebGPU, the same layers are stacked as 2D canvases with screen blending.

import type { Engine } from './engine'

export type Compositor = { present: () => void; resize: () => void; hdr: boolean; kind: 'webgpu' | '2d' }

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

export async function createCompositor(canvas: HTMLCanvasElement, layers2d: HTMLCanvasElement[], engine: Engine): Promise<Compositor> {
  const gpu = await webgpu(canvas, engine).catch(() => null)
  if (gpu) {
    layers2d.forEach((c) => (c.hidden = true))
    return gpu
  }
  canvas.hidden = true
  return canvas2d(layers2d, engine)
}

async function webgpu(canvas: HTMLCanvasElement, engine: Engine): Promise<Compositor | null> {
  if (!navigator.gpu) return null
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) return null
  const device = await adapter.requestDevice()
  const ctx = canvas.getContext('webgpu')
  if (!ctx) return null
  // ?sdr forces the ordinary range, to compare
  const hdr = matchMedia('(dynamic-range: high)').matches && !new URLSearchParams(location.search).has('sdr')
  const format: GPUTextureFormat = hdr ? 'rgba16float' : navigator.gpu.getPreferredCanvasFormat()
  ctx.configure({ device, format, alphaMode: 'opaque', toneMapping: { mode: hdr ? 'extended' : 'standard' } } as GPUCanvasConfiguration)

  const module = device.createShaderModule({ code: SHADER })
  const pipeline = device.createRenderPipeline({ layout: 'auto', vertex: { module, entryPoint: 'vs' }, fragment: { module, entryPoint: 'fs', targets: [{ format }] } })
  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' })
  const uniforms = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
  let tex: GPUTexture[] = []
  let group: GPUBindGroup | null = null

  const resize = () => {
    const dpr = Math.min(devicePixelRatio, 2)
    canvas.width = Math.round(canvas.clientWidth * dpr)
    canvas.height = Math.round(canvas.clientHeight * dpr)
    const { w, h, bw, bh } = engine.size()
    tex.forEach((t) => t.destroy())
    const make = (width: number, height: number) => device.createTexture({ size: [width, height], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST })
    tex = [make(w, h), make(w, h), make(bw, bh)]
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
  resize()

  return {
    kind: 'webgpu',
    hdr,
    resize,
    present() {
      if (!group) return
      const { w, h, bw, bh } = engine.size()
      const l = engine.layers()
      device.queue.writeTexture({ texture: tex[0] }, l.picture, { bytesPerRow: w * 4 }, [w, h])
      device.queue.writeTexture({ texture: tex[1] }, l.glow, { bytesPerRow: w * 4 }, [w, h])
      device.queue.writeTexture({ texture: tex[2] }, l.bloom, { bytesPerRow: bw * 4 }, [bw, bh])
      // an HDR screen gets light above white; an ordinary one gets it rolled off gently
      device.queue.writeBuffer(uniforms, 0, new Float32Array([w, h, canvas.width, canvas.height, hdr ? 1.1 : 0.7, hdr ? 1.5 : 0.9, hdr ? 1 : 0, 0]))
      const enc = device.createCommandEncoder()
      const pass = enc.beginRenderPass({ colorAttachments: [{ view: ctx!.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] })
      pass.setPipeline(pipeline)
      pass.setBindGroup(0, group)
      pass.draw(3)
      pass.end()
      device.queue.submit([enc.finish()])
    },
  }
}

function canvas2d(layers: HTMLCanvasElement[], engine: Engine): Compositor {
  const [pic, glow, bloom] = layers
  const ctx = layers.map((c) => c.getContext('2d')!)
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
    resize,
    present() {
      const { w, h, bw, bh } = engine.size()
      const l = engine.layers()
      ctx[0].putImageData(new ImageData(new Uint8ClampedArray(l.picture), w, h), 0, 0)
      ctx[1].putImageData(new ImageData(new Uint8ClampedArray(l.glow), w, h), 0, 0)
      ctx[2].putImageData(new ImageData(new Uint8ClampedArray(l.bloom), bw, bh), 0, 0)
    },
  }
}
