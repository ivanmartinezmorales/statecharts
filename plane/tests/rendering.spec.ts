import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => { await page.goto('/tests/fixture.html') })

test('GPU bloom matches CPU bloom within one channel value, including bright light and small edges', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { loadEngine } = await import('/tests/modules.ts')
    const { createGpuBloom } = await import('/tests/modules.ts')
    const { cases } = await (await fetch('/tests/frames.json')).json()
    const adapter = await navigator.gpu?.requestAdapter()
    if (!adapter) throw new Error('This test requires WebGPU')
    const device = await adapter.requestDevice()
    const blur = await createGpuBloom(device)
    const engine = await loadEngine()
    let maxDifference = 0, frames = 0, aboveWhite = false
    device.pushErrorScope('validation')
    for (const f of cases) {
      engine.resize(f.w, f.h)
      const { bw, bh } = engine.size()
      const texture = device.createTexture({ size: [bw, bh], format: 'rgba8unorm', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC })
      blur.resize(bw, bh, texture)
      const bytesPerRow = Math.ceil(bw * 4 / 256) * 256
      const readback = device.createBuffer({ size: bytesPerRow * bh, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ })
      for (const { t } of f.snapshots) {
        engine.setGpuBloom(false)
        engine.draw(f.frame, t)
        const expected = engine.layers().bloom.slice()
        engine.setGpuBloom(true)
        engine.draw(f.frame, t)
        aboveWhite ||= engine.bloomInput().light.some(v => v > 255)
        const encoder = device.createCommandEncoder()
        blur.encode(encoder, engine.bloomInput())
        encoder.copyTextureToBuffer({ texture }, { buffer: readback, bytesPerRow }, [bw, bh])
        device.queue.submit([encoder.finish()])
        await readback.mapAsync(GPUMapMode.READ)
        const actual = new Uint8Array(readback.getMappedRange())
        for (let y = 0; y < bh; y++) for (let x = 0; x < bw * 4; x++) {
          const delta = Math.abs(actual[y * bytesPerRow + x] - expected[y * bw * 4 + x])
          maxDifference = Math.max(maxDifference, delta)
          if (delta > 1) throw new Error(`${f.name} t=${t}, byte ${y * bw * 4 + x}: difference ${delta}`)
        }
        readback.unmap()
        frames++
      }
      texture.destroy(); readback.destroy()
    }
    const error = await device.popErrorScope()
    blur.destroy(); device.destroy()
    if (error) throw new Error(error.message)
    return { maxDifference, frames, aboveWhite }
  })
  expect(result.frames).toBe(84)
  expect(result.aboveWhite).toBe(true)
  expect(result.maxDifference).toBeLessThanOrEqual(1)
})

test('worker renders, limits in-flight work, resizes, and permits a fresh mount', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { createRenderer } = await import('/tests/modules.ts')
    const { cases } = await (await fetch('/tests/frames.json')).json()
    const host = document.createElement('div'); document.body.append(host)
    const size = { w: 1280, h: 720, width: 1280, height: 720, dpr: 1, hdr: false }
    const controller = new AbortController()
    const renderer = await createRenderer(host, size, controller.signal)
    const f = cases.find(f => f.name === 'deck.pfd').frame
    let complete = false, inputDuringFrame = false
    const pending = renderer.draw(f, 2.3, size).then(() => { complete = true })
    const wasBusy = renderer.busy
    setTimeout(() => { inputDuringFrame = !complete }, 0)
    let rejectedSecondFrame = false
    try { await renderer.draw(f, 2.3, size) } catch { rejectedSecondFrame = true }
    await pending
    const resized = { ...size, w: 321, h: 181, width: 642, height: 362 }
    await renderer.draw(f, 2.3, resized)
    // The offscreen canvas commits its new size at the next browser paint.
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
    const width = host.querySelector('canvas')!.width
    const worker = renderer.worker, kind = renderer.kind
    controller.abort()
    const removed = host.children.length === 0
    const second = new AbortController()
    const again = await createRenderer(host, size, second.signal)
    await again.draw(f, 2.3, size)
    second.abort()
    return { worker, kind, wasBusy, inputDuringFrame, rejectedSecondFrame, width, removed, remaining: host.children.length }
  })
  expect(result).toEqual({ worker: true, kind: 'webgpu', wasBusy: true, inputDuringFrame: true, rejectedSecondFrame: true, width: 642, removed: true, remaining: 0 })
})

