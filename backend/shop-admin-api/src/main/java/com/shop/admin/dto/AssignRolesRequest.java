package com.shop.admin.dto;

import java.io.Serializable;
import java.util.List;

import jakarta.validation.constraints.NotNull;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 管理员分配角色请求入参
 * <p>
 * 替代原先「路径传 id + Map 传 roleIds」的混合写法，一次分配动作的全部输入统一由 body 承载。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "管理员分配角色请求参数")
public class AssignRolesRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 管理员ID
     */
    @NotNull(message = "id不能为空")
    @Schema(description = "管理员ID", example = "1")
    private Long id;

    /**
     * 角色ID列表；为空表示清空该管理员的所有角色
     */
    @Schema(description = "角色ID列表，为空表示清空该管理员的所有角色", example = "[1, 2]")
    private List<Long> roleIds;
}
