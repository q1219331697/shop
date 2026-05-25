/**
 * 管理员用户 CRUD Schema 配置
 */
import type { CrudSchema, ActionContext } from '@/components/CrudTable'
import type { AdminUserItem } from '@/api/admin-user'
import type { FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  adminUserApi,
  batchDisableAdminUser,
  batchEnableAdminUser,
  batchRestoreAdminUser,
} from '@/api/admin-user'

/** 批量禁用 */
async function handleBatchDisable(ctx: ActionContext<AdminUserItem>) {
  const ids = ctx.selectedRows.filter((r) => !r.deleted && r.status === 1).map((r) => r.id)
  try { await ElMessageBox.confirm(`确定禁用选中的 ${ids.length} 个管理员吗？`, '禁用', { type: 'warning' }) } catch { return }
  try { await batchDisableAdminUser(ids); ElMessage.success('禁用成功'); ctx.refresh() } catch { /* 请求工具已处理 */ }
}

/** 批量启用 */
async function handleBatchEnable(ctx: ActionContext<AdminUserItem>) {
  const ids = ctx.selectedRows.filter((r) => !r.deleted && r.status === 0).map((r) => r.id)
  try { await ElMessageBox.confirm(`确定启用选中的 ${ids.length} 个管理员吗？`, '启用', { type: 'warning' }) } catch { return }
  try { await batchEnableAdminUser(ids); ElMessage.success('启用成功'); ctx.refresh() } catch { /* 请求工具已处理 */ }
}

/** 批量恢复 */
async function handleBatchRestore(ctx: ActionContext<AdminUserItem>) {
  const ids = ctx.selectedRows.filter((r) => r.deleted).map((r) => r.id)
  try { await ElMessageBox.confirm(`确定恢复选中的 ${ids.length} 个管理员吗？`, '恢复', { type: 'warning' }) } catch { return }
  try { await batchRestoreAdminUser(ids); ElMessage.success('恢复成功'); ctx.refresh() } catch { /* 请求工具已处理 */ }
}

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
      { action: 'create', label: '新增', icon: 'Plus', type: 'primary' },
      {
        action: 'edit',
        label: '编辑',
        icon: 'Edit',
        type: 'warning',
        disabled: (ctx) =>
          ctx.selectedCount !== 1 || ctx.selectedRows.some((r: AdminUserItem) => r.deleted),
      },
      {
        action: 'detail',
        label: '详情',
        icon: 'View',
        type: 'info',
        disabled: (ctx) => ctx.selectedCount !== 1,
      },
      {
        action: 'delete',
        label: '删除',
        icon: 'Delete',
        type: 'danger',
        disabled: (ctx) => !ctx.selectedRows.some((r: AdminUserItem) => !r.deleted),
        confirm: (ctx) =>
          `确定删除选中的 ${ctx.selectedRows.filter((r: AdminUserItem) => !r.deleted).length} 个管理员吗？`,
      },
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

  // ---- API ----
  api: adminUserApi,
}
