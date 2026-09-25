/**
 * 操作日志查询 Schema 配置
 * <p>
 * 操作日志由 OperationLogAspect 自动写入，属只读数据：不提供新增/编辑/删除，
 * 故工具栏默认按钮全部隐藏，行操作仅保留「详情」，表格不可多选。
 * </p>
 */
import type { OperationLogItem } from '@/api'
import type { CrudSchema, DetailField, TagMap } from '@/components/CrudTable'

/** 操作类型标签映射：1-登录，2-登出，3-新增，4-修改，5-删除，6-查询，7-其它 */
export const OPERATION_TYPE_TAG_MAP: TagMap = {
  1: ['登录', 'success'],
  2: ['登出', 'info'],
  3: ['新增', 'primary'],
  4: ['修改', 'warning'],
  5: ['删除', 'danger'],
  6: ['查询', 'info'],
  7: ['其它', 'info'],
}

/** 是否成功标签映射：0-失败，1-成功 */
export const OPERATION_SUCCESS_TAG_MAP: TagMap = {
  1: ['成功', 'success'],
  0: ['失败', 'danger'],
}

/** 操作日志查询 Schema */
export const operationLogSchema: CrudSchema<OperationLogItem> = {
  name: '操作日志',
  rowKey: 'id',
  rowActionsWidth: 100,
  detailDialogWidth: '900px',

  // ---- 搜索区 ----
  searchFields: [
    { prop: 'username', label: '操作人', type: 'input', width: '180px' },
    { prop: 'module', label: '模块', type: 'input', width: '160px' },
    { prop: 'operation', label: '操作', type: 'input', width: '160px' },
    {
      prop: 'operationType',
      label: '类型',
      type: 'select',
      width: '130px',
      options: [
        { label: '登录', value: 1 },
        { label: '登出', value: 2 },
        { label: '新增', value: 3 },
        { label: '修改', value: 4 },
        { label: '删除', value: 5 },
        { label: '查询', value: 6 },
        { label: '其它', value: 7 },
      ],
    },
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
      prop: 'startTime',
      label: '开始时间',
      type: 'datePicker',
      width: '195px',
      dateType: 'datetime',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      prop: 'endTime',
      label: '结束时间',
      type: 'datePicker',
      width: '195px',
      dateType: 'datetime',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
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
    // 行操作：只读页仅保留「详情」，新增/编辑/删除在工具栏已隐藏
    // 详情为列表数据的延伸查看，与列表同源，不设独立权限码（noPermission）
    rowActions: [{ action: 'detail', label: '详情', type: 'info', noPermission: true }],
  },

  // ---- 数据区 ----
  columns: [
    { prop: 'id', label: 'ID', width: 80, align: 'center' },
    { prop: 'username', label: '操作人', width: 90, showOverflowTooltip: true },
    { prop: 'module', label: '模块', width: 100, showOverflowTooltip: true },
    { prop: 'operation', label: '操作', width: 160, showOverflowTooltip: true },
    {
      prop: 'operationType',
      label: '类型',
      width: 70,
      align: 'center',
      type: 'tag',
      tagMap: OPERATION_TYPE_TAG_MAP,
    },
    { prop: 'requestMethod', label: '方式', width: 70, align: 'center' },
    { prop: 'requestUri', label: '请求地址', minWidth: 140, showOverflowTooltip: true },
    { prop: 'duration', label: '耗时(ms)', width: 90, align: 'center' },
    {
      prop: 'success',
      label: '状态',
      width: 70,
      align: 'center',
      type: 'tag',
      tagMap: OPERATION_SUCCESS_TAG_MAP,
    },
    { prop: 'ip', label: 'IP', width: 140 },
    { prop: 'operationTime', label: '操作时间', width: 170, align: 'center', type: 'date' },
  ],
  selectable: false,

  // ---- 详情区 ----
  detailEnabled: true,
  detailFields: [
    { prop: 'id', label: 'ID' },
    { prop: 'username', label: '操作人' },
    { prop: 'module', label: '模块' },
    { prop: 'operation', label: '操作' },
    {
      prop: 'operationType',
      label: '类型',
      type: 'tag',
      tagMap: OPERATION_TYPE_TAG_MAP,
    },
    { prop: 'permissionCode', label: '权限编码' },
    { prop: 'requestMethod', label: '请求方式' },
    { prop: 'requestUri', label: '请求地址' },
    { prop: 'classMethod', label: '类#方法' },
    { prop: 'requestParams', label: '请求参数', type: 'slot', slot: 'requestParams' },
    { prop: 'responseData', label: '响应结果', type: 'slot', slot: 'responseData' },
    { prop: 'ip', label: 'IP' },
    { prop: 'duration', label: '耗时(ms)' },
    {
      prop: 'success',
      label: '状态',
      type: 'tag',
      tagMap: OPERATION_SUCCESS_TAG_MAP,
    },
    { prop: 'message', label: '失败原因' },
    { prop: 'operationTime', label: '操作时间', type: 'date' },
    { prop: 'createTime', label: '创建时间', type: 'date' },
  ] as DetailField[],
}
