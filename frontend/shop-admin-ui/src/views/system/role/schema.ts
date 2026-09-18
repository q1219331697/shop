/**
 * 角色管理 CRUD Schema 配置
 */
import type { FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

import type { RoleItem } from '@/api'
import type { CrudSchema, ActionContext } from '@/components/CrudTable'

/** 批量操作通用逻辑 */
async function handleBatchAction(
  ctx: ActionContext<RoleItem>,
  filter: (r: RoleItem) => boolean,
  action: (ids: number[]) => Promise<unknown>,
  message: string,
) {
  const ids = ctx.selectedRows.filter(filter).map((r) => r.id)
  try {
    await action(ids)
    ElMessage.success(message)
    ctx.refresh()
  } catch {
    /* 请求工具已处理 */
  }
}

/** 批量禁用 */
const handleBatchDisable = (ctx: ActionContext<RoleItem>) =>
  handleBatchAction(ctx, (r) => !r.deleted && r.status === 1, api.role.batchDisable, '禁用成功')

/** 批量启用 */
const handleBatchEnable = (ctx: ActionContext<RoleItem>) =>
  handleBatchAction(ctx, (r) => !r.deleted && r.status === 0, api.role.batchEnable, '启用成功')

/** 角色管理 CRUD Schema */
export const roleSchema: CrudSchema<RoleItem> = {
  name: '角色',
  rowKey: 'id',

  // ---- 搜索区 ----
  searchFields: [
    { prop: 'roleName', label: '角色名', type: 'input', width: '180px' },
    {
      prop: 'status',
      label: '状态',
      type: 'select',
      width: '120px',
      options: [
        { label: '正常', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
  ],

  // ---- 按钮区 ----
  // 工具栏配色（Ant 商务蓝，与管理员页一致，见 global.scss 的 .op-btn）
  //   新增=实心蓝 详情=线框(黑字) 编辑=线框(蓝字) 删除=实心红 禁用=实心橙 启用=实心绿
  actions: {
    toolbar: [
      // 编辑/详情未选中时禁用，单选后跳转独立页面（见 index.vue）
      { action: 'edit', type: 'primary', colorClass: 'btn-outline' },
      { action: 'detail', type: 'info' },
      {
        action: 'delete',
        type: 'danger',
        disabled: (ctx) => !ctx.selectedRows.some((r: RoleItem) => !r.deleted),
      },
    ],
    extraToolbar: [
      {
        action: 'disable',
        label: '禁用',
        icon: 'Lock',
        type: 'warning',
        disabled: (ctx) => !ctx.selectedRows.some((r: RoleItem) => !r.deleted && r.status === 1),
        handler: handleBatchDisable,
      },
      {
        action: 'enable',
        label: '启用',
        icon: 'Unlock',
        type: 'success',
        disabled: (ctx) => !ctx.selectedRows.some((r: RoleItem) => !r.deleted && r.status === 0),
        handler: handleBatchEnable,
      },
    ],
    // 行内操作：详情走默认按钮（跳页面）；编辑/禁用/启用/分配权限由 row-actions-extra 插槽渲染
    rowActions: [
      {
        action: 'detail',
        label: '详情',
        icon: 'View',
      },
    ],
  },

  // ---- 数据区 ----
  columns: [
    { prop: 'id', label: 'ID', width: 70, align: 'center' },
    { prop: 'roleName', label: '角色名', width: 150, showOverflowTooltip: true },
    { prop: 'description', label: '描述', minWidth: 180, showOverflowTooltip: true },
    {
      prop: 'status',
      label: '状态',
      width: 90,
      align: 'center',
      type: 'tag',
      tagMap: { 1: ['正常', 'success'], 0: ['禁用', 'danger'] },
    },
    {
      prop: 'sortOrder',
      label: '排序',
      width: 80,
      align: 'center',
    },
    { prop: 'createTime', label: '创建时间', width: 170, align: 'center', type: 'date' },
    { prop: 'updateTime', label: '更新时间', width: 170, align: 'center', type: 'date' },
  ],
  rowActionsWidth: 300,

  // ---- 表单区 ----
  formFields: [
    { prop: 'roleName', label: '角色名', type: 'input', maxlength: 30 },
    { prop: 'description', label: '描述', type: 'textarea', rows: 3, maxlength: 200 },
    { prop: 'sortOrder', label: '排序', type: 'number', min: 0, precision: 0 },
    {
      prop: 'status',
      label: '状态',
      type: 'radio',
      radios: [
        { label: '正常', value: 1 },
        { label: '禁用', value: 0 },
      ],
    },
  ],
  formRules: {
    roleName: [
      { required: true, message: '请输入角色名', trigger: 'blur' },
      { min: 1, max: 30, message: '角色名长度为1-30个字符', trigger: 'blur' },
    ],
    description: [{ max: 200, message: '描述最多200个字符', trigger: 'blur' }],
    sortOrder: [{ required: true, message: '请输入排序值', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  } as FormRules,
  defaultFormData: {
    status: 1,
    sortOrder: 0,
  },

  // ---- 详情区 ----
  detailFields: [
    { prop: 'id', label: 'ID' },
    { prop: 'roleName', label: '角色名' },
    { prop: 'description', label: '描述' },
    {
      prop: 'status',
      label: '状态',
      type: 'tag',
      tagMap: { 1: ['正常', 'success'], 0: ['禁用', 'danger'] },
    },
    { prop: 'sortOrder', label: '排序' },
    { prop: 'createTime', label: '创建时间', type: 'date' },
    { prop: 'updateTime', label: '更新时间', type: 'date' },
  ],
}
