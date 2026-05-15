package com.shop.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 订单详情实体类
 * @since 1.0.0
 */
@Data
@Schema(description = "订单详情实体")
@TableName("t_order_item")
public class OrderItemEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 订单详情ID
     */
    @Schema(description = "订单详情ID")
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 订单ID
     */
    @Schema(description = "订单ID")
    private Long orderId;

    /**
     * 商品ID
     */
    @Schema(description = "商品ID")
    private Long productId;

    /**
     * 商品名称
     */
    @Schema(description = "商品名称")
    private String productName;

    /**
     * 商品图片
     */
    @Schema(description = "商品图片")
    private String productImage;

    /**
     * 商品价格
     */
    @Schema(description = "商品价格")
    private BigDecimal productPrice;

    /**
     * 购买数量
     */
    @Schema(description = "购买数量")
    private Integer quantity;

    /**
     * 小计金额
     */
    @Schema(description = "小计金额")
    private BigDecimal totalPrice;

    /**
     * 删除标记：0-未删除，1-已删除
     */
    @Schema(description = "删除标记：0-未删除，1-已删除")
    @TableLogic
    private Integer deleted;
}
