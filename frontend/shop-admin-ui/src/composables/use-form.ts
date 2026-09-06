/**
 * 表单通用逻辑
 */
import type { FormInstance, FormRules } from 'element-plus'
import { ref, reactive } from 'vue'

interface UseFormOptions<T> {
  /** 默认表单数据 */
  defaultData: T
  /** 表单校验规则 */
  rules?: FormRules
  /** 提交方法 */
  submitApi: (data: T) => Promise<unknown>
  /** 提交成功回调 */
  onSuccess?: () => void
}

export function useForm<T extends Record<string, unknown>>(options: UseFormOptions<T>) {
  const { defaultData, rules, submitApi, onSuccess } = options

  const formRef = ref<FormInstance>()
  const formData = reactive<T>({ ...defaultData }) as T
  const submitting = ref(false)
  const dialogVisible = ref(false)
  const isEdit = ref(false)

  /** 打开新增对话框 */
  function openCreate() {
    isEdit.value = false
    Object.assign(formData, { ...defaultData })
    formRef.value?.resetFields()
    dialogVisible.value = true
  }

  /** 打开编辑对话框 */
  function openEdit(data: T) {
    isEdit.value = true
    Object.assign(formData, { ...data })
    formRef.value?.resetFields()
    dialogVisible.value = true
  }

  /** 关闭对话框 */
  function closeDialog() {
    dialogVisible.value = false
    formRef.value?.resetFields()
  }

  /** 提交表单 */
  async function handleSubmit() {
    if (!formRef.value) return
    await formRef.value.validate()
    submitting.value = true
    try {
      await submitApi(formData)
      onSuccess?.()
      closeDialog()
    } finally {
      submitting.value = false
    }
  }

  return {
    formRef,
    formData,
    rules,
    submitting,
    dialogVisible,
    isEdit,
    openCreate,
    openEdit,
    closeDialog,
    handleSubmit,
  }
}
