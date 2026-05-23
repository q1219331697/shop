/**
 * 商品管理接口
 */
import { get, post, put, del } from '@/utils/request'
import type { PageParams, PageResult } from './types'

/** 商品信息 */
export interface ProductItem {
  id: number
  name: string
  categoryId: number
  categoryName: string
  price: number
  originalPrice: number
  stock: number
  image: string
  description: string
  status: number
  createTime: string
}

/** 商品分类 */
export interface CategoryItem {
  id: number
  name: string
  parentId: number
  sort: number
  icon: string
  children?: CategoryItem[]
}

/** 商品列表 */
export function getProductList(
  params: PageParams & {
    keyword?: string
    categoryId?: number
    status?: number
  },
) {
  return get<PageResult<ProductItem>>('/product', params)
}

/** 商品详情 */
export function getProductDetail(id: number) {
  return get<ProductItem>(`/product/${id}`)
}

/** 新增商品 */
export function createProduct(data: Partial<ProductItem>) {
  return post('/product', data)
}

/** 编辑商品 */
export function updateProduct(id: number, data: Partial<ProductItem>) {
  return put(`/product/${id}`, data)
}

/** 删除商品 */
export function deleteProduct(id: number) {
  return del(`/product/${id}`)
}

/** 分类树 */
export function getCategoryTree() {
  return get<CategoryItem[]>('/product/category/tree')
}
