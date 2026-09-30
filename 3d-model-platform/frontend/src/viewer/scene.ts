import { Color, DirectionalLight, HemisphereLight, Scene, WebGLRenderer } from 'three'

export function createScene(canvas: HTMLCanvasElement) {
  const scene = new Scene()
  scene.background = new Color('#f5f6f7')
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  scene.add(new HemisphereLight('#ffffff', '#9da5ae', 2.2))
  const keyLight = new DirectionalLight('#ffffff', 3)
  keyLight.position.set(3, 6, 4)
  scene.add(keyLight)
  return { scene, renderer }
}
