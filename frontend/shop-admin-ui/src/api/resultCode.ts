/**
 * 响应码常量 — 与后端 ResultCodeEnum 保持同步
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
 *   子资源编号：DDMNNN，M=子模块序号
 */

// ========== 公共 00 ==========
/** 成功 */
export const SUCCESS = '000000'
/** 失败 */
export const ERROR = '000001'
/** 参数错误 */
export const PARAM_ERROR = '000002'
/** 操作失败 */
export const OPERATION_FAILED = '000003'
/** 未登录或登录已过期 */
export const UNAUTHORIZED = '000401'
/** 无权限访问 */
export const FORBIDDEN = '000403'

// ========== 用户 01 ==========
/** 用户名已存在 */
export const USERNAME_EXIST = '010001'
/** 密码错误 */
export const PASSWORD_ERROR = '010002'
/** 用户已被禁用 */
export const USER_DISABLED = '010003'
/** 手机号已存在 */
export const PHONE_EXIST = '010004'
/** 用户不存在 */
export const USER_NOT_EXIST = '010404'

// ========== 商品 02 ==========
/** 库存不足 */
export const STOCK_INSUFFICIENT = '020001'
/** 商品不存在 */
export const PRODUCT_NOT_EXIST = '020404'

// ========== 分类 03 ==========
/** 分类名称已存在 */
export const CATEGORY_NAME_EXIST = '030001'
/** 分类下存在商品 */
export const CATEGORY_HAS_PRODUCTS = '030002'
/** 分类不存在 */
export const CATEGORY_NOT_EXIST = '030404'

// ========== 购物车 04 ==========
/** 购物车项不存在 */
export const CART_ITEM_NOT_EXIST = '040404'

// ========== 订单 05 ==========
/** 订单状态错误 */
export const ORDER_STATUS_ERROR = '050001'
/** 订单不存在 */
export const ORDER_NOT_EXIST = '050404'
/** 订单详情不存在 */
export const ORDER_ITEM_NOT_EXIST = '051404'
