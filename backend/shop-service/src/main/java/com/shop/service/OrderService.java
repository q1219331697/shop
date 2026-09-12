package com.shop.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.shop.common.Result;
import com.shop.entity.OrderEntity;

/**
 * 订单服务接口
 *
 * @author shop
 * @since 1.0.0
 */
public interface OrderService extends IService<OrderEntity> {

    /**
     * 创建订单
     * @param order 订单信息
     * @return 创建结果
     */
    Result<OrderEntity> createOrder(OrderEntity order);

    /**
     * 获取订单详情
     * @param id 订单ID
     * @return 订单详情
     */
    Result<OrderEntity> getOrderById(Long id);

    /**
     * 获取用户订单列表
     * @param userId 用户ID
     * @param current 当前页
     * @param size 每页大小
     * @return 订单列表
     */
    Result<IPage<OrderEntity>> getUserOrders(Long userId, Long current, Long size);

    /**
     * 取消订单
     * @param id 订单ID
     * @return 取消结果
     */
    Result<Void> cancelOrder(Long id);

    /**
     * 更新订单状态
     * @param id 订单ID
     * @param status 状态
     * @return 更新结果
     */
    Result<Void> updateOrderStatus(Long id, Integer status);
}
