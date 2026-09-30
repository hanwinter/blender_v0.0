<script setup lang="ts">
import type { Diagnostic } from '../errors'
import type { ModelReady, ModelSource, PartSelection } from '../models/types'

defineProps<{
  source: ModelSource
  model: ModelReady | null
  hovered: PartSelection | null
  selected: PartSelection | null
  issues: Diagnostic[]
}>()
function vector(values: number[]) { return values.map((value) => value.toFixed(2)).join(', ') }
</script>

<template>
  <section class="debug-panel" aria-label="Viewer Debug">
    <div class="debug-title">Viewer Debug</div>
    <dl class="debug-values">
      <dt>Model Source</dt><dd>{{ source.type }}<template v-if="source.type === 'glb'"> · {{ source.url }}</template></dd>
      <dt>Parts / Meshes</dt><dd>{{ model?.stats.partCount ?? 0 }} / {{ model?.stats.meshCount ?? 0 }}</dd>
      <dt>Hover Part ID</dt><dd>{{ hovered?.id || '-' }}</dd>
      <dt>Selected Part ID</dt><dd>{{ selected?.id || '-' }}</dd>
      <dt>Object Name</dt><dd>{{ selected?.objectName || hovered?.objectName || model?.stats.objectName || '-' }}</dd>
      <dt>Part Mesh Count</dt><dd>{{ selected?.meshCount ?? hovered?.meshCount ?? '-' }}</dd>
      <dt>Triangle Count</dt><dd>{{ model?.stats.triangleCount ?? 0 }}</dd>
      <dt>Bounding Box</dt><dd>{{ model ? vector(model.stats.bounds.min) + ' / ' + vector(model.stats.bounds.max) : '-' }}</dd>
    </dl>
    <ul v-if="issues.length" class="debug-issues">
      <li v-for="(issue, index) in issues" :key="index"><code>{{ issue.code }}</code><span>{{ issue.detail }}</span></li>
    </ul>
  </section>
</template>
