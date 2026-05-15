package com.shop.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.shop.common.Result;
import com.shop.entity.CategoryEntity;

import java.util.List;

/**
 * 分类服务接口
 * @since 1.0.0
 */
public interface CategoryService extends IService<CategoryEntity> {

    /**
     * 获取所有分类列表
     * @return 分类列表
     */
    Result<List<CategoryEntity>> getAllCategories();

    /**
     * 获取分类详情
     * @param id 分类ID
     * @return 分类详情
     */
    Result<CategoryEntity> getCategoryById(Long id);

    /**
     * 添加分类
     * @param category 分类信息
     * @return 添加结果
     */
    Result<Void> addCategory(CategoryEntity category);

    /**
     * 更新分类
     * @param category 分类信息
     * @return 更新结果
     */
    Result<Void> updateCategory(CategoryEntity category);

    /**
     * 删除分类
     * @param id 分类ID
     * @return 删除结果
     */
    Result<Void> deleteCategory(Long id);
}
