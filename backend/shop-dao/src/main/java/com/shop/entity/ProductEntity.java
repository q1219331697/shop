package com.shop.entity;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 商品实体类
 * <p>
 * 对应数据库表 t_product，用于存储商品信息
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "商品实体")
@TableName("t_product")
public class ProductEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 商品ID，主键自增
     */
    @Schema(description = "商品ID")
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 商品名称
     */
    @Schema(description = "商品名称")
    private String name;

    /**
     * 商品描述
     */
    @Schema(description = "商品描述")
    private String description;

    /**
     * 商品价格
     */
    @Schema(description = "商品价格")
    private BigDecimal price;

    /**
     * 库存数量
     */
    @Schema(description = "库存数量")
    private Integer stock;

    /**
     * 商品图片URL
     */
    @Schema(description = "商品图片")
    private String image;

    /**
     * 分类ID，关联 t_category.id
     */
    @Schema(description = "分类ID")
    private Integer categoryId;

    /**
     * 状态：0-下架，1-上架，2-库存不足
     */
    @Schema(description = "状态：0-下架，1-上架，2-库存不足")
    private Integer status;

    /**
     * 销量
     */
    @Schema(description = "销量")
    private Integer sales;

    /**
     * 删除标记：0-未删除，1-已删除（逻辑删除）
     */
    @Schema(description = "删除标记：0-未删除，1-已删除")
    @TableLogic
    private Integer deleted;

    /**
     * 创建时间，自动填充
     */
    @Schema(description = "创建时间")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间，自动填充
     */
    @Schema(description = "更新时间")
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}