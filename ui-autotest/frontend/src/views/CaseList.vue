<template>
  <div class="case-list">
    <el-card shadow="hover">
      <!-- 搜索筛选栏 -->
      <div class="filter-bar">
        <div class="filter-left">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索案例名称/描述"
            clearable
            style="width: 260px"
            @keyup.enter="loadCases"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="filters.module" placeholder="模块" clearable style="width: 140px" @change="loadCases">
            <el-option label="登录模块" value="登录模块" />
            <el-option label="商品模块" value="商品模块" />
            <el-option label="订单模块" value="订单模块" />
            <el-option label="支付模块" value="支付模块" />
            <el-option label="用户模块" value="用户模块" />
            <el-option label="AI生成" value="AI生成" />
          </el-select>
          <el-select v-model="filters.priority" placeholder="优先级" clearable style="width: 120px" @change="loadCases">
            <el-option label="P0-紧急" value="P0" />
            <el-option label="P1-高" value="P1" />
            <el-option label="P2-中" value="P2" />
            <el-option label="P3-低" value="P3" />
          </el-select>
          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px" @change="loadCases">
            <el-option label="草稿" value="draft" />
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
          <el-button type="primary" @click="loadCases">
            <el-icon><Search /></el-icon>查询
          </el-button>
        </div>
        <div class="filter-right">
          <el-button type="primary" @click="$router.push('/cases/create')">
            <el-icon><Plus /></el-icon>新建案例
          </el-button>
          <el-button type="danger" :disabled="!selectedIds.length" @click="batchDelete">
            <el-icon><Delete /></el-icon>批量删除
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table
        :data="cases"
        stripe
        @selection-change="handleSelectionChange"
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="案例名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push('/cases/' + row.id + '/edit')">
              {{ row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.module || '未分类' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="priorityTagType(row.priority)" size="small" effect="dark">
              {{ row.priority }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="steps" label="步骤数" width="80" align="center">
          <template #default="{ row }">
            {{ parseSteps(row.steps).length }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push('/cases/' + row.id + '/edit')">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button link type="success" @click="execCase(row)">
              <el-icon><VideoPlay /></el-icon>执行
            </el-button>
            <el-popconfirm title="确定删除该案例？" @confirm="deleteCase(row.id)">
              <template #reference>
                <el-button link type="danger">
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-area">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadCases"
          @current-change="loadCases"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { caseApi, execApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const cases = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selectedIds = ref([])
const filters = ref({
  keyword: '',
  module: '',
  priority: '',
  status: '',
})

const loadCases = async () => {
  loading.value = true
  try {
    const res = await caseApi.getList({
      page: page.value,
      pageSize: pageSize.value,
      ...filters.value,
    })
    cases.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const parseSteps = (steps) => {
  if (!steps) return []
  try {
    return typeof steps === 'string' ? JSON.parse(steps) : steps
  } catch {
    return []
  }
}

const handleSelectionChange = (rows) => {
  selectedIds.value = rows.map((r) => r.id)
}

const priorityTagType = (p) => {
  const map = { P0: 'danger', P1: 'warning', P2: '', P3: 'info' }
  return map[p] || 'info'
}

const statusTagType = (s) => {
  const map = { draft: 'info', active: 'success', disabled: 'danger' }
  return map[s] || 'info'
}

const statusLabel = (s) => {
  const map = { draft: '草稿', active: '启用', disabled: '禁用' }
  return map[s] || s
}

const deleteCase = async (id) => {
  try {
    await caseApi.delete(id)
    ElMessage.success('删除成功')
    loadCases()
  } catch (e) {
    console.error(e)
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm('确定删除选中的 ' + selectedIds.value.length + ' 条案例？', '批量删除', { type: 'warning' })
    await caseApi.batchDelete(selectedIds.value)
    ElMessage.success('批量删除成功')
    loadCases()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

const execCase = async (row) => {
  try {
    await execApi.create({
      name: '执行案例: ' + row.name,
      type: 'case',
      target_ids: [row.id],
    })
    ElMessage.success('已提交执行任务')
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadCases()
})
</script>

<style scoped>
.case-list {
  max-width: 1400px;
  margin: 0 auto;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-area {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
