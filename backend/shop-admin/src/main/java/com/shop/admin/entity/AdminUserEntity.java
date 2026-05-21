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
    private String username;

    /**
     * 密码，BCrypt加密存储
     */
    @Schema(description = "密码")
    private String password;

    /**
     * 姓名
     */
    @Schema(description = "姓名")
    private String name;

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