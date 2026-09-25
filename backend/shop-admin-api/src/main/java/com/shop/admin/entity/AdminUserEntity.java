package com.shop.admin.entity;

import java.io.Serializable;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
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
 * 后台管理用户实体类
 * <p>
 * 对应数据库表 t_admin_user，用于存储后台管理系统的用户信息
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "后台管理用户实体")
@TableName("t_admin_user")
public class AdminUserEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 管理用户ID，主键自增
     */
    @Schema(description = "管理用户ID")
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户名，唯一
     */
    @Schema(description = "用户名")
    @NotBlank(message = "请输入用户名",
            groups = {ValidationGroups.OnCreate.class, ValidationGroups.OnUpdate.class})
    @Size(max = 50, message = "用户名长度不能超过50",
            groups = {ValidationGroups.OnCreate.class, ValidationGroups.OnUpdate.class})
    private String username;

    /**
     * 密码
     * <p>
     * 新增管理员不传密码时由后端填充系统默认密码（见 app.admin.default-password）；
     * 若显式传入密码则仍需满足长度校验。
     * </p>
     */
    @Schema(description = "密码（可不传，不传时使用系统默认密码）")
    @Size(min = 4, max = 30, message = "密码长度需在4-30位之间",
            groups = {ValidationGroups.OnCreate.class, ValidationGroups.OnUpdate.class})
    private String password;

    /**
     * 姓名
     */
    @Schema(description = "姓名")
    @Size(max = 50, message = "姓名长度不能超过50", groups = {ValidationGroups.OnCreate.class, ValidationGroups.OnUpdate.class})
    private String realName;

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
     * 登录锁定状态（非数据库字段，取自Redis锁定键）：true-已锁定，false-未锁定
     */
    @Schema(description = "登录锁定：true-已锁定 false-未锁定")
    @TableField(exist = false)
    private Boolean locked;

    /**
     * 创建时间，自动填充
     */
    @Schema(description = "创建时间")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createDatetime;

    /**
     * 更新时间，自动填充
     */
    @Schema(description = "更新时间")
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateDatetime;
}