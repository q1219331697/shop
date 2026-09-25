package com.shop.admin.dto;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 管理员列表查询入参（含分页）
 * <p>
 * 与 role / permission 的查询入参不同，此处保留 deleted：adminUser 通过
 * selectPageIgnoreDeleted 绕过 {@code @TableLogic}，deleted 是其真实可见的查询维度
 * （既有设计的不一致，本次只做传输层改造，不动该语义）。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "管理员列表查询参数")
public class AdminUserListRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 默认每页条数
     */
    private static final Long DEFAULT_PAGE_SIZE = 10L;

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
     * 用户名，模糊匹配
     */
    @Schema(description = "用户名，模糊匹配")
    private String username;

    /**
     * 真实姓名，模糊匹配
     */
    @Schema(description = "真实姓名，模糊匹配")
    private String realName;

    /**
     * 状态：0-禁用，1-正常
     */
    @Schema(description = "状态：0-禁用，1-正常")
    private Integer status;

    /**
     * 删除标记：0-未删除，1-已删除；不传则不按删除状态过滤
     */
    @Schema(description = "删除标记：0-未删除，1-已删除；不传则不按删除状态过滤")
    private Integer deleted;
}
