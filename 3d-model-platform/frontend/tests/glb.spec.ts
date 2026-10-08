import { expect, test } from '@playwright/test'
import { PNG } from 'pngjs'

test('four local human models render, switch views, and return to Cube', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  const select = page.getByLabel('模型来源')
  await expect(select).toHaveValue('demo')
  await expect(select.locator('option')).toHaveCount(6)
  await page.getByRole('button', { name: 'Viewer Debug', exact: true }).click()
  for (const key of ["bodyFemale-realistic","bodyFemale-stylized","bodyMale-realistic","bodyMale-stylized"]) {
    await select.selectOption(key)
    await expect(page.locator('.debug-values')).toContainText('8 / 14')
    await expect(page.locator('.viewer-error')).toHaveCount(0)
    await expect(page.locator('.part-row')).toHaveCount(8)
    await expect(page.getByRole('status')).toHaveText('本地模型')
    for (const view of ['主视', '俯视', '右视', '透视']) {
      await page.getByRole('button', { name: view, exact: true }).click()
      const png = PNG.sync.read(await page.getByLabel('3D 模型视图').screenshot())
      let occupied = 0
      for (let i = 0; i < png.data.length; i += 4) {
        if ([0, 1, 2].some(c => Math.abs(png.data[i + c]! - png.data[c]!) > 12)) occupied++
      }
      expect(occupied).toBeGreaterThan(1000)
    }
    await page.screenshot({ path: testInfo.outputPath(key + '.png') })
  }
  await select.selectOption('interaction-test')
  await expect(page.locator('.part-row')).toHaveCount(3)
  await select.selectOption('demo')
  await expect(page.locator('.part-row')).toHaveCount(6)
  expect(errors).toEqual([])
})
