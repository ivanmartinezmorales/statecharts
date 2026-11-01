import type { Frame } from './engine'
import type { RenderRequest, RenderResponse } from './renderProtocol'
import { createRenderSession, type RenderSize } from './renderSession'

type Backend = Awaited<ReturnType<typeof createRenderSession>>

function startWorker(canvases: HTMLCanvasElement[], size: RenderSize, signal: AbortSignal): Promise<Backend> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./render.worker.ts', import.meta.url), { type: 'module' })
    let ready = false
    let failure: Error | undefined
    let pending: { resolve: (ms: number) => void; reject: (error: Error) => void } | undefined
    const fail = (error: Error) => {
      failure = error
      if (!ready) {
        signal.removeEventListener('abort', destroy)
        worker.terminate()
        reject(error)
      }
      pending?.reject(error)
      pending = undefined
    }
    const destroy = () => {
      signal.removeEventListener('abort', destroy)
      fail(new DOMException('Rendering stopped', 'AbortError'))
      worker.terminate()
    }
    signal.addEventListener('abort', destroy, { once: true })
    worker.onerror = event => {
      event.preventDefault()
      fail(new Error(event.message || 'Render worker failed'))
      worker.terminate()
    }
    worker.onmessageerror = () => { fail(new Error('Invalid render worker message')); worker.terminate() }
    worker.onmessage = (event: MessageEvent<RenderResponse>) => {
      const message = event.data
      if (message.type === 'error') {
        fail(new Error(message.message))
      } else if (message.type === 'frame') {
        pending?.resolve(message.ms)
        pending = undefined
      } else {
        ready = true
        resolve({
          origins: message.origins, kind: message.kind, hdr: message.hdr, destroy,
          draw(frame: Frame, t: number, next: RenderSize) {
            if (failure) return Promise.reject(failure)
            if (pending) return Promise.reject(new Error('A frame is already in progress'))
            return new Promise<number>((resolve, reject) => {
              pending = { resolve, reject }
              const request: RenderRequest = { type: 'frame', frame, t, size: next }
              try { worker.postMessage(request) } catch (error) { fail(error as Error) }
            })
          },
        })
      }
    }
    try {
      signal.throwIfAborted()
      const offscreen = canvases.map(c => c.transferControlToOffscreen())
      const request: RenderRequest = { type: 'init', canvases: offscreen, size }
      worker.postMessage(request, offscreen)
    } catch (error) {
      fail(error as Error)
      destroy()
    }
  })
}

/** Own fresh canvases per mount: a transferred canvas cannot be transferred again. */
export async function createRenderer(host: HTMLElement, initial: RenderSize, signal: AbortSignal) {
  let canvases: HTMLCanvasElement[] = []
  let backend: Backend | undefined
  let worker = false
  let busy = false
  let disposed = false
  const checkActive = () => {
    signal.throwIfAborted()
    if (disposed) throw new DOMException('Rendering stopped', 'AbortError')
  }
  const replaceCanvases = () => {
    canvases.forEach(c => c.remove())
    canvases = ['gpu', 'pic', 'glow', 'bloom'].map(layer => {
      const canvas = document.createElement('canvas')
      canvas.className = `stage__${layer}`
      host.append(canvas)
      return canvas
    })
  }
  const show = () => canvases.forEach((c, i) => { c.hidden = (i === 0) !== (backend!.kind === 'webgpu') })
  const destroy = () => {
    if (disposed) return
    disposed = true
    backend?.destroy()
    canvases.forEach(c => c.remove())
    signal.removeEventListener('abort', destroy)
  }
  signal.addEventListener('abort', destroy, { once: true })
  try {
    signal.throwIfAborted()
    replaceCanvases()
    if (typeof Worker !== 'undefined' && typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function') {
      try {
        backend = await startWorker(canvases, initial, signal)
        worker = true
      } catch (error) {
        signal.throwIfAborted()
        console.warn('Render worker startup failed; using the main thread', error)
        replaceCanvases()
      }
    }
    backend ??= await createRenderSession(canvases, initial, false, signal)
    signal.throwIfAborted()
    show()
    return {
      origins: backend.origins,
      get kind() { return backend!.kind },
      get hdr() { return backend!.hdr },
      get busy() { return busy },
      get worker() { return worker },
      async draw(frame: Frame, t: number, size: RenderSize) {
        checkActive()
        if (busy) throw new Error('A frame is already in progress')
        busy = true
        try {
          return await backend!.draw(frame, t, size)
        } catch (error) {
          checkActive()
          if (!worker && backend!.kind === '2d') throw error
          console.warn('Render backend failed; using Canvas 2D', error)
          backend!.destroy()
          replaceCanvases()
          backend = await createRenderSession(canvases, size, true, signal)
          if (disposed) { backend.destroy(); checkActive() }
          worker = false
          show()
          return await backend.draw(frame, t, size)
        } finally {
          busy = false
        }
      },
      destroy,
    }
  } catch (error) {
    destroy()
    throw error
  }
}
