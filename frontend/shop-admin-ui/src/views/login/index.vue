<template>
  <div class="login-container">
    <!-- 左侧品牌展示区 -->
    <div class="login-banner">
      <div class="banner-content">
        <div class="banner-icon">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="16" width="56" height="36" rx="4" stroke="white" stroke-width="3" />
            <path d="M4 28h56" stroke="white" stroke-width="3" />
            <rect x="12" y="36" width="16" height="8" rx="2" stroke="white" stroke-width="2" />
            <circle cx="44" cy="40" r="4" stroke="white" stroke-width="2" />
          </svg>
        </div>
        <h1 class="banner-title">商城管理后台</h1>
        <p class="banner-desc">高效、安全、便捷的电商管理解决方案</p>
        <div class="banner-features">
          <div class="feature-item">
            <el-icon :size="20"><Goods /></el-icon>
            <span>商品管理</span>
          </div>
          <div class="feature-item">
            <el-icon :size="20"><List /></el-icon>
            <span>订单处理</span>
          </div>
          <div class="feature-item">
            <el-icon :size="20"><User /></el-icon>
            <span>用户运营</span>
          </div>
          <div class="feature-item">
            <el-icon :size="20"><DataAnalysis /></el-icon>
            <span>数据分析</span>
          </div>
        </div>
      </div>
      <!-- 装饰元素 -->
      <div class="decoration decoration-1"></div>
      <div class="decoration decoration-2"></div>
      <div class="decoration decoration-3"></div>
    </div>

    <!-- 右侧登录表单区 -->
    <div class="login-form-wrapper">
      <div class="form-container">
        <div class="form-header">
          <h2 class="form-title">欢迎回来</h2>
          <p class="form-subtitle">请登录您的管理员账号</p>
        </div>

        <el-form ref="formRef" :model="loginForm" :rules="rules" label-width="0" size="large">
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名/姓名"
              :prefix-icon="UserIcon"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="LockIcon"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
          </div>

          <el-form-item>
            <el-button type="primary" :loading="loading" class="login-btn" @click="handleLogin">
              <span v-if="!loading">登 录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <span>商城管理后台 v1.0</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  User as UserIcon,
  Lock as LockIcon,
  Goods,
  List,
  User,
  DataAnalysis,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/modules/user'

const REMEMBER_KEY = 'admin_remember_username'
const REMEMBER_PWD_KEY = 'admin_remember_password'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为2-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 4, max: 30, message: '密码长度为4-30个字符', trigger: 'blur' },
  ],
}

onMounted(() => {
  const saved = localStorage.getItem(REMEMBER_KEY)
  const savedPwd = localStorage.getItem(REMEMBER_PWD_KEY)
  if (saved) {
    loginForm.username = saved
    rememberMe.value = true
  }
  if (savedPwd) {
    loginForm.password = savedPwd
  }
})

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login(loginForm)
    // 记住用户名和密码
    if (rememberMe.value) {
      localStorage.setItem(REMEMBER_KEY, loginForm.username)
      localStorage.setItem(REMEMBER_PWD_KEY, loginForm.password)
    } else {
      localStorage.removeItem(REMEMBER_KEY)
      localStorage.removeItem(REMEMBER_PWD_KEY)
    }
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
    ElMessage.success('登录成功')
  } catch {
    ElMessage.error('登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #ffffff;
}

// 左侧品牌展示区
.login-banner {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-right: 1px solid #d3dae6;
  overflow: hidden;

  @media (max-width: 900px) {
    display: none;
  }
}

.banner-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #535966;
  padding: 40px;
}

.banner-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  animation: float 3s ease-in-out infinite;

  svg {
    width: 100%;
    height: 100%;

    rect,
    path,
    circle {
      stroke: #535966;
    }
  }
}

.banner-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: 2px;
  color: #1a1c21;
}

.banner-desc {
  font-size: 16px;
  color: #535966;
  margin-bottom: 48px;
}

.banner-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  color: #535966;
  transition: all 0.3s;

  .el-icon {
    color: #1a1c21;
  }

  &:hover {
    background: #e8e8ec;
    color: #1a1c21;
  }
}

// 装饰元素
.decoration {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
  background: #d3dae6;
}

.decoration-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  animation: pulse 6s ease-in-out infinite;
}

.decoration-2 {
  width: 300px;
  height: 300px;
  bottom: -80px;
  right: -60px;
  animation: pulse 8s ease-in-out infinite 2s;
}

.decoration-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: 15%;
  animation: pulse 5s ease-in-out infinite 1s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.06;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.1;
  }
}

// 右侧登录表单区
.login-form-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  padding: 40px;

  @media (max-width: 900px) {
    flex: none;
    width: 100%;
  }
}

.form-container {
  width: 100%;
  max-width: 400px;
}

.form-header {
  margin-bottom: 40px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1c21;
  margin-bottom: 8px;
}

.form-subtitle {
  font-size: 15px;
  color: #535966;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  background: #7ea0d4;
  border: none;
  letter-spacing: 4px;
  color: #fff;

  &:hover {
    background: #6488be;
  }
}

.form-footer {
  text-align: center;
  margin-top: 40px;
  color: #b0b0c0;
  font-size: 12px;
}

// Element Plus 样式覆盖
:deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 4px 12px;
}

:deep(.el-checkbox__label) {
  color: #535966 !important;
  font-size: 13px;
}

:deep(.el-checkbox__inner) {
  border-color: #a8b5c8 !important;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #a8b5c8 !important;
  border-color: #a8b5c8 !important;
}
</style>
