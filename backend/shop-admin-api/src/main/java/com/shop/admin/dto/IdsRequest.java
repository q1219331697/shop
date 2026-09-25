package com.shop.admin.dto;

import java.io.Serializable;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 批量主键请求入参
 * <p>
 * 承接 batch-delete / batch-disable / batch-enable / batch-restore 等批量操作，
 * 替代原先弱类型的 {@code Map<String, List<Long>>}（该写法无法生成 Swagger 文档，也无法做参数校验）。
 * </p>
 * <p>
 * 此处刻意不加非空校验：迁移前的 Map 写法同样是宽松的，本次只统一传输形式，不收紧业务约束。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "批量主键请求参数")
public class IdsRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID列表
     */
    @Schema(description = "主键ID列表", example = "[1, 2, 3]")
    private List<Long> ids;
}
