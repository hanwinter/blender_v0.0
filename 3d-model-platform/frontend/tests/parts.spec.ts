import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { PNG } from 'pngjs'

const faces = [
  { id: 'face_front', name: '前面' }, { id: 'face_back', name: '后面' },
  { id: 'face_left', name: '左面' }, { id: 'face_right', name: '右面' },
  { id: 'face_top', name: '顶面' }, { id: 'face_bottom', name: '底面' },
]

async function pixels(canvas: Locator) { return PNG.sync.read(await canvas.screenshot()) }
function centerColor(png: PNG) {
  const i = (Math.floor(png.height / 2) * png.width + Math.floor(png.width / 2)) * 4
  return Array.from(png.data.subarray(i, i + 3))
}
function colorAt(png: PNG, x: number, y: number) {
  const i = (Math.floor(y) * png.width + Math.floor(x)) * 4
  return Array.from(png.data.subarray(i, i + 3))
}
function changedPixels(first: PNG, second: PNG) {
  let count = 0
  for (let i = 0; i < first.data.length; i += 4) {
    if (first.data[i] !== second.data[i] || first.data[i + 1] !== second.data[i + 1]
      || first.data[i + 2] !== second.data[i + 2]) count++
  }
  return count
}
function footprint(png: PNG) {
  let count = 0
  let left = png.width, right = 0, top = png.height, bottom = 0
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const i = (y * png.width + x) * 4
    if ([0, 1, 2].some((channel) => Math.abs(png.data[i + channel]! - png.data[channel]!) > 12)) {
      count++; left = Math.min(left, x); right = Math.max(right, x)
      top = Math.min(top, y); bottom = Math.max(bottom, y)
    }
  }
  return { count, left, right, top, bottom, width: right - left + 1, height: bottom - top + 1 }
}
async function ready(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('服务在线')
  await expect(page.locator('.part-row')).toHaveCount(6)
}
async function center(page: Page) {
  const canvas = page.getByLabel('3D 模型视图')
  const box = (await canvas.boundingBox())!
  return { canvas, box, x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test('database-backed model and part API contracts', async ({ request }) => {
  expect(await (await request.get('/api/health')).json()).toEqual({ status: 'ok' })
  const models = await request.get('/api/models')
  expect(models.ok()).toBeTruthy()
  const summaries = await models.json()
  expect(summaries.map((model: { id: string }) => model.id)).toEqual(['demo_cube', 'interaction_test'])
  expect(summaries[0]).toEqual({
    id: 'demo_cube', name: '测试立方体', description: '六面部件交互与三视图验证模型。',
    version: '1.0.0', model_url: null, part_count: 6,
  })
  const detail = await (await request.get('/api/models/demo_cube')).json()
  expect(detail.parts.map((part: { id: string; name: string }) => ({ id: part.id, name: part.name }))).toEqual(faces)
  expect(await (await request.get('/api/models/demo_cube/parts')).json()).toEqual(detail.parts)
  expect((await request.get('/api/models/missing')).status()).toBe(404)
  expect((await request.get('/api/models/missing/parts')).status()).toBe(404)
})

test('orthographic views pick the correct independent face and render square projections', async ({ page }, testInfo) => {
  await ready(page)
  for (const view of [
    { name: '主视', id: 'face_front', part: '前面' },
    { name: '俯视', id: 'face_top', part: '顶面' },
    { name: '右视', id: 'face_right', part: '右面' },
  ]) {
    await page.getByRole('button', { name: view.name, exact: true }).click()
    const { canvas, x, y } = await center(page)
    await page.mouse.click(x, y)
    await expect(page.getByRole('heading', { level: 3 })).toHaveText(view.part)
    await expect(page.locator('.object-id')).toHaveText(view.id)
    const image = await pixels(canvas)
    const shape = footprint(image)
    expect(shape.count).toBeGreaterThan(10000)
    expect(Math.abs(shape.width - shape.height)).toBeLessThanOrEqual(2)
    expect(shape.left).toBeGreaterThan(8)
    expect(shape.top).toBeGreaterThan(8)
    expect(shape.right).toBeLessThan(image.width - 8)
    expect(shape.bottom).toBeLessThan(image.height - 8)
    await page.mouse.move(10, 10)
    await page.screenshot({ path: testInfo.outputPath(`${view.id}.png`) })
  }
})

test('hover, selected priority across faces, blank clear, orbit, zoom and reset', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await ready(page)
  await page.getByRole('button', { name: '主视', exact: true }).click()
  const { canvas, box, x, y } = await center(page)
  await page.mouse.move(10, 10)
  const initial = await pixels(canvas)
  await page.mouse.move(x, y)
  await expect.poll(async () => centerColor(await pixels(canvas))).not.toEqual(centerColor(initial))
  const hovered = await pixels(canvas)
  await page.mouse.move(10, 10)
  await expect.poll(async () => centerColor(await pixels(canvas))).toEqual(centerColor(initial))
  await page.mouse.click(x, y)
  await expect(page.locator('.object-id')).toHaveText('face_front')
  const selected = await pixels(canvas)
  expect(centerColor(selected)).not.toEqual(centerColor(hovered))
  await page.mouse.move(10, 10)
  await expect.poll(async () => centerColor(await pixels(canvas))).toEqual(centerColor(selected))

  await page.getByRole('button', { name: '俯视', exact: true }).click()
  await page.mouse.move(x, y)
  await expect(page.locator('.object-id')).toHaveText('face_front')
  await page.getByRole('button', { name: '主视', exact: true }).click()
  await page.mouse.move(x, y)
  await expect.poll(async () => centerColor(await pixels(canvas))).toEqual(centerColor(selected))
  await page.mouse.click(box.x + 10, box.y + 10)
  await expect(page.getByRole('complementary')).toContainText('当前未选择模型部件')
  await expect.poll(async () => centerColor(await pixels(canvas))).toEqual(centerColor(initial))

  await page.getByRole('button', { name: '透视', exact: true }).click()
  await page.mouse.move(10, 10)
  const perspective = await pixels(canvas)
  expect(footprint(perspective).count).toBeGreaterThan(10000)
  await page.screenshot({ path: testInfo.outputPath('perspective-default.png') })
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 140, y + 70, { steps: 15 })
  await page.mouse.up()
  await page.mouse.move(box.x + 10, box.y + 10)
  await page.waitForTimeout(700)
  await expect(page.getByRole('complementary')).toContainText('当前未选择模型部件')
  const rotated = await pixels(canvas)
  expect(changedPixels(perspective, rotated)).toBeGreaterThan(1000)
  await page.mouse.wheel(0, -450)
  await page.waitForTimeout(700)
  expect(changedPixels(rotated, await pixels(canvas))).toBeGreaterThan(1000)
  await page.getByRole('button', { name: '重置视角' }).click()
  await page.mouse.move(10, 10)
  await expect.poll(async () => changedPixels(perspective, await pixels(canvas))).toBeLessThan(100)
  expect(errors).toEqual([])
})

