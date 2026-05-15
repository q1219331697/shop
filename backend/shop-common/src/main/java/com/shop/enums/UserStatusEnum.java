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

    DISABLED(0, "禁用"),
    NORMAL(1, "正常"),
    LOCKED(2, "锁定");

    private final Integer code;
    private final String desc;
}
