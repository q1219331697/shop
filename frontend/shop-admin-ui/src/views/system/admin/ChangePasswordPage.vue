<template>
  <SubPage body-class="form-page" footer-class="form-footer">
    <CrudForm
      ref="formRef"
      :fields="changePasswordFields"
      :form-data="formData"
      :rules="changePasswordRules"
      :is-edit="false"
      :submitting="submitting"
      label-width="96px"
      @submit="handleSubmit"
    />

    <template #footer>
      <el-button @click="goBack">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="formRef?.submit()">保 存</el-button>
    </template>
  </SubPage>
</template>

<script setup lang="ts">
/**
 * 管理员 - 修改密码页（弹窗改页面）
 * <p>自助改密：提交「原密码 + 新密码」，成功后强制登出并回到登录页
 * （密码已变更，旧会话不再继续使用）。</p>
 * <p>骨架（边距 / 宽度 / 底部操作区）统一由 SubPage 提供。</p>
 */
import type { FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { changeAdminPassword } from '@/api/adminUser'
import CrudForm from '@/components/CrudForm.vue'
import type { FormField } from '@/components/CrudTable'
import SubPage from '@/components/SubPage.vue'
import { usePageNav } from '@/composables/use-page-nav'
import { usePermissionStore } from '@/stores/modules/permission'
import { useUserStore } from '@/stores/modules/user'

const router = useRouter()
const permissionStore = usePermissionStore()
const userStore = useUserStore()
/** 统一返回：回到所属列表页（/system/admin） */
const { goBackToList } = usePageNav()

const formRef = ref<InstanceType<typeof CrudForm>>()
const submitting = ref(false)

const formData = reactive<Record<string, unknown>>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

/** 确认密码仅用于前端一致性校验，不参与接口提交 */
const changePasswordFields: FormField[] = [
  { prop: 'oldPassword', label: '原密码', type: 'input', password: true, maxlength: 30 },
  { prop: 'newPassword', label: '新密码', type: 'input', password: true, maxlength: 30 },
  { prop: 'confirmPassword', label: '确认新密码', type: 'input', password: true, maxlength: 30 },
]

/**
 * 校验规则：长度契约与后端保持一致（4-30 位）。
 * 两次输入是否一致不在此处校验：CrudForm 的字段值只存在于表单内部副本（提交时才回传），
 * 规则里的 validator 取不到「新密码」的实时值，故放到提交时统一校验。
 */
const changePasswordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 4, max: 30, message: '密码长度需在4-30位之间', trigger: 'blur' },
  ],
  confirmPassword: [{ required: true, message: '请再次输入新密码', trigger: 'blur' }],
}

/** 提交改密：成功后提示并登出回到登录页 */
async function handleSubmit(data: Record<string, unknown>) {
  if (String(data.newPassword ?? '') !== String(data.confirmPassword ?? '')) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  submitting.value = true
  try {
    await changeAdminPassword({
      oldPassword: String(data.oldPassword ?? ''),
      newPassword: String(data.newPassword ?? ''),
    })
    ElMessage.success('密码修改成功，请重新登录')
    permissionStore.resetPermission()
    try {
      await userStore.logout()
    } catch {
      // 后端异常不影响前端注销，本地状态已在 logout 内部清除
    }
    router.push('/login')
  } catch {
    /* 请求工具已统一提示（如原密码错误） */
  } finally {
    submitting.value = false
  }
}

function goBack() {
  goBackToList()
}
</script>
