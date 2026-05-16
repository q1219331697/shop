package com.shop.admin.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 后台角色实体类
 * <p>
 * 对应数据库表 t_admin_role，用于RBAC模型中的角色管理
 * </p>
 *
 * @author shop
 * @since 1.1.0
 */
@Data
@Schema(description = "后台角色实体")
@TableName("t_admin_role")
public class AdminRoleEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 角色ID，主键自增
     */
    @Schema(description = "角色ID")
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 角色名称，唯一
     */
    @Schema(description = "角色名称")
    private String roleName;

    /**
     * 角色编码，唯一，如 ROLE_ADMIN
     */
    @Schema(description = "角色编码")
    private String roleCode;

    /**
     * 角色描述
     */
    @Schema(description = "角色描述")
    private String description;

    /**
     * 排序序号，越小越靠前
     */
    @Schema(description = "排序")
    private Integer sortOrder;

    /**
     * 状态：0-禁用，1-正常
     */
    @Schema(description = "状态：0-禁用，1-正常")
    private Integer status;

    /**
     * 删除标记：0-未删除，1-已删除（逻辑删除）
     */
    @Schema(description = "删除标记：0-未删除，1-已删除")
    @TableLogic
    private Integer deleted;

    /**
     * 创建时间，自动填充
     */
    @Schema(description = "创建时间")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间，自动填充
     */
    @Schema(description = "更新时间")
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
