<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-blue">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">测试案例</div>
              <div class="stat-value">{{ stats.caseCount || 0 }}</div>
            </div>
            <el-icon :size="48" class="stat-icon"><Document /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-purple">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">测试流程</div>
              <div class="stat-value">{{ stats.flowCount || 0 }}</div>
            </div>
            <el-icon :size="48" class="stat-icon"><Share /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-green">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">执行次数</div>
              <div class="stat-value">{{ stats.execCount || 0 }}</div>
            </div>
            <el-icon :size="48" class="stat-icon"><VideoPlay /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card stat-orange">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">通过率</div>
              <div class="stat-value">{{ stats.passRate || 0 }}%</div>
            </div>
            <el-icon :size="48" class="stat-icon"><TrendCharts /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 模块分布 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">模块分布</span>
          </template>
          <div class="chart-container" v-if="stats.moduleDist && stats.moduleDist.length">
            <div
              v-for="item in stats.moduleDist"
              :key="item.module"
              class="dist-item"
            >
              <span class="dist-label">{{ item.module || '未分类' }}</span>
              <el-progress
                :percentage="calcPercentage(item.cnt, stats.caseCount)"
                :stroke-width="18"
                :text-inside="true"
                :format="() => item.cnt + ' 个'"
              />
            </div>
          </div>
          <el-empty v-else description="暂无数据" :image-size="80" />
        </el-card>
      </el-col>

      <!-- 优先级分布 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">优先级分布</span>
          </template>
          <div class="chart-container" v-if="stats.priorityDist && stats.priorityDist.length">
            <div
              v-for="item in stats.priorityDist"
              :key="item.priority"
              class="dist-item"
            >
              <span class="dist-label">
                <el-tag :type="priorityTagType(item.priority)" size="small">
                  {{ item.priority }}
                </el-tag>
              </span>
              <el-progress
                :percentage="calcPercentage(item.cnt, stats.caseCount)"
                :stroke-width="18"
                :text-inside="true"
                :color="priorityColor(item.priority)"
                :format="() => item.cnt + ' 个'"
              />
            </div>
          </div>
          <el-empty v-else description="暂无数据" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-card shadow="hover" style="margin-top: 20px;">
      <template #header>
        <span class="card-title">快捷操作</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-button type="primary" size="large" class="quick-btn" @click="$router.push('/cases/create')">
            <el-icon :size="24"><Plus /></el-icon>
            <span>新建案例</span>
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="success" size="large" class="quick-btn" @click="$router.push('/flows/create')">
            <el-icon :size="24"><Share /></el-icon>
            <span>新建流程</span>
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="warning" size="large" class="quick-btn" @click="$router.push('/ai')">
            <el-icon :size="24"><MagicStick /></el-icon>
            <span>AI生成</span>
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="info" size="large" class="quick-btn" @click="$router.push('/executions')">
            <el-icon :size="24"><VideoPlay /></el-icon>
            <span>执行记录</span>
          </el-button>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { statsApi } from '@/api'

const stats = ref({})

const loadStats = async () => {
  try {
    const res = await statsApi.getStats()
    stats.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const calcPercentage = (value, total) => {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

const priorityTagType = (p) => {
  const map = { P0: 'danger', P1: 'warning', P2: '', P3: 'info' }
  return map[p] || 'info'
}

const priorityColor = (p) => {
  const map = { P0: '#F56C6C', P1: '#E6A23C', P2: '#409EFF', P3: '#909399' }
  return map[p] || '#409EFF'
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  border-radius: 12px;
  border: none;
}

.stat-card :deep(.el-card__body) {
  padding: 20px 24px;
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1d1e2c;
}

.stat-blue .stat-icon { color: #409EFF; }
.stat-purple .stat-icon { color: #7C3AED; }
.stat-green .stat-icon { color: #10B981; }
.stat-orange .stat-icon { color: #F59E0B; }

.stat-blue { border-top: 3px solid #409EFF; }
.stat-purple { border-top: 3px solid #7C3AED; }
.stat-green { border-top: 3px solid #10B981; }
.stat-orange { border-top: 3px solid #F59E0B; }

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d1e2c;
}

.chart-container {
  padding: 10px 0;
}

.dist-item {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.dist-label {
  min-width: 80px;
  font-size: 14px;
  color: #555;
}

.dist-item .el-progress {
  flex: 1;
}

.quick-btn {
  width: 100%;
  height: 80px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}
</style>
