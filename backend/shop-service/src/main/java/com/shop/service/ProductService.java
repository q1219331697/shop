package com.shop.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.shop.common.Result;
import com.shop.entity.ProductEntity;

/**
 * 商品服务接口
 * @since 1.0.0
 */
public interface ProductService extends IService<ProductEntity> {

    /**
     * 分页查询商品列表
     * @param current 当前页
     * @param size 每页大小
     * @param categoryId 分类ID
     * @param keyword 关键词
     * @return 商品列表
     */
    Result<IPage<ProductEntity>> listProducts(Long current, Long size, Long categoryId, String keyword);

    /**
     * 获取商品详情
     * @param id 商品ID
     * @return 商品详情
     */
    Result<ProductEntity> getProductById(Long id);

    /**
     * 添加商品
     * @param product 商品信息
     * @return 添加结果
     */
    Result<Void> addProduct(ProductEntity product);

    /**
     * 更新商品
     * @param product 商品信息
     * @return 更新结果
     */
    Result<Void> updateProduct(ProductEntity product);

    /**
     * 删除商品
     * @param id 商品ID
     * @return 删除结果
     */
    Result<Void> deleteProduct(Long id);
}
