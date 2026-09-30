import { Color, Material } from 'three'
import type { Mesh } from 'three'
import type { ModelPart } from '../models/types'

type ColoredMaterial = Material & { color: Color }
function hasColor(material: Material): material is ColoredMaterial {
  return 'color' in material && material.color instanceof Color
}

export function createHighlighter(parts: ModelPart[]) {
  const bindings = new Map<Mesh, Material | Material[]>()
  const clones = new Set<Material>()
  const colors = new Map<ModelPart, Map<ColoredMaterial, Color>>()
  const hoverColor = new Color('#a6bec5')
  const selectedColor = new Color('#549c91')
  let disposed = false

  // One clone per source material per part; meshes within a part keep sharing it.
  for (const part of parts) {
    const cache = new Map<Material, Material>()
    const states = new Map<ColoredMaterial, Color>()
    colors.set(part, states)
    for (const mesh of part.meshes) {
      bindings.set(mesh, mesh.material)
      const isolate = (original: Material) => {
        let material = cache.get(original)
        if (!material) {
          material = original.clone()
          cache.set(original, material)
          clones.add(material)
          if (hasColor(material)) states.set(material, material.color.clone())
        }
        return material
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(isolate) : isolate(mesh.material)
    }
  }

  return {
    update(selected: ModelPart | null, hovered: ModelPart | null) {
      for (const [part, states] of colors) {
        for (const [material, baseColor] of states) {
          material.color.copy(part === selected ? selectedColor : part === hovered ? hoverColor : baseColor)
        }
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      for (const [mesh, material] of bindings) mesh.material = material
      for (const material of clones) material.dispose()
      bindings.clear(); clones.clear(); colors.clear()
    },
  }
}
