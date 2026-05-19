package com.shop.common;

/**
 * 响应码枚举
 * <p>
 * 编码规则：DDYYNN
 *   DD - 模块：00公共、01用户、02商品、03分类、04购物车、05订单、06权限
 *   YY - 类型
 *   NN - 序号
 *
 * @since 1.0.0
 */
public enum ResultCodeEnum {

    // ========== 公共 00 ==========
    /** 成功 */
    SUCCESS("0000", "成功"),
    /** 失败 */
    ERROR("0001", "失败"),
    /** 参数错误 */
    PARAM_ERROR("0002", "参数错误"),
    /** 操作失败 */
    OPERATION_FAILED("0003", "操作失败"),

    // ========== 用户 01 ==========
    /** 用户不存在 */
    USER_NOT_EXIST("0101", "用户不存在"),
    /** 用户名已存在 */
    USERNAME_EXIST("0102", "用户名已存在"),
    /** 手机号已存在 */
    PHONE_EXIST("0103", "手机号已存在"),
    /** 密码错误 */
    PASSWORD_ERROR("0104", "密码错误"),
    /** 用户已被禁用 */
    USER_DISABLED("0105", "用户已被禁用"),

    // ========== 商品 02 ==========
    /** 商品不存在 */
    PRODUCT_NOT_EXIST("0201", "商品不存在"),
    /** 库存不足 */
    STOCK_INSUFFICIENT("0202", "库存不足"),

    // ========== 分类 03 ==========
    /** 分类不存在 */
    CATEGORY_NOT_EXIST("0301", "分类不存在"),
    /** 分类名称已存在 */
    CATEGORY_NAME_EXIST("0302", "分类名称已存在"),
    /** 分类下存在商品 */
    CATEGORY_HAS_PRODUCTS("0303", "分类下存在商品"),

    // ========== 购物车 04 ==========
    /** 购物车项不存在 */
    CART_ITEM_NOT_EXIST("0401", "购物车项不存在"),

    // ========== 订单 05 ==========
    /** 订单不存在 */
    ORDER_NOT_EXIST("0501", "订单不存在"),
    /** 订单状态错误 */
    ORDER_STATUS_ERROR("0502", "订单状态错误"),
    /** 订单详情不存在 */
    ORDER_ITEM_NOT_EXIST("0503", "订单详情不存在"),

    // ========== 权限 06 ==========
    /** 无权限访问 */
    FORBIDDEN("0601", "无权限访问");

    private final String code;
    private final String msg;

    ResultCodeEnum(String code, String msg) {
        this.code = code;
        this.msg = msg;
    }

    public String getCode() {
        return code;
    }

    public String getMsg() {
        return msg;
    }

    /**
     * 生成失败结果（使用枚举默认消息）
     *
     * @param <T> 数据类型
     * @return 失败结果
     */
    public <T> Result<T> toResult() {
        return Result.of(code, msg);
    }

    /**
     * 生成失败结果（自定义消息覆盖默认消息）
     *
     * @param <T>    数据类型
     * @param message 自定义消息
     * @return 失败结果
     */
    public <T> Result<T> toResult(String message) {
        return Result.of(code, message);
    }

    /**
     * 根据码值查找枚举项
     *
     * @param code 码值，如 "0000"、"0101"
     * @return 对应的枚举项；找不到返回 null
     */
    public static ResultCodeEnum fromCode(String code) {
        for (ResultCodeEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        return null;
    }
}
