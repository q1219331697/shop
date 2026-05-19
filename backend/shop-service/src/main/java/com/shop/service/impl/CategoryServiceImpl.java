package com.shop.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;
import com.shop.entity.CategoryEntity;
import com.shop.entity.ProductEntity;
import com.shop.mapper.CategoryMapper;
import com.shop.service.CategoryService;
import com.shop.service.ProductService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 分类服务实现类
 * @since 1.0.0
 */
@Slf4j
@Service
public class CategoryServiceImpl extends ServiceImpl<CategoryMapper, CategoryEntity> implements CategoryService {

    @Autowired
    @Lazy
    private ProductService productService;

    @Override
    public Result<List<CategoryEntity>> getAllCategories() {
        log.info("查询所有分类列表");
        LambdaQueryWrapper<CategoryEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(CategoryEntity::getSort);
        List<CategoryEntity> list = this.list(wrapper);
        log.info("查询分类列表成功, 总数: {}", list.size());
        return Result.success(list);
    }

    @Override
    public Result<CategoryEntity> getCategoryById(Long id) {
        log.info("查询分类详情, categoryId: {}", id);
        CategoryEntity category = this.getById(id);
        if (category == null) {
            log.warn("查询分类详情失败, 分类不存在, categoryId: {}", id);
            return Result.error(ResultCodeEnum.CATEGORY_NOT_EXIST, "分类不存在");
        }
        log.info("查询分类详情成功, categoryId: {}", id);
        return Result.success(category);
    }

    @Override
    public Result<Void> addCategory(CategoryEntity category) {
        log.info("添加分类, categoryName: {}", category.getName());
        // 检查分类名称是否已存在
        LambdaQueryWrapper<CategoryEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CategoryEntity::getName, category.getName());
        if (this.count(wrapper) > 0) {
            log.warn("添加分类失败, 分类名称已存在, categoryName: {}", category.getName());
            return Result.error(ResultCodeEnum.CATEGORY_NAME_EXIST, "分类名称已存在");
        }

        // 设置默认状态
        if (category.getStatus() == null) {
            category.setStatus(1);
        }

        // 设置默认排序
        if (category.getSort() == null) {
            category.setSort(0);
        }

        boolean success = this.save(category);
        if (success) {
            log.info("添加分类成功, categoryId: {}, categoryName: {}", category.getId(), category.getName());
        } else {
            log.error("添加分类失败, categoryName: {}", category.getName());
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "添加分类失败");
    }

    @Override
    public Result<Void> updateCategory(CategoryEntity category) {
        log.info("更新分类, categoryId: {}", category.getId());
        CategoryEntity existCategory = this.getById(category.getId());
        if (existCategory == null) {
            log.warn("更新分类失败, 分类不存在, categoryId: {}", category.getId());
            return Result.error(ResultCodeEnum.CATEGORY_NOT_EXIST, "分类不存在");
        }

        // 如果修改分类名称，检查新名称是否已存在
        if (category.getName() != null && !category.getName().equals(existCategory.getName())) {
            LambdaQueryWrapper<CategoryEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(CategoryEntity::getName, category.getName());
            if (this.count(wrapper) > 0) {
                log.warn("更新分类失败, 分类名称已存在, categoryName: {}", category.getName());
                return Result.error(ResultCodeEnum.CATEGORY_NAME_EXIST, "分类名称已存在");
            }
        }

        boolean success = this.updateById(category);
        if (success) {
            log.info("更新分类成功, categoryId: {}", category.getId());
        } else {
            log.error("更新分类失败, categoryId: {}", category.getId());
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "更新分类失败");
    }

    @Override
    public Result<Void> deleteCategory(Long id) {
        log.info("删除分类, categoryId: {}", id);
        CategoryEntity category = this.getById(id);
        if (category == null) {
            log.warn("删除分类失败, 分类不存在, categoryId: {}", id);
            return Result.error(ResultCodeEnum.CATEGORY_NOT_EXIST, "分类不存在");
        }

        // 检查分类下是否有商品
        LambdaQueryWrapper<ProductEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductEntity::getCategoryId, id);
        long productCount = productService.count(wrapper);
        if (productCount > 0) {
            log.warn("删除分类失败, 该分类下存在商品, categoryId: {}, productCount: {}", id, productCount);
            return Result.error(ResultCodeEnum.CATEGORY_HAS_PRODUCTS, "该分类下存在商品，无法删除");
        }

        boolean success = this.removeById(id);
        if (success) {
            log.info("删除分类成功, categoryId: {}", id);
        } else {
            log.error("删除分类失败, categoryId: {}", id);
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "删除分类失败");
    }
}
