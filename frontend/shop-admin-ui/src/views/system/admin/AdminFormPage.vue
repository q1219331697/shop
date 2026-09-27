<template>
  <SubPage body-class="form-page" footer-class="form-footer" :loading="!formReady">
    <!-- 新增不需要填写密码：由后端填充系统默认密码，这里只做提示（编辑页无密码相关操作） -->
    <el-alert
      v-if="!isEdit"
      class="form-tip"
      type="info"
      :closable="false"
      show-icon
      :title="`新管理员将使用系统默认密码：${defaultPassword}`"
    />

    <!-- 初始化完成前不渲染表单：详情回填必须先于任何用户输入，
         否则 CrudForm 以 formData 为回填源，回填会把已填内容一并重置 -->
    <CrudForm
      v-if="formReady"
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
  ...(adminUserSchema.defaultFormData || {}),
})
const labelWidth = '96px'

/** 系统默认密码（以后端配置为唯一来源；仅用于提示文案，接口异常时保留兜底值） */
const defaultPassword = ref('admin123')

onMounted(async () => {
  if (id.value) {
    try {
      Object.assign(formData, await api.adminUser.detail(id.value))
    } catch {
      /* 请求工具已处理 */
    }
    // 编辑：详情回填完成后再放行表单
    formReady.value = true
    return
  }
  // 新增：默认值随 formData 声明就位，无需等待接口即可交互（默认密码仅提示文案）
  formReady.value = true
  try {
    defaultPassword.value = await api.adminUser.defaultPassword()
  } catch {
    /* 请求工具已处理，保留兜底提示文案 */
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

<style lang="scss" scoped>
/* 默认密码提示与表单保持 16px 间距，避免与第一个表单项贴在一起 */
.form-tip {
  margin-bottom: 16px;
}
</style>
