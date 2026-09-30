<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, ref, watch } from 'vue'
import { asProjectError } from '../errors'
import type { Diagnostic } from '../errors'
import { loadModel } from '../models/modelLoader'
import { describePart } from '../models/types'
import type { LoadedModel, ModelPart, ModelReady, ModelSource, PartSelection } from '../models/types'
import type { ViewMode } from '../types/model'
import { disposeModel } from '../viewer/dispose'
import { createViewer } from '../viewer/runtime'

const props = withDefaults(defineProps<{ source: ModelSource; viewMode?: ViewMode; debug?: boolean }>(), {
  viewMode: 'perspective', debug: false,
})
const emit = defineEmits<{
  select: [part: PartSelection | null]
  hover: [part: PartSelection | null]
  ready: [model: ModelReady | null]
  error: [issue: Diagnostic | null]
}>()
const container = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const error = ref('')
const selectedPart = shallowRef<ModelPart | null>(null)
const hoveredPart = shallowRef<ModelPart | null>(null)
const selectedObject = computed(() => selectedPart.value?.object ?? null)
const hoveredObject = computed(() => hoveredPart.value?.object ?? null)
const sourceKey = computed(() => props.source.type === 'glb' ? 'glb:' + props.source.url : props.source.type)
let runtime: ReturnType<typeof createViewer> | undefined
let request: AbortController | undefined
let generation = 0

async function initialize() {
  const ticket = ++generation
  request?.abort()
  request = new AbortController()
  const signal = request.signal
  runtime?.dispose()
  runtime = undefined
  selectedPart.value = null
  hoveredPart.value = null
  emit('select', null)
  emit('hover', null)
  emit('ready', null)
  emit('error', null)
  error.value = ''
  if (!canvas.value || !container.value) return
  let pending: LoadedModel | undefined
  try {
    pending = await loadModel(props.source, signal)
    if (ticket !== generation || signal.aborted) { disposeModel(pending.root); return }
    const model = pending
    pending = undefined
    runtime = createViewer({
      canvas: canvas.value, container: container.value, model, viewMode: props.viewMode,
      onSelect(part) { selectedPart.value = part; emit('select', describePart(part)) },
      onHover(part) { hoveredPart.value = part; emit('hover', describePart(part)) },
    })
    emit('ready', { parts: model.parts.map((part) => describePart(part)!), stats: runtime.stats })
  } catch (cause) {
    if (pending) disposeModel(pending.root)
    if (ticket !== generation || signal.aborted) return
    const issue = asProjectError(cause, 'MODEL_LOAD_ERROR', '模型加载失败，请检查浏览器 WebGL 支持。').toDiagnostic()
    error.value = issue.message
    emit('error', issue)
    if (props.debug) console.warn('[Viewer]', issue.code, issue.detail)
  }
}

onMounted(initialize)
watch(sourceKey, initialize, { flush: 'post' })
watch(() => props.viewMode, (mode) => runtime?.setViewMode(mode))
onBeforeUnmount(() => {
  generation++
  request?.abort()
  runtime?.dispose()
  selectedPart.value = null
  hoveredPart.value = null
})
defineExpose({
  selectedPart, hoveredPart, selectedObject, hoveredObject,
  selectPart(id: string | null) { runtime?.selectPart(id) },
  resetView() { runtime?.resetView() },
})
</script>

<template>
  <div ref="container" class="model-viewer">
    <canvas :key="sourceKey" ref="canvas" aria-label="3D 模型视图" />
    <div v-if="error" class="viewer-error" role="alert">{{ error }}</div>
  </div>
</template>
