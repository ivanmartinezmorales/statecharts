import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(() => {
    for (const method of ['putImageData', 'drawImage', 'clearRect'] as const) {
      const original = CanvasRenderingContext2D.prototype[method]
      CanvasRenderingContext2D.prototype[method] = function (...args) {
        if (this.canvas.isConnected) this.canvas.dataset.paints = String(Number(this.canvas.dataset.paints || 0) + 1)
        return original.apply(this, args)
      }
    }
  })
  ;(page as any).renderErrors = errors
})

test.afterEach(async ({ page }) => { expect((page as any).renderErrors).toEqual([]) })

test('Plane production worker loads, renders, resizes, and opens tour controls', async ({ page }) => {
  await page.goto('http://127.0.0.1:5354')
  await expect(page.locator('.cover__meta')).toContainText('WebGPU')
  await expect(page.locator('.stage__gpu')).toHaveJSProperty('width', 1280)
  await page.locator('.card__deeper').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Next →' }).click()
  await expect(page.locator('.deep__count')).toContainText('2 of')
  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.stage__gpu')).toHaveJSProperty('width', 390)
})

test('Origami skips offscreen previews and static frames; folding and route cleanup work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('http://127.0.0.1:5352')
  await expect(page.locator('.tile').first()).toBeVisible()
  await expect.poll(() => page.locator('canvas[data-paints]').count()).toBeGreaterThan(0)
  const offscreen = await page.locator('.tile canvas').evaluateAll(canvases => canvases.filter(c => c.getBoundingClientRect().top > innerHeight).map(c => c.dataset.paints || '0'))
  expect(offscreen.length).toBeGreaterThan(0)
  expect(offscreen.every(n => n === '0')).toBe(true)
  const first = page.locator('.up-next-art canvas')
  const count = await first.getAttribute('data-paints')
  await page.waitForTimeout(150)
  expect(await first.getAttribute('data-paints')).toBe(count)
  await page.locator('.tile').first().click()
  await expect(page.locator('.workspace')).toBeVisible()
  await expect.poll(() => page.locator('.stage canvas').getAttribute('data-paints')).not.toBeNull()
  await page.keyboard.press('Space')
  await expect.poll(async () => Number(await page.locator('.stage canvas').getAttribute('data-paints'))).toBeGreaterThan(2)
  await page.locator('.back').click()
  await expect(page.locator('.picker')).toBeVisible()
  await expect(page.locator('.workspace')).toHaveCount(0)
})

test('Story reveal, choices, bloom resize, and offscreen pause work', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 500 })
  await page.goto('http://127.0.0.1:5351')
  await expect.poll(async () => Number(await page.locator('#glow').getAttribute('data-paints'))).toBeGreaterThan(2)
  const before = await page.locator('#state-text').textContent()
  await page.waitForTimeout(1000)
  await page.locator('#choices button').first().click()
  await expect(page.locator('#state-text')).not.toHaveText(before!)
  await page.setViewportSize({ width: 390, height: 500 })
  await expect.poll(() => page.locator('#glow').evaluate(c => c.width === Math.round(c.getBoundingClientRect().width * devicePixelRatio))).toBe(true)
  await page.locator('#rules').scrollIntoViewIfNeeded()
  await page.waitForTimeout(100)
  const count = await page.locator('#glow').getAttribute('data-paints')
  await page.waitForTimeout(150)
  expect(await page.locator('#glow').getAttribute('data-paints')).toBe(count)
})

test('Underground layer, model, and journey controls work after resize', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('http://127.0.0.1:5353')
  await expect(page.getByRole('heading', { name: 'Under the Street' })).toBeVisible()
  await page.locator('.ug-hero__index button').nth(1).click()
  await expect(page.locator('.ug-imm')).toBeVisible()
  await expect(page.locator('button.ug-imm__note[data-on]').first()).toBeVisible()
  await page.locator('button.ug-imm__note[data-on]').first().click()
  await expect(page.locator('.ug-detail')).toBeVisible()
  await expect(page.locator('.ug-3d__view canvas')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.locator('.ug-3d__view canvas').evaluate(c => c.width > 1)).toBe(true)
  const journey = page.locator('.ug-detail__journey')
  if (await journey.count()) {
    await journey.click()
    await expect(page.locator('.ug-journey')).toBeVisible()
    await page.keyboard.press('ArrowRight')
  } else await page.locator('.ug-detail__close').click()
})

test('Underground internet journey reaches the globe and resizes its GPU canvas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('http://127.0.0.1:5353')
  await page.locator('.ug-hero__index button').nth(1).click()
  await expect(page.locator('.ug-imm')).toHaveAttribute('data-phase', 'in')
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight')
  await page.getByRole('button', { name: 'About the internet cables' }).click()
  await page.getByRole('button', { name: /Follow the internet, from your house/ }).click()
  await expect(page.locator('.ug-journey')).toBeVisible()
  for (let i = 0; i < 10 && !(await page.locator('.ug-globe').count()); i++) await page.keyboard.press('ArrowRight')
  await expect(page.locator('.ug-globe__view canvas')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.locator('.ug-globe__view canvas').evaluate(c => c.width)).toBe(130)
  await page.keyboard.press('Escape')
  await expect(page.locator('.ug-globe')).toHaveCount(0)
})
