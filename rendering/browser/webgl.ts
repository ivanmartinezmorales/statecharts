type SurfaceRenderer = {
  domElement: HTMLCanvasElement
  setPixelRatio(ratio: number): void
  setSize(w: number, h: number, updateStyle: boolean): void
  dispose(): void
}

/** The app supplies its scene renderer; shared code owns its canvas and resize lifecycle. */
export function createWebGLSurface<T extends SurfaceRenderer>(renderer: T, host: HTMLElement, scale: number, resized: (w: number, h: number) => void) {
  renderer.setPixelRatio(1)
  host.append(renderer.domElement)
  let width = 0, height = 0
  const resize = () => {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight)
    if (w === width && h === height) return
    width = w; height = h
    renderer.setSize(Math.max(1, Math.round(w / scale)), Math.max(1, Math.round(h / scale)), false)
    resized(w, h)
  }
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  return {
    destroy() { observer.disconnect(); renderer.dispose(); renderer.domElement.remove() },
  }
}
