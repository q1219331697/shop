
package com.shop.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.admin.entity.AdminRoleEntity;
import com.shop.admin.security.RequirePermission;
import com.shop.admin.service.AdminRoleService;
import com.shop.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 角色管理控制器
 * @since 1.1.0
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
     * @param current 当前页码
     * @param size 每页条数
     * @return 角色分页数据
     */
    @RequirePermission("system:role:query")
    @Operation(summary = "分页查询角色列表")
    @GetMapping("/list")
    public Result<IPage<AdminRoleEntity>> list(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size) {
        return Result.success(adminRoleService.page(
                new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(current, size)));
    }

    /**
     * 查询所有角色（下拉选择用）
     *
     * @return 所有角色列表
     */
    @RequirePermission("system:role:query")
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
    @RequirePermission("system:role:query")
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
    @RequirePermission("system:role:create")
    @Operation(summary = "创建角色")
    @PostMapping("/create")
    public Result<Void> create(@RequestBody AdminRoleEntity role) {
        return adminRoleService.createRole(role);
    }

    /**
     * 更新角色
     *
     * @param role 角色信息
     * @return 更新结果
     */
    @RequirePermission("system:role:update")
    @Operation(summary = "更新角色")
    @PutMapping("/update")
    public Result<Void> update(@RequestBody AdminRoleEntity role) {
        return adminRoleService.updateRole(role);
    }

    /**
     * 删除角色
     *
     * @param id 角色ID
     * @return 删除结果
     */
    @RequirePermission("system:role:delete")
    @Operation(summary = "删除角色")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return adminRoleService.deleteRole(id);
    }

    /**
     * 为角色分配权限
     *
     * @param roleId 角色ID
     * @param permissionIds 权限ID列表
     * @return 分配结果
     */
    @RequirePermission("system:role:assign")
    @Operation(summary = "为角色分配权限")
    @PostMapping("/{id}/permissions")
    public Result<Void> assignPermissions(@PathVariable("id") Long roleId,
                                          @RequestBody List<Long> permissionIds) {
        return adminRoleService.assignPermissions(roleId, permissionIds);
    }

    /**
     * 获取角色的权限ID列表
     *
     * @param roleId 角色ID
     * @return 权限ID列表
     */
    @RequirePermission("system:role:query")
    @Operation(summary = "获取角色的权限ID列表")
    @GetMapping("/{id}/permissions")
    public Result<List<Long>> getRolePermissionIds(@PathVariable("id") Long roleId) {
        return adminRoleService.getRolePermissionIds(roleId);
    }
}
