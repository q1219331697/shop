package com.shop.api.controller;

import com.shop.common.Result;
import com.shop.entity.CategoryEntity;
import com.shop.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 分类控制器
 * @since 1.0.0
 */
@Tag(name = "分类管理", description = "分类相关接口")
@RestController
@RequestMapping("/category")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    /**
     * 获取所有分类列表
     */
    @Operation(summary = "获取所有分类列表")
    @GetMapping("/list")
    public Result<List<CategoryEntity>> list() {
        return categoryService.getAllCategories();
    }

    /**
     * 获取分类详情
     */
    @Operation(summary = "获取分类详情")
    @GetMapping("/{id}")
    public Result<CategoryEntity> getById(@PathVariable Long id) {
        return categoryService.getCategoryById(id);
    }

    /**
     * 添加分类
     */
    @Operation(summary = "添加分类")
    @PostMapping("/add")
    public Result<Void> add(@RequestBody CategoryEntity category) {
        return categoryService.addCategory(category);
    }

    /**
     * 更新分类
     */
    @Operation(summary = "更新分类")
    @PutMapping("/update")
    public Result<Void> update(@RequestBody CategoryEntity category) {
        return categoryService.updateCategory(category);
    }

    /**
     * 删除分类
     */
    @Operation(summary = "删除分类")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return categoryService.deleteCategory(id);
    }
}
