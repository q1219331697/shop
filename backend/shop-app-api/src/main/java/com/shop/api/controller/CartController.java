package com.shop.api.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shop.common.Result;
import com.shop.entity.CartEntity;
import com.shop.service.CartService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 购物车控制器
 *
 * @author shop
 * @since 1.0.0
 */
@Tag(name = "购物车管理", description = "购物车相关接口")
@RestController
@RequestMapping("/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    /**
     * 获取用户购物车列表
     *
     * @param userId 用户ID
     * @return 购物车列表
     */
    @Operation(summary = "获取用户购物车列表")
    @GetMapping("/user/{userId}")
    public Result<List<CartEntity>> list(@PathVariable Long userId) {
        return cartService.getUserCart(userId);
    }

    /**
     * 添加商品到购物车
     *
     * @param cart 购物车信息
     * @return 操作结果
     */
    @Operation(summary = "添加商品到购物车")
    @PostMapping
    public Result<Void> add(@RequestBody CartEntity cart) {
        return cartService.addToCart(cart);
    }

    /**
     * 更新购物车商品数量
     *
     * @param id 购物车项ID
     * @param cart 购物车信息
     * @return 操作结果
     */
    @Operation(summary = "更新购物车商品数量")
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody CartEntity cart) {
        cart.setId(id);
        return cartService.updateCartItem(cart);
    }

    /**
     * 删除购物车商品
     *
     * @param id 购物车项ID
     * @return 操作结果
     */
    @Operation(summary = "删除购物车商品")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return cartService.deleteCartItem(id);
    }

    /**
     * 清空用户购物车
     *
     * @param userId 用户ID
     * @return 操作结果
     */
    @Operation(summary = "清空用户购物车")
    @DeleteMapping("/user/{userId}")
    public Result<Void> clear(@PathVariable Long userId) {
        return cartService.clearCart(userId);
    }
}
