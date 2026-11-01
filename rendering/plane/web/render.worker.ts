import { createRenderSession } from './renderSession'
import type { RenderRequest, RenderResponse } from './renderProtocol'

let session: Awaited<ReturnType<typeof createRenderSession>> | undefined
const send = (message: RenderResponse) => postMessage(message)
self.onmessage = async (event: MessageEvent<RenderRequest>) => {
  try {
    const message = event.data
    if (message.type === 'init') {
      session = await createRenderSession(message.canvases, message.size)
      send({ type: 'ready', origins: session.origins, kind: session.kind, hdr: session.hdr })
    } else {
      if (!session) throw new Error('Renderer is not ready')
      send({ type: 'frame', ms: await session.draw(message.frame, message.t, message.size) })
    }
  } catch (error) {
    send({ type: 'error', message: error instanceof Error ? error.message : String(error) })
  }
}
