package com.shop.controller;

import com.shop.common.Result;
import com.shop.entity.OrderItemEntity;
import com.shop.service.OrderItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 订单详情控制器
 * @since 1.0.0
 */
@Tag(name = "订单详情管理", description = "订单详情相关接口")
@RestController
@RequestMapping("/order-item")
public class OrderItemController {

    @Autowired
    private OrderItemService orderItemService;

    /**
     * 获取订单详情列表
     */
    @Operation(summary = "获取订单详情列表")
    @GetMapping("/list/{orderId}")
    public Result<List<OrderItemEntity>> list(@PathVariable Long orderId) {
        return orderItemService.getOrderItems(orderId);
    }

    /**
     * 添加订单详情
     */
    @Operation(summary = "添加订单详情")
    @PostMapping("/add")
    public Result<Void> add(@RequestBody OrderItemEntity orderItem) {
        return orderItemService.addOrderItem(orderItem);
    }

    /**
     * 获取订单详情
     */
    @Operation(summary = "获取订单详情")
    @GetMapping("/{id}")
    public Result<OrderItemEntity> getById(@PathVariable Long id) {
        return orderItemService.getOrderItemById(id);
    }
}
