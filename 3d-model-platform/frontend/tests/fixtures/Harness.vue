<script setup lang="ts">
import { ref } from 'vue'
import ModelViewer from '../../src/components/ModelViewer.vue'
import type { ModelSource } from '../../src/models/types'

const mounted = ref(true)
const source = ref<ModelSource>({ type: 'demo' })
</script>
<template>
  <button @click="mounted = !mounted">{{ mounted ? '卸载' : '挂载' }}</button>
  <button @click="source = source.type === 'glb' ? { type: 'demo' } : { type: 'glb', url: '' }">切换资源</button>
  <div style="height: 450px; width: 640px; display: flex">
    <ModelViewer v-if="mounted" :source="source" />
  </div>
</template>
