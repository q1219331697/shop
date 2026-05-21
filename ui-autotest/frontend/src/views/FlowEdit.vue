<template>
  <div class="flow-edit">
    <el-card shadow="hover">
      <template #header>
        <div class="edit-header">
          <span class="card-title">{{ isEdit ? '编辑流程' : '新建流程' }}</span>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width:800px;">
        <el-form-item label="流程名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入流程名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="流程描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="draft">草稿</el-radio>
            <el-radio value="active">启用</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 流程步骤编排 -->
        <el-form-item label="流程步骤">
          <div class="flow-steps-editor">
            <div v-for="(step, idx) in form.steps" :key="idx" class="flow-step-item">
              <div class="step-left">
                <el-icon class="drag-handle" :size="20"><Rank /></el-icon>
                <el-tag type="primary" effect="dark" size="small" round>{{ idx + 1 }}</el-tag>
              </div>
              <div class="step-content">
                <el-row :gutter="10">
                  <el-col :span="8">
                    <el-input v-model="step.step_name" placeholder="步骤名称" />
                  </el-col>
                  <el-col :span="5">
                    <el-select v-model="step.step_type" placeholder="类型" style="width:100%">
                      <el-option label="执行案例" value="case" />
                      <el-option label="操作步骤" value="action" />
                      <el-option label="断言验证" value="assert" />
                    </el-select>
                  </el-col>
                  <el-col :span="7">
                    <el-select v-model="step.case_id" placeholder="关联案例(可选)" clearable filterable style="width:100%">
                      <el-option v-for="c in caseList" :key="c.id" :label="c.name" :value="c.id" />
                    </el-select>
                  </el-col>
                  <el-col :span="4">
                    <el-input-number v-model="step.wait_seconds" :min="0" :max="60" placeholder="等待(s)" style="width:100%" />
                  </el-col>
                </el-row>
                <el-row :gutter="10" style="margin-top:6px" v-if="step.step_type==='assert'">
                  <el-col :span="24">
                    <el-input v-model="step.condition_expr" placeholder="断言条件表达式" />
                  </el-col>
                </el-row>
              </div>
              <div class="step-actions">
                <el-button :icon="Top" circle size="small" :disabled="idx===0" @click="moveStep(idx,-1)" />
                <el-button :icon="Bottom" circle size="small" :disabled="idx===form.steps.length-1" @click="moveStep(idx,1)" />
                <el-button type="danger" :icon="Delete" circle size="small" @click="removeStep(idx)" />
              </div>
            </div>

            <!-- 连接线 -->
            <div v-if="form.steps.length" class="step-connector">
              <div class="connector-line"></div>
            </div>

            <el-button type="primary" plain @click="addStep" style="margin-top:8px;width:100%">
              <el-icon><Plus /></el-icon>添加步骤
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveFlow" :loading="saving">保存</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { flowApi, caseApi } from '@/api'
import { ElMessage } from 'element-plus'
import { Delete, Top, Bottom } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const formRef = ref(null)
const saving = ref(false)
const caseList = ref([])

const form = ref({
  name: '',
  description: '',
  status: 'draft',
  steps: [],
})

const rules = {
  name: [{ required: true, message: '请输入流程名称', trigger: 'blur' }],
}

const addStep = () => {
  form.value.steps.push({
    step_name: '',
    step_type: 'case',
    case_id: '',
    wait_seconds: 0,
    condition_expr: '',
  })
}

const removeStep = (idx) => {
  form.value.steps.splice(idx, 1)
}

const moveStep = (idx, dir) => {
  const steps = form.value.steps
  const target = idx + dir
  const temp = steps[idx]
  steps[idx] = steps[target]
  steps[target] = temp
  form.value.steps = [...steps]
}

const loadCaseList = async () => {
  try {
    const res = await caseApi.getList({ page: 1, pageSize: 200 })
    caseList.value = res.data.list
  } catch (e) { console.error(e) }
}

const loadFlow = async (id) => {
  try {
    const res = await flowApi.getDetail(id)
    form.value = {
      name: res.data.name,
      description: res.data.description || '',
      status: res.data.status || 'draft',
      steps: (res.data.steps || []).map(s => ({
        step_name: s.step_name || '',
        step_type: s.step_type || 'case',
        case_id: s.case_id || '',
        wait_seconds: s.wait_seconds || 0,
        condition_expr: s.condition_expr || '',
      })),
    }
  } catch (e) {
    ElMessage.error('加载流程失败')
  }
}

const saveFlow = async () => {
  try { await formRef.value.validate() } catch { return }
  saving.value = true
  try {
    if (isEdit.value) {
      await flowApi.update(route.params.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await flowApi.create(form.value)
      ElMessage.success('创建成功')
    }
    router.push('/flows')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCaseList()
  if (isEdit.value) loadFlow(route.params.id)
})
</script>

<style scoped>
.flow-edit { max-width: 1400px; margin: 0 auto; }
.edit-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 16px; font-weight: 600; }
.flow-steps-editor { width: 100%; }
.flow-step-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px; margin-bottom: 8px;
  background: #f8f9fb; border-radius: 8px;
  border: 1px solid #e8ecf1; transition: all 0.2s;
}
.flow-step-item:hover { border-color: #409EFF; box-shadow: 0 2px 8px rgba(64,158,255,0.1); }
.step-left { display: flex; align-items: center; gap: 8px; padding-top: 6px; }
.drag-handle { cursor: grab; color: #999; }
.step-content { flex: 1; }
.step-actions { display: flex; flex-direction: column; gap: 4px; padding-top: 4px; }
.step-connector { text-align: center; padding: 4px 0; }
.connector-line { width: 2px; height: 16px; background: #dcdfe6; margin: 0 auto; }
</style>
