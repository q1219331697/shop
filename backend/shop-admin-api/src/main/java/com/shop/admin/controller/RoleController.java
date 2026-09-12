package com.shop.admin.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shop.admin.entity.AdminRoleEntity;
import com.shop.admin.service.AdminRoleService;
import com.shop.admin.validation.ValidationGroups;
import com.shop.admin.vo.RolePageQueryVo;
import com.shop.common.Result;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 角色管理控制器
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
     * @param queryVo 查询参数
     * @return 角色分页数据
     */
    @PreAuthorize("hasAuthority('system:role:list')")
    @Operation(summary = "分页查询角色列表")
    @GetMapping
    public Result<IPage<AdminRoleEntity>> list(RolePageQueryVo queryVo) {
        Page<AdminRoleEntity> page = new Page<>(queryVo.getPageNum(), queryVo.getPageSize());
        LambdaQueryWrapper<AdminRoleEntity> wrapper = new LambdaQueryWrapper<>();
        if (queryVo.getRoleName() != null && !queryVo.getRoleName().isEmpty()) {
            wrapper.like(AdminRoleEntity::getRoleName, queryVo.getRoleName());
        }
        if (queryVo.getStatus() != null) {
            wrapper.eq(AdminRoleEntity::getStatus, queryVo.getStatus());
        }
        wrapper.orderByAsc(AdminRoleEntity::getSortOrder);
        return Result.success(adminRoleService.page(page, wrapper));
    }

    /**
     * 查询所有角色（下拉选择用）
     *
     * @return 所有角色列表
     */
    @PreAuthorize("hasAuthority('system:role:list')")
    @Operation(summary = "查询所有角色")
    @GetMapping("/all")
    public Result<List<AdminRoleEntity>> all() {
        return Result.success(adminRoleService.list());
    }

    /**
     * 获取角色详情
     *
     * @param id 角色ID
     * @return 角色详情
     */
    @PreAuthorize("hasAuthority('system:role:list')")
    @Operation(summary = "获取角色详情")
    @GetMapping("/{id}")
    public Result<AdminRoleEntity> getById(@PathVariable Long id) {
        return adminRoleService.getRoleInfo(id);
    }

    /**
     * 创建角色
     *
     * @param role 角色信息
     * @return 创建结果
     */
    @PreAuthorize("hasAuthority('system:role:create')")
    @Operation(summary = "创建角色")
    @PostMapping
    public Result<Void> create(@RequestBody @Validated(ValidationGroups.OnCreate.class) AdminRoleEntity role) {
        return adminRoleService.createRole(role);
    }

    /**
     * 更新角色
     *
     * @param id 角色ID
     * @param role 角色信息
     * @return 更新结果
     */
    @PreAuthorize("hasAuthority('system:role:update')")
    @Operation(summary = "更新角色")
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id,
            @RequestBody @Validated(ValidationGroups.OnUpdate.class) AdminRoleEntity role) {
        role.setId(id);
        return adminRoleService.updateRole(role);
    }

    /**
     * 删除角色
     *
     * @param id 角色ID
     * @return 删除结果
     */
    @PreAuthorize("hasAuthority('system:role:delete')")
    @Operation(summary = "删除角色")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return adminRoleService.deleteRole(id);
    }

    /**
     * 禁用角色
     *
     * @param id 角色ID
     * @return 禁用结果
     */
    @PreAuthorize("hasAuthority('system:role:update')")
    @Operation(summary = "禁用角色")
    @PutMapping("/{id}/disable")
    public Result<Void> disable(@PathVariable Long id) {
        return adminRoleService.disableRole(id);
    }

    /**
     * 启用角色
     *
     * @param id 角色ID
     * @return 启用结果
     */
    @PreAuthorize("hasAuthority('system:role:update')")
    @Operation(summary = "启用角色")
    @PutMapping("/{id}/enable")
    public Result<Void> enable(@PathVariable Long id) {
        return adminRoleService.enableRole(id);
    }

    /**
     * 批量禁用角色
     *
     * @param params 包含ids列表
     * @return 禁用结果
     */
    @PreAuthorize("hasAuthority('system:role:update')")
    @Operation(summary = "批量禁用角色")
    @PutMapping("/batch-disable")
    public Result<Void> batchDisable(@RequestBody Map<String, List<Long>> params) {
        return adminRoleService.batchDisableRole(params.get("ids"));
    }

    /**
     * 批量启用角色
     *
     * @param params 包含ids列表
     * @return 启用结果
     */
    @PreAuthorize("hasAuthority('system:role:update')")
    @Operation(summary = "批量启用角色")
    @PutMapping("/batch-enable")
    public Result<Void> batchEnable(@RequestBody Map<String, List<Long>> params) {
        return adminRoleService.batchEnableRole(params.get("ids"));
    }

    /**
     * 为角色分配权限
     *
     * @param roleId 角色ID
     * @param params 包含permissionIds列表
     * @return 分配结果
     */
    @PreAuthorize("hasAuthority('system:role:assign')")
    @Operation(summary = "为角色分配权限")
    @PostMapping("/{id}/permissions")
    public Result<Void> assignPermissions(@PathVariable("id") Long roleId,
                                          @RequestBody Map<String, List<Long>> params) {
        return adminRoleService.assignPermissions(roleId, params.get("permissionIds"));
    }

    /**
     * 获取角色的权限ID列表
     *
     * @param roleId 角色ID
     * @return 权限ID列表
     */
    @PreAuthorize("hasAuthority('system:role:list')")
    @Operation(summary = "获取角色的权限ID列表")
    @GetMapping("/{id}/permissions")
    public Result<List<Long>> getRolePermissionIds(@PathVariable("id") Long roleId) {
        return adminRoleService.getRolePermissionIds(roleId);
    }
}
