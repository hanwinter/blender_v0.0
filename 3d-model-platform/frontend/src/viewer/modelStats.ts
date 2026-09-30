import { Box3, Mesh, Vector3 } from 'three'
import type { LoadedModel, ModelStats } from '../models/types'

export function getModelStats(model: LoadedModel): ModelStats {
  const bounds = new Box3().setFromObject(model.root)
  let meshCount = 0
  let triangleCount = 0
  model.root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    meshCount++
    triangleCount += (object.geometry.index?.count ?? object.geometry.getAttribute('position')?.count ?? 0) / 3
  })
  return {
    objectName: model.root.name,
    partCount: model.parts.length, meshCount, triangleCount: Math.floor(triangleCount),
    bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: bounds.getSize(new Vector3()).toArray() },
  }
}
