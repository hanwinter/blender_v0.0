import type { Mesh, Object3D } from 'three'

export type ModelSource =
  | { type: 'demo' }
  | { type: 'interaction-test' }
  | { type: 'glb'; url: string }

export interface ModelPart {
  id: string
  object: Object3D
  meshes: Mesh[]
  sourceName?: string
}

export interface LoadedModel {
  root: Object3D
  parts: ModelPart[]
}

export interface PartSelection {
  id: string
  objectName: string
  meshCount: number
}

export interface ModelStats {
  objectName: string
  partCount: number
  meshCount: number
  triangleCount: number
  bounds: { min: number[]; max: number[]; size: number[] }
}

export interface ModelReady {
  parts: PartSelection[]
  stats: ModelStats
}

export function describePart(part: ModelPart | null): PartSelection | null {
  return part ? { id: part.id, objectName: part.object.name, meshCount: part.meshes.length } : null
}
