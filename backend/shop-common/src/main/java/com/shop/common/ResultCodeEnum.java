package com.shop.common;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 响应码枚举
 * <p>
 * 编码规则：DDNNNN
 *   DD   - 模块：00公共、01用户、02商品、03分类、04购物车、05订单
 *   NNNN - 模块内编号，高频错误编号靠前
 * <p>
 *   语义编号约定（源自互联网大数据报错频率排序）：
 *     404  = 资源不存在（最高频）
 *     401  = 未认证（次高频）
 *     403  = 无权限
 *     001+ = 其余按模块内频率递增（001最频繁，002次之…）
 * <p>
 *   子资源编号：DDMNNN，M=子模块序号（如 050101=订单子模块01的01号错误）
 * <p>
 *   前端通过 resultCode.ts 常量精准匹配码值，新增码值需同步更新
 *
 * @author shop
 * @since 1.0.0
 */
public enum ResultCodeEnum {

    // ========== 公共 00 ==========
    /** 成功 */
    SUCCESS("000000", "成功"),
    /** 失败 */
    ERROR("000001", "失败"),
    /** 参数错误 */
    PARAM_ERROR("000002", "参数错误"),
    /** 操作失败 */
    OPERATION_FAILED("000003", "操作失败"),
    /** 未登录或登录已过期 */
    UNAUTHORIZED("000401", "未登录或登录已过期"),
    /** 无权限访问 */
    FORBIDDEN("000403", "无权限访问"),

    // ========== 用户 01 ==========
    /** 用户名已存在 */
    USERNAME_EXIST("010001", "用户名已存在"),
    /** 密码错误 */
    PASSWORD_ERROR("010002", "密码错误"),
    /** 用户已被禁用 */
    USER_DISABLED("010003", "用户已被禁用"),
    /** 手机号已存在 */
    PHONE_EXIST("010004", "手机号已存在"),
    /** 用户不存在 */
    USER_NOT_EXIST("010404", "用户不存在"),
    /** 账号已被锁定（登录失败次数过多） */
    ACCOUNT_LOCKED("010005", "账号已被锁定"),

    // ========== 商品 02 ==========
    /** 库存不足 */
    STOCK_INSUFFICIENT("020001", "库存不足"),
    /** 商品不存在 */
    PRODUCT_NOT_EXIST("020404", "商品不存在"),

    // ========== 分类 03 ==========
    /** 分类名称已存在 */
    CATEGORY_NAME_EXIST("030001", "分类名称已存在"),
    /** 分类下存在商品 */
    CATEGORY_HAS_PRODUCTS("030002", "分类下存在商品"),
    /** 分类不存在 */
    CATEGORY_NOT_EXIST("030404", "分类不存在"),

    // ========== 购物车 04 ==========
    /** 购物车项不存在 */
    CART_ITEM_NOT_EXIST("040404", "购物车项不存在"),

    // ========== 订单 05 ==========
    /** 订单状态错误 */
    ORDER_STATUS_ERROR("050001", "订单状态错误"),
    /** 订单不存在 */
    ORDER_NOT_EXIST("050404", "订单不存在"),
    /** 订单详情不存在 */
    ORDER_ITEM_NOT_EXIST("051404", "订单详情不存在"),

    // ========== 兜底 ==========
    /** 未知码值（查找时的安全兜底，无业务含义） */
    UNKNOWN("", "未知码值");

    private final String code;
    private final String msg;

    /** code → 枚举项 缓存，类加载时初始化，查找 O(1) */
    private static final Map<String, ResultCodeEnum> CODE_MAP;

    static {
        Map<String, ResultCodeEnum> map = new HashMap<>();
        for (ResultCodeEnum e : values()) {
            map.put(e.code, e);
        }
        CODE_MAP = Collections.unmodifiableMap(map);
    }

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
     * 根据码值查找枚举项，找不到返回 UNKNOWN（无业务含义的安全兜底）
     *
     * @param code 码值，如 "000000"、"010404"
     * @return 对应的枚举项；找不到返回 UNKNOWN
     */
    public static ResultCodeEnum fromCode(String code) {
        return fromCode(code, UNKNOWN);
    }

    /**
     * 根据码值查找枚举项，找不到返回指定的默认值
     *
     * @param code        码值，如 "000000"、"010404"
     * @param defaultValue 默认值
     * @return 对应的枚举项；找不到返回 defaultValue
     */
    public static ResultCodeEnum fromCode(String code, ResultCodeEnum defaultValue) {
        ResultCodeEnum e = CODE_MAP.get(code);
        return e != null ? e : defaultValue;
    }

    /**
     * 根据码值查找枚举项，返回Optional，调用方必须显式处理空值
     *
     * @param code 码值，如 "000000"、"010404"
     * @return Optional包装的枚举项
     */
    public static Optional<ResultCodeEnum> findByCode(String code) {
        return Optional.ofNullable(CODE_MAP.get(code));
    }
}
