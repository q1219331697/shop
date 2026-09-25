package com.shop.admin.dto;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 登录日志列表查询入参
 * <p>
 * 承载登录日志列表的分页与过滤条件，以 JSON body 传入。
 * 分页字段自包含，不依赖任何 vo 包基类：全站请求入参统一归属 {@code dto} 包并以
 * {@code XxxRequest} 命名，反向依赖 vo 包会造成包职责倒置。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "登录日志分页查询参数")
public class LoginLogListRequest implements Serializable {

    /**
     * 默认每页条数
     */
    private static final Long DEFAULT_PAGE_SIZE = 10L;

    private static final long serialVersionUID = 1L;

    /**
     * 当前页码
     */
    @Schema(description = "当前页码", example = "1")
    private Long pageNum = 1L;

    /**
     * 每页条数
     */
    @Schema(description = "每页条数", example = "10")
    private Long pageSize = DEFAULT_PAGE_SIZE;

    /**
     * 用户名（模糊匹配）
     */
    @Schema(description = "用户名（模糊匹配）")
    private String username;

    /**
     * 登录IP（模糊匹配）
     */
    @Schema(description = "登录IP（模糊匹配）")
    private String ip;

    /**
     * 是否成功：0-失败，1-成功
     */
    @Schema(description = "是否成功：0-失败，1-成功")
    private Integer success;

    /**
     * 开始时间（yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss）
     */
    @Schema(description = "开始时间（yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss）")
    private String startTime;

    /**
     * 结束时间（yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss）
     */
    @Schema(description = "结束时间（yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss）")
    private String endTime;
}
