<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑管理员' : '新增管理员'"
    width="520px"
    destroy-on-close
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="formData.username" placeholder="请输入用户名" maxlength="20" />
      </el-form-item>
      <el-form-item v-if="!isEdit" label="密码" prop="password">
        <el-input
          v-model="formData.password"
          type="password"
          placeholder="请输入密码"
          show-password
          maxlength="30"
        />
      </el-form-item>
      <el-form-item label="姓名" prop="realName">
        <el-input v-model="formData.realName" placeholder="请输入姓名" maxlength="20" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">正常</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ submitting ? '提交中...' : '确 定' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * 管理员用户新增/编辑表单对话框
 * 状态内聚：通过 openCreate() / openEdit(row) 打开
 */
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { createAdminUser, updateAdminUser, type AdminUserItem } from '@/api/admin-user'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const visible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const submitting = ref(false)

const defaultFormData = {
  id: undefined as number | undefined,
  username: '',
  password: '',
  realName: '',
  status: 1,
}

const formData = reactive({ ...defaultFormData })

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为2-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 4, max: 30, message: '密码长度为4-30个字符', trigger: 'blur' },
  ],
  realName: [{ max: 20, message: '姓名最多20个字符', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

/** 打开新增对话框 */
function openCreate() {
  isEdit.value = false
  Object.assign(formData, { ...defaultFormData })
  visible.value = true
}

/** 打开编辑对话框 */
function openEdit(row: AdminUserItem) {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    username: row.username,
    password: '',
    realName: row.realName || '',
    status: row.status,
  })
  visible.value = true
}

/** 关闭后重置 */
function handleClosed() {
  formRef.value?.resetFields()
}

/** 提交表单 */
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value && formData.id !== undefined) {
      await updateAdminUser(formData.id, {
        username: formData.username,
        realName: formData.realName,
        status: formData.status,
      })
      ElMessage.success('更新成功')
    } else {
      await createAdminUser({
        username: formData.username,
        password: formData.password,
        realName: formData.realName,
        status: formData.status,
      })
      ElMessage.success('创建成功')
    }
    visible.value = false
    emit('success')
  } catch {
    // 请求工具已处理错误提示
  } finally {
    submitting.value = false
  }
}

defineExpose({ openCreate, openEdit })
</script>
