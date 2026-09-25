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
 * 后台操作日志实体类
 * <p>
 * 对应数据库表 t_admin_operation_log，用于记录后台管理系统的操作日志
 * （登录、登出、新增、修改、删除、查询等），由 {@code OperationLogAspect} 自动写入。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "后台操作日志实体")
@TableName("t_admin_operation_log")
public class AdminOperationLogEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 日志ID，主键自增
     */
    @Schema(description = "日志ID")
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 操作人ID
     */
    @Schema(description = "操作人ID")
    private Long userId;

    /**
     * 操作人用户名
     */
    @Schema(description = "操作人用户名")
    private String username;

    /**
     * 操作类型：1-登录，2-登出，3-新增，4-修改，5-删除，6-查询，7-其它
     */
    @Schema(description = "操作类型：1-登录，2-登出，3-新增，4-修改，5-删除，6-查询，7-其它")
    private Integer operationType;

    /**
     * 所属模块（菜单名称）
     */
    @Schema(description = "所属模块")
    private String module;

    /**
     * 操作名称（取自接口 @Operation 的 summary）
     */
    @Schema(description = "操作名称")
    private String operation;

    /**
     * 操作对应的权限编码
     */
    @Schema(description = "权限编码")
    private String permissionCode;

    /**
     * HTTP请求方法
     */
    @Schema(description = "HTTP请求方法")
    private String requestMethod;

    /**
     * 请求URI
     */
    @Schema(description = "请求URI")
    private String requestUri;

    /**
     * 类#方法（Controller 方法签名）
     */
    @Schema(description = "类#方法")
    private String classMethod;

    /**
     * 请求参数（敏感字段已脱敏，超长截断）
     */
    @Schema(description = "请求参数（已脱敏）")
    private String requestParams;

    /**
     * 响应结果（敏感字段已脱敏，超长截断）
     */
    @Schema(description = "响应结果（已脱敏）")
    private String responseData;

    /**
     * 操作IP
     */
    @Schema(description = "操作IP")
    private String ip;

    /**
     * 耗时（毫秒）
     */
    @Schema(description = "耗时(毫秒)")
    private Integer duration;

    /**
     * 是否成功：0-失败，1-成功
     */
    @Schema(description = "是否成功：0-失败，1-成功")
    private Integer success;

    /**
     * 失败原因/错误消息
     */
    @Schema(description = "失败原因")
    private String message;

    /**
     * 操作时间
     */
    @Schema(description = "操作时间")
    private LocalDateTime operationTime;

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
