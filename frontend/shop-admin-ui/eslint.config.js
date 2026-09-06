import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import pluginImportX from 'eslint-plugin-import-x'
import prettierPlugin from 'eslint-plugin-prettier'
import pluginUnicorn from 'eslint-plugin-unicorn'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

import requireDialogCloseOnClickModal from './eslint-rules/require-dialog-close-on-click-modal.js'

export default tseslint.config(
  // 全局忽略
  {
    ignores: ['dist/**', 'node_modules/**', 'src/auto-imports.d.ts', 'src/components.d.ts'],
  },

  // 基础 JS 规则
  js.configs.recommended,

  // TypeScript 规则（strict 包含 recommended，并将所有规则设为 error）
  ...tseslint.configs.strict,

  // Vue 规则（recommended：essential + 可读性 + 主观审美）
  ...pluginVue.configs['flat/recommended'],

  // Vue 文件使用 TypeScript 解析器
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
      globals: {
        computed: 'readonly',
        ref: 'readonly',
        reactive: 'readonly',
        watch: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        window: 'readonly',
        document: 'readonly',
        // 自动导入的接口聚合对象（unplugin-auto-import 配置）
        api: 'readonly',
      },
    },
  },

  // Import 路径检查（大小写敏感，防止 Windows/Linux 不一致）
  {
    files: ['**/*.ts', '**/*.js', '**/*.vue'],
    plugins: {
      'import-x': pluginImportX,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      'import-x/no-unresolved': 'error',
      // 社区惯例的 import 排序：外部包 → 别名(@/) → 相对(../) → 同级(./) → 入口(./)
      // 组间空行、组内字母序（大小写不敏感）。
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroups: [{ pattern: '@/**', group: 'internal', position: 'before' }],
        },
      ],
    },
  },

  // 测试文件：Playwright 运行时经 esbuild 解析相对路径（含跨入 src 的 ../../src/api），
  // 而 import-x 的 TS resolver 因 tests 不在 tsconfig include 中无法解析，故对测试关闭 no-unresolved。
  {
    files: ['tests/**/*.ts'],
    rules: {
      'import-x/no-unresolved': 'off',
    },
  },

  // 全局 TypeScript 规则补充
  {
    files: ['**/*.ts', '**/*.js', '**/*.vue'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },

  // Prettier 配置（必须放最后，覆盖前面的格式化规则）
  prettierConfig,

  // 自定义规则（仅 Vue 文件）
  {
    files: ['**/*.vue'],
    plugins: {
      'custom-rules': {
        rules: {
          'require-dialog-close-on-click-modal': requireDialogCloseOnClickModal,
        },
      },
      prettier: prettierPlugin,
      unicorn: pluginUnicorn,
    },
    rules: {
      // 文件命名规则：.ts/.js 使用 kebab-case，.vue 组件使用 PascalCase
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true,
          },
          ignore: [/^[A-Z][a-zA-Z]+\.vue$/],
        },
      ],

      // Vue
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
      'vue/attribute-hyphenation': ['error', 'always'],

      // 自定义规则：el-dialog 必须设置 :close-on-click-modal="false"
      'custom-rules/require-dialog-close-on-click-modal': 'error',

      // Prettier
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: false,
          trailingComma: 'all',
          printWidth: 100,
          endOfLine: 'auto',
        },
      ],
    },
  },

  // 类型声明文件放宽规则（必须放在自定义规则之后，避免被覆盖）
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
)
