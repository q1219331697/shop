<template>
  <div class="flow-list">
    <el-card shadow="hover">
      <div class="filter-bar">
        <div class="filter-left">
          <el-input v-model="keyword" placeholder="搜索流程名称" clearable style="width:260px" @keyup.enter="loadFlows">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" @click="loadFlows"><el-icon><Search /></el-icon>查询</el-button>
        </div>
        <div class="filter-right">
          <el-button type="primary" @click="$router.push('/flows/create')"><el-icon><Plus /></el-icon>新建流程</el-button>
        </div>
      </div>

      <el-table :data="flows" stripe v-loading="loading" style="width:100%">
        <el-table-column prop="name" label="流程名称" min-width="200" show-overflow-tooltip>
          <template #default="{row}">
            <el-link type="primary" @click="$router.push('/flows/'+row.id+'/edit')">{{ row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="row.status==='active'?'success':row.status==='draft'?'info':'danger'" size="small">
              {{ row.status==='active'?'启用':row.status==='draft'?'草稿':'禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="步骤数" width="80" align="center">
          <template #default="{row}">{{ (row.steps||[]).length }}</template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" @click="$router.push('/flows/'+row.id+'/edit')"><el-icon><Edit /></el-icon>编辑</el-button>
            <el-button link type="success" @click="execFlow(row)"><el-icon><VideoPlay /></el-icon>执行</el-button>
            <el-popconfirm title="确定删除该流程？" @confirm="deleteFlow(row.id)">
              <template #reference>
                <el-button link type="danger"><el-icon><Delete /></el-icon>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-area">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
          :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @size-change="loadFlows" @current-change="loadFlows" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { flowApi, execApi } from '@/api'
import { ElMessage } from 'element-plus'

const flows = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const keyword = ref('')

const loadFlows = async () => {
  loading.value = true
  try {
    const res = await flowApi.getList({ page: page.value, pageSize: pageSize.value, keyword: keyword.value })
    flows.value = res.data.list
    total.value = res.data.total
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const deleteFlow = async (id) => {
  try {
    await flowApi.delete(id)
    ElMessage.success('删除成功')
    loadFlows()
  } catch (e) { console.error(e) }
}

const execFlow = async (row) => {
  try {
    await execApi.create({ name: '执行流程: ' + row.name, type: 'flow', target_ids: [row.id] })
    ElMessage.success('已提交执行任务')
  } catch (e) { console.error(e) }
}

onMounted(() => { loadFlows() })
</script>

<style scoped>
.flow-list { max-width: 1400px; margin: 0 auto; }
.filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.filter-left { display: flex; align-items: center; gap: 10px; }
.filter-right { display: flex; align-items: center; gap: 10px; }
.pagination-area { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