test('visible faces have isolated hover and selection materials', async ({ page }, testInfo) => {
  await ready(page)
  await page.mouse.move(10, 10)
  const { canvas, box } = await center(page)
  const base = await pixels(canvas)
  const shape = footprint(base)
  const front = { x: shape.left + shape.width * 0.25, y: shape.top + shape.height * 0.65 }
  const top = { x: shape.left + shape.width * 0.5, y: shape.top + shape.height * 0.18 }
  const right = { x: shape.left + shape.width * 0.75, y: shape.top + shape.height * 0.65 }
  await page.mouse.click(box.x + front.x, box.y + front.y)
  await expect(page.locator('.object-id')).toHaveText('face_front')
  await page.mouse.move(10, 10)
  const selectedFront = await pixels(canvas)
  expect(colorAt(selectedFront, front.x, front.y)).not.toEqual(colorAt(base, front.x, front.y))
  expect(colorAt(selectedFront, top.x, top.y)).toEqual(colorAt(base, top.x, top.y))
  expect(colorAt(selectedFront, right.x, right.y)).toEqual(colorAt(base, right.x, right.y))
  await page.mouse.move(box.x + top.x, box.y + top.y)
  await expect.poll(async () => colorAt(await pixels(canvas), top.x, top.y)).not.toEqual(colorAt(base, top.x, top.y))
  const hoverTop = await pixels(canvas)
  expect(colorAt(hoverTop, front.x, front.y)).toEqual(colorAt(selectedFront, front.x, front.y))
  expect(colorAt(hoverTop, right.x, right.y)).toEqual(colorAt(base, right.x, right.y))
  await page.screenshot({ path: testInfo.outputPath('independent-faces.png') })
  await page.mouse.click(box.x + top.x, box.y + top.y)
  await expect(page.locator('.object-id')).toHaveText('face_top')
  await page.mouse.move(10, 10)
  const selectedTop = await pixels(canvas)
  expect(colorAt(selectedTop, front.x, front.y)).toEqual(colorAt(base, front.x, front.y))
  expect(colorAt(selectedTop, top.x, top.y)).not.toEqual(colorAt(base, top.x, top.y))
})

