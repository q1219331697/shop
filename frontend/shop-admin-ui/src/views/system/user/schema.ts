/**
 * 管理员用户 CRUD Schema 配置
 */
import type { CrudSchema, ActionContext } from '@/components/CrudTable'
import type { AdminUserItem } from '@/api/admin-user'
import type { FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  batchDisableAdminUser,
  batchEnableAdminUser,
  batchRestoreAdminUser,
} from '@/api/admin-user'

/** 批量操作通用逻辑 */
async function handleBatchAction(
  ctx: ActionContext<AdminUserItem>,
  filter: (r: AdminUserItem) => boolean,
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
const handleBatchDisable = (ctx: ActionContext<AdminUserItem>) =>
  handleBatchAction(ctx, (r) => !r.deleted && r.status === 1, batchDisableAdminUser, '禁用成功')

/** 批量启用 */
const handleBatchEnable = (ctx: ActionContext<AdminUserItem>) =>
  handleBatchAction(ctx, (r) => !r.deleted && r.status === 0, batchEnableAdminUser, '启用成功')

/** 批量恢复 */
const handleBatchRestore = (ctx: ActionContext<AdminUserItem>) =>
  handleBatchAction(ctx, (r) => r.deleted, batchRestoreAdminUser, '恢复成功')

/** 管理员用户 CRUD Schema */
export const userSchema: CrudSchema<AdminUserItem> = {
  name: '管理员',
  rowKey: 'id',

  // ---- 搜索区 ----
  searchFields: [
    { prop: 'username', label: '用户名', type: 'input', width: '180px' },
    { prop: 'realName', label: '姓名', type: 'input', width: '180px' },
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
    {
      prop: 'deleted',
      label: '删除状态',
      type: 'select',
      width: '120px',
      options: [
        { label: '未删除', value: 0 },
        { label: '已删除', value: 1 },
      ],
    },
  ],

  // ---- 按钮区 ----
  actions: {
    toolbar: [
      {
        action: 'edit',
        disabled: (ctx) =>
          ctx.selectedCount !== 1 || ctx.selectedRows.some((r: AdminUserItem) => r.deleted),
      },
      {
        action: 'delete',
        disabled: (ctx) => !ctx.selectedRows.some((r: AdminUserItem) => !r.deleted),
      },
    ],
    extraToolbar: [
      {
        action: 'disable',
        label: '禁用',
        icon: 'Lock',
        type: 'warning',
        disabled: (ctx) =>
          !ctx.selectedRows.some((r: AdminUserItem) => !r.deleted && r.status === 1),
        handler: handleBatchDisable,
      },
      {
        action: 'enable',
        label: '启用',
        icon: 'Unlock',
        type: 'success',
        disabled: (ctx) =>
          !ctx.selectedRows.some((r: AdminUserItem) => !r.deleted && r.status === 0),
        handler: handleBatchEnable,
      },
      {
        action: 'restore',
        label: '恢复',
        icon: 'RefreshRight',
        type: 'success',
        disabled: (ctx) => !ctx.selectedRows.some((r: AdminUserItem) => r.deleted),
        handler: handleBatchRestore,
      },
      {
        action: 'assignRole',
        label: '分配角色',
        icon: 'Key',
        type: 'primary',
        disabled: (ctx) =>
          ctx.selectedCount !== 1 || ctx.selectedRows.some((r: AdminUserItem) => r.deleted),
      },
    ],
    // 行操作由 row-actions-extra 插槽自定义渲染（编辑/删除/禁用/启用/恢复/分配角色）
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
    { prop: 'username', label: '用户名', width: 130, showOverflowTooltip: true },
    { prop: 'realName', label: '姓名', minWidth: 120, showOverflowTooltip: true },
    {
      prop: 'status',
      label: '状态',
      width: 90,
      align: 'center',
      type: 'tag',
      tagMap: { 1: ['正常', 'success'], 0: ['禁用', 'danger'] },
    },
    {
      prop: 'deleted',
      label: '已删除',
      width: 90,
      align: 'center',
      type: 'boolean',
      trueText: '是',
      falseText: '否',
      trueType: 'danger',
      falseType: 'info',
    },
    { prop: 'createTime', label: '创建时间', width: 170, align: 'center', type: 'date' },
    { prop: 'updateTime', label: '更新时间', width: 170, align: 'center', type: 'date' },
  ],
  rowActionsWidth: 320,

  // ---- 表单区 ----
  formFields: [
    { prop: 'username', label: '用户名', type: 'input', maxlength: 20 },
    {
      prop: 'password',
      label: '密码',
      type: 'input',
      password: true,
      maxlength: 30,
      hidden: (_formData, isEdit) => isEdit,
    },
    { prop: 'realName', label: '姓名', type: 'input', maxlength: 20 },
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
  } as FormRules,
  defaultFormData: {
    status: 1,
  },

  // ---- 详情区 ----
  detailFields: [
    { prop: 'id', label: 'ID' },
    { prop: 'username', label: '用户名' },
    { prop: 'realName', label: '姓名' },
    {
      prop: 'status',
      label: '状态',
      type: 'tag',
      tagMap: { 1: ['正常', 'success'], 0: ['禁用', 'danger'] },
    },
    {
      prop: 'deleted',
      label: '删除状态',
      type: 'boolean',
      trueText: '已删除',
      falseText: '未删除',
      trueType: 'danger',
      falseType: 'info',
    },
    { prop: 'createTime', label: '创建时间', type: 'date' },
    { prop: 'updateTime', label: '更新时间', type: 'date' },
  ],
}
