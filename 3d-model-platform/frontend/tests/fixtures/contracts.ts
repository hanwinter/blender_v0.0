import type { Material } from 'three'
import { createInteractionTestModel } from '../../src/models/interactionTestModel'
import { createHighlighter } from '../../src/viewer/highlight'
import { disposeModel } from '../../src/viewer/dispose'
import { parseMetadata, validatePartMetadata } from '../../src/metadata/validate'
import { describePart } from '../../src/models/types'

export function checkMaterialOwnership() {
  const model = createInteractionTestModel()
  const original = model.parts[0]!.meshes[0]!.material as Material
  const highlighter = createHighlighter(model.parts)
  const clones = new Set<Material>()
  for (const part of model.parts) for (const mesh of part.meshes) {
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) clones.add(material)
  }
  const a = model.parts[0]!, b = model.parts[1]!
  const first = a.meshes[0]!.material
  const second = a.meshes[1]!.material
  const samePartShares = Array.isArray(second) && second.every((item) => item === first)
  const otherPartIsolated = b.meshes[0]!.material !== first
  for (let i = 0; i < 1000; i++) highlighter.update(i % 2 ? a : null, i % 2 ? b : a)
  const stableReferences = a.meshes[0]!.material === first
  let cloneDisposals = 0, originalDisposals = 0, geometryDisposals = 0
  for (const clone of clones) clone.addEventListener('dispose', () => cloneDisposals++)
  original.addEventListener('dispose', () => originalDisposals++)
  const geometries = new Set(model.parts.flatMap((part) => part.meshes.map((mesh) => mesh.geometry)))
  for (const geometry of geometries) geometry.addEventListener('dispose', () => geometryDisposals++)
  highlighter.dispose()
  highlighter.dispose()
  const restored = a.meshes[0]!.material === original && b.meshes[0]!.material === original
  disposeModel(model.root)
  return { clones: clones.size, samePartShares, otherPartIsolated, stableReferences, restored, cloneDisposals, originalDisposals, geometryDisposals }
}

export function checkMetadataValidation() {
  const model = createInteractionTestModel()
  const parts = model.parts.map((part) => describePart(part)!)
  const raw = {
    id: 'interaction_test', version: '1.0.0', name: 'Test', description: 'Test', model_url: null, part_count: 4,
    parts: [
      { id: 'part_a', name: '', description: '' },
      { id: 'part_a', name: 'Duplicate', description: 'Duplicate' },
      { id: 'part_b', name: 'B', description: 'B' },
      { id: 'phantom', name: 'Extra', description: 'Extra' },
    ],
  }
  const parsed = parseMetadata(raw)
  const issues = [...parsed.issues, ...validatePartMetadata([...parts, parts[0]!], parsed.model?.parts ?? null)]
  disposeModel(model.root)
  return issues
}
