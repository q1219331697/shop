package com.shop.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;
import com.shop.entity.CategoryEntity;
import com.shop.entity.ProductEntity;
import com.shop.mapper.ProductMapper;
import com.shop.service.CategoryService;
import com.shop.service.ProductService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 商品服务实现类
 * @since 1.0.0
 */
@Slf4j
@Service
public class ProductServiceImpl extends ServiceImpl<ProductMapper, ProductEntity> implements ProductService {

    @Autowired
    @Lazy
    private CategoryService categoryService;

    @Override
    public Result<IPage<ProductEntity>> listProducts(Long current, Long size, Long categoryId, String keyword) {
        log.info("查询商品列表, current: {}, size: {}, categoryId: {}, keyword: {}", current, size, categoryId, keyword);
        Page<ProductEntity> page = new Page<>(current, size);
        LambdaQueryWrapper<ProductEntity> wrapper = new LambdaQueryWrapper<>();

        // 按分类筛选
        if (categoryId != null) {
            wrapper.eq(ProductEntity::getCategoryId, categoryId);
        }

        // 按关键词搜索
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(ProductEntity::getName, keyword)
                    .or()
                    .like(ProductEntity::getDescription, keyword));
        }

        // 按销量降序排序
        wrapper.orderByDesc(ProductEntity::getSales);

        IPage<ProductEntity> result = this.page(page, wrapper);
        log.info("查询商品列表成功, 总数: {}", result.getTotal());
        return Result.success(result);
    }

    @Override
    public Result<ProductEntity> getProductById(Long id) {
        log.info("查询商品详情, productId: {}", id);
        ProductEntity product = this.getById(id);
        if (product == null) {
            log.warn("查询商品详情失败, 商品不存在, productId: {}", id);
            return Result.error(ResultCodeEnum.PRODUCT_NOT_EXIST, "商品不存在");
        }
        log.info("查询商品详情成功, productId: {}", id);
        return Result.success(product);
    }

    @Override
    public Result<Void> addProduct(ProductEntity product) {
        log.info("添加商品, productName: {}, categoryId: {}", product.getName(), product.getCategoryId());
        // 验证分类是否存在
        if (product.getCategoryId() != null) {
            CategoryEntity category = categoryService.getById(product.getCategoryId());
            if (category == null) {
                log.warn("添加商品失败, 分类不存在, categoryId: {}", product.getCategoryId());
                return Result.error(ResultCodeEnum.CATEGORY_NOT_EXIST, "分类不存在");
            }
        }

        // 设置默认状态
        if (product.getStatus() == null) {
            product.setStatus(1);
        }

        boolean success = this.save(product);
        if (success) {
            log.info("添加商品成功, productId: {}, productName: {}", product.getId(), product.getName());
        } else {
            log.error("添加商品失败, productName: {}", product.getName());
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "添加商品失败");
    }

    @Override
    public Result<Void> updateProduct(ProductEntity product) {
        log.info("更新商品, productId: {}", product.getId());
        ProductEntity existProduct = this.getById(product.getId());
        if (existProduct == null) {
            log.warn("更新商品失败, 商品不存在, productId: {}", product.getId());
            return Result.error(ResultCodeEnum.PRODUCT_NOT_EXIST, "商品不存在");
        }

        // 验证分类是否存在
        if (product.getCategoryId() != null) {
            CategoryEntity category = categoryService.getById(product.getCategoryId());
            if (category == null) {
                log.warn("更新商品失败, 分类不存在, categoryId: {}", product.getCategoryId());
                return Result.error(ResultCodeEnum.CATEGORY_NOT_EXIST, "分类不存在");
            }
        }

        boolean success = this.updateById(product);
        if (success) {
            log.info("更新商品成功, productId: {}", product.getId());
        } else {
            log.error("更新商品失败, productId: {}", product.getId());
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "更新商品失败");
    }

    @Override
    public Result<Void> deleteProduct(Long id) {
        log.info("删除商品, productId: {}", id);
        ProductEntity product = this.getById(id);
        if (product == null) {
            log.warn("删除商品失败, 商品不存在, productId: {}", id);
            return Result.error(ResultCodeEnum.PRODUCT_NOT_EXIST, "商品不存在");
        }

        boolean success = this.removeById(id);
        if (success) {
            log.info("删除商品成功, productId: {}", id);
        } else {
            log.error("删除商品失败, productId: {}", id);
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "删除商品失败");
    }
}
