<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Box, Bug } from '@lucide/vue'
import ModelViewer from './components/ModelViewer.vue'
import ModelInfoPanel from './components/ModelInfoPanel.vue'
import ViewerToolbar from './components/ViewerToolbar.vue'
import ViewerDebugPanel from './components/ViewerDebugPanel.vue'
import { api } from './api/client'
import { humanParts } from './models/humanParts'
import { config, modelOptions, getModelSource } from './config'
import type { ModelOptionKey } from './config'
import { asProjectError } from './errors'
import type { Diagnostic } from './errors'
import { parseMetadata, validatePartMetadata } from './metadata/validate'
import type { ModelReady, PartSelection } from './models/types'
import type { ModelDetail, ModelInfo, ViewMode } from './types/model'

const viewer = ref<InstanceType<typeof ModelViewer> | null>(null)
const sourceType = ref<ModelOptionKey>(config.defaultModel)
const source = computed(() => getModelSource(sourceType.value))
const option = computed(() => modelOptions.find((item) => item.source === sourceType.value)!)
const debug = ref(config.debug)
const model = ref<ModelDetail | null>(null)
const readyModel = ref<ModelReady | null>(null)
const viewMode = ref<ViewMode>('perspective')
const selected = ref<PartSelection | null>(null)
const hovered = ref<PartSelection | null>(null)
const fetching = ref(true)
const metadataIssues = ref<Diagnostic[]>([])
const viewerIssue = ref<Diagnostic | null>(null)
let request: AbortController | undefined

const consistencyIssues = computed(() => readyModel.value
  ? validatePartMetadata(readyModel.value.parts, model.value?.parts ?? null) : [])
const issues = computed(() => [...metadataIssues.value, ...consistencyIssues.value, ...(viewerIssue.value ? [viewerIssue.value] : [])])
const parts = computed<ModelInfo[]>(() => {
  const unique = new Map(readyModel.value?.parts.map((part) => [part.id, part]) ?? [])
  const loaded = [...unique.values()]
  if (source.value.type === 'glb') loaded.sort((a, b) =>
    humanParts.findIndex((part) => part.id === a.id) - humanParts.findIndex((part) => part.id === b.id))
  return loaded.map((part) => {
    const data = model.value?.parts.find((item) => item.id === part.id)
    return { id: part.id, name: data?.name.trim() || part.id, description: data?.description.trim() || '部件信息暂不可用。' }
  })
})
const selectedInfo = computed(() => selected.value
  ? parts.value.find((part) => part.id === selected.value?.id) ?? null : null)
const fatalIssue = computed(() => issues.value.find((issue) =>
  ['NETWORK_ERROR', 'MODEL_NOT_FOUND', 'MODEL_LOAD_ERROR', 'METADATA_LOAD_ERROR'].includes(issue.code)))
const status = computed(() => fatalIssue.value ? 'error' : fetching.value ? 'checking' : issues.value.length ? 'warning' : 'ready')
const statusText = computed(() => fatalIssue.value?.message.replace(/。$/, '')
  || (fetching.value ? '连接中' : issues.value.length ? '模型信息不完整' : source.value.type === 'glb' ? '本地模型' : '服务在线'))

watch(sourceType, async () => {
  request?.abort()
  request = new AbortController()
  const signal = request.signal
  model.value = null
  metadataIssues.value = []
  fetching.value = true
  if (source.value.type === 'glb') {
    model.value = { id: option.value.id, name: option.value.label, description: '人体部位交互模型',
      version: '1.0.0', model_url: source.value.url, part_count: humanParts.length, parts: humanParts }
    fetching.value = false
    return
  }
  const requestedId = option.value.id
  try {
    const health = await api.health(signal)
    if (!health || typeof health !== 'object' || !('status' in health) || health.status !== 'ok') {
      throw asProjectError('Unexpected health status', 'NETWORK_ERROR', '服务暂不可用。')
    }
    const raw = await api.model(requestedId, signal)
    if (signal.aborted) return
    const parsed = parseMetadata(raw)
    if (parsed.model && parsed.model.id !== requestedId) {
      parsed.issues.push({ code: 'INVALID_METADATA', message: '模型信息格式错误。', detail: 'Metadata model ID does not match requested model: ' + requestedId })
      parsed.model = null
    }
    model.value = parsed.model
    metadataIssues.value = parsed.issues
  } catch (cause) {
    if (!signal.aborted) metadataIssues.value = [asProjectError(cause, 'METADATA_LOAD_ERROR', '模型信息加载失败。').toDiagnostic()]
  } finally {
    if (!signal.aborted) fetching.value = false
  }
}, { immediate: true })

watch(() => JSON.stringify([debug.value, issues.value]), () => {
  if (debug.value) for (const issue of issues.value) console.warn('[Metadata]', issue.code, issue.detail)
})
onBeforeUnmount(() => request?.abort())
</script>

<template>
  <div class="app-shell" :class="{ 'debug-enabled': debug }">
    <header class="app-header">
      <div class="brand"><Box :size="24" :stroke-width="1.7" /><h1>Web 3D Model Viewer</h1></div>
      <span class="version">V0.2</span>
      <div class="service-status" :data-status="status" role="status"><span class="status-dot" />{{ statusText }}</div>
    </header>
    <main class="workspace">
      <section class="viewer-section" aria-label="模型">
        <div class="viewer-heading">
          <select v-model="sourceType" class="model-source-select" aria-label="模型来源">
            <option v-for="item in modelOptions" :key="item.source" :value="item.source">{{ item.label }}</option>
          </select>
          <div class="model-heading-tools">
            <span class="model-name">{{ option.id }}</span>
            <button v-if="config.allowDebug" type="button" class="icon-button" aria-label="Viewer Debug"
              title="Viewer Debug" :aria-pressed="debug" @click="debug = !debug"><Bug :size="16" /></button>
          </div>
        </div>
        <ViewerToolbar v-model:view-mode="viewMode" @reset="viewer?.resetView()" />
        <ModelViewer ref="viewer" :source="source" :view-mode="viewMode" :debug="debug"
          @select="selected = $event" @hover="hovered = $event" @ready="readyModel = $event" @error="viewerIssue = $event" />
        <p class="viewer-help">左键点击选择 · 左键拖动旋转（透视） · 右键拖动平移 · 滚轮缩放</p>
        <div class="viewer-status"><span class="viewer-status-dot" />{{ selected ? '已选中' : hovered ? '悬停中' : '就绪' }}<span class="object-total">{{ (readyModel?.parts.length ?? 0) + ' 个部件' }}</span></div>
        <ViewerDebugPanel v-if="debug" :source="source" :model="readyModel" :hovered="hovered" :selected="selected" :issues="issues" />
      </section>
      <ModelInfoPanel :model="selectedInfo" :parts="parts" @select-part="viewer?.selectPart($event)" />
    </main>
  </div>
</template>
