package com.shop.common;

/**
 * 响应码常量类
 */
public final class ResultCode {

    /**
     * 成功响应码
     */
    public static final int SUCCESS = 200;

    /**
     * 失败响应码
     */
    public static final int ERROR = 500;

    // ========== 用户相关 ==========
    /** 用户不存在 */
    public static final int USER_NOT_EXIST = 1001;
    /** 用户名已存在 */
    public static final int USERNAME_EXIST = 1002;
    /** 手机号已存在 */
    public static final int PHONE_EXIST = 1003;
    /** 密码错误 */
    public static final int PASSWORD_ERROR = 1004;
    /** 用户已被禁用 */
    public static final int USER_DISABLED = 1005;

    // ========== 商品相关 ==========
    /** 商品不存在 */
    public static final int PRODUCT_NOT_EXIST = 2001;
    /** 库存不足 */
    public static final int STOCK_INSUFFICIENT = 2002;

    // ========== 分类相关 ==========
    /** 分类不存在 */
    public static final int CATEGORY_NOT_EXIST = 3001;
    /** 分类名称已存在 */
    public static final int CATEGORY_NAME_EXIST = 3002;
    /** 分类下存在商品 */
    public static final int CATEGORY_HAS_PRODUCTS = 3003;

    // ========== 购物车相关 ==========
    /** 购物车项不存在 */
    public static final int CART_ITEM_NOT_EXIST = 4001;

    // ========== 订单相关 ==========
    /** 订单不存在 */
    public static final int ORDER_NOT_EXIST = 5001;
    /** 订单状态错误 */
    public static final int ORDER_STATUS_ERROR = 5002;
    /** 订单详情不存在 */
    public static final int ORDER_ITEM_NOT_EXIST = 5003;

    // ========== 通用错误 ==========
    /** 操作失败 */
    public static final int OPERATION_FAILED = 9001;
    /** 参数错误 */
    public static final int PARAM_ERROR = 9002;

    private ResultCode() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }
}
