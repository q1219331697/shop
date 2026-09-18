/**
 * 管理员 CRUD Schema 配置
 * <p>
 * 管理后台账号（AdminUserEntity），区别于 C 端会员（UserEntity）。
 * </p>
 */
import type { FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

import type { AdminUserItem } from '@/api'
import type { CrudSchema, ActionContext } from '@/components/CrudTable'
// API 通过自动导入的 api 聚合对象使用（无需 import）

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
  handleBatchAction(ctx, (r) => !r.deleted && r.status === 1, api.adminUser.batchDisable, '禁用成功')

/** 批量启用 */
const handleBatchEnable = (ctx: ActionContext<AdminUserItem>) =>
  handleBatchAction(ctx, (r) => !r.deleted && r.status === 0, api.adminUser.batchEnable, '启用成功')

/** 批量恢复 */
const handleBatchRestore = (ctx: ActionContext<AdminUserItem>) =>
  handleBatchAction(ctx, (r) => r.deleted, api.adminUser.batchRestore, '恢复成功')

/** 管理员 CRUD Schema */
export const adminUserSchema: CrudSchema<AdminUserItem> = {
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
  // 工具栏配色（Ant 商务蓝，见 global.scss 的 .op-btn）：
  //   新增=实心蓝 详情=线框(黑字) 编辑=线框(蓝字) 删除=实心红
  //   禁用=实心橙 启用=实心绿 恢复=实心绿（与启用同款）
  actions: {
    toolbar: [
      // 编辑/详情未选中时禁用，单选后跳转独立页面（见 index.vue）
      { action: 'edit', type: 'primary', colorClass: 'btn-outline' },
      { action: 'detail', type: 'info' },
      {
        action: 'delete',
        type: 'danger',
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
    ],
    // 行内操作：详情走默认按钮（跳页面）；编辑/禁用/启用/恢复/分配角色由 row-actions-extra 插槽渲染
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
  rowActionsWidth: 400,

  // ---- 表单区 ----
  // 密码不在表单里：新增时后端填充系统默认密码，改密走列表「重置密码」操作
  formFields: [
    { prop: 'username', label: '用户名', type: 'input', maxlength: 50 },
    { prop: 'realName', label: '姓名', type: 'input', maxlength: 50 },
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
      { min: 1, max: 50, message: '用户名长度为1-50个字符', trigger: 'blur' },
    ],
    realName: [{ max: 50, message: '姓名最多50个字符', trigger: 'blur' }],
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
