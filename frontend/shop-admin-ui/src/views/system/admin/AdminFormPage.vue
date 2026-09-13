<template>
  <PageContainer>
    <div class="form-page">
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
      <div class="form-footer">
        <el-button @click="goBack">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="formRef?.submit()">保 存</el-button>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
/**
 * 管理员 - 新增/编辑页（弹窗改页面）
 * <p>复用 adminUserSchema 的 formFields / formRules，与弹窗共享同一套渲染与校验。</p>
 */
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api } from '@/api'
import CrudForm from '@/components/CrudForm.vue'

import { adminUserSchema } from './schema'

const route = useRoute()
const router = useRouter()

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
const labelWidth = '80px'

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
    router.back()
  } catch {
    /* 请求工具已处理 */
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.back()
}
</script>

<style lang="scss" scoped>
.form-page {
  padding: 16px;
  max-width: 560px;
}

.form-footer {
  margin-top: 24px;
  text-align: right;
}
</style>
