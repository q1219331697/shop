package com.shop.admin.dto;

import java.io.Serializable;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 权限列表查询入参
 * <p>
 * 用于合并后的 POST /permission/list：四个条件全为空时返回完整树；
 * 任一条件非空时返回「命中节点 + 其祖先链」构成的树（保结构，不做平铺，保持层级完整）。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Schema(description = "权限列表查询参数")
public class PermissionListRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 权限名称，模糊匹配
     */
    @Schema(description = "权限名称，模糊匹配")
    private String permissionName;

    /**
     * 权限编码，模糊匹配
     */
    @Schema(description = "权限编码，模糊匹配")
    private String permissionCode;

    /**
     * 权限类型：1-目录，2-菜单，3-操作
     */
    @Schema(description = "权限类型：1-目录，2-菜单，3-操作")
    private Integer permissionType;

    /**
     * 状态：0-禁用，1-正常。不传时默认只查正常节点
     */
    @Schema(description = "状态：0-禁用，1-正常。不传时默认只查正常节点")
    private Integer status;
}
