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
 * 用户角色关联实体类
 * <p>
 * 对应数据库表 t_admin_user_role，用于RBAC模型中用户与角色的多对多关联
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "用户角色关联实体")
@TableName("t_admin_user_role")
public class AdminUserRoleEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID，自增
     */
    @Schema(description = "ID")
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID，关联 t_admin_user.id
     */
    @Schema(description = "用户ID")
    private Long userId;

    /**
     * 角色ID，关联 t_admin_role.id
     */
    @Schema(description = "角色ID")
    private Long roleId;

    /**
     * 创建时间，自动填充
     */
    @Schema(description = "创建时间")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
