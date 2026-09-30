import { expect, test } from '@playwright/test'

test('mount, unmount and prop replacement never accumulate animation loops', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    const frames = new Set<number>()
    const request = window.requestAnimationFrame.bind(window)
    const cancel = window.cancelAnimationFrame.bind(window)
    window.requestAnimationFrame = (callback) => {
      const id = request((time) => { frames.delete(id); callback(time) })
      frames.add(id)
      return id
    }
    window.cancelAnimationFrame = (id) => { frames.delete(id); cancel(id) }
    Object.defineProperty(window, '__viewerFrames', { value: frames })
  })
  const count = () => page.evaluate(() => (Reflect.get(window, '__viewerFrames') as Set<number>).size)
  await page.goto('/tests/fixtures/harness.html')
  for (let index = 0; index < 6; index++) {
    await expect.poll(count).toBe(1)
    await page.getByRole('button', { name: '卸载' }).click()
    await expect.poll(count).toBe(0)
    await page.getByRole('button', { name: '挂载' }).click()
  }
  await expect.poll(count).toBe(1)
  await page.getByRole('button', { name: '切换资源' }).click()
  await expect(page.getByRole('alert')).toHaveText('当前版本暂不支持 GLB 资源。')
  await expect.poll(count).toBe(0)
  await page.getByRole('button', { name: '切换资源' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect.poll(count).toBe(1)
  await page.getByRole('button', { name: '卸载' }).click()
  await expect.poll(count).toBe(0)
  expect(errors).toEqual([])
})
