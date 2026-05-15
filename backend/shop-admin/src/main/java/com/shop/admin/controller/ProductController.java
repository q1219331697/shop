package com.shop.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
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
@Tag(name = "后台-商品管理", description = "后台商品管理接口")
@RestController
@RequestMapping("/admin/product")
public class ProductController {

    @Autowired
    private ProductService productService;

    /**
     * 分页查询商品列表
     */
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
     */
    @Operation(summary = "获取商品详情")
    @GetMapping("/{id}")
    public Result<ProductEntity> getById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    /**
     * 添加商品
     */
    @Operation(summary = "添加商品")
    @PostMapping("/add")
    public Result<Void> add(@RequestBody ProductEntity product) {
        return productService.addProduct(product);
    }

    /**
     * 更新商品
     */
    @Operation(summary = "更新商品")
    @PutMapping("/update")
    public Result<Void> update(@RequestBody ProductEntity product) {
        return productService.updateProduct(product);
    }

    /**
     * 删除商品
     */
    @Operation(summary = "删除商品")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return productService.deleteProduct(id);
    }
}
