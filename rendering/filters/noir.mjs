// Pixel noir: the city at night in black and white, lit by one color, the amber of sodium street lamps, with red kept
// only where something warns. Every color the site draws goes through `noir`, so the picture, the animation, the
// journeys, the globe and the 3D parts share one grade. Plain JavaScript, so the Node script that draws the picture
// can use it too.

const AMBER = [[38, 20, 6], [146, 82, 18], [240, 166, 58], [255, 236, 192]]
const RED = [[36, 6, 8], [146, 20, 26], [228, 54, 52]]

const clamp = (v) => Math.max(0, Math.min(1, v))
function ramp(stops, t) {
  const u = clamp(t) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(u)), f = u - i
  return stops[i].map((a, k) => Math.round(a + (stops[i + 1][k] - a) * f))
}

/** An [r, g, b] color (0 to 255) as its noir color: warm bright light stays amber, strong red stays red, and
 *  everything else becomes gray by its brightness, with the shadows crushed toward black. */
export function noir(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), v = max / 255, s = max ? (max - min) / max : 0
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  let h = 0
  if (max !== min) {
    const d = max - min
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h = (h * 60 + 360) % 360
  }
  if (h >= 20 && h <= 66 && ((s > 0.6 && v > 0.4) || (s > 0.45 && v > 0.7) || (s > 0.12 && v > 0.92))) return ramp(AMBER, 0.15 + L * 1.05)
  if ((h < 12 || h > 345) && s > 0.6 && v > 0.65) return ramp(RED, L * 1.6)
  let t = clamp((L - 0.05) / 0.85)
  t = (t * t * (3 - 2 * t)) ** 1.35
  return [Math.round(5 + t * 235), Math.round(6 + t * 231), Math.round(9 + t * 221)]
}

const toHex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
/** A '#rrggbb' color as its noir '#rrggbb'. */
export function noirHex(hex) {
  const n = parseInt(hex.slice(1), 16)
  return toHex(noir((n >> 16) & 255, (n >> 8) & 255, n & 255))
}

// 32 levels a channel is plenty for pixel art, and keeps the table small enough to build at once
let lut = null
function table() {
  lut = new Uint8Array(32768 * 3)
  for (let i = 0; i < 32768; i++) lut.set(noir(((i >> 10) << 3) + 4, (((i >> 5) & 31) << 3) + 4, ((i & 31) << 3) + 4), i * 3)
  return lut
}

/** Grades a 2D canvas in place. Transparent pixels stay transparent. */
export function gradeCanvas(ctx, w, h) {
  const T = lut ?? table(), img = ctx.getImageData(0, 0, w, h), d = img.data
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue
    const k = (((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3)) * 3
    d[i] = T[k]; d[i + 1] = T[k + 1]; d[i + 2] = T[k + 2]
  }
  ctx.putImageData(img, 0, 0)
}

/** Rain over a night sky: thin streaks falling across rows 0 to `h`, drawn before the grade. */
export function rain(g, t, w, h) {
  g.fillStyle = 'rgba(190,200,220,0.3)'
  for (let i = 0, n = Math.round((w * h) / 380); i < n; i++) {
    const y = (((i * 29 + t * 150) % (h + 6)) + h + 6) % (h + 6) - 6
    g.fillRect(Math.round((i * 47 + t * 18) % w), Math.round(y), 1, 3)
  }
}
