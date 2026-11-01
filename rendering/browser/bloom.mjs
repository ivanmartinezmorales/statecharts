/** Cache the soft light at its display size. Call only when source or size changes. */
export function createCanvasBloom(source, width, height, radii) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  for (const radius of radii) {
    ctx.filter = `blur(${radius.toFixed(1)}px)`;
    ctx.drawImage(source, 0, 0, width, height);
  }
  return canvas;
}
