package com.shop.api.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.common.Result;
import com.shop.entity.OrderEntity;
import com.shop.service.OrderService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 订单控制器
 *
 * @author shop
 * @since 1.0.0
 */
@Tag(name = "订单管理", description = "订单相关接口")
@RestController
@RequestMapping("/order")
public class OrderController {

    private static final Long DEFAULT_PAGE_SIZE = 10L;

    @Autowired
    private OrderService orderService;

    /**
     * 创建订单
     *
     * @param order 订单信息
     * @return 创建的订单
     */
    @Operation(summary = "创建订单")
    @PostMapping
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
     * @param params 查询参数：pageNum, pageSize
     * @return 订单分页列表
     */
    @Operation(summary = "获取用户订单列表")
    @GetMapping("/user/{userId}")
    public Result<IPage<OrderEntity>> list(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> params) {
        Long pageNum = params.get("pageNum") != null
                ? Long.valueOf(params.get("pageNum").toString()) : 1L;
        Long pageSize = params.get("pageSize") != null
                ? Long.valueOf(params.get("pageSize").toString()) : DEFAULT_PAGE_SIZE;
        return orderService.getUserOrders(userId, pageNum, pageSize);
    }

    /**
     * 取消订单
     *
     * @param id 订单ID
     * @return 操作结果
     */
    @Operation(summary = "取消订单")
    @PutMapping("/{id}/cancel")
    public Result<Void> cancel(@PathVariable Long id) {
        return orderService.cancelOrder(id);
    }

    /**
     * 更新订单状态
     *
     * @param id 订单ID
     * @param params 包含status字段
     * @return 操作结果
     */
    @Operation(summary = "更新订单状态")
    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id,
                                     @RequestBody Map<String, Integer> params) {
        return orderService.updateOrderStatus(id, params.get("status"));
    }
}
