<template>
  <div class="dashboard">
    <h2>仪表盘</h2>
    <el-row :gutter="24" class="stat-row">
      <el-col :span="6">
        <div class="stat-card stat-card--blue">
          <div class="stat-icon">
            <el-icon :size="28"><Goods /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">1,024</div>
            <div class="stat-label">商品总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-card--green">
          <div class="stat-icon">
            <el-icon :size="28"><List /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">256</div>
            <div class="stat-label">今日订单</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-card--orange">
          <div class="stat-icon">
            <el-icon :size="28"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">8,192</div>
            <div class="stat-label">注册用户</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-card--purple">
          <div class="stat-icon">
            <el-icon :size="28"><Wallet /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥12,580</div>
            <div class="stat-label">今日营收</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { Goods, List, User, Wallet } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.dashboard {
  min-height: 100%;

  h2 {
    margin-bottom: 28px;
    margin-top: 0;
    color: #1a1c21;
    font-size: 20px;
    font-weight: 600;
  }
}

.stat-row {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #d3dae6;
  transition: border-color 0.2s ease;
  cursor: default;

  &:hover {
    border-color: #006bb4;
  }
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  color: #fff;
  flex-shrink: 0;
}

.stat-card--blue .stat-icon {
  background: #006bb4;
}

.stat-card--green .stat-icon {
  background: #017d73;
}

.stat-card--orange .stat-icon {
  background: #f5a623;
}

.stat-card--purple .stat-icon {
  background: #9b59b6;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1a1c21;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #69707d;
  margin-top: 2px;
}
</style>
