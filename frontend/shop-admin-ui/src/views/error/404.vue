<template>
  <div class="not-found">
    <h1>404</h1>
    <p>抱歉，您访问的页面不存在</p>
    <el-button type="primary" @click="router.push('/')">返回首页</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 组件挂载时显示提示
ElMessage.warning('页面不存在')
</script>

<style lang="scss" scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;

  h1 {
    font-size: 120px;
    color: #409eff;
    margin-bottom: 10px;
  }

  p {
    font-size: 18px;
    color: #999;
    margin-bottom: 30px;
  }
}
</style>
