
package com.shop.admin.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 通用分页查询VO
 * <p>
 * 用于分页查询的请求参数封装，提供基础的分页参数
 * </p>
 *
 * @since 1.0.0
 */
@Data
@Schema(description = "通用分页查询参数")
public class PageQueryVo implements Serializable {

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
}
