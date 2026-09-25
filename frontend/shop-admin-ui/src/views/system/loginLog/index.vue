<template>
  <!-- 登录日志为只读数据：schema 已隐藏全部工具栏按钮与行操作 -->
  <CrudTable ref="crudTableRef" :schema="loginLogSchema" :api="api.loginLog" resource="loginlog" />
</template>

<script setup lang="ts">
/**
 * 登录日志 - 基于 CrudTable 的只读查询页
 * <p>
 * 日志由登录行为产生，仅支持按用户名 / 登录IP / 状态 / 登录时间查询。
 * </p>
 */

// ==================== 依赖引入 ====================

// Vue 核心
import { ref } from 'vue'

// API 聚合对象（显式导入，避免依赖 auto-import 在该视图未注入）/ 业务组件
import { api } from '@/api'
import { CrudTable } from '@/components/CrudTable'

// Schema 配置
import { loginLogSchema } from './schema'

// ==================== 组件引用 ====================

const crudTableRef = ref<InstanceType<typeof CrudTable>>()
</script>
