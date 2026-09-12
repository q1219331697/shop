package com.shop.admin.validation;

/**
 * JSR-303 校验分组：区分「创建」与「更新」两类约束集合。
 *
 * <p>设计要点：管理员密码在前端编辑表单中隐藏（更新时不传），故密码的 {@code @NotBlank} 仅归入
 * {@link OnCreate}；而长度类约束（{@code @Size}）同时归入 {@link OnCreate} 与 {@link OnUpdate}，
 * 使更新接口也能拒绝超长/非法值（如编辑时姓名超长、角色描述超长），但不因“密码未传”误拒正常编辑。</p>
 *
 * <p>控制器侧：创建接口用 {@code @Validated(OnCreate.class)}，更新接口用
 * {@code @Validated(OnUpdate.class)}，配合全局异常处理器统一返回 {@code PARAM_ERROR}。</p>
 *
 * @author shop
 * @since 1.0.0
 */
public class ValidationGroups {

    /** 创建场景约束分组 */
    public interface OnCreate { }

    /** 更新场景约束分组 */
    public interface OnUpdate { }
}
