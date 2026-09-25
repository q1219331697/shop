package com.shop.admin.entity;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.shop.admin.validation.ValidationGroups;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 后台权限实体类
 * <p>
 * 对应数据库表 t_admin_permission，用于RBAC模型中的权限管理，支持菜单和按钮级权限
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "后台权限实体")
@TableName("t_admin_permission")
public class AdminPermissionEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 权限ID，主键自增
     */
    @Schema(description = "权限ID")
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 父权限ID，0为顶级权限
     */
    @Schema(description = "父权限ID，0为顶级")
    private Long parentId;

    /**
     * 权限名称
     */
    @Schema(description = "权限名称")
    @NotBlank(message = "请输入权限名称",
            groups = {ValidationGroups.OnCreate.class, ValidationGroups.OnUpdate.class})
    @Size(max = 50, message = "权限名称长度不能超过50",
            groups = {ValidationGroups.OnCreate.class, ValidationGroups.OnUpdate.class})
    private String permissionName;

    /**
     * 权限编码，唯一标识，如 admin:user:list
     * <p>
     * 目录节点（type=1）仅作导航分组、不参与授权，编码允许为空；
     * 菜单、任务页与操作按钮必须填写。空串由服务层归一化为 null，
     * 避免多个目录节点的空串触发唯一索引冲突。
     * </p>
     */
    @Schema(description = "权限编码(目录可为空)")
    @Size(max = 100, message = "权限编码长度不能超过100",
            groups = {ValidationGroups.OnCreate.class, ValidationGroups.OnUpdate.class})
    @Pattern(regexp = "^$|^[A-Za-z][A-Za-z0-9:_-]*$", message = "权限编码以字母开头",
            groups = {ValidationGroups.OnCreate.class, ValidationGroups.OnUpdate.class})
    private String permissionCode;

    /**
     * 类型：1-目录，2-菜单，3-操作
     */
    @Schema(description = "类型：1-目录，2-菜单，3-操作")
    @NotNull(message = "请选择权限类型", groups = {ValidationGroups.OnCreate.class, ValidationGroups.OnUpdate.class})
    private Integer permissionType;

    /**
     * 菜单路径/路由，菜单类型时有效
     */
    @Schema(description = "菜单路径/路由")
    private String path;

    /**
     * 菜单图标名称
     */
    @Schema(description = "菜单图标")
    private String icon;

    /**
     * 前端组件路径，菜单类型时有效
     */
    @Schema(description = "前端组件路径")
    private String component;

    /**
     * 排序序号，越小越靠前
     */
    @Schema(description = "排序")
    private Integer sortOrder;

    /**
     * 是否可见：0-隐藏，1-显示
     */
    @Schema(description = "是否可见：0-隐藏，1-显示")
    private Integer visible;

    /**
     * 状态：0-禁用，1-正常
     */
    @Schema(description = "状态：0-禁用，1-正常")
    private Integer status;

    /**
     * 是否记录操作日志：0-不记录，1-记录
     */
    @Schema(description = "是否记录操作日志：0-不记录，1-记录")
    private Integer logFlag;

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

    /**
     * 子权限列表（非数据库字段）
     * <p>
     * 用于构建树形权限结构
     * </p>
     */
    @TableField(exist = false)
    private List<AdminPermissionEntity> children;
}
