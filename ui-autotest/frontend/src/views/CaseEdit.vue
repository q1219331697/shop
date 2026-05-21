<template>
  <div class="case-edit">
    <el-card shadow="hover">
      <template #header>
        <div class="edit-header">
          <span class="card-title">{{ isEdit ? '编辑案例' : '新建案例' }}</span>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width: 800px;">
        <el-form-item label="案例名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入案例名称" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模块" prop="module">
              <el-select v-model="form.module" placeholder="选择模块" style="width:100%">
                <el-option label="登录模块" value="登录模块" />
                <el-option label="商品模块" value="商品模块" />
                <el-option label="订单模块" value="订单模块" />
                <el-option label="支付模块" value="支付模块" />
                <el-option label="用户模块" value="用户模块" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" placeholder="选择优先级" style="width:100%">
                <el-option label="P0-紧急" value="P0" />
                <el-option label="P1-高" value="P1" />
                <el-option label="P2-中" value="P2" />
                <el-option label="P3-低" value="P3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="draft">草稿</el-radio>
            <el-radio value="active">启用</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="案例描述" />
        </el-form-item>
        <el-form-item label="前置条件">
          <el-input v-model="form.pre_condition" type="textarea" :rows="2" placeholder="执行前需满足的条件" />
        </el-form-item>
        <el-form-item label="预期结果">
          <el-input v-model="form.expected_result" type="textarea" :rows="2" placeholder="预期执行结果" />
        </el-form-item>

        <!-- 步骤编排 -->
        <el-form-item label="测试步骤">
          <div class="steps-editor">
            <div v-for="(step, idx) in form.steps" :key="idx" class="step-row">
              <el-tag type="info" size="small" class="step-index">{{ idx + 1 }}</el-tag>
              <el-select v-model="step.action" style="width: 120px" placeholder="操作">
                <el-option label="导航" value="navigate" />
                <el-option label="点击" value="click" />
                <el-option label="输入" value="fill" />
                <el-option label="断言" value="assert" />
                <el-option label="等待" value="wait" />
                <el-option label="滚动" value="scroll" />
              </el-select>
              <el-input v-model="step.target" placeholder="目标元素/路径" style="flex:1" />
              <el-input v-model="step.value" placeholder="值(可选)" style="width:160px" />
              <el-button type="danger" :icon="Delete" circle size="small" @click="removeStep(idx)" />
            </div>
            <el-button type="primary" plain @click="addStep" style="margin-top:8px">
              <el-icon><Plus /></el-icon>添加步骤
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="标签">
          <el-select v-model="form.tags" multiple filterable allow-create placeholder="添加标签" style="width:100%">
            <el-option label="smoke" value="smoke" />
            <el-option label="regression" value="regression" />
            <el-option label="login" value="login" />
            <el-option label="AI生成" value="AI生成" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveCase" :loading="saving">保存</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { caseApi } from '@/api'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const formRef = ref(null)
const saving = ref(false)

const form = ref({
  name: '',
  description: '',
  module: '',
  priority: 'P2',
  status: 'draft',
  steps: [],
  pre_condition: '',
  expected_result: '',
  tags: [],
})

const rules = {
  name: [{ required: true, message: '请输入案例名称', trigger: 'blur' }],
  module: [{ required: true, message: '请选择模块', trigger: 'change' }],
}

const addStep = () => {
  form.value.steps.push({ action: 'click', target: '', value: '' })
}

const removeStep = (idx) => {
  form.value.steps.splice(idx, 1)
}

const loadCase = async (id) => {
  try {
    const res = await caseApi.getDetail(id)
    const data = res.data
    data.steps = typeof data.steps === 'string' ? JSON.parse(data.steps) : (data.steps || [])
    data.tags = typeof data.tags === 'string' ? JSON.parse(data.tags) : (data.tags || [])
    form.value = data
  } catch (e) {
    ElMessage.error('加载案例失败')
  }
}

const saveCase = async () => {
  try {
    await formRef.value.validate()
  } catch { return }

  saving.value = true
  try {
    if (isEdit.value) {
      await caseApi.update(route.params.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await caseApi.create(form.value)
      ElMessage.success('创建成功')
    }
    router.push('/cases')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEdit.value) {
    loadCase(route.params.id)
  }
})
</script>

<style scoped>
.case-edit { max-width: 1400px; margin: 0 auto; }
.edit-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 16px; font-weight: 600; }
.steps-editor { width: 100%; }
.step-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.step-index { min-width: 28px; text-align: center; }
</style>