test('all six parts can be selected from the list, including hidden faces', async ({ page }) => {
  await ready(page)
  for (const face of faces) {
    const row = page.getByRole('button', { name: `${face.name} ${face.id}`, exact: true })
    await row.click()
    await expect(row).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.part-row[aria-pressed="true"]')).toHaveCount(1)
    await expect(page.locator('.object-id')).toHaveText(face.id)
    await expect(page.getByRole('heading', { level: 3 })).toHaveText(face.name)
  }
  await page.getByRole('button', { name: '取消选择' }).click()
  await expect(page.locator('.part-row[aria-pressed="true"]')).toHaveCount(0)
})

test('resize remains framed and mobile controls do not overflow', async ({ page }, testInfo) => {
  await ready(page)
  for (const size of [{ width: 1920, height: 1080 }, { width: 1100, height: 700 }, { width: 390, height: 844 }, { width: 320, height: 700 }]) {
    await page.setViewportSize(size)
    const { canvas } = await center(page)
    await page.mouse.move(0, 0)
    const png = await pixels(canvas)
    const shape = footprint(png)
    expect(shape.count).toBeGreaterThan(3000)
    expect(shape.left).toBeGreaterThan(5)
    expect(shape.top).toBeGreaterThan(5)
    expect(shape.right).toBeLessThan(png.width - 5)
    expect(shape.bottom).toBeLessThan(png.height - 5)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    if (size.width < 700) {
      const canvasBox = (await canvas.boundingBox())!
      const panelBox = (await page.getByRole('complementary').boundingBox())!
      expect(panelBox.y).toBeGreaterThanOrEqual(canvasBox.y + canvasBox.height)
      await page.screenshot({ path: testInfo.outputPath(`mobile-${size.width}.png`), fullPage: true })
    }
  }
})

test('offline metadata still allows face selection', async ({ page }) => {
  await page.route('**/api/health', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('无法连接服务')
  await page.getByRole('button', { name: '主视', exact: true }).click()
  await page.getByLabel('3D 模型视图').click()
  await expect(page.locator('.object-id')).toHaveText('face_front')
  await expect(page.getByRole('complementary')).toContainText('部件信息暂不可用。')
})

test.describe('touch input', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  test('tap selects a face in the front view', async ({ page }) => {
    await ready(page)
    await page.getByRole('button', { name: '主视', exact: true }).tap()
    await page.getByLabel('3D 模型视图').tap()
    await expect(page.locator('.object-id')).toHaveText('face_front')
    await page.getByRole('button', { name: '取消选择' }).tap()
    await expect(page.getByRole('complementary')).toContainText('当前未选择模型部件')
  })
})
