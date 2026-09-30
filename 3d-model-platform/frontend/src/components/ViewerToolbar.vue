<script setup lang="ts">
import { Box, PanelRight, PanelTop, RotateCcw, Square } from '@lucide/vue'
import type { ViewMode } from '../types/model'

defineProps<{ viewMode: ViewMode }>()
const emit = defineEmits<{ 'update:viewMode': [mode: ViewMode]; reset: [] }>()
const modes = [
  { id: 'perspective', label: '透视', icon: Box },
  { id: 'front', label: '主视', icon: Square },
  { id: 'top', label: '俯视', icon: PanelTop },
  { id: 'right', label: '右视', icon: PanelRight },
] as const
</script>

<template>
  <div class="viewer-toolbar">
    <div class="view-modes" role="group" aria-label="视图模式">
      <button v-for="mode in modes" :key="mode.id" type="button" class="view-mode"
        :aria-pressed="viewMode === mode.id" :title="mode.label + '视图'"
        @click="emit('update:viewMode', mode.id)">
        <component :is="mode.icon" :size="15" :stroke-width="1.6" /><span>{{ mode.label }}</span>
      </button>
    </div>
    <button type="button" class="icon-button" aria-label="重置视角" title="重置视角" @click="emit('reset')">
      <RotateCcw :size="17" :stroke-width="1.7" />
    </button>
  </div>
</template>
