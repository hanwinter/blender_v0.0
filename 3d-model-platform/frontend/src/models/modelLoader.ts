import { ProjectError } from '../errors'
import { createDemoCube } from './demoCube'
import { createInteractionTestModel } from './interactionTestModel'
import type { LoadedModel, ModelSource } from './types'

export async function loadModel(source: ModelSource, signal?: AbortSignal): Promise<LoadedModel> {
  signal?.throwIfAborted()
  switch (source.type) {
    case 'demo': return createDemoCube()
    case 'interaction-test': return createInteractionTestModel()
    case 'glb': throw new ProjectError('MODEL_LOAD_ERROR', '当前版本暂不支持 GLB 资源。', `Source: glb; URL: ${source.url}`)
  }
}
