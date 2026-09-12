package com.shop.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;
import com.shop.entity.OrderEntity;
import com.shop.enums.OrderStatusEnum;
import com.shop.mapper.OrderMapper;
import com.shop.service.OrderService;

import lombok.extern.slf4j.Slf4j;

/**
 * 订单服务实现类
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Service
public class OrderServiceImpl extends ServiceImpl<OrderMapper, OrderEntity> implements OrderService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<OrderEntity> createOrder(OrderEntity order) {
        log.info("创建订单, userId: {}, totalAmount: {}", order.getUserId(), order.getTotalAmount());
        // 生成订单号
        String orderNo = generateOrderNo();
        order.setOrderNo(orderNo);

        // 设置初始状态为待付款
        order.setStatus(OrderStatusEnum.PENDING_PAYMENT.getCode());

        boolean success = this.save(order);
        if (success) {
            log.info("创建订单成功, orderId: {}, orderNo: {}", order.getId(), orderNo);
        } else {
            log.error("创建订单失败, userId: {}", order.getUserId());
        }
        return success ? Result.success(order) : Result.error(ResultCodeEnum.OPERATION_FAILED, "创建订单失败");
    }

    @Override
    public Result<OrderEntity> getOrderById(Long id) {
        log.info("查询订单详情, orderId: {}", id);
        OrderEntity order = this.getById(id);
        if (order == null) {
            log.warn("查询订单详情失败, 订单不存在, orderId: {}", id);
            return Result.error(ResultCodeEnum.ORDER_NOT_EXIST, "订单不存在");
        }
        log.info("查询订单详情成功, orderId: {}, orderNo: {}", id, order.getOrderNo());
        return Result.success(order);
    }

    @Override
    public Result<IPage<OrderEntity>> getUserOrders(Long userId, Long current, Long size) {
        log.info("查询用户订单列表, userId: {}, current: {}, size: {}", userId, current, size);
        Page<OrderEntity> page = new Page<>(current, size);
        LambdaQueryWrapper<OrderEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OrderEntity::getUserId, userId);
        wrapper.orderByDesc(OrderEntity::getCreateTime);
        IPage<OrderEntity> result = this.page(page, wrapper);
        log.info("查询用户订单列表成功, userId: {}, 总数: {}", userId, result.getTotal());
        return Result.success(result);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> cancelOrder(Long id) {
        log.info("取消订单, orderId: {}", id);
        OrderEntity order = this.getById(id);
        if (order == null) {
            log.warn("取消订单失败, 订单不存在, orderId: {}", id);
            return Result.error(ResultCodeEnum.ORDER_NOT_EXIST, "订单不存在");
        }

        // 只有待付款和待发货的订单可以取消
        if (order.getStatus() > OrderStatusEnum.PENDING_SHIPMENT.getCode()) {
            log.warn("取消订单失败, 当前订单状态不允许取消, orderId: {}, status: {}", id, order.getStatus());
            return Result.error(ResultCodeEnum.ORDER_STATUS_ERROR, "当前订单状态不允许取消");
        }

        order.setStatus(OrderStatusEnum.CANCELLED.getCode()); // 已取消
        boolean success = this.updateById(order);
        if (success) {
            log.info("取消订单成功, orderId: {}, orderNo: {}", id, order.getOrderNo());
        } else {
            log.error("取消订单失败, orderId: {}", id);
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "取消订单失败");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> updateOrderStatus(Long id, Integer status) {
        log.info("更新订单状态, orderId: {}, status: {}", id, status);
        OrderEntity order = this.getById(id);
        if (order == null) {
            log.warn("更新订单状态失败, 订单不存在, orderId: {}", id);
            return Result.error(ResultCodeEnum.ORDER_NOT_EXIST, "订单不存在");
        }

        // 验证状态流转是否合法
        if (!isValidStatusTransition(order.getStatus(), status)) {
            log.warn("更新订单状态失败, 订单状态流转不合法, orderId: {}, oldStatus: {}, newStatus: {}", id, order.getStatus(), status);
            return Result.error(ResultCodeEnum.ORDER_STATUS_ERROR, "订单状态流转不合法");
        }

        order.setStatus(status);
        boolean success = this.updateById(order);
        if (success) {
            log.info("更新订单状态成功, orderId: {}, orderNo: {}, status: {}", id, order.getOrderNo(), status);
        } else {
            log.error("更新订单状态失败, orderId: {}", id);
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "更新订单状态失败");
    }

    /**
     * 生成订单号
     * @return 订单号
     */
    private String generateOrderNo() {
        return "ORD" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
    }

    /**
     * 验证订单状态流转是否合法
     * @param currentStatus 当前状态
     * @param newStatus 新状态
     * @return 是否合法
     */
    private boolean isValidStatusTransition(Integer currentStatus, Integer newStatus) {
        if (currentStatus.equals(newStatus)) {
            return false;
        }

        // 已取消的订单不能更改状态
        if (OrderStatusEnum.CANCELLED.getCode().equals(currentStatus)) {
            return false;
        }

        // 已完成的订单只能退款
        if (OrderStatusEnum.COMPLETED.getCode().equals(currentStatus)
                && !OrderStatusEnum.REFUNDING.getCode().equals(newStatus)) {
            return false;
        }

        // 已退款的订单不能更改状态
        if (OrderStatusEnum.REFUNDED.getCode().equals(currentStatus)) {
            return false;
        }

        return true;
    }
}
