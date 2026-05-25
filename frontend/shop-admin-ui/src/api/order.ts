/**
 * 订单管理接口
 */
import { get, put } from '@/utils/http'
import type { PageParams, PageResult } from './types'
import type { IdType } from '@/components/CrudTable/types'

/** 订单信息 */
export interface OrderItem {
  id: number
  orderNo: string
  userId: number
  username: string
  totalAmount: number
  payAmount: number
  freightAmount: number
  status: number
  payTime: string
  deliveryTime: string
  receiveTime: string
  createTime: string
  items: OrderProduct[]
}

/** 订单商品 */
export interface OrderProduct {
  productId: number
  productName: string
  productImage: string
  price: number
  quantity: number
}

/** 订单列表 */
export function getOrderList(
  params: PageParams & {
    orderNo?: string
    status?: number
    startTime?: string
    endTime?: string
  },
) {
  return get<PageResult<OrderItem>>('/order', params)
}

/** 订单详情 */
export function getOrderDetail(id: IdType) {
  return get<OrderItem>(`/order/${id}`)
}

/** 发货 */
export function deliverOrder(id: IdType, data: { expressNo: string; expressCompany: string }) {
  return put(`/order/${id}/deliver`, data)
}

/** 关闭订单 */
export function closeOrder(id: IdType) {
  return put(`/order/${id}/close`)
}
