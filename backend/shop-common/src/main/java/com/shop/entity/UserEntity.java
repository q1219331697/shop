package com.shop.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户实体类
 * <p>
 * 对应数据库表 t_user，用于存储前台用户信息
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "用户实体")
@TableName("t_user")
public class UserEntity implements Serializable {

    @Serial
    private static final long serialVersionUID = -8383789023495098564L;

    /**
     * 用户ID，主键自增
     */
    @Schema(description = "用户ID")
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
     * 昵称
     */
    @Schema(description = "昵称")
    private String nickname;

    /**
     * 手机号
     */
    @Schema(description = "手机号")
    private String phone;

    /**
     * 邮箱
     */
    @Schema(description = "邮箱")
    private String email;

    /**
     * 头像URL
     */
    @Schema(description = "头像")
    private String avatar;

    /**
     * 状态：0-禁用，1-正常，2-锁定
     */
    @Schema(description = "状态：0-禁用，1-正常，2-锁定")
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
