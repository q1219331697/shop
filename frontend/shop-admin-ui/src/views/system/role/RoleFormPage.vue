<template>
  <SubPage body-class="form-page" footer-class="form-footer" :loading="!formReady">
    <!-- 初始化完成前不渲染表单：详情回填必须先于任何用户输入，
         否则 CrudForm 以 formData 为回填源，回填会把已填内容一并重置 -->
    <CrudForm
      v-if="formReady"
      ref="formRef"
      :fields="roleSchema.formFields ?? []"
      :form-data="formData"
      :rules="roleSchema.formRules"
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
      <!-- 取消始终可点：初始化未完成也应允许离开页面；保存须等初始化就绪，
           避免「遮罩下的保存」提交半初始化数据 -->
      <el-button @click="goBack">取 消</el-button>
      <el-button
        type="primary"
        :disabled="!formReady"
        :loading="submitting"
        @click="formRef?.submit()"
      >
        保 存
      </el-button>
    </template>
  </SubPage>
</template>

<script setup lang="ts">
/**
 * 角色 - 新增/编辑页（弹窗改页面）
 * <p>骨架（边距 / 宽度 / 底部操作区）统一由 SubPage 提供。</p>
 */
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { api } from '@/api'
import CrudForm from '@/components/CrudForm.vue'
import SubPage from '@/components/SubPage.vue'
import { usePageNav } from '@/composables/use-page-nav'

import { roleSchema } from './schema'

const route = useRoute()
/** 统一返回：回到所属列表页（/system/role） */
const { goBackToList } = usePageNav()

const formRef = ref<InstanceType<typeof CrudForm>>()

const id = computed(() => {
  const raw = route.params.id
  return raw ? Number(raw) : undefined
})
const isEdit = computed(() => !!id.value)

const submitting = ref(false)

/**
 * 表单是否已就绪（可渲染 / 可交互）。
 * <p>
 * CrudForm 把 formData 当「回填源」：其内部副本在 formData 变化时会整体重置（清空后重建）。
 * 编辑态详情回填必须在 await 之后完成，若此时表单已可交互，用户刚填的内容会被这次回填清空。
 * 故表单须等初始化结束再渲染；语义是「初始化流程结束」（成功或失败都置位）。
 * </p>
 */
const formReady = ref(false)
const formData = reactive<Record<string, unknown>>({
  ...(roleSchema.defaultFormData || {}),
})
const labelWidth = '96px'

onMounted(async () => {
  if (id.value) {
    try {
      Object.assign(formData, await api.role.detail(id.value))
    } catch {
      /* 请求工具已处理 */
    }
  }
  // 表单数据已就绪（编辑=详情回填完成；新增=默认值随声明就位）：此后不再回写 formData
  formReady.value = true
})

async function handleSubmit(data: Record<string, unknown>) {
  submitting.value = true
  try {
    if (isEdit.value && id.value) {
      await api.role.update(id.value, data)
      ElMessage.success('修改成功')
    } else {
      await api.role.create(data)
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
