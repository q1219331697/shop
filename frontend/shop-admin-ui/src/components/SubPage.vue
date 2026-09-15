<template>
  <PageContainer>
    <div class="sub-page">
      <div class="sub-page__inner" :style="innerStyle">
        <!-- 页面标题放在内容块内：标题、内容、操作区三者左边界天然对齐 -->
        <h2 v-if="pageTitle" class="sub-page__title">{{ pageTitle }}</h2>

        <div v-loading="loading" class="sub-page__body" :class="bodyClass" :style="bodyStyle">
          <slot />
        </div>

        <div v-if="$slots.footer" class="sub-page__footer" :class="footerClass">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
/**
 * SubPage - 任务页（新增 / 编辑 / 详情 / 分配）基础骨架组件
 *
 * 统一了这类页面的全部布局规格，页面只提供「内容 + 页脚」，不写任何布局样式：
 * 1. 内容卡片：白底 + 细边框 + 圆角 + 内边距，居中显示（默认宽 640px，可用 maxWidth 调整）；
 * 2. 页面标题：取路由 meta.title，与面包屑末级同源，位于卡片内顶部；
 * 3. 内容区：默认随页面滚动（整页滚动）；bodyMaxHeight 可让内容区内部滚动（如权限树）；
 * 4. 页脚操作区：左对齐、上间距 16px、按钮间距 12px，并吸底（长内容时按钮始终可见）。
 *
 * bodyClass / footerClass 用于挂业务类名（同时兼容既有测试定位器，
 * 如 .form-page / .form-footer / .role-assign-content / .role-assign-footer）。
 */
import { computed } from 'vue'

import { usePageNav } from '@/composables/use-page-nav'

/** 页面标题与顶栏面包屑末级同源（路由 meta.title） */
const { pageTitle } = usePageNav()

const props = withDefaults(
  defineProps<{
    /** 内容与页脚共用的最大宽度（默认 640px；传空串则撑满内容区） */
    maxWidth?: string
    /** 内容区加载态 */
    loading?: boolean
    /** 内容区最大高度，超过则在内容区内部滚动（用于权限树等高内容） */
    bodyMaxHeight?: string
    /** 内容区附加类名 */
    bodyClass?: string
    /** 页脚附加类名 */
    footerClass?: string
  }>(),
  {
    maxWidth: '640px',
    loading: false,
    bodyMaxHeight: '',
    bodyClass: '',
    footerClass: '',
  },
)

const innerStyle = computed(() => (props.maxWidth ? { maxWidth: props.maxWidth } : undefined))

/** 内容区内部滚动（默认不设，跟随页面滚动） */
const bodyStyle = computed(() =>
  props.bodyMaxHeight ? { maxHeight: props.bodyMaxHeight, overflowY: 'auto' as const } : undefined,
)
</script>

<style lang="scss" scoped>
/* 任务页改为「整页滚动」：
   PageContainer 默认 height:100% + overflow:hidden（列表页依赖它做表格内滚动），
   任务页需要放开高度限制，交给外层内容区（.app-main 自带 overflow-y:auto）统一滚动，
   避免在卡片外再出现一条容器内滚动条 */
.page-container {
  height: auto;
  min-height: 100%;
  overflow: visible;
}

.sub-page {
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.sub-page__title {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
  color: #111827;
}

.sub-page__inner {
  width: 100%;
  /* 卡片化：白底 + 细边框 + 圆角 + 内边距，让内容块有清晰边界；
     窄内容在宽屏下水平居中，避免「内容挤在左边、右侧大片空白」的偏斜感 */
  margin: 0 auto;
  padding: 20px 24px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-sizing: border-box;
}

.sub-page__body {
  width: 100%;

  /* 表单最后一行的下外边距会与页脚的上外边距折叠，导致表单页间距比其他页多 2px；
     清零后「内容 → 页脚」在所有任务页统一为 16px */
  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
}

.sub-page__footer {
  /* 吸底：内容较长时操作按钮始终停在内容区底部，无需滚到底；
     白底避免下方内容滚动时从按钮后面透出 */
  position: sticky;
  bottom: 0;
  z-index: 1;
  margin-top: 16px;
  background: #fff;
  /* 与内容左边界对齐：内容本身就靠左，居中会让按钮看着「漂」在中间 */
  text-align: left;

  /* 页脚内相邻按钮间距固定，避免各页依赖 element 默认外边距产生差异 */
  :deep(.el-button + .el-button) {
    margin-left: 12px;
  }
}
</style>
