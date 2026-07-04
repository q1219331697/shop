package com.shop.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 购物车实体类
 * <p>
 * 对应数据库表 t_cart，用于存储用户购物车信息
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "购物车实体")
@TableName("t_cart")
public class CartEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 购物车ID，主键自增
     */
    @Schema(description = "购物车ID")
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID，关联 t_user.id
     */
    @Schema(description = "用户ID")
    private Long userId;

    /**
     * 商品ID，关联 t_product.id
     */
    @Schema(description = "商品ID")
    private Long productId;

    /**
     * 商品名称（冗余字段）
     */
    @Schema(description = "商品名称")
    private String productName;

    /**
     * 商品图片URL（冗余字段）
     */
    @Schema(description = "商品图片")
    private String productImage;

    /**
     * 商品数量
     */
    @Schema(description = "商品数量")
    private Integer quantity;

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