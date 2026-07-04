package com.shop.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shop.admin.security.RequirePermission;
import com.shop.admin.vo.PageQueryVo;
import com.shop.common.Result;
import com.shop.entity.OrderEntity;
import com.shop.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 后台订单管理控制器
 * @since 1.0.0
 */
@Tag(name = "订单管理", description = "订单管理接口")
@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    /**
     * 分页查询所有订单
     *
     * @param queryVo 查询参数
     * @return 订单分页数据
     */
    @RequirePermission("order:query")
    @Operation(summary = "分页查询所有订单")
    @GetMapping
    public Result<IPage<OrderEntity>> list(PageQueryVo queryVo) {
        Page<OrderEntity> page = new Page<>(queryVo.getPageNum(), queryVo.getPageSize());
        return Result.success(orderService.page(page));
    }

    /**
     * 获取订单详情
     *
     * @param id 订单ID
     * @return 订单详情
     */
    @RequirePermission("order:query")
    @Operation(summary = "获取订单详情")
    @GetMapping("/{id}")
    public Result<OrderEntity> getById(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }

    /**
     * 更新订单状态
     *
     * @param id 订单ID
     * @param params 包含status字段
     * @return 更新结果
     */
    @RequirePermission("order:update")
    @Operation(summary = "更新订单状态")
    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, Integer> params) {
        return orderService.updateOrderStatus(id, params.get("status"));
    }
}
