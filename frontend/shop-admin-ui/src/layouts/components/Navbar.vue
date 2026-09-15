<template>
  <el-header class="navbar">
    <div class="navbar-left">
      <!-- 任务页（新增/编辑/详情/分配）返回入口：回到所属列表页。
           用带文字的按钮而非裸图标，保证「有明确的返回途径」 -->
      <el-button v-if="isTaskPage" class="back-btn" text @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </el-button>
      <Breadcrumb />
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'

import { usePageNav } from '@/composables/use-page-nav'

import Breadcrumb from './Breadcrumb.vue'

/** 任务页判定与返回行为统一由 usePageNav 提供，与页面内「取消/返回」共用同一实现 */
const { isTaskPage, goBackToList } = usePageNav()

/** 返回所属列表页 */
function goBack() {
  goBackToList()
}
</script>

<style lang="scss" scoped>
/* 位置行：只承载「返回 + 面包屑」，紧贴内容区，高度比工作区行更轻 */
.navbar {
  height: 40px !important;
  padding: 0 20px !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-bottom: 1px solid #d3dae6;
  margin: 0;
}

.navbar-left {
  display: flex;
  align-items: center;
}

/* 与同行的面包屑保持同一套文字规格：14px / 常规字重 / 同色 / 同字体栈。
   font-family: inherit 是关键——el-button 默认用 element 自己的字体变量（实际落到 Arial），
   中文回退字形与正文系统字体栈不同，会导致「看着大小粗细不一致、基线差半像素」。
   hover 只变色、不出背景块，避免和整行文字风格割裂 */
.back-btn {
  display: inline-flex;
  align-items: center;
  height: 24px;
  margin-right: 12px;
  padding: 0 4px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  line-height: 14px;
  color: #535966;
  background-color: transparent;

  &:hover,
  &:focus {
    color: #006bb4;
    background-color: transparent;
  }

  .el-icon {
    margin-right: 4px;
    font-size: 14px;
  }
}
</style>
