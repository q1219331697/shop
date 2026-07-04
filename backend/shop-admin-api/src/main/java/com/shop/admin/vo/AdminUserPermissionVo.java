
package com.shop.admin.vo;

import com.shop.admin.entity.AdminPermissionEntity;
import com.shop.admin.entity.AdminRoleEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 用户权限详情VO
 * <p>
 * 用于授权管理页面，展示用户的角色列表和权限编码列表
 * </p>
 *
 * @since 1.0.0
 */
@Data
@Schema(description = "用户权限详情")
public class AdminUserPermissionVo implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 用户ID
     */
    @Schema(description = "用户ID")
    private Long userId;

    /**
     * 用户名
     */
    @Schema(description = "用户名")
    private String username;

    /**
     * 角色列表
     */
    @Schema(description = "角色列表")
    private List<AdminRoleEntity> roles;

    /**
     * 权限编码列表
     */
    @Schema(description = "权限编码列表")
    private List<String> permissionCodes;

    /**
     * 菜单树
     */
    @Schema(description = "菜单树")
    private List<AdminPermissionEntity> menus;
}
