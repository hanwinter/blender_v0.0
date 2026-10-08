import { Mesh } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { ProjectError } from '../errors'
import { disposeModel } from '../viewer/dispose'
import type { LoadedModel, ModelPart } from './types'

export async function loadGlbModel(url: string, signal?: AbortSignal): Promise<LoadedModel> {
  signal?.throwIfAborted()
  if (!url.trim()) throw new ProjectError('MODEL_LOAD_ERROR', '模型资源地址为空。', 'Empty GLB URL')
  const response = await fetch(url, { signal })
  if (!response.ok) throw new ProjectError('MODEL_LOAD_ERROR', '人体模型加载失败。', 'GLB HTTP status: ' + response.status)
  const data = await response.arrayBuffer()
  signal?.throwIfAborted()
  const resourcePath = new URL('.', new URL(url, window.location.href)).href
  const gltf = await new GLTFLoader().parseAsync(data, resourcePath)
  if (signal?.aborted) {
    for (const scene of new Set(gltf.scenes)) disposeModel(scene)
    signal.throwIfAborted()
  }
  for (const scene of new Set(gltf.scenes)) if (scene !== gltf.scene) disposeModel(scene)
  const parts = new Map<string, ModelPart>()
  gltf.scene.traverse((object) => {
    if (!(object instanceof Mesh)) return
    // GLTFLoader creates child meshes for multi-material objects (e.g. iris).
    // Their stable part ID lives on the parent node's extras.
    let owner = object as import('three').Object3D
    while (!owner.userData.part_id && owner.parent) owner = owner.parent
    const id: unknown = owner.userData.part_id
    if (typeof id !== 'string' || !id.trim()) return
    const existing = parts.get(id)
    if (existing) existing.meshes.push(object)
    else parts.set(id, { id, object, meshes: [object], sourceName: object.name })
  })
  return { root: gltf.scene, parts: [...parts.values()] }
}
