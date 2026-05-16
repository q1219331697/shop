package com.shop.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 用户状态枚举
 * @since 1.0.0
 */
@Getter
@AllArgsConstructor
public enum UserStatusEnum {

    /** 禁用 */
    DISABLED(0, "禁用"),
    /** 正常 */
    NORMAL(1, "正常"),
    /** 锁定 */
    LOCKED(2, "锁定");

    private final Integer code;
    private final String desc;
}
