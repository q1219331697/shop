package com.shop.api.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.common.Result;
import com.shop.entity.OrderEntity;
import com.shop.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 订单控制器
 * @since 1.0.0
 */
@Tag(name = "订单管理", description = "订单相关接口")
@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    /**
     * 创建订单
     *
     * @param order 订单信息
     * @return 创建的订单
     */
    @Operation(summary = "创建订单")
    @PostMapping("/create")
    public Result<OrderEntity> create(@RequestBody OrderEntity order) {
        return orderService.createOrder(order);
    }

    /**
     * 获取订单详情
     *
     * @param id 订单ID
     * @return 订单详情
     */
    @Operation(summary = "获取订单详情")
    @GetMapping("/{id}")
    public Result<OrderEntity> getById(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }

    /**
     * 获取用户订单列表
     *
     * @param userId 用户ID
     * @param current 当前页码
     * @param size 每页数量
     * @return 订单分页列表
     */
    @Operation(summary = "获取用户订单列表")
    @GetMapping("/list/{userId}")
    public Result<IPage<OrderEntity>> list(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size) {
        return orderService.getUserOrders(userId, current, size);
    }

    /**
     * 取消订单
     *
     * @param id 订单ID
     * @return 操作结果
     */
    @Operation(summary = "取消订单")
    @PutMapping("/cancel/{id}")
    public Result<Void> cancel(@PathVariable Long id) {
        return orderService.cancelOrder(id);
    }

    /**
     * 更新订单状态
     *
     * @param id 订单ID
     * @param status 订单状态
     * @return 操作结果
     */
    @Operation(summary = "更新订单状态")
    @PutMapping("/status/{id}")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        return orderService.updateOrderStatus(id, status);
    }
}
