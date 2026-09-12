package com.shop.service.impl;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;
import com.shop.entity.OrderEntity;
import com.shop.entity.OrderItemEntity;
import com.shop.entity.ProductEntity;
import com.shop.mapper.OrderItemMapper;
import com.shop.service.OrderItemService;
import com.shop.service.OrderService;
import com.shop.service.ProductService;

import lombok.extern.slf4j.Slf4j;

/**
 * 订单详情服务实现类
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Service
public class OrderItemServiceImpl extends ServiceImpl<OrderItemMapper, OrderItemEntity> implements OrderItemService {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductService productService;

    @Override
    public Result<List<OrderItemEntity>> getOrderItems(Long orderId) {
        log.info("查询订单详情列表, orderId: {}", orderId);
        // 验证订单是否存在
        OrderEntity order = orderService.getById(orderId);
        if (order == null) {
            log.warn("查询订单详情列表失败, 订单不存在, orderId: {}", orderId);
            return Result.error(ResultCodeEnum.ORDER_NOT_EXIST, "订单不存在");
        }

        LambdaQueryWrapper<OrderItemEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OrderItemEntity::getOrderId, orderId);
        List<OrderItemEntity> list = this.list(wrapper);
        log.info("查询订单详情列表成功, orderId: {}, 详情数量: {}", orderId, list.size());
        return Result.success(list);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> addOrderItem(OrderItemEntity orderItem) {
        log.info("添加订单详情, orderId: {}, productId: {}, quantity: {}",
                orderItem.getOrderId(), orderItem.getProductId(), orderItem.getQuantity());
        // 验证订单是否存在
        OrderEntity order = orderService.getById(orderItem.getOrderId());
        if (order == null) {
            log.warn("添加订单详情失败, 订单不存在, orderId: {}", orderItem.getOrderId());
            return Result.error(ResultCodeEnum.ORDER_NOT_EXIST, "订单不存在");
        }

        // 验证商品是否存在
        ProductEntity product = productService.getById(orderItem.getProductId());
        if (product == null) {
            log.warn("添加订单详情失败, 商品不存在, productId: {}", orderItem.getProductId());
            return Result.error(ResultCodeEnum.PRODUCT_NOT_EXIST, "商品不存在");
        }

        // 设置商品信息
        orderItem.setProductName(product.getName());
        orderItem.setProductImage(product.getImage());
        orderItem.setProductPrice(product.getPrice());

        // 计算小计金额
        if (orderItem.getTotalPrice() == null) {
            BigDecimal totalPrice = product.getPrice().multiply(new BigDecimal(orderItem.getQuantity()));
            orderItem.setTotalPrice(totalPrice);
        }

        boolean success = this.save(orderItem);
        if (success) {
            log.info("添加订单详情成功, orderItemId: {}, orderId: {}, productId: {}",
                    orderItem.getId(), orderItem.getOrderId(), orderItem.getProductId());
        } else {
            log.error("添加订单详情失败, orderId: {}, productId: {}", orderItem.getOrderId(), orderItem.getProductId());
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "添加订单详情失败");
    }

    @Override
    public Result<OrderItemEntity> getOrderItemById(Long id) {
        log.info("查询订单详情, orderItemId: {}", id);
        OrderItemEntity orderItem = this.getById(id);
        if (orderItem == null) {
            log.warn("查询订单详情失败, 订单详情不存在, orderItemId: {}", id);
            return Result.error(ResultCodeEnum.ORDER_ITEM_NOT_EXIST, "订单详情不存在");
        }
        log.info("查询订单详情成功, orderItemId: {}", id);
        return Result.success(orderItem);
    }
}
