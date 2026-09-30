import { expect, test } from '@playwright/test'

test('production defaults hide developer diagnostics and retain both models', async ({ page }, testInfo) => {
  test.skip(!process.env.PRODUCTION_BASE_URL, 'Run explicitly against a built preview')
  await page.goto(process.env.PRODUCTION_BASE_URL!)
  await expect(page.getByRole('status')).toHaveText('服务在线')
  await expect(page.getByRole('button', { name: 'Viewer Debug', exact: true })).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Viewer Debug' })).toHaveCount(0)
  await expect(page.locator('.part-row')).toHaveCount(6)
  await page.getByLabel('模型来源').selectOption('interaction-test')
  await expect(page.locator('.part-row')).toHaveCount(3)
  await page.getByRole('button', { name: '主视', exact: true }).click()
  await page.getByRole('button', { name: '部件 A part_a', exact: true }).click()
  await expect(page.locator('.object-id')).toHaveText('part_a')
  await page.screenshot({ path: testInfo.outputPath('production.png') })
})
