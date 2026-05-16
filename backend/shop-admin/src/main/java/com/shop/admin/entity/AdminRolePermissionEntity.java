package com.shop.admin.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 角色权限关联实体类
 * <p>
 * 对应数据库表 t_admin_role_permission，用于RBAC模型中角色与权限的多对多关联
 * </p>
 *
 * @author shop
 * @since 1.1.0
 */
@Data
@Schema(description = "角色权限关联实体")
@TableName("t_admin_role_permission")
public class AdminRolePermissionEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID，自增
     */
    @Schema(description = "ID")
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 角色ID，关联 t_admin_role.id
     */
    @Schema(description = "角色ID")
    private Long roleId;

    /**
     * 权限ID，关联 t_admin_permission.id
     */
    @Schema(description = "权限ID")
    private Long permissionId;

    /**
     * 创建时间，自动填充
     */
    @Schema(description = "创建时间")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
