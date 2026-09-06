
package com.shop.admin.controller;

import com.shop.admin.entity.AdminPermissionEntity;
import com.shop.admin.service.AdminPermissionService;
import org.springframework.security.access.prepost.PreAuthorize;
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
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 权限管理控制器
 * @since 1.0.0
 */
@Tag(name = "权限管理", description = "权限管理接口")
@RestController
@RequestMapping("/permission")
public class PermissionController {

    @Autowired
    private AdminPermissionService adminPermissionService;

    /**
     * 获取当前登录用户的菜单树
     * <p>
     * 根据用户角色动态返回有权限的菜单列表，用于前端动态生成侧边栏菜单和路由
     * </p>
     *
     * @param request HTTP请求（从请求属性中获取当前用户ID）
     * @return 当前用户的菜单树形列表
     */
    @Operation(summary = "获取当前用户菜单树")
    @GetMapping("/menus")
    public Result<List<AdminPermissionEntity>> menus(HttpServletRequest request) {
        Long adminUserId = (Long) request.getAttribute("adminUserId");
        List<AdminPermissionEntity> menuTree = adminPermissionService.getMenuTreeByUserId(adminUserId);
        return Result.success(menuTree);
    }

    /**
     * 获取权限树形结构
     *
     * @return 权限树形结构列表
     */
    @PreAuthorize("hasAuthority('system:permission:query')")
    @Operation(summary = "获取权限树形结构")
    @GetMapping("/tree")
    public Result<List<AdminPermissionEntity>> tree() {
        return adminPermissionService.getPermissionTree();
    }

    /**
     * 获取权限详情
     *
     * @param id 权限ID
     * @return 权限详情
     */
    @PreAuthorize("hasAuthority('system:permission:query')")
    @Operation(summary = "获取权限详情")
    @GetMapping("/{id}")
    public Result<AdminPermissionEntity> getById(@PathVariable Long id) {
        return adminPermissionService.getPermissionInfo(id);
    }

    /**
     * 创建权限
     *
     * @param permission 权限信息
     * @return 创建结果
     */
    @PreAuthorize("hasAuthority('system:permission:create')")
    @Operation(summary = "创建权限")
    @PostMapping
    public Result<Long> create(@RequestBody AdminPermissionEntity permission) {
        return adminPermissionService.createPermission(permission);
    }

    /**
     * 更新权限
     *
     * @param id 权限ID
     * @param permission 权限信息
     * @return 更新结果
     */
    @PreAuthorize("hasAuthority('system:permission:update')")
    @Operation(summary = "更新权限")
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody AdminPermissionEntity permission) {
        permission.setId(id);
        return adminPermissionService.updatePermission(permission);
    }

    /**
     * 删除权限
     *
     * @param id 权限ID
     * @return 删除结果
     */
    @PreAuthorize("hasAuthority('system:permission:delete')")
    @Operation(summary = "删除权限")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return adminPermissionService.deletePermission(id);
    }
}
