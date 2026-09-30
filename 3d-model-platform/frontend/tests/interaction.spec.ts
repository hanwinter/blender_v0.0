import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { PNG } from 'pngjs'

async function pixels(canvas: Locator) { return PNG.sync.read(await canvas.screenshot()) }
function colorAt(png: PNG, x: number, y: number) {
  const index = (Math.floor(y) * png.width + Math.floor(x)) * 4
  return Array.from(png.data.subarray(index, index + 3))
}
function bounds(png: PNG) {
  let left = png.width, right = 0, top = png.height, bottom = 0
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const i = (y * png.width + x) * 4
    if ([0, 1, 2].some((channel) => Math.abs(png.data[i + channel]! - png.data[channel]!) > 12)) {
      left = Math.min(left, x); right = Math.max(right, x)
      top = Math.min(top, y); bottom = Math.max(bottom, y)
    }
  }
  return { left, top, width: right - left + 1, height: bottom - top + 1 }
}

test('multi-mesh and deep parts pick stable IDs and isolate a shared material', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await page.getByLabel('模型来源').selectOption('interaction-test')
  await expect(page.getByRole('status')).toHaveText('服务在线')
  await expect(page.locator('.part-row')).toHaveCount(3)
  await page.getByRole('button', { name: '主视', exact: true }).click()
  await page.getByRole('button', { name: 'Viewer Debug', exact: true }).click()
  const debug = page.getByRole('region', { name: 'Viewer Debug' })
  await expect(debug).toContainText('3 / 4')
  await expect(debug.getByText('48', { exact: true })).toBeVisible()
  const canvas = page.getByLabel('3D 模型视图')
  const rectangle = (await canvas.boundingBox())!
  await page.mouse.move(10, 10)
  const base = await pixels(canvas)
  const shape = bounds(base)
  const a1 = { x: shape.left + shape.width * 0.108, y: shape.top + shape.height * 0.2 }
  const a2 = { x: a1.x, y: shape.top + shape.height * 0.8 }
  const b = { x: shape.left + shape.width * 0.5, y: shape.top + shape.height * 0.5 }
  const c = { x: shape.left + shape.width * 0.892, y: b.y }
  const move = (point: { x: number; y: number }) => page.mouse.move(rectangle.x + point.x, rectangle.y + point.y)
  const click = (point: { x: number; y: number }) => page.mouse.click(rectangle.x + point.x, rectangle.y + point.y)
  await move(a1)
  await expect.poll(async () => colorAt(await pixels(canvas), a1.x, a1.y)).not.toEqual(colorAt(base, a1.x, a1.y))
  const hovered = await pixels(canvas)
  expect(colorAt(hovered, a2.x, a2.y)).not.toEqual(colorAt(base, a2.x, a2.y))
  expect(colorAt(hovered, b.x, b.y)).toEqual(colorAt(base, b.x, b.y))
  expect(colorAt(hovered, c.x, c.y)).toEqual(colorAt(base, c.x, c.y))
  await click(a2)
  await expect(page.locator('.object-id')).toHaveText('part_a')
  await expect(debug.getByText('assembly_left', { exact: true })).toBeVisible()
  const selected = await pixels(canvas)
  expect(colorAt(selected, a1.x, a1.y)).toEqual(colorAt(selected, a2.x, a2.y))
  expect(colorAt(selected, a1.x, a1.y)).not.toEqual(colorAt(hovered, a1.x, a1.y))
  await move(a1)
  expect(colorAt(await pixels(canvas), a1.x, a1.y)).toEqual(colorAt(selected, a1.x, a1.y))
  await move(b)
  const anotherHover = await pixels(canvas)
  expect(colorAt(anotherHover, a1.x, a1.y)).toEqual(colorAt(selected, a1.x, a1.y))
  expect(colorAt(anotherHover, b.x, b.y)).not.toEqual(colorAt(base, b.x, b.y))
  await page.screenshot({ path: testInfo.outputPath('interaction-debug.png') })
  await click(c)
  await expect(page.locator('.object-id')).toHaveText('part_c')
  await expect(debug.getByText('assembly_right', { exact: true })).toBeVisible()
  await page.mouse.move(10, 10)
  expect(colorAt(await pixels(canvas), a1.x, a1.y)).toEqual(colorAt(base, a1.x, a1.y))
  await page.getByLabel('模型来源').selectOption('demo')
  await expect(page.locator('.part-row')).toHaveCount(6)
  await expect(page.locator('.object-id')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('material clones stay bounded and all owned resources are disposed once', async ({ page }) => {
  await page.goto('/tests/fixtures/harness.html')
  const result = await page.evaluate(async () => {
    const path = '/tests/fixtures/contracts.ts'
    return (await import(path)).checkMaterialOwnership()
  })
  expect(result).toEqual({ clones: 3, samePartShares: true, otherPartIsolated: true, stableReferences: true, restored: true, cloneDisposals: 3, originalDisposals: 1, geometryDisposals: 2 })
})

test('metadata validator reports both duplicate sources, absent parts and missing fields', async ({ page }) => {
  await page.goto('/tests/fixtures/harness.html')
  const issues = await page.evaluate(async () => {
    const path = '/tests/fixtures/contracts.ts'
    return (await import(path)).checkMetadataValidation()
  })
  expect(issues).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 'DUPLICATE_PART_ID', detail: 'Duplicate part ID (geometry): part_a' }),
    expect.objectContaining({ code: 'DUPLICATE_PART_ID', detail: 'Duplicate part ID (metadata): part_a' }),
    expect.objectContaining({ code: 'PART_ID_MISMATCH', detail: 'Missing metadata: part_c' }),
    expect.objectContaining({ code: 'PART_ID_MISMATCH', detail: 'Metadata without geometry: phantom' }),
    expect.objectContaining({ code: 'INVALID_METADATA', detail: 'Missing name: part_a' }),
    expect.objectContaining({ code: 'INVALID_METADATA', detail: 'Missing description: part_a' }),
  ]))
})
