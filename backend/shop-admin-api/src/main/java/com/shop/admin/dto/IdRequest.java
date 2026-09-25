package com.shop.admin.dto;

import java.io.Serializable;

import jakarta.validation.constraints.NotNull;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 单主键请求入参
 * <p>
 * 全站 POST+JSON 改造后，原先拼在 URL 路径上的 id 统一移入 body，由本类承接。
 * 适用于 detail / delete / disable / enable / restore / reset-password 等单资源动作。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "单主键请求参数")
public class IdRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @NotNull(message = "id不能为空")
    @Schema(description = "主键ID", example = "1")
    private Long id;
}
