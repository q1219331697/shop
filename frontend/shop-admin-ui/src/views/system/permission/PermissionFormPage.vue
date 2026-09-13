<template>
  <PageContainer>
    <template #actions>
      <el-button @click="goBack">返回</el-button>
    </template>
    <div class="form-page">
      <CrudForm
        ref="formRef"
        :fields="permissionFormFields"
        :form-data="formData"
        :rules="permissionFormRules"
        :is-edit="isEdit"
        :submitting="submitting"
        :label-width="labelWidth"
        @submit="handleSubmit"
      >
        <!-- 上级权限：树形选择（仅菜单可作为上级） -->
        <template #form-parentId="{ model }">
          <ElTreeSelect
            v-model="model.parentId"
            :data="parentOptions"
            :props="parentTreeProps"
            node-key="id"
            check-strictly
            default-expand-all
            :render-after-expand="false"
            placeholder="请选择上级权限"
            clearable
            style="width: 100%"
          />
        </template>

        <!-- 菜单图标：图标选择器 -->
        <template #form-icon="{ model }">
          <IconSelect v-model="model.icon" />
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
 * 权限 - 新增/编辑页（弹窗改页面）
 * <p>复用 permissionFormFields / permissionFormRules，表单内上级权限、图标选择器通过插槽渲染。</p>
 */
import { ElMessage, ElTreeSelect } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, type PermissionItem } from '@/api'
import CrudForm from '@/components/CrudForm.vue'
import IconSelect from '@/components/IconSelect.vue'
import { flattenPermissionTree, invalidatePermissionTreeCache } from '@/utils/permissionTree'

import { permissionDefaultFormData, permissionFormFields, permissionFormRules } from './schema'

const route = useRoute()
const router = useRouter()

const formRef = ref<InstanceType<typeof CrudForm>>()

const id = computed(() => {
  const raw = route.params.id
  return raw ? Number(raw) : undefined
})
const isEdit = computed(() => !!id.value)
// 新增下级：通过 query 预填上级
const parentIdFromQuery = computed(() => {
  const raw = route.query.parentId
  return raw ? Number(raw) : undefined
})

const submitting = ref(false)
const formData = reactive<Record<string, unknown>>({
  ...permissionDefaultFormData,
})

// ---- 上级权限选项 ----
const permissionTree = ref<PermissionItem[]>([])

interface ParentOption {
  id: number
  permissionName: string
  children?: ParentOption[]
}

const parentTreeProps = {
  children: 'children',
  label: 'permissionName',
}

function buildParentOptions(nodes: PermissionItem[], excludeIds: Set<number>): ParentOption[] {
  return nodes
    .filter((node) => node.permissionType === 1 && !excludeIds.has(node.id))
    .map((node) => {
      const children = buildParentOptions(node.children ?? [], excludeIds)
      return children.length > 0
        ? { id: node.id, permissionName: node.permissionName, children }
        : { id: node.id, permissionName: node.permissionName }
    })
}

const parentOptions = computed<ParentOption[]>(() => {
  const excludeIds = new Set<number>()
  const selfId = isEdit.value ? Number(formData.id) : NaN
  if (Number.isFinite(selfId)) {
    const self = flattenPermissionTree(permissionTree.value).find((n) => n.id === selfId)
    if (self) {
      flattenPermissionTree([self]).forEach((n) => excludeIds.add(n.id))
    }
  }
  const root: ParentOption = { id: 0, permissionName: '顶级权限' }
  const children = buildParentOptions(permissionTree.value, excludeIds)
  return children.length > 0 ? [{ ...root, children }] : [root]
})

const labelWidth = computed(() => {
  const maxLen = permissionFormFields.reduce((max: number, f) => Math.max(max, f.label.length), 0)
  return Math.max(80, maxLen * 14 + 12) + 'px'
})

onMounted(async () => {
  // 加载权限树（用于上级权限选择）
  try {
    permissionTree.value = await api.permission.tree()
  } catch {
    permissionTree.value = []
  }
  // 预填数据
  if (isEdit.value && id.value) {
    try {
      Object.assign(formData, await api.permission.detail(id.value))
    } catch {
      /* 请求工具已处理 */
    }
  } else {
    Object.assign(formData, permissionDefaultFormData)
    if (parentIdFromQuery.value !== undefined) {
      formData.parentId = parentIdFromQuery.value
    }
  }
})

/** 构造提交数据：剔除树形结构与只读字段，避免脏字段回传后端 */
function buildSubmitPayload(data: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  Object.keys(data).forEach((key) => {
    if (['children', 'createTime', 'updateTime', 'deleted'].includes(key)) return
    payload[key] = data[key]
  })
  return payload
}

async function handleSubmit(data: Record<string, unknown>) {
  submitting.value = true
  try {
    if (isEdit.value && id.value) {
      await api.permission.update(id.value, buildSubmitPayload(data))
      ElMessage.success('修改成功')
    } else {
      await api.permission.create(buildSubmitPayload(data))
      ElMessage.success('新增成功')
    }
    invalidatePermissionTreeCache()
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
  max-width: 640px;
}

.form-footer {
  margin-top: 24px;
  text-align: right;
}
</style>
