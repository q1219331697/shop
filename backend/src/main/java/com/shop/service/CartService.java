package com.shop.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.shop.common.Result;
import com.shop.entity.CartEntity;

import java.util.List;

/**
 * 购物车服务接口
 * @since 1.0.0
 */
public interface CartService extends IService<CartEntity> {

    /**
     * 获取用户购物车列表
     * @param userId 用户ID
     * @return 购物车列表
     */
    Result<List<CartEntity>> getUserCart(Long userId);

    /**
     * 添加商品到购物车
     * @param cart 购物车项
     * @return 添加结果
     */
    Result<Void> addToCart(CartEntity cart);

    /**
     * 更新购物车商品数量
     * @param cart 购物车项
     * @return 更新结果
     */
    Result<Void> updateCartItem(CartEntity cart);

    /**
     * 删除购物车商品
     * @param id 购物车项ID
     * @return 删除结果
     */
    Result<Void> deleteCartItem(Long id);

    /**
     * 清空用户购物车
     * @param userId 用户ID
     * @return 清空结果
     */
    Result<Void> clearCart(Long userId);
}
