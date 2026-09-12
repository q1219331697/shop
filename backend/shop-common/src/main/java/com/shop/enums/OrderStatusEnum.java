package com.shop.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 订单状态枚举
 *
 * @author shop
 * @since 1.0.0
 */
@Getter
@AllArgsConstructor
public enum OrderStatusEnum {

    /** 待付款 */
    PENDING_PAYMENT(0, "待付款"),
    /** 待发货 */
    PENDING_SHIPMENT(1, "待发货"),
    /** 待收货 */
    PENDING_RECEIPT(2, "待收货"),
    /** 已完成 */
    COMPLETED(3, "已完成"),
    /** 已取消 */
    CANCELLED(4, "已取消"),
    /** 退款中 */
    REFUNDING(5, "退款中"),
    /** 已退款 */
    REFUNDED(6, "已退款");

    private final Integer code;
    private final String desc;
}
