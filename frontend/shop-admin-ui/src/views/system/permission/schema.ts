/**
 * 权限管理页面配置
 *
 * 权限为树形结构（无分页），无法直接套用 CrudSchema 的分页表格，
 * 因此只沉淀搜索/表单/详情/工具栏配置，由页面自行组装树形表格。
 */
import type { FormRules } from 'element-plus'

import type {
  ActionItem,
  DetailField,
  FormField,
  SearchField,
  TagMap,
} from '@/components/CrudTable'

/** 权限类型标签映射：1-目录，2-菜单，3-操作 */
export const PERMISSION_TYPE_TAG_MAP: TagMap = {
  // 目录是分组语义，取中性灰；空串自 Element Plus 2.3 起不再是合法 type
  1: ['目录', 'info'],
  2: ['菜单', 'success'],
  3: ['操作', 'warning'],
}

/** 是否可见标签映射：0-隐藏，1-显示 */
export const VISIBLE_TAG_MAP: TagMap = {
  1: ['显示', 'success'],
  0: ['隐藏', 'info'],
}

/** 状态标签映射：0-禁用，1-正常 */
export const STATUS_TAG_MAP: TagMap = {
  1: ['正常', 'success'],
  0: ['禁用', 'danger'],
}

/** 是否记录操作日志标签映射：0-不记录，1-记录 */
export const LOG_FLAG_TAG_MAP: TagMap = {
  1: ['记录', 'success'],
  0: ['不记录', 'info'],
}

/** 搜索区配置 */
export const permissionSearchFields: SearchField[] = [
  { prop: 'permissionName', label: '权限名称', type: 'input', width: '180px' },
  { prop: 'permissionCode', label: '权限编码', type: 'input', width: '180px' },
  {
    prop: 'permissionType',
    label: '权限类型',
    type: 'select',
    width: '120px',
    options: [
      { label: '目录', value: 1 },
      { label: '菜单', value: 2 },
      { label: '操作', value: 3 },
    ],
  },
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
]

/**
 * 工具栏按钮配置：Ant 商务蓝（与管理员/角色页一致，见 global.scss 的 .op-btn）
 * 新增=实心蓝 编辑=线框(蓝字) 详情=线框(黑字) 删除=实心红
 */
export const permissionToolbarActions: ActionItem[] = [
  { action: 'create', label: '新增', icon: 'Plus', type: 'primary' },
  {
    action: 'update',
    label: '编辑',
    icon: 'Edit',
    type: 'primary',
    colorClass: 'btn-outline',
    disabled: (ctx) => ctx.selectedCount !== 1,
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
    disabled: (ctx) => ctx.selectedCount === 0,
  },
]

/** 表单区配置 */
export const permissionFormFields: FormField[] = [
  {
    prop: 'permissionType',
    label: '权限类型',
    type: 'radio',
    radios: [
      { label: '目录', value: 1 },
      { label: '菜单', value: 2 },
      { label: '操作', value: 3 },
    ],
  },
  { prop: 'parentId', label: '上级权限', type: 'slot' },
  { prop: 'permissionName', label: '权限名称', type: 'input', maxlength: 50 },
  {
    prop: 'permissionCode',
    label: '权限编码',
    type: 'input',
    maxlength: 100,
    placeholder: '如 system:user:list',
  },
  {
    prop: 'path',
    label: '路径',
    type: 'input',
    maxlength: 255,
    placeholder: '如 /system/admin',
    hidden: (formData) => formData.permissionType === 3,
  },
  {
    prop: 'component',
    label: '组件路径',
    type: 'input',
    maxlength: 255,
    placeholder: '如 views/system/admin/index.vue',
    hidden: (formData) => formData.permissionType === 3,
  },
  {
    prop: 'icon',
    label: '菜单图标',
    type: 'slot',
    hidden: (formData) => formData.permissionType === 3,
  },
  { prop: 'sortOrder', label: '排序', type: 'number', min: 0, precision: 0 },
  {
    prop: 'visible',
    label: '是否可见',
    type: 'radio',
    radios: [
      { label: '显示', value: 1 },
      { label: '隐藏', value: 0 },
    ],
    hidden: (formData) => formData.permissionType === 3,
  },
  // 记录操作日志开关：关闭后该菜单/操作点对应的请求不再落操作日志；
  // 目录(1)仅作导航分组、不承载接口请求，故隐藏
  {
    prop: 'logFlag',
    label: '记录操作日志',
    type: 'switch',
    activeValue: 1,
    inactiveValue: 0,
    hidden: (formData) => formData.permissionType === 1,
  },
  {
    prop: 'status',
    label: '状态',
    type: 'radio',
    radios: [
      { label: '正常', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
]

/** 表单校验规则 */
export const permissionFormRules: FormRules = {
  permissionType: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
  permissionName: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    { min: 1, max: 50, message: '权限名称长度为1-50个字符', trigger: 'blur' },
  ],
  // 权限编码非必填：目录节点仅作导航分组、不参与授权，允许留空；
  // 「非目录必填」由 PermissionFormPage 提交前校验（rules 无法读取表单其它字段）
  permissionCode: [
    { max: 100, message: '权限编码长度不能超过100个字符', trigger: 'blur' },
    {
      // E2E 测试数据采用 e2e-<案例ID>-<ts> 中杠形态以便辨识批次；放开中杠与大写，
      // 仍兼容真实编码（如 system:user:list）的小写冒号形态
      pattern: /^[a-zA-Z][a-zA-Z0-9:_-]*$/,
      message: '权限编码以字母开头，可包含字母、数字、冒号与中杠',
      trigger: 'blur',
    },
  ],
  sortOrder: [{ required: true, message: '请输入排序值', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

/** 表单默认值 */
export const permissionDefaultFormData: Record<string, unknown> = {
  parentId: 0,
  permissionType: 1,
  sortOrder: 0,
  visible: 1,
  status: 1,
  logFlag: 1,
}

/** 详情区配置 */
export const permissionDetailFields: DetailField[] = [
  { prop: 'id', label: 'ID' },
  { prop: 'permissionName', label: '权限名称' },
  { prop: 'permissionCode', label: '权限编码' },
  { prop: 'permissionType', label: '权限类型', type: 'tag', tagMap: PERMISSION_TYPE_TAG_MAP },
  { prop: 'parentId', label: '上级权限', type: 'slot' },
  { prop: 'path', label: '路径' },
  { prop: 'component', label: '组件路径' },
  { prop: 'icon', label: '菜单图标' },
  { prop: 'sortOrder', label: '排序' },
  { prop: 'visible', label: '是否可见', type: 'tag', tagMap: VISIBLE_TAG_MAP },
  { prop: 'status', label: '状态', type: 'tag', tagMap: STATUS_TAG_MAP },
  { prop: 'logFlag', label: '记录操作日志', type: 'tag', tagMap: LOG_FLAG_TAG_MAP },
  { prop: 'createTime', label: '创建时间', type: 'date' },
  { prop: 'updateTime', label: '更新时间', type: 'date' },
]
