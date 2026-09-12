package com.shop.admin.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 角色分页查询VO
 * <p>
 * 用于角色列表分页查询的请求参数封装
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "角色分页查询参数")
public class RolePageQueryVo extends PageQueryVo {

    private static final long serialVersionUID = 1L;

    /**
     * 角色名称（模糊查询）
     */
    @Schema(description = "角色名称（模糊查询）")
    private String roleName;

    /**
     * 状态（0-禁用 1-启用）
     */
    @Schema(description = "状态（0-禁用 1-启用）")
    private Integer status;
}
