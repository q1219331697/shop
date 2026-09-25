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
/** 参数错误 */
export const PARAM_ERROR = '000002'
/** 未登录或登录已过期 */
export const UNAUTHORIZED = '000401'
/** 无权限访问 */
export const FORBIDDEN = '000403'
/** 账号已被锁定（登录失败次数过多） */
export const ACCOUNT_LOCKED = '010005'

