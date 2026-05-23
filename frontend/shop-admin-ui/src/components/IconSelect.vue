<template>
  <el-popover placement="bottom-start" :width="360" trigger="click" @show="filterText = ''">
    <template #reference>
      <el-input
        :model-value="modelValue"
        placeholder="请选择图标"
        readonly
        clearable
        @clear="handleClear"
      >
        <template #prefix>
          <el-icon v-if="modelValue" style="vertical-align: middle">
            <component :is="modelValue" />
          </el-icon>
        </template>
      </el-input>
    </template>
    <div class="icon-select-panel">
      <el-input v-model="filterText" placeholder="搜索图标" clearable style="margin-bottom: 8px" />
      <div class="icon-list">
        <div
          v-for="name in filteredIcons"
          :key="name"
          class="icon-item"
          :class="{ active: modelValue === name }"
          :title="name"
          @click="handleSelect(name)"
        >
          <el-icon :size="20">
            <component :is="name" />
          </el-icon>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as Icons from '@element-plus/icons-vue'

defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const filterText = ref('')

const iconNames = Object.keys(Icons)

const filteredIcons = computed(() => {
  const text = filterText.value.toLowerCase().trim()
  if (!text) return iconNames
  return iconNames.filter((name) => name.toLowerCase().includes(text))
})

function handleSelect(name: string) {
  emit('update:modelValue', name)
}

function handleClear() {
  emit('update:modelValue', '')
}
</script>

<style scoped>
.icon-select-panel {
  max-height: 320px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.icon-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 260px;
  overflow-y: auto;
  padding: 4px 0;
}
.icon-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.icon-item:hover {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}
.icon-item.active {
  background-color: var(--el-color-primary-light-8);
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
</style>
