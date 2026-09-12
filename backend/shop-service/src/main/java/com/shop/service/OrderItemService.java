package com.shop.service;

import java.util.List;

import com.baomidou.mybatisplus.extension.service.IService;
import com.shop.common.Result;
import com.shop.entity.OrderItemEntity;

/**
 * 订单详情服务接口
 *
 * @author shop
 * @since 1.0.0
 */
public interface OrderItemService extends IService<OrderItemEntity> {

    /**
     * 获取订单详情列表
     * @param orderId 订单ID
     * @return 订单详情列表
     */
    Result<List<OrderItemEntity>> getOrderItems(Long orderId);

    /**
     * 添加订单详情
     * @param orderItem 订单详情
     * @return 添加结果
     */
    Result<Void> addOrderItem(OrderItemEntity orderItem);

    /**
     * 获取订单详情
     * @param id 订单详情ID
     * @return 订单详情
     */
    Result<OrderItemEntity> getOrderItemById(Long id);
}
