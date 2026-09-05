package com.shop.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.common.Result;
import org.springframework.security.access.prepost.PreAuthorize;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 后台商品管理控制器
 * @since 1.0.0
 */
@Tag(name = "商品管理", description = "商品管理接口")
@RestController
@RequestMapping("/product")
public class ProductController {

    private static final Long DEFAULT_PAGE_SIZE = 10L;

    @Autowired
    private ProductService productService;

    /**
     * 分页查询商品列表
     *
     * @param params 查询参数：pageNum, pageSize, categoryId, keyword
     * @return 商品分页数据
     */
    @PreAuthorize("hasAuthority('product:query')")
    @Operation(summary = "分页查询商品列表")
    @GetMapping
    public Result<IPage<ProductEntity>> list(@RequestBody Map<String, Object> params) {
        Long pageNum = params.get("pageNum") != null ? Long.valueOf(params.get("pageNum").toString()) : 1L;
        Long pageSize = params.get("pageSize") != null
                ? Long.valueOf(params.get("pageSize").toString()) : DEFAULT_PAGE_SIZE;
        Long categoryId = params.get("categoryId") != null ? Long.valueOf(params.get("categoryId").toString()) : null;
        String keyword = params.get("keyword") != null ? params.get("keyword").toString() : null;
        return productService.listProducts(pageNum, pageSize, categoryId, keyword);
    }

    /**
     * 获取商品详情
     *
     * @param id 商品ID
     * @return 商品详情
     */
    @PreAuthorize("hasAuthority('product:query')")
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
    @PreAuthorize("hasAuthority('product:create')")
    @Operation(summary = "添加商品")
    @PostMapping
    public Result<Void> add(@RequestBody ProductEntity product) {
        return productService.addProduct(product);
    }

    /**
     * 更新商品
     *
     * @param id 商品ID
     * @param product 商品信息
     * @return 更新结果
     */
    @PreAuthorize("hasAuthority('product:update')")
    @Operation(summary = "更新商品")
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody ProductEntity product) {
        product.setId(id);
        return productService.updateProduct(product);
    }

    /**
     * 删除商品
     *
     * @param id 商品ID
     * @return 删除结果
     */
    @PreAuthorize("hasAuthority('product:delete')")
    @Operation(summary = "删除商品")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return productService.deleteProduct(id);
    }
}
