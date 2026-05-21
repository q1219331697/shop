<template>
  <div class="ai-generate">
    <el-row :gutter="20">
      <!-- 左侧：输入区 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">AI 智能生成</span>
          </template>

          <el-form label-width="80px">
            <el-form-item label="生成类型">
              <el-radio-group v-model="genType">
                <el-radio value="case">测试案例</el-radio>
                <el-radio value="flow">测试流程</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="功能描述">
              <el-input
                v-model="prompt"
                type="textarea"
                :rows="6"
                placeholder="请用自然语言描述你要测试的功能，例如：&#10;用户注册流程：打开注册页面，填写用户名、邮箱、密码，点击注册按钮，验证注册成功并发送验证邮件"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generate" :loading="generating" size="large">
                <el-icon><MagicStick /></el-icon>AI 生成
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 示例提示 -->
          <div class="examples">
            <h4>示例描述</h4>
            <el-tag
              v-for="(ex, i) in examples"
              :key="i"
              class="example-tag"
              effect="plain"
              @click="prompt = ex"
            >
              {{ ex.substring(0, 30) }}...
            </el-tag>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：结果区 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="edit-header">
              <span class="card-title">生成结果</span>
              <el-button type="primary" :disabled="!result" @click="saveResult">保存为案例</el-button>
            </div>
          </template>

          <div v-if="generating" class="loading-area">
            <el-icon :size="48" class="spin-icon"><Loading /></el-icon>
            <p>AI 正在生成中...</p>
          </div>

          <div v-else-if="result" class="result-area">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="名称">{{ result.name }}</el-descriptions-item>
              <el-descriptions-item label="模块">{{ result.module }}</el-descriptions-item>
              <el-descriptions-item label="优先级">{{ result.priority }}</el-descriptions-item>
              <el-descriptions-item label="前置条件">{{ result.pre_condition }}</el-descriptions-item>
              <el-descriptions-item label="预期结果">{{ result.expected_result }}</el-descriptions-item>
            </el-descriptions>

            <h4 style="margin:16px 0 8px">生成步骤</h4>
            <el-table :data="result.steps||[]" border size="small">
              <el-table-column type="index" width="50" label="#" />
              <el-table-column prop="action" label="操作" width="80">
                <template #default="{row}">
                  <el-tag size="small" :type="actionType(row.action)">{{ actionLabel(row.action) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="target" label="目标" min-width="150" />
              <el-table-column prop="value" label="值" min-width="100" />
            </el-table>

            <div v-if="result.tags && result.tags.length" style="margin-top:12px">
              <el-tag v-for="t in result.tags" :key="t" size="small" style="margin-right:6px">{{ t }}</el-tag>
            </div>
          </div>

          <el-empty v-else description="请在左侧输入描述，点击AI生成" :image-size="120" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { aiApi, caseApi, flowApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const genType = ref('case')
const prompt = ref('')
const generating = ref(false)
const result = ref(null)

const examples = [
  '用户登录：打开登录页，输入用户名和密码，点击登录，验证跳转到首页并显示欢迎信息',
  '商品搜索：在搜索框输入关键词，点击搜索按钮，验证搜索结果列表包含相关商品',
  '购物车操作：浏览商品详情页，点击加入购物车，验证购物车数量更新',
  '订单支付：选择商品下单，选择支付方式，完成支付，验证订单状态变为已支付',
]

const actionLabel = (a) => ({ navigate:'导航', click:'点击', fill:'输入', assert:'断言', wait:'等待', scroll:'滚动' }[a]||a)
const actionType = (a) => ({ navigate:'', click:'success', fill:'warning', assert:'danger', wait:'info' }[a]||'')

const generate = async () => {
  if (!prompt.value.trim()) {
    ElMessage.warning('请输入功能描述')
    return
  }
  generating.value = true
  result.value = null
  try {
    const res = await aiApi.generate({ prompt: prompt.value, type: genType.value })
    result.value = res.data
    ElMessage.success('AI生成完成')
  } catch (e) {
    ElMessage.error('生成失败')
  } finally {
    generating.value = false
  }
}

const saveResult = async () => {
  if (!result.value) return
  try {
    if (genType.value === 'case') {
      await caseApi.create(result.value)
      ElMessage.success('已保存为测试案例')
      router.push('/cases')
    } else {
      await flowApi.create(result.value)
      ElMessage.success('已保存为测试流程')
      router.push('/flows')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  }
}
</script>

<style scoped>
.ai-generate { max-width: 1400px; margin: 0 auto; }
.card-title { font-size: 16px; font-weight: 600; }
.edit-header { display: flex; justify-content: space-between; align-items: center; }
.loading-area { text-align: center; padding: 60px 0; color: #999; }
.spin-icon { animation: spin 1s linear infinite; color: #409EFF; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.result-area { padding: 10px 0; }
.examples { margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; }
.examples h4 { margin-bottom: 10px; color: #666; font-size: 14px; }
.example-tag { cursor: pointer; margin: 0 6px 6px 0; transition: all 0.2s; }
.example-tag:hover { color: #409EFF; border-color: #409EFF; }
</style>
