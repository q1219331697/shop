<template>
  <SubPage body-class="form-page" footer-class="form-footer" :loading="!formReady">
    <!-- 初始化完成前不渲染表单：回填/预填必须先于任何用户输入，
         否则 CrudForm 以 formData 为回填源，异步回填会把已填内容一并重置 -->
    <CrudForm
      v-if="formReady"
      ref="formRef"
      :fields="permissionFormFields"
      :form-data="formData"
      :rules="formRules"
      :is-edit="isEdit"
      :submitting="submitting"
      :label-width="labelWidth"
      @submit="handleSubmit"
    >
      <!-- 上级权限：树形选择（目录/菜单可作为上级，操作不可） -->
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
 * 权限 - 新增/编辑页（弹窗改页面）
 * <p>复用 permissionFormFields / permissionFormRules，表单内上级权限、图标选择器通过插槽渲染。</p>
 * <p>骨架（边距 / 宽度 / 底部操作区）统一由 SubPage 提供。</p>
 */
import { ElMessage, ElTreeSelect, type FormItemRule, type FormRules } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { api, type PermissionItem } from '@/api'
import CrudForm from '@/components/CrudForm.vue'
import IconSelect from '@/components/IconSelect.vue'
import SubPage from '@/components/SubPage.vue'
import { usePageNav } from '@/composables/use-page-nav'
import { flattenPermissionTree } from '@/utils/permissionTree'

import { permissionDefaultFormData, permissionFormFields, permissionFormRules } from './schema'

const route = useRoute()
/** 统一返回：回到所属列表页（/system/permission） */
const { goBackToList } = usePageNav()

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

/**
 * 上级节点类型：与 parentId 一同由列表页「新增下级」入口带入。
 * <p>
 * 用于**同步**推导下一层级默认权限类型（目录→菜单、菜单→操作）。若改为在
 * 「权限树加载完成」后再从树上推导，就必然要在异步加载后回写 formData，
 * 而 CrudForm 以 formData 为回填源，那次回写会把用户已填内容一并清空。
 * </p>
 */
const parentTypeFromQuery = computed(() => {
  const raw = route.query.parentType
  return raw ? Number(raw) : undefined
})

const submitting = ref(false)

/**
 * 表单是否已就绪（可渲染 / 可交互）。
 * <p>
 * CrudForm 把 formData 当「回填源」：其内部副本在 formData 变化时会整体重置（清空后重建）。
 * 本页详情回填必须在 await 之后完成，若此时表单已可交互，用户刚填的内容会被这次回填清空。
 * 故表单须等初始化结束再渲染 —— 回填只发生在「用户还看不到表单」的阶段。
 * 语义是「初始化流程结束」（成功或失败都置位），否则接口异常时页面会永久空白。
 * </p>
 */
const formReady = ref(false)
const formData = reactive<Record<string, unknown>>({
  ...permissionDefaultFormData,
})

/**
 * 表单校验规则
 * <p>
 * 权限编码对「非目录」节点必填：目录仅作导航分组、不参与授权，允许留空。
 * CrudForm 内部维护 localFormData 副本，故须从校验源 source 读取权限类型，
 * 不能读取外层 formData（其值不会随表单交互同步）。
 * </p>
 */
const formRules = computed<FormRules>(() => ({
  ...permissionFormRules,
  permissionCode: [
    {
      validator: (
        _rule: FormItemRule,
        value: unknown,
        callback: (error?: Error) => void,
        source: Record<string, unknown>,
      ) => {
        if (source?.permissionType !== 1 && !String(value ?? '').trim()) {
          callback(new Error('请输入权限编码'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
    ...(permissionFormRules.permissionCode as FormItemRule[]),
  ],
}))

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
  return (
    nodes
      // 目录(1)与菜单(2)可作为上级，操作(3)是叶子节点不可作为上级
      .filter((node) => node.permissionType !== 3 && !excludeIds.has(node.id))
      .map((node) => {
        const children = buildParentOptions(node.children ?? [], excludeIds)
        return children.length > 0
          ? { id: node.id, permissionName: node.permissionName, children }
          : { id: node.id, permissionName: node.permissionName }
      })
  )
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

/** 标签宽度与其他任务页表单保持一致 */
const labelWidth = '96px'

onMounted(async () => {
  // 预填数据。
  // 注意：CrudForm 以 formData 为「回填源」（其 deep watch 会先清空本地副本再重建），
  // 因此「用户可能已开始输入之后再写 formData」的任何写入都会把已填内容清空。
  // 新增分支的一切预填必须在此处**同步**完成，不做任何 await 之后的回写。
  if (isEdit.value && id.value) {
    // 编辑：记录必须从服务端取，回填本质上是异步的 ——
    // 由用例侧「等待详情回填」同步点兜住（见 steps.csv 编辑类用例的 expectValue 步骤）
    try {
      Object.assign(formData, await api.permission.detail(id.value))
    } catch {
      /* 请求工具已处理 */
    }
  } else if (parentIdFromQuery.value !== undefined) {
    // 新增下级：上级与默认类型随 query 同步带入（其余默认值在 formData 声明时已就位，无需再写）
    formData.parentId = parentIdFromQuery.value
    if (parentTypeFromQuery.value === 1) {
      formData.permissionType = 2
    } else if (parentTypeFromQuery.value === 2) {
      formData.permissionType = 3
    }
  }

  // 表单数据已就绪（编辑=详情回填完成；新增=默认值同步就位）：此后不再回写 formData
  formReady.value = true

  // 权限树仅用于「上级权限」下拉选项：异步补齐即可，不再回写 formData
  try {
    permissionTree.value = await api.permission.list()
  } catch {
    permissionTree.value = []
  }
})

/** 构造提交数据：剔除树形结构与只读字段，避免脏字段回传后端 */
function buildSubmitPayload(data: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  Object.keys(data).forEach((key) => {
    if (['children', 'createDatetime', 'updateDatetime', 'deleted'].includes(key)) return
    payload[key] = data[key]
  })
  // 目录节点无需权限编码：空串归一为 null，避免多目录空串触发后端唯一索引冲突
  if (typeof payload.permissionCode === 'string' && payload.permissionCode.trim() === '') {
    payload.permissionCode = null
  }
  return payload
}

async function handleSubmit(data: Record<string, unknown>) {
  // 非目录节点必须填写权限编码（与后端服务层契约保持一致）；
  // rules 无法读取表单其它字段，故在此补充类型相关的必填校验
  if (data.permissionType !== 1 && !String(data.permissionCode ?? '').trim()) {
    ElMessage.error('请输入权限编码')
    return
  }
  submitting.value = true
  try {
    if (isEdit.value && id.value) {
      await api.permission.update(id.value, buildSubmitPayload(data))
      ElMessage.success('修改成功')
    } else {
      await api.permission.create(buildSubmitPayload(data))
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
