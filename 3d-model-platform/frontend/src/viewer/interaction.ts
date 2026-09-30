import { Raycaster, Vector2 } from 'three'
import type { Camera, Mesh } from 'three'
import type { ModelPart } from '../models/types'
import { createHighlighter } from './highlight'

interface InteractionOptions {
  canvas: HTMLCanvasElement
  getCamera: () => Camera
  parts: ModelPart[]
  onHover: (part: ModelPart | null) => void
  onSelect: (part: ModelPart | null) => void
}

export function createInteraction({ canvas, getCamera, parts, onHover, onSelect }: InteractionOptions) {
  const raycaster = new Raycaster()
  const pointer = new Vector2()
  const owners = new Map<Mesh, ModelPart>()
  for (const part of parts) for (const mesh of part.meshes) owners.set(mesh, part)
  const meshes = [...owners.keys()]
  const highlighter = createHighlighter(parts)
  let hovered: ModelPart | null = null
  let selected: ModelPart | null = null
  let inside = false
  let pointerX = 0
  let pointerY = 0
  let press: { id: number; x: number; y: number; dragged: boolean } | null = null

  function pick(): ModelPart | null {
    const rect = canvas.getBoundingClientRect()
    if (!inside || !rect.width || !rect.height) return null
    pointer.set((pointerX - rect.left) / rect.width * 2 - 1, -(pointerY - rect.top) / rect.height * 2 + 1)
    const camera = getCamera()
    camera.updateMatrixWorld()
    for (const mesh of meshes) mesh.updateWorldMatrix(true, false)
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(meshes, false)[0]?.object
    return hit ? owners.get(hit as Mesh) ?? null : null
  }

  function select(part: ModelPart | null) {
    selected = part
    highlighter.update(selected, hovered)
    onSelect(part)
  }

  function updateHover() {
    const next = press?.dragged ? null : pick()
    if (next === hovered) return
    hovered = next
    canvas.style.cursor = next ? 'pointer' : 'grab'
    highlighter.update(selected, hovered)
    onHover(next)
  }

  function move(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    pointerX = event.clientX
    pointerY = event.clientY
    inside = pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom
    if (press && Math.hypot(pointerX - press.x, pointerY - press.y) > 5) press.dragged = true
    updateHover()
  }

  function down(event: PointerEvent) {
    if (!event.isPrimary) { if (press) press.dragged = true; return }
    if (event.button !== 0) return
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false }
    move(event)
  }

  function up(event: PointerEvent) {
    if (!press || press.id !== event.pointerId) return
    move(event)
    const click = !press.dragged && event.button === 0 && inside
    press = null
    if (click) select(pick())
    if (event.pointerType !== 'mouse') inside = false
    updateHover()
  }

  function leave() { inside = false; updateHover() }
  function cancel() { press = null; leave() }
  canvas.addEventListener('pointermove', move)
  canvas.addEventListener('pointerdown', down)
  canvas.addEventListener('pointerup', up)
  canvas.addEventListener('pointerleave', leave)
  canvas.addEventListener('pointercancel', cancel)
  canvas.addEventListener('lostpointercapture', cancel)

  return {
    updateHover,
    selectPart(id: string | null) { select(parts.find((part) => part.id === id) ?? null) },
    dispose() {
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointerleave', leave)
      canvas.removeEventListener('pointercancel', cancel)
      canvas.removeEventListener('lostpointercapture', cancel)
      highlighter.dispose()
      owners.clear()
      canvas.style.cursor = ''
    },
  }
}
