import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '仪表盘' },
  },
  {
    path: '/cases',
    name: 'Cases',
    component: () => import('@/views/CaseList.vue'),
    meta: { title: '测试案例' },
  },
  {
    path: '/cases/create',
    name: 'CaseCreate',
    component: () => import('@/views/CaseEdit.vue'),
    meta: { title: '创建案例' },
  },
  {
    path: '/cases/:id/edit',
    name: 'CaseEdit',
    component: () => import('@/views/CaseEdit.vue'),
    meta: { title: '编辑案例' },
  },
  {
    path: '/flows',
    name: 'Flows',
    component: () => import('@/views/FlowList.vue'),
    meta: { title: '测试流程' },
  },
  {
    path: '/flows/create',
    name: 'FlowCreate',
    component: () => import('@/views/FlowEdit.vue'),
    meta: { title: '创建流程' },
  },
  {
    path: '/flows/:id/edit',
    name: 'FlowEditPage',
    component: () => import('@/views/FlowEdit.vue'),
    meta: { title: '编辑流程' },
  },
  {
    path: '/executions',
    name: 'Executions',
    component: () => import('@/views/ExecutionList.vue'),
    meta: { title: '执行记录' },
  },
  {
    path: '/ai',
    name: 'AI',
    component: () => import('@/views/AIGenerate.vue'),
    meta: { title: 'AI生成' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  document.title = (to.meta.title || 'AI UI自动化测试') + ' - 测试管理平台'
  next()
})

export default router
