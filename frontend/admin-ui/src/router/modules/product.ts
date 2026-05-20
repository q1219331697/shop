/**
 * 商品管理路由
 */
import type { RouteRecordRaw } from 'vue-router'

const productRoutes: RouteRecordRaw = {
  path: '/product',
  name: 'Product',
  redirect: '/product/list',
  meta: { title: '商品管理', icon: 'Goods' },
  children: [
    {
      path: 'list',
      name: 'ProductList',
      component: () => import('@/views/product/list/index.vue'),
      meta: { title: '商品列表', icon: 'List' },
    },
    {
      path: 'category',
      name: 'ProductCategory',
      component: () => import('@/views/product/category/index.vue'),
      meta: { title: '分类管理', icon: 'Menu' },
    },
  ],
}

export default productRoutes
