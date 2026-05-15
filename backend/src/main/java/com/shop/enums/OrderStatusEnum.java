package com.shop.enums;

import lombok.Getter;

/**
 * 订单状态枚举
 * @since 1.0.0
 */
@Getter
public enum OrderStatusEnum {

    /**
     * 待付款
     */
    PENDING_PAYMENT(0, "待付款"),

    /**
     * 待发货
     */
    PENDING_SHIPMENT(1, "待发货"),

    /**
     * 待收货
     */
    PENDING_RECEIPT(2, "待收货"),

    /**
     * 已完成
     */
    COMPLETED(3, "已完成"),

    /**
     * 已取消
     */
    CANCELLED(4, "已取消"),

    /**
     * 退款中
     */
    REFUNDING(5, "退款中"),

    /**
     * 已退款
     */
    REFUNDED(6, "已退款");

    /**
     * 状态码
     */
    private final Integer code;

    /**
     * 状态描述
     */
    private final String desc;

    OrderStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    /**
     * 根据状态码获取订单状态枚举
     * @param code 状态码
     * @return 订单状态枚举
     */
    public static OrderStatusEnum getByCode(Integer code) {
        for (OrderStatusEnum status : OrderStatusEnum.values()) {
            if (status.getCode().equals(code)) {
                return status;
            }
        }
        return null;
    }
}
