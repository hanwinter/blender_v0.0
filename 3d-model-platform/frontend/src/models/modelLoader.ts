import { loadGlbModel } from './glbModel'
import { createDemoCube } from './demoCube'
import { createInteractionTestModel } from './interactionTestModel'
import type { LoadedModel, ModelSource } from './types'

export async function loadModel(source: ModelSource, signal?: AbortSignal): Promise<LoadedModel> {
  signal?.throwIfAborted()
  switch (source.type) {
    case 'demo': return createDemoCube()
    case 'interaction-test': return createInteractionTestModel()
    case 'glb': return loadGlbModel(source.url, signal)
  }
}
