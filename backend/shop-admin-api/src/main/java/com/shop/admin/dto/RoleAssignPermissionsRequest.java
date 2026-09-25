package com.shop.admin.dto;

import java.io.Serializable;
import java.util.List;

import jakarta.validation.constraints.NotNull;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 角色分配权限请求入参
 * <p>
 * 替代原先「路径传 id + Map 传 permissionIds」的混合写法，
 * 一次分配动作的全部输入统一由 body 承载。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "角色分配权限请求参数")
public class RoleAssignPermissionsRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 角色ID
     */
    @NotNull(message = "id不能为空")
    @Schema(description = "角色ID", example = "1")
    private Long id;

    /**
     * 权限ID列表；为空表示清空该角色的所有权限
     */
    @Schema(description = "权限ID列表，为空表示清空该角色的所有权限", example = "[1, 2, 3]")
    private List<Long> permissionIds;
}
