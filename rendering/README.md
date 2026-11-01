# Rendering

All four browser apps use this directory for render scheduling. It also contains both Rust engines, the WASM interfaces, GPU compositing, bloom filters, WebGL surface setup, and the city color filter. App directories contain scene data, controls, and page layout.

| Path | Responsibility |
| --- | --- |
| `browser/loop.mjs` | One frame at a time; 60 Hz limit; pause hidden and offscreen work; coalesce input; stop on cleanup. A callback can request the next frame or return a promise for GPU/worker completion. |
| `browser/compositor.ts`, `gpuBloom.ts`, `raster.ts` | Shared raster-layer contract, WebGPU presentation, two-pass float bloom, Canvas fallback. |
| `browser/bloom.mjs` | Cached Canvas bloom for the story player. |
| `browser/webgl.ts` | WebGL canvas ownership, resize, pixel scale, and cleanup. |
| `filters/noir.mjs` | Shared city color filter for runtime and asset generation. |
| `plane/` | Plane Rust rasterizer, scene drawing, WASM exports, and worker session. |
| `origami/` | Fold geometry, Rust rasterizer, WASM interface, and model wire types. |

Plane renders in a worker when OffscreenCanvas is available. The worker runs Rust/WASM, uploads picture and light buffers, applies GPU bloom, and presents the result. It acknowledges one frame after GPU completion. Worker or GPU failure creates fresh canvases and resumes through the same session API. Canvas fallback uses the Rust blur. GPU bloom receives unclamped float light; it does not blur clipped highlights.

Origami renders on demand. Offscreen previews do not allocate a diagram. Visible previews stop after a static frame; folds and featured rotation request more frames. Each canvas reads the Rust pixel buffer directly, then releases its diagram when the view closes. Recreate memory views after each render because WASM memory can grow.

The city shares one painted life frame among visible viewers. Reduced-motion journeys and models skip unchanged frames. The story caches its bloom source and rebuilds the blur only when the image or display size changes. Each app keeps its current image style and motion settings.

## Build and test

Run from the repository root. Install Rust with the `wasm32-unknown-unknown` target and Node.js first.

```sh
npm ci --prefix plane
npm ci --prefix origami
npm ci --prefix underground
npm ci --prefix pixel
cd plane && npx playwright install chromium && cd ..
npm run wasm --prefix origami
npm run test:shared --prefix plane
npm test --prefix plane
npm run test:apps --prefix plane
cargo clippy --manifest-path rendering/plane/Cargo.toml --all-targets -- -D warnings
```

`test:apps` builds and tests all four production bundles. The GPU tests use full Chromium. Its default headless-shell can lose worker GPU devices on this test system. GPU tests fail if WebGPU is unavailable; fallback tests run separately.

The app build commands keep their existing entry points. Build from a checkout that includes this shared directory. Hosted builds that restrict input to one app directory must include `rendering/` too. Origami's ignored-build rule now includes shared changes. Verify the hosted build root before deployment; local tests do not verify external project settings. See [Vercel build-root settings](https://vercel.com/docs/builds/configure-a-build#root-directory).

## Local measurements

Baseline: `1015147c8598937ec5cb0e41af8b8d642a5fbbf1`. Apple M4 Pro, 14 cores, Rust 1.98.0 release WASM, Node 22.23.1. Five alternating batches of 30 frames per version, after 30 warm-up frames. Table values are median batch means in milliseconds; brackets give the batch range. These are CPU engine times. They exclude browser layout, GPU completion, and display refresh.

| Plane case | Size | Before ms | After ms | Reduction |
| --- | --- | --- | --- | --- |
| Overview | 640 × 360 | 11.56 [11.50–11.84] | 8.53 [8.51–8.60] | 26.2% |
| Cockpit display | 640 × 360 | 24.20 [24.15–24.63] | 18.51 [18.38–18.78] | 23.5% |
| Cabin air | 640 × 360 | 22.99 [22.90–23.44] | 18.00 [17.87–18.31] | 21.7% |
| Overview | 1280 × 720 | 43.61 [43.07–43.62] | 30.90 [30.80–30.97] | 29.1% |
| Cockpit display | 1280 × 720 | 93.79 [93.67–93.83] | 71.33 [71.28–71.46] | 23.9% |
| Cabin air | 1280 × 720 | 83.64 [82.47–84.69] | 63.66 [63.11–64.60] | 23.9% |

To compare two release builds:

```sh
node rendering/bench/plane.mjs /path/to/before.wasm plane/public/engine.wasm
```

The full output comparison passed 945 Plane frames and 792 Origami frames across all 47 models, with zero byte differences. The committed fixtures keep representative original hashes. The GPU blur test checks 84 frames, including small edges and light above 255; its allowed error is one 8-bit channel value. This allows GPU floating-point rounding.

Browser tests verify worker input response, fallback recovery, fresh mounts, mobile resize, offscreen pause, static preview reuse, and controls in all four production apps. These checks do not establish a site-wide FPS or speedup claim. Hardware, browser, viewport, and scene still affect performance.

## Browser frame latency

Chrome 156.0.8078.80, native Apple Metal GPU, SDR, DPR 1, 1280 × 720 display canvas. Five alternating batches of 15 frames, with 30 warm-up frames per version. Both versions wait for GPU completion. The new path includes worker messages. These are frame completion times, not displayed FPS.

| Plane case | Engine size | Before ms | After ms | Reduction |
| --- | --- | --- | --- | --- |
| airplane.overview | 640 × 360 | 12.85 [12.69–12.93] | 8.28 [8.16–8.41] | 35.5% |
| deck.pfd | 640 × 360 | 21.13 [21.08–21.68] | 15.29 [15.25–15.47] | 27.6% |
| cabin.air | 640 × 360 | 20.71 [20.64–20.88] | 16.77 [16.61–16.85] | 19.1% |
| airplane.overview | 1280 × 720 | 44.99 [44.87–45.13] | 26.45 [26.25–26.57] | 41.2% |
| deck.pfd | 1280 × 720 | 77.88 [77.71–79.01] | 55.17 [54.65–55.53] | 29.2% |
| cabin.air | 1280 × 720 | 73.81 [73.69–73.83] | 50.72 [50.44–50.97] | 31.3% |

The main-thread timer probe was delayed by 11.9–77.1 ms during the original draw, and 0–0.2 ms during the worker draw. This checks event-loop availability during one frame; it is not a full interaction-latency measurement.

To repeat, start `npm run dev --prefix plane`, then run:

```sh
node rendering/bench/browser.mjs /path/to/before.wasm
```

The script loads the original compositor from the baseline Git commit. It adds a GPU-completion wait to that compositor for a fair comparison. Temporary benchmark files are removed at exit. Use `BROWSER=chromium` to use Playwright Chromium; absolute timings can differ.
