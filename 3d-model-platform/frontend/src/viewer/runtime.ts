import type { LoadedModel, ModelPart } from '../models/types'
import type { ViewMode } from '../types/model'
import { createCameraRig } from './camera'
import { disposeModel } from './dispose'
import { createInteraction } from './interaction'
import { getModelStats } from './modelStats'
import { createScene } from './scene'

interface ViewerOptions {
  canvas: HTMLCanvasElement
  container: HTMLElement
  model: LoadedModel
  viewMode: ViewMode
  onSelect: (part: ModelPart | null) => void
  onHover: (part: ModelPart | null) => void
}

export function createViewer({ canvas, container, model, viewMode, onSelect, onHover }: ViewerOptions) {
  let sceneState: ReturnType<typeof createScene> | undefined
  let rig: ReturnType<typeof createCameraRig> | undefined
  let interaction: ReturnType<typeof createInteraction> | undefined
  let observer: ResizeObserver | undefined
  let frame = 0
  let disposed = false

  function dispose() {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(frame)
    observer?.disconnect()
    interaction?.dispose()
    rig?.dispose()
    disposeModel(model.root)
    sceneState?.scene.clear()
    sceneState?.renderer.dispose()
    sceneState?.renderer.forceContextLoss()
  }

  try {
    sceneState = createScene(canvas)
    const { scene, renderer } = sceneState
    scene.add(model.root)
    rig = createCameraRig(canvas, model.root, viewMode)
    const cameraRig = rig
    interaction = createInteraction({ canvas, getCamera: () => cameraRig.camera, parts: model.parts, onSelect, onHover })
    const picking = interaction

    function resize() {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      cameraRig.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(width, height, false)
    }

    function animate() {
      if (disposed) return
      cameraRig.update()
      picking.updateHover()
      renderer.render(scene, cameraRig.camera)
      frame = requestAnimationFrame(animate)
    }

    resize()
    observer = new ResizeObserver(resize)
    observer.observe(container)
    animate()
    return {
      stats: getModelStats(model),
      setViewMode(mode: ViewMode) { cameraRig.setMode(mode) },
      resetView() { cameraRig.reset() },
      selectPart(id: string | null) { picking.selectPart(id) },
      dispose,
    }
  } catch (error) {
    dispose()
    throw error
  }
}
