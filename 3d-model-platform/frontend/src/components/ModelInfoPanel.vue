<script setup lang="ts">
import { Box, X } from '@lucide/vue'
import type { ModelInfo } from '../types/model'
defineProps<{ model: ModelInfo | null; parts: ModelInfo[] }>()
const emit = defineEmits<{ selectPart: [id: string | null] }>()
</script>

<template>
  <aside class="info-panel" aria-labelledby="selection-title">
    <div class="panel-heading">
      <h2>模型部件</h2><span class="selection-count">{{ parts.length.toString().padStart(2, '0') }}</span>
    </div>
    <ul class="part-list" aria-label="模型部件">
      <li v-for="part in parts" :key="part.id">
        <button type="button" class="part-row" :aria-pressed="model?.id === part.id" @click="emit('selectPart', part.id)">
          <Box :size="17" :stroke-width="1.5" /><span>{{ part.name }}</span><span class="part-id">{{ part.id }}</span>
        </button>
      </li>
    </ul>
    <div class="panel-heading">
      <h2 id="selection-title">当前选择</h2>
      <button v-if="model" type="button" class="icon-button" aria-label="取消选择" title="取消选择" @click="emit('selectPart', null)"><X :size="16" /></button>
      <span v-else class="selection-count">00</span>
    </div>
    <div class="selection-content" aria-live="polite">
      <template v-if="model">
        <div class="object-symbol selected-symbol"><Box :size="26" :stroke-width="1.5" /></div>
        <h3>{{ model.name }}</h3>
        <dl>
          <dt>ID</dt>
          <dd class="object-id">{{ model.id }}</dd>
          <dt>简介</dt>
          <dd>{{ model.description }}</dd>
        </dl>
      </template>
      <div v-else class="empty-selection">
        <div class="object-symbol"><Box :size="26" :stroke-width="1.5" /></div>
        <p>当前未选择模型部件</p>
      </div>
    </div>
  </aside>
</template>
