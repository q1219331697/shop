import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'
import pluginUnicorn from 'eslint-plugin-unicorn'

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
      },
    },
  },

  // Prettier 配置（必须放最后，覆盖前面的格式化规则）
  prettierConfig,

  // 自定义规则
  {
    plugins: {
      prettier: prettierPlugin,
      unicorn: pluginUnicorn,
    },
    rules: {
      // TypeScript（strict 已覆盖核心规则，此处补充 argsIgnorePattern）
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // 文件命名规则：.ts/.js 使用 kebab-case，.vue 组件允许 PascalCase
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true,
            pascalCase: true,
          },
          ignore: [/^[A-Z][a-zA-Z]+\.vue$/],
        },
      ],

      // Vue
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
      'vue/attribute-hyphenation': ['error', 'always'],

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
