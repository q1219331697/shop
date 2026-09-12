package com.shop.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 商品状态枚举
 *
 * @author shop
 * @since 1.0.0
 */
@Getter
@AllArgsConstructor
public enum ProductStatusEnum {

    /** 下架 */
    OFF_SHELF(0, "下架"),
    /** 上架 */
    ON_SHELF(1, "上架"),
    /** 库存不足 */
    OUT_OF_STOCK(2, "库存不足");

    private final Integer code;
    private final String desc;
}
