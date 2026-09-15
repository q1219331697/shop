<template>
  <SubPage body-class="form-page" footer-class="form-footer">
    <CrudForm
      ref="formRef"
      :fields="adminUserSchema.formFields ?? []"
      :form-data="formData"
      :rules="adminUserSchema.formRules"
      :is-edit="isEdit"
      :submitting="submitting"
      :label-width="labelWidth"
      @submit="handleSubmit"
    >
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot :name="name" v-bind="slotData" />
      </template>
    </CrudForm>

    <template #footer>
      <el-button @click="goBack">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="formRef?.submit()">保 存</el-button>
    </template>
  </SubPage>
</template>

<script setup lang="ts">
/**
 * 管理员 - 新增/编辑页（弹窗改页面）
 * <p>复用 adminUserSchema 的 formFields / formRules，与弹窗共享同一套渲染与校验。</p>
 * <p>骨架（边距 / 宽度 / 底部操作区）统一由 SubPage 提供。</p>
 */
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { api } from '@/api'
import CrudForm from '@/components/CrudForm.vue'
import SubPage from '@/components/SubPage.vue'
import { usePageNav } from '@/composables/use-page-nav'

import { adminUserSchema } from './schema'

const route = useRoute()
/** 统一返回：回到所属列表页（/system/admin） */
const { goBackToList } = usePageNav()

const formRef = ref<InstanceType<typeof CrudForm>>()

const id = computed(() => {
  const raw = route.params.id
  return raw ? Number(raw) : undefined
})
const isEdit = computed(() => !!id.value)

const submitting = ref(false)
const formData = reactive<Record<string, unknown>>({
  ...(adminUserSchema.defaultFormData || {}),
})
const labelWidth = '96px'

onMounted(async () => {
  if (id.value) {
    try {
      Object.assign(formData, await api.adminUser.detail(id.value))
    } catch {
      /* 请求工具已处理 */
    }
  }
})

async function handleSubmit(data: Record<string, unknown>) {
  submitting.value = true
  try {
    if (isEdit.value && id.value) {
      await api.adminUser.update(id.value, data)
      ElMessage.success('修改成功')
    } else {
      await api.adminUser.create(data)
      ElMessage.success('新增成功')
    }
    goBackToList()
  } catch {
    /* 请求工具已处理 */
  } finally {
    submitting.value = false
  }
}

function goBack() {
  goBackToList()
}
</script>
