package com.shop.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;
import com.shop.entity.CartEntity;
import com.shop.entity.ProductEntity;
import com.shop.mapper.CartMapper;
import com.shop.service.CartService;
import com.shop.service.ProductService;

import lombok.extern.slf4j.Slf4j;

/**
 * 购物车服务实现类
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Service
public class CartServiceImpl extends ServiceImpl<CartMapper, CartEntity> implements CartService {

    @Autowired
    private ProductService productService;

    @Override
    public Result<List<CartEntity>> getUserCart(Long userId) {
        log.info("查询用户购物车, userId: {}", userId);
        LambdaQueryWrapper<CartEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CartEntity::getUserId, userId);
        wrapper.orderByDesc(CartEntity::getCreateTime);
        List<CartEntity> list = this.list(wrapper);
        log.info("查询用户购物车成功, userId: {}, 商品数量: {}", userId, list.size());
        return Result.success(list);
    }

    @Override
    public Result<Void> addToCart(CartEntity cart) {
        log.info("添加商品到购物车, userId: {}, productId: {}, quantity: {}",
                cart.getUserId(), cart.getProductId(), cart.getQuantity());
        // 验证商品是否存在
        ProductEntity product = productService.getById(cart.getProductId());
        if (product == null) {
            log.warn("添加购物车失败, 商品不存在, productId: {}", cart.getProductId());
            return Result.error(ResultCodeEnum.PRODUCT_NOT_EXIST, "商品不存在");
        }

        // 检查库存
        if (product.getStock() < cart.getQuantity()) {
            log.warn("添加购物车失败, 库存不足, productId: {}, stock: {}, quantity: {}",
                    cart.getProductId(), product.getStock(), cart.getQuantity());
            return Result.error(ResultCodeEnum.STOCK_INSUFFICIENT, "库存不足");
        }

        // 检查购物车是否已存在该商品
        LambdaQueryWrapper<CartEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CartEntity::getUserId, cart.getUserId());
        wrapper.eq(CartEntity::getProductId, cart.getProductId());
        CartEntity existCart = this.getOne(wrapper);

        if (existCart != null) {
            // 更新数量
            existCart.setQuantity(existCart.getQuantity() + cart.getQuantity());
            this.updateById(existCart);
            log.info("更新购物车数量成功, cartId: {}, 新数量: {}",
                    existCart.getId(), existCart.getQuantity());
            return Result.success();
        } else {
            // 新增购物车项
            cart.setProductName(product.getName());
            cart.setProductImage(product.getImage());
            this.save(cart);
            log.info("添加购物车成功, cartId: {}, userId: {}, productId: {}",
                    cart.getId(), cart.getUserId(), cart.getProductId());
            return Result.success();
        }
    }

    @Override
    public Result<Void> updateCartItem(CartEntity cart) {
        log.info("更新购物车项, cartId: {}, quantity: {}", cart.getId(), cart.getQuantity());
        CartEntity existCart = this.getById(cart.getId());
        if (existCart == null) {
            log.warn("更新购物车项失败, 购物车项不存在, cartId: {}", cart.getId());
            return Result.error(ResultCodeEnum.CART_ITEM_NOT_EXIST, "购物车项不存在");
        }

        // 验证商品库存
        ProductEntity product = productService.getById(existCart.getProductId());
        if (product != null && product.getStock() < cart.getQuantity()) {
            log.warn("更新购物车项失败, 库存不足, productId: {}, stock: {}, quantity: {}",
                    product.getId(), product.getStock(), cart.getQuantity());
            return Result.error(ResultCodeEnum.STOCK_INSUFFICIENT, "库存不足");
        }

        this.updateById(cart);
        log.info("更新购物车项成功, cartId: {}", cart.getId());
        return Result.success();
    }

    @Override
    public Result<Void> deleteCartItem(Long id) {
        log.info("删除购物车项, cartId: {}", id);
        CartEntity cart = this.getById(id);
        if (cart == null) {
            log.warn("删除购物车项失败, 购物车项不存在, cartId: {}", id);
            return Result.error(ResultCodeEnum.CART_ITEM_NOT_EXIST, "购物车项不存在");
        }

        this.removeById(id);
        log.info("删除购物车项成功, cartId: {}", id);
        return Result.success();
    }

    @Override
    public Result<Void> clearCart(Long userId) {
        log.info("清空购物车, userId: {}", userId);
        LambdaQueryWrapper<CartEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CartEntity::getUserId, userId);
        this.remove(wrapper);
        log.info("清空购物车成功, userId: {}", userId);
        return Result.success();
    }
}
