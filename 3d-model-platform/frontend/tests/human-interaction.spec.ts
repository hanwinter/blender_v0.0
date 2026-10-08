import { expect, test } from '@playwright/test'
import { PNG } from 'pngjs'

function diff(a: PNG, b: PNG) {
  let count = 0
  for (let i=0; i<a.data.length; i+=4) if ([0,1,2].some(c=>a.data[i+c]!==b.data[i+c])) count++
  return count
}
for (const asset of ['bodyFemale-realistic','bodyFemale-stylized','bodyMale-realistic','bodyMale-stylized']) {
test(asset + ' parts select, highlight independently, pan and reset', async ({ page }, testInfo) => {
  const errors: string[]=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto('/')
  await page.getByLabel('模型来源').selectOption(asset)
  await expect(page.locator('.part-row')).toHaveCount(8)
  await page.getByRole('button',{name:'主视',exact:true}).click()
  const canvas=page.getByLabel('3D 模型视图')
  await page.mouse.move(0,0)
  const screenshot=async()=>PNG.sync.read(await canvas.screenshot())
  const original=await screenshot()
  let baseline=original
  for (const [id,label] of [['head','头部'],['torso','躯干'],['left_arm','左臂'],['right_arm','右臂'],['left_leg','左腿'],['right_leg','右腿'],['left_eye','左眼'],['right_eye','右眼']]) {
    if(id==='left_eye') {
      await page.getByRole('button',{name:'取消选择',exact:true}).click()
      const rect=(await canvas.boundingBox())!
      await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2)
      await page.mouse.down({button:'right'})
      await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2+250,{steps:12})
      await page.mouse.up({button:'right'})
      await page.mouse.wheel(0,-1000)
      await page.waitForTimeout(500)
      await page.mouse.move(0,0)
      baseline=await screenshot()
    }
    const cancel=page.getByRole('button',{name:'取消选择',exact:true})
    if(await cancel.count())await cancel.click()
    await page.mouse.move(0,0)
    await page.waitForTimeout(100)
    baseline=await screenshot()
    await page.getByRole('button',{name:label+' '+id,exact:true}).click()
    await expect(page.locator('.object-id')).toHaveText(id)
    await expect(page.getByRole('heading',{level:3})).toHaveText(label)
    await expect(page.locator('.selection-content')).toContainText('示例说明')
    await page.mouse.move(0,0)
    expect(diff(baseline,await screenshot())).toBeGreaterThan(id.includes('eye')?1:100)
    const highlighted=await screenshot()
    const changed: { x:number; y:number }[]=[]
    for(let y=0;y<highlighted.height;y++)for(let x=0;x<highlighted.width;x++){
      const i=(y*highlighted.width+x)*4
      if(highlighted.data[i+1]!-highlighted.data[i]!>10 && highlighted.data[i+1]!-highlighted.data[i+2]!>3 && Math.abs(highlighted.data[i]!-baseline.data[i]!)>8)changed.push({x,y})
    }
    expect(changed.length).toBeGreaterThan(0)
    // Choose an interior pixel, not an antialiased silhouette/eyelid edge.
    let interior=new Set(changed.map(p=>p.y*highlighted.width+p.x))
    for(;;) {
      const next=new Set([...interior].filter(i=>
        [-1,1,-highlighted.width,highlighted.width].every(offset=>interior.has(i+offset))))
      if(!next.size)break
      interior=next
    }
    const index=[...interior][Math.floor(interior.size/2)]!
    const point={x:index%highlighted.width,y:Math.floor(index/highlighted.width)}
    await page.getByRole('button',{name:'取消选择',exact:true}).click()
    const rect=(await canvas.boundingBox())!
    await page.mouse.click(rect.x+point.x,rect.y+point.y)
    await expect(page.locator('.object-id')).toHaveText(id)
    await page.mouse.move(0,0)
    await page.screenshot({path:testInfo.outputPath(id+'.png')})
  }
  await page.getByRole('button',{name:'取消选择',exact:true}).click()
  await page.getByRole('button',{name:'重置视角',exact:true}).click()
  baseline=original
  const bounds=await canvas.boundingBox();if(!bounds)throw Error('No canvas')
  // Orthographic front-view projection and known world height allow body clicks.
  // Pick visible regions by their diagnostic geometry bounds in the next test.
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2)
  await page.mouse.down({button:'right'})
  await page.mouse.move(bounds.x+bounds.width/2+90,bounds.y+bounds.height/2+45,{steps:12})
  await page.mouse.up({button:'right'})
  await page.mouse.move(0,0)
  await expect.poll(async()=>diff(baseline,await screenshot())).toBeGreaterThan(1000)
  await expect(page.locator('.object-id')).toHaveCount(0)
  await page.getByRole('button',{name:'重置视角',exact:true}).click()
  await expect.poll(async()=>diff(baseline,await screenshot())).toBeLessThan(100)
  expect(errors).toEqual([])
})

}