test('main-thread Canvas fallback draws directly from WASM views after resize', async ({ page }) => {
  const result = await page.evaluate(async () => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', { value: undefined })
    Object.defineProperty(navigator, 'gpu', { value: undefined })
    const { createRenderer } = await import('/tests/modules.ts')
    const { loadEngine } = await import('/tests/modules.ts')
    const { cases } = await (await fetch('/tests/frames.json')).json()
    const host = document.createElement('div'); document.body.append(host)
    const controller = new AbortController()
    const size = { w: 320, h: 180, width: 640, height: 360, dpr: 1, hdr: false }
    const renderer = await createRenderer(host, size, controller.signal)
    const engine = await loadEngine()
    for (const [w, h] of [[320, 180], [641, 359], [1, 1]]) {
      const f = cases[0].frame
      engine.resize(w, h); engine.draw(f, 2.3)
      await renderer.draw(f, 2.3, { ...size, w, h })
      const layers = Object.values(engine.layers())
      const canvases = [...host.querySelectorAll('canvas')].slice(1)
      for (let k = 0; k < 3; k++) {
        const c = canvases[k]
        const actual = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
        if (actual.some((v, i) => v !== layers[k][i])) throw new Error(`Canvas layer ${k} differs at ${w}x${h}`)
      }
    }
    const result = { worker: renderer.worker, kind: renderer.kind, visible: [...host.querySelectorAll('canvas')].filter(c => !c.hidden).length }
    controller.abort()
    return result
  })
  expect(result).toEqual({ worker: false, kind: '2d', visible: 3 })
})

test('worker startup and runtime failures recover with fresh canvases', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const NativeWorker = Worker
    let latest: Worker | undefined
    // Force init failure after canvas transfer, then use a real worker for runtime failure.
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options)
        latest = this
      }
    }
    const { createRenderer } = await import('/tests/modules.ts')
    const { cases } = await (await fetch('/tests/frames.json')).json()
    const size = { w: 320, h: 180, width: 640, height: 360, dpr: 1, hdr: false }
    const host = document.createElement('div'); document.body.append(host)
    const first = new AbortController()
    const starting = createRenderer(host, size, first.signal)
    latest!.dispatchEvent(new ErrorEvent('error', { message: 'Test startup failure', cancelable: true }))
    const fallback = await starting
    await fallback.draw(cases[0].frame, 2.3, size)
    const startupRecovered = !fallback.worker
    first.abort()
    const second = new AbortController()
    const renderer = await createRenderer(host, size, second.signal)
    const pending = renderer.draw(cases[0].frame, 2.3, size)
    latest!.dispatchEvent(new ErrorEvent('error', { message: 'Test runtime failure', cancelable: true }))
    await pending
    const runtimeRecovered = !renderer.worker && renderer.kind === '2d'
    const canvases = host.children.length
    second.abort()
    return { startupRecovered, runtimeRecovered, canvases, remaining: host.children.length }
  })
  expect(result).toEqual({ startupRecovered: true, runtimeRecovered: true, canvases: 4, remaining: 0 })
})

test('React StrictMode starts cleanly and tour controls remain usable', async ({ page }) => {
  const failures: string[] = []
  page.on('pageerror', error => failures.push(error.message))
  page.on('console', message => { if (message.type() === 'error' && /Render.*failed/.test(message.text())) failures.push(message.text()) })
  await page.goto('/')
  await expect(page.locator('.cover__meta')).toContainText('WebGPU')
  await expect(page.locator('.stage canvas')).toHaveCount(4)
  await page.locator('.card__deeper').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Next →' }).click()
  await expect(page.locator('.deep__count')).toContainText('2 of')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.stage__gpu')).toHaveJSProperty('width', 390)
  expect(failures).toEqual([])
})

test('GPU device loss recovers through Canvas; destroy is terminal', async ({ page }) => {
  const result = await page.evaluate(async () => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', { value: undefined })
    const requestAdapter = navigator.gpu.requestAdapter.bind(navigator.gpu)
    let device: GPUDevice
    navigator.gpu.requestAdapter = async options => {
      const adapter = await requestAdapter(options)
      const requestDevice = adapter!.requestDevice.bind(adapter)
      adapter!.requestDevice = async options => { device = await requestDevice(options); return device }
      return adapter
    }
    const { createRenderer } = await import('/tests/modules.ts')
    const { cases } = await (await fetch('/tests/frames.json')).json()
    const host = document.createElement('div'); document.body.append(host)
    const controller = new AbortController()
    const size = { w: 320, h: 180, width: 640, height: 360, dpr: 1, hdr: false }
    const renderer = await createRenderer(host, size, controller.signal)
    const started = renderer.kind
    await renderer.draw(cases[0].frame, 2.3, size)
    device!.destroy(); await device!.lost
    await renderer.draw(cases[0].frame, 3, size)
    const recovered = renderer.kind
    renderer.destroy(); renderer.destroy()
    let rejected = false
    try { await renderer.draw(cases[0].frame, 4, size) } catch { rejected = true }
    return { started, recovered, rejected, remaining: host.children.length }
  })
  expect(result).toEqual({ started: 'webgpu', recovered: '2d', rejected: true, remaining: 0 })
})
