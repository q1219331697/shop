package com.shop.enums;

import lombok.Getter;

/**
 * 用户状态枚举
 * @since 1.0.0
 */
@Getter
public enum UserStatusEnum {

    /**
     * 禁用
     */
    DISABLED("0", "禁用"),

    /**
     * 正常
     */
    NORMAL("1", "正常"),

    /**
     * 锁定
     */
    LOCKED("2", "锁定");

    /**
     * 状态码
     */
    private final String code;

    /**
     * 状态描述
     */
    private final String desc;

    UserStatusEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    /**
     * 根据状态码获取用户状态枚举
     * @param code 状态码
     * @return 用户状态枚举
     */
    public static UserStatusEnum getByCode(String code) {
        for (UserStatusEnum status : UserStatusEnum.values()) {
            if (status.getCode().equals(code)) {
                return status;
            }
        }
        return null;
    }
}
