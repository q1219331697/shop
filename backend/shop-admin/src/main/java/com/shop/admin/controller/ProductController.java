package com.shop.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.admin.security.RequirePermission;
import com.shop.common.Result;
import com.shop.entity.ProductEntity;
import com.shop.service.ProductService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 后台商品管理控制器
 * @since 1.0.0
 */
@Tag(name = "商品管理", description = "商品管理接口")
@RestController
@RequestMapping("/product")
public class ProductController {

    @Autowired
    private ProductService productService;

    /**
     * 分页查询商品列表
     *
     * @param current 当前页码
     * @param size 每页条数
     * @param categoryId 分类ID
     * @param keyword 搜索关键词
     * @return 商品分页数据
     */
    @RequirePermission("product:query")
    @Operation(summary = "分页查询商品列表")
    @GetMapping("/list")
    public Result<IPage<ProductEntity>> list(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword) {
        return productService.listProducts(current, size, categoryId, keyword);
    }

    /**
     * 获取商品详情
     *
     * @param id 商品ID
     * @return 商品详情
     */
    @RequirePermission("product:query")
    @Operation(summary = "获取商品详情")
    @GetMapping("/{id}")
    public Result<ProductEntity> getById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    /**
     * 添加商品
     *
     * @param product 商品信息
     * @return 添加结果
     */
    @RequirePermission("product:create")
    @Operation(summary = "添加商品")
    @PostMapping("/add")
    public Result<Void> add(@RequestBody ProductEntity product) {
        return productService.addProduct(product);
    }

    /**
     * 更新商品
     *
     * @param product 商品信息
     * @return 更新结果
     */
    @RequirePermission("product:update")
    @Operation(summary = "更新商品")
    @PutMapping("/update")
    public Result<Void> update(@RequestBody ProductEntity product) {
        return productService.updateProduct(product);
    }

    /**
     * 删除商品
     *
     * @param id 商品ID
     * @return 删除结果
     */
    @RequirePermission("product:delete")
    @Operation(summary = "删除商品")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return productService.deleteProduct(id);
    }
}
