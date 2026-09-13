package com.shop.admin.entity;

import java.io.Serializable;
import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 后台登录日志实体类
 * <p>
 * 对应数据库表 t_admin_login_log，用于存储后台管理系统的登录日志信息
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "后台登录日志实体")
@TableName("t_admin_login_log")
public class AdminLoginLogEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 日志ID，主键自增
     */
    @Schema(description = "日志ID")
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 管理用户ID
     */
    @Schema(description = "管理用户ID")
    private Long userId;

    /**
     * 用户名
     */
    @Schema(description = "用户名")
    private String username;

    /**
     * 登录IP地址
     */
    @Schema(description = "登录IP地址")
    private String ip;

    /**
     * 登录时间
     */
    @Schema(description = "登录时间")
    private LocalDateTime loginTime;

    /**
     * 是否成功：0-失败，1-成功
     */
    @Schema(description = "是否成功：0-失败，1-成功")
    private Integer success;

    /**
     * 提示信息
     */
    @Schema(description = "提示信息")
    private String message;

    /**
     * 创建时间，自动填充
     */
    @Schema(description = "创建时间")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}