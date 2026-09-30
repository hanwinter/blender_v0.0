import { Box3, MathUtils, OrthographicCamera, PerspectiveCamera, Vector3 } from 'three'
import type { Object3D } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { ViewMode } from '../types/model'

export function createCameraRig(canvas: HTMLCanvasElement, model: Object3D, initialMode: ViewMode) {
  const bounds = new Box3().setFromObject(model)
  const center = bounds.getCenter(new Vector3())
  const radius = Math.max(bounds.getSize(new Vector3()).length() / 2, 0.01)
  const perspective = new PerspectiveCamera(40, 1, radius / 1000, radius * 100)
  const orthographic = new OrthographicCamera(-1, 1, 1, -1, radius / 1000, radius * 100)
  let mode = initialMode
  let aspect = 1
  let fitDistance = 1
  let camera: PerspectiveCamera | OrthographicCamera = perspective
  let controls: OrbitControls | undefined

  function distanceForAspect() {
    const vertical = MathUtils.degToRad(perspective.fov) / 2
    const horizontal = Math.atan(Math.tan(vertical) * aspect)
    return radius / Math.sin(Math.min(vertical, horizontal)) * 1.15
  }

  function setSize(width: number, height: number) {
    aspect = width / height
    perspective.aspect = aspect
    perspective.updateProjectionMatrix()
    const previousDistance = fitDistance
    fitDistance = distanceForAspect()
    if (controls && camera === perspective) {
      perspective.position.sub(center).multiplyScalar(fitDistance / previousDistance).add(center)
    }
    const halfHeight = radius * 0.9 / Math.min(aspect, 1)
    orthographic.left = -halfHeight * aspect
    orthographic.right = halfHeight * aspect
    orthographic.top = halfHeight
    orthographic.bottom = -halfHeight
    orthographic.updateProjectionMatrix()
  }

  function setMode(next: ViewMode) {
    controls?.dispose()
    mode = next
    camera = next === 'perspective' ? perspective : orthographic
    camera.up.set(0, 1, 0)
    if (next === 'perspective') {
      perspective.position.copy(new Vector3(4, 3, 5).normalize().multiplyScalar(fitDistance).add(center))
    } else {
      orthographic.zoom = 1
      const direction = next === 'front' ? new Vector3(0, 0, 1)
        : next === 'top' ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0)
      if (next === 'top') camera.up.set(0, 0, -1)
      camera.position.copy(direction.multiplyScalar(radius * 4).add(center))
      orthographic.updateProjectionMatrix()
    }
    camera.lookAt(center)
    camera.updateMatrixWorld()
    controls = new OrbitControls(camera, canvas)
    controls.target.copy(center)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enableRotate = next === 'perspective'
    controls.enablePan = false
    controls.minDistance = radius * 1.4
    controls.maxDistance = radius * 20
    controls.minZoom = 0.5
    controls.maxZoom = 4
    controls.update()
  }

  setSize(1, 1)
  setMode(initialMode)
  return {
    get camera() { return camera },
    setSize,
    setMode,
    reset() { setMode(mode) },
    update() { controls?.update() },
    dispose() { controls?.dispose(); controls = undefined },
  }
}
