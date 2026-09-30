import { expect, test } from '@playwright/test'

test('invalid and mismatched metadata does not block the cube or picking', async ({ page, request }, testInfo) => {
  const model = await (await request.get('/api/models/demo_cube')).json()
  model.parts = model.parts.filter((part: { id: string }) => part.id !== 'face_right')
  model.parts[0].name = ''
  model.parts[0].description = ''
  model.parts.push({ ...model.parts[0] }, { id: 'phantom', name: 'Extra', description: 'Extra' })
  model.part_count = model.parts.length
  await page.route('**/api/models/demo_cube', (route) => route.fulfill({ json: model }))
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('模型信息不完整')
  await expect(page.locator('.part-row')).toHaveCount(6)
  await page.getByRole('button', { name: 'Viewer Debug', exact: true }).click()
  const debug = page.getByRole('region', { name: 'Viewer Debug' })
  await expect(debug).toContainText('DUPLICATE_PART_ID')
  await expect(debug).toContainText('Missing metadata: face_right')
  await expect(debug).toContainText('Metadata without geometry: phantom')
  await expect(debug).toContainText('Missing name: face_front')
  await expect(debug).toContainText('Missing description: face_front')
  await page.getByRole('button', { name: '右视', exact: true }).click()
  await page.getByLabel('3D 模型视图').click()
  await expect(page.locator('.object-id')).toHaveText('face_right')
  await expect(page.getByRole('complementary')).toContainText('部件信息暂不可用。')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('metadata-debug.png') })
})

for (const scenario of [
  { status: 404, text: '未找到模型', code: 'MODEL_NOT_FOUND' },
  { status: 500, text: '模型信息加载失败', code: 'METADATA_LOAD_ERROR' },
]) {
  test(`metadata HTTP ${scenario.status} has a specific friendly status`, async ({ page }) => {
    await page.route('**/api/models/demo_cube', (route) => route.fulfill({ status: scenario.status, json: { detail: 'Test failure' } }))
    await page.goto('/')
    await expect(page.getByRole('status')).toHaveText(scenario.text)
    await page.getByRole('button', { name: 'Viewer Debug', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Viewer Debug' })).toContainText(scenario.code)
    await page.getByRole('button', { name: '主视', exact: true }).click()
    await page.getByLabel('3D 模型视图').click()
    await expect(page.locator('.object-id')).toHaveText('face_front')
  })
}

test('invalid JSON is classified separately from network failure', async ({ page }) => {
  await page.route('**/api/models/demo_cube', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{invalid' }))
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('模型信息不完整')
  await page.getByRole('button', { name: 'Viewer Debug', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Viewer Debug' })).toContainText('INVALID_METADATA')
  await expect(page.locator('.part-row')).toHaveCount(6)
})

test('debug remains legible on a narrow viewport', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Viewer Debug', exact: true }).click()
  const debug = page.getByRole('region', { name: 'Viewer Debug' })
  await expect(debug).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
  const box = (await page.getByLabel('3D 模型视图').boundingBox())!
  const debugBox = (await debug.boundingBox())!
  expect(box.height).toBeGreaterThan(200)
  expect(debugBox.y).toBeGreaterThanOrEqual(box.y + box.height)
  await page.screenshot({ path: testInfo.outputPath('mobile-debug.png'), fullPage: true })
})
