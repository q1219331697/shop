<template>
  <div class="exec-list">
    <el-card shadow="hover">
      <template #header>
        <div class="edit-header">
          <span class="card-title">执行记录</span>
          <el-button @click="loadExecs"><el-icon><Refresh /></el-icon>刷新</el-button>
        </div>
      </template>

      <el-table :data="execs" stripe v-loading="loading" style="width:100%">
        <el-table-column prop="name" label="执行名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="row.type==='flow'?'warning':''" size="small">
              {{ row.type==='flow'?'流程':'案例' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="statusType(row.status)" size="small" effect="dark">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="步骤结果" width="140" align="center">
          <template #default="{row}">
            <template v-if="row.steps && row.steps.length">
              <el-tag type="success" size="small">{{ row.steps.filter(s=>s.status==='passed').length }} 通过</el-tag>
              <el-tag type="danger" size="small" style="margin-left:4px">{{ row.steps.filter(s=>s.status==='failed').length }} 失败</el-tag>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="started_at" label="开始时间" width="170" />
        <el-table-column prop="finished_at" label="结束时间" width="170" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" @click="showDetail(row)"><el-icon><View /></el-icon>详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-area">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
          :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @size-change="loadExecs" @current-change="loadExecs" />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="执行详情" width="700px">
      <div v-if="currentExec">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="执行名称">{{ currentExec.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ currentExec.type==='flow'?'流程':'案例' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(currentExec.status)">{{ statusLabel(currentExec.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ currentExec.started_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ currentExec.finished_at || '-' }}</el-descriptions-item>
        </el-descriptions>

        <h4 style="margin:16px 0 8px">步骤执行结果</h4>
        <el-table :data="currentExec.steps||[]" border size="small">
          <el-table-column type="index" width="50" label="#" />
          <el-table-column prop="step_name" label="步骤名称" min-width="150" />
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="{row}">
              <el-tag :type="row.status==='passed'?'success':'danger'" size="small">{{ row.status==='passed'?'通过':'失败' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="耗时(s)" width="80" align="center">
            <template #default="{row}">{{ row.duration || 0 }}</template>
          </el-table-column>
          <el-table-column prop="error_msg" label="错误信息" min-width="150">
            <template #default="{row}">{{ row.error_msg || '-' }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { execApi } from '@/api'

const execs = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const detailVisible = ref(false)
const currentExec = ref(null)

const statusType = (s) => ({ pending:'info', running:'warning', passed:'success', failed:'danger' }[s]||'info')
const statusLabel = (s) => ({ pending:'等待中', running:'执行中', passed:'通过', failed:'失败' }[s]||s)

const loadExecs = async () => {
  loading.value = true
  try {
    const res = await execApi.getList({ page: page.value, pageSize: pageSize.value })
    execs.value = res.data.list
    total.value = res.data.total
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const showDetail = (row) => {
  currentExec.value = row
  detailVisible.value = true
}

onMounted(() => { loadExecs() })
</script>

<style scoped>
.exec-list { max-width: 1400px; margin: 0 auto; }
.edit-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 16px; font-weight: 600; }
.pagination-area { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
