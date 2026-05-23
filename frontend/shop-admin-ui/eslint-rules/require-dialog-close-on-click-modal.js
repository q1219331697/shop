/**
 * 自定义 ESLint 规则：包含编辑内容的 el-dialog 必须设置 :close-on-click-modal="false"
 * 防止误触遮罩层关闭对话框导致编辑数据丢失
 * 纯展示型 dialog（无表单/输入组件）不强制要求
 */
const EDITABLE_COMPONENTS = [
  'el-form',
  'el-input',
  'el-select',
  'el-checkbox',
  'el-radio',
  'el-switch',
  'el-date-picker',
  'el-input-number',
  'el-cascader',
  'el-transfer',
]

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'require el-dialog with editable content to set :close-on-click-modal="false"',
    },
    fixable: null,
    messages: {
      missing:
        '包含编辑内容的 el-dialog 必须设置 :close-on-click-modal="false"，防止误触遮罩层关闭导致数据丢失',
      wrongValue:
        '包含编辑内容的 el-dialog 的 close-on-click-modal 必须为 false',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode
    const df = sourceCode?.ast?.templateBody
    if (!df) return {}

    const dialogs = []
    collectDialogs(df, dialogs)

    for (const dialog of dialogs) {
      if (!hasEditableChild(dialog)) continue

      const startTag = dialog.startTag
      const attr = startTag.attributes.find(
        (a) =>
          a.type === 'VAttribute' &&
          a.key.type === 'VDirectiveKey' &&
          a.key.name?.name === 'bind' &&
          (a.key.argument?.type === 'VIdentifier'
            ? a.key.argument.name
            : a.key.argument?.value) === 'close-on-click-modal'
      )

      if (!attr) {
        context.report({
          node: startTag,
          messageId: 'missing',
        })
        continue
      }

      if (
        attr.value?.type === 'VExpressionContainer' &&
        attr.value.expression?.type === 'Literal' &&
        attr.value.expression.value !== false
      ) {
        context.report({
          node: startTag,
          messageId: 'wrongValue',
        })
      }
    }

    return {}
  },
}

/**
 * 递归收集所有 el-dialog 节点
 */
function collectDialogs(node, result) {
  if (node.type === 'VElement' && node.name === 'el-dialog') {
    result.push(node)
  }
  if (node.children) {
    for (const child of node.children) {
      collectDialogs(child, result)
    }
  }
}

/**
 * 递归检查元素及其子元素中是否包含编辑型组件
 */
function hasEditableChild(node) {
  if (!node || !node.children) return false

  for (const child of node.children) {
    if (
      child.type === 'VElement' &&
      EDITABLE_COMPONENTS.includes(child.name)
    ) {
      return true
    }
    if (child.type === 'VElement' && hasEditableChild(child)) {
      return true
    }
  }
  return false
}
