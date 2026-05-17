package com.shop.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.common.Result;
import com.shop.entity.OrderEntity;
import com.shop.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 后台订单管理控制器
 * @since 1.0.0
 */
@Tag(name = "后台-订单管理", description = "后台订单管理接口")
@RestController
@RequestMapping("/admin/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    /**
     * 分页查询所有订单
     *
     * @param current 当前页码
     * @param size 每页条数
     * @return 订单分页数据
     */
    @Operation(summary = "分页查询所有订单")
    @GetMapping("/list")
    public Result<IPage<OrderEntity>> list(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size) {
        return Result.success(orderService.page(
                new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(current, size)));
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
     * 更新订单状态
     *
     * @param id 订单ID
     * @param status 订单状态
     * @return 更新结果
     */
    @Operation(summary = "更新订单状态")
    @PutMapping("/status/{id}")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        return orderService.updateOrderStatus(id, status);
    }
}
