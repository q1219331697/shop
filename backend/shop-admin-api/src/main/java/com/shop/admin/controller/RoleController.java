package com.shop.admin.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shop.admin.dto.IdRequest;
import com.shop.admin.dto.IdsRequest;
import com.shop.admin.dto.RoleAssignPermissionsRequest;
import com.shop.admin.dto.RoleListRequest;
import com.shop.admin.entity.AdminRoleEntity;
import com.shop.admin.service.AdminRoleService;
import com.shop.admin.validation.ValidationGroups;
import com.shop.common.Result;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 角色管理控制器
 * <p>
 * 全站 POST+JSON 改造后：所有端点统一为 POST，路径末段为动作语义；
 * 单资源动作的 id 置于 body，故路径不含路径参数。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Tag(name = "角色管理", description = "角色管理接口")
@RestController
@RequestMapping("/role")
public class RoleController {

    @Autowired
    private AdminRoleService adminRoleService;

    /**
     * 分页查询角色列表
     *
     * @param request 查询参数（含分页与过滤）
     * @return 角色分页数据
     */
    @PreAuthorize("hasAuthority('system:role:list')")
    @Operation(summary = "分页查询角色列表")
    @PostMapping("/list")
    public Result<IPage<AdminRoleEntity>> list(@RequestBody RoleListRequest request) {
        Page<AdminRoleEntity> page = new Page<>(request.getPageNum(), request.getPageSize());
        return Result.success(adminRoleService.page(page, buildListWrapper(request)));
    }

    /**
     * 查询所有角色（下拉选择用）
     *
     * @return 所有角色列表
     */
    @PreAuthorize("hasAuthority('system:role:list')")
    @Operation(summary = "查询所有角色")
    @PostMapping("/list-all")
    public Result<List<AdminRoleEntity>> listAll() {
        return Result.success(adminRoleService.list());
    }

    /**
     * 构建列表查询条件：角色名称模糊匹配，状态精确匹配
     *
     * @param request 查询条件
     * @return 查询条件构造器
     */
    private LambdaQueryWrapper<AdminRoleEntity> buildListWrapper(RoleListRequest request) {
        LambdaQueryWrapper<AdminRoleEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(request.getRoleName()), AdminRoleEntity::getRoleName, request.getRoleName());
        wrapper.eq(request.getStatus() != null, AdminRoleEntity::getStatus, request.getStatus());
        wrapper.orderByAsc(AdminRoleEntity::getSortOrder);
        return wrapper;
    }

    /**
     * 获取角色详情
     *
     * @param request 主键请求，含角色ID
     * @return 角色详情
     */
    @PreAuthorize("hasAuthority('system:role:detail')")
    @Operation(summary = "获取角色详情")
    @PostMapping("/detail")
    public Result<AdminRoleEntity> detail(@RequestBody @Validated IdRequest request) {
        return adminRoleService.getRoleDetail(request.getId());
    }

    /**
     * 创建角色
     *
     * @param role 角色信息
     * @return 创建结果
     */
    @PreAuthorize("hasAuthority('system:role:create')")
    @Operation(summary = "创建角色")
    @PostMapping("/create")
    public Result<Void> create(@RequestBody @Validated(ValidationGroups.OnCreate.class) AdminRoleEntity role) {
        return adminRoleService.createRole(role);
    }

    /**
     * 更新角色
     *
     * @param role 角色信息，id 置于请求体中
     * @return 更新结果
     */
    @PreAuthorize("hasAuthority('system:role:update')")
    @Operation(summary = "更新角色")
    @PostMapping("/update")
    public Result<Void> update(@RequestBody @Validated(ValidationGroups.OnUpdate.class) AdminRoleEntity role) {
        return adminRoleService.updateRole(role);
    }

    /**
     * 删除角色
     *
     * @param request 主键请求，含角色ID
     * @return 删除结果
     */
    @PreAuthorize("hasAuthority('system:role:delete')")
    @Operation(summary = "删除角色")
    @PostMapping("/delete")
    public Result<Void> delete(@RequestBody @Validated IdRequest request) {
        return adminRoleService.deleteRole(request.getId());
    }

    /**
     * 禁用角色
     *
     * @param request 主键请求，含角色ID
     * @return 禁用结果
     */
    @PreAuthorize("hasAuthority('system:role:disable')")
    @Operation(summary = "禁用角色")
    @PostMapping("/disable")
    public Result<Void> disable(@RequestBody @Validated IdRequest request) {
        return adminRoleService.disableRole(request.getId());
    }

    /**
     * 启用角色
     *
     * @param request 主键请求，含角色ID
     * @return 启用结果
     */
    @PreAuthorize("hasAuthority('system:role:enable')")
    @Operation(summary = "启用角色")
    @PostMapping("/enable")
    public Result<Void> enable(@RequestBody @Validated IdRequest request) {
        return adminRoleService.enableRole(request.getId());
    }

    /**
     * 批量禁用角色
     *
     * @param request 批量主键请求，含角色ID列表
     * @return 禁用结果
     */
    @PreAuthorize("hasAuthority('system:role:disable')")
    @Operation(summary = "批量禁用角色")
    @PostMapping("/batch-disable")
    public Result<Void> batchDisable(@RequestBody IdsRequest request) {
        return adminRoleService.batchDisableRole(request.getIds());
    }

    /**
     * 批量启用角色
     *
     * @param request 批量主键请求，含角色ID列表
     * @return 启用结果
     */
    @PreAuthorize("hasAuthority('system:role:enable')")
    @Operation(summary = "批量启用角色")
    @PostMapping("/batch-enable")
    public Result<Void> batchEnable(@RequestBody IdsRequest request) {
        return adminRoleService.batchEnableRole(request.getIds());
    }

    /**
     * 为角色分配权限
     *
     * @param request 分配请求，含角色ID与权限ID列表
     * @return 分配结果
     */
    @PreAuthorize("hasAuthority('system:role:assign')")
    @Operation(summary = "为角色分配权限")
    @PostMapping("/assign-permissions")
    public Result<Void> assignPermissions(@RequestBody @Validated RoleAssignPermissionsRequest request) {
        return adminRoleService.assignPermissions(request.getId(), request.getPermissionIds());
    }

    /**
     * 获取角色的权限ID列表
     *
     * @param request 主键请求，含角色ID
     * @return 权限ID列表
     */
    @PreAuthorize("hasAuthority('system:role:list')")
    @Operation(summary = "获取角色的权限ID列表")
    @PostMapping("/permission-ids")
    public Result<List<Long>> rolePermissionIds(@RequestBody @Validated IdRequest request) {
        return adminRoleService.getRolePermissionIds(request.getId());
    }
}
