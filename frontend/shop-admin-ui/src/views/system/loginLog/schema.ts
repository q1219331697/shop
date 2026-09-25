/**
 * 登录日志查询 Schema 配置
 * <p>
 * 登录日志由登录行为产生，属只读数据：不提供新增/编辑/删除，
 * 故工具栏默认按钮全部隐藏、行操作为空、表格不可多选。
 * </p>
 */
import type { LoginLogItem } from '@/api'
import type { CrudSchema } from '@/components/CrudTable'

/** 登录日志查询 Schema */
export const loginLogSchema: CrudSchema<LoginLogItem> = {
  name: '登录日志',
  rowKey: 'id',

  // ---- 搜索区 ----
  searchFields: [
    { prop: 'username', label: '用户名', type: 'input', width: '180px' },
    { prop: 'ip', label: '登录IP', type: 'input', width: '160px' },
    {
      prop: 'success',
      label: '状态',
      type: 'select',
      width: '120px',
      options: [
        { label: '成功', value: 1 },
        { label: '失败', value: 0 },
      ],
    },
    {
      prop: 'loginTimeRange',
      label: '登录时间',
      type: 'dateRange',
      width: '260px',
      dateType: 'daterange',
      startProp: 'startTime',
      endProp: 'endTime',
      valueFormat: 'YYYY-MM-DD',
    },
  ],

  // ---- 按钮区 ----
  actions: {
    // ActionBar 会把未配置的默认按钮补齐（新增/编辑/详情/删除），只读页必须逐个显式隐藏
    toolbar: [
      { action: 'create', visible: false },
      { action: 'update', visible: false },
      { action: 'detail', visible: false },
      { action: 'delete', visible: false },
    ],
    // 空数组即隐藏行操作列（DataArea 使用 rowActions ?? 默认按钮，空数组不会被默认值覆盖）
    rowActions: [],
  },

  // ---- 数据区 ----
  columns: [
    { prop: 'id', label: 'ID', width: 80, align: 'center' },
    { prop: 'username', label: '用户名', width: 200, showOverflowTooltip: true },
    { prop: 'ip', label: '登录IP', width: 140 },
    {
      prop: 'success',
      label: '状态',
      width: 90,
      align: 'center',
      type: 'tag',
      tagMap: { 1: ['成功', 'success'], 0: ['失败', 'danger'] },
    },
    { prop: 'message', label: '提示信息', minWidth: 180, showOverflowTooltip: true },
    { prop: 'loginTime', label: '登录时间', width: 170, align: 'center', type: 'date' },
  ],
  selectable: false,

  // ---- 详情区 ----
  detailEnabled: false,
}
