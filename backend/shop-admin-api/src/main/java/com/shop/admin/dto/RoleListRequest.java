package com.shop.admin.dto;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 角色列表查询入参（含分页）
 * <p>
 * 合并原 RolePageQueryVo 及其父类 PageQueryVo：继承层级对分页查询没有实际收益，
 * 改为扁平结构后由 {@code dto} 包统一承接全站 POST 请求的入参。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "角色列表查询参数")
public class RoleListRequest implements Serializable {

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
     * 角色名称（模糊查询）
     */
    @Schema(description = "角色名称（模糊查询）")
    private String roleName;

    /**
     * 状态（0-禁用 1-启用）
     */
    @Schema(description = "状态（0-禁用 1-启用）")
    private Integer status;
}
