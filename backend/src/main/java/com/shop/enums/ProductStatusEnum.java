package com.shop.enums;

import lombok.Getter;

/**
 * 商品状态枚举
 * @since 1.0.0
 */
@Getter
public enum ProductStatusEnum {

    /**
     * 下架
     */
    OFF_SHELF("0", "下架"),

    /**
     * 上架
     */
    ON_SHELF("1", "上架"),

    /**
     * 库存不足
     */
    OUT_OF_STOCK("2", "库存不足");

    /**
     * 状态码
     */
    private final String code;

    /**
     * 状态描述
     */
    private final String desc;

    ProductStatusEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    /**
     * 根据状态码获取商品状态枚举
     * @param code 状态码
     * @return 商品状态枚举
     */
    public static ProductStatusEnum getByCode(String code) {
        for (ProductStatusEnum status : ProductStatusEnum.values()) {
            if (status.getCode().equals(code)) {
                return status;
            }
        }
        return null;
    }
}
