package com.shop.admin.controller;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.shop.admin.entity.AdminPermissionEntity;
import com.shop.admin.service.AdminPermissionService;
import com.shop.admin.validation.ValidationGroups;
import com.shop.common.Result;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 权限管理控制器
 *
 * @author shop
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
     * 搜索权限节点
     * <p>
     * 返回命中的节点列表（平铺，不做层级补全）；
     * 与无条件返回完整树的 /tree 分开，调用方按需选择。
     * </p>
     *
     * @param permissionName 权限名称，模糊匹配，可空
     * @param permissionCode 权限编码，模糊匹配，可空
     * @param permissionType 权限类型，精确匹配，可空
     * @param status 状态，精确匹配，可空
     * @return 命中的权限节点列表
     */
    @PreAuthorize("hasAuthority('system:permission:query')")
    @Operation(summary = "搜索权限节点（返回命中列表）")
    @GetMapping("/search")
    public Result<List<AdminPermissionEntity>> search(
            @RequestParam(required = false) String permissionName,
            @RequestParam(required = false) String permissionCode,
            @RequestParam(required = false) Integer permissionType,
            @RequestParam(required = false) Integer status) {
        return Result.success(adminPermissionService.searchPermissions(
                permissionName, permissionCode, permissionType, status));
    }

    /**
     * 获取权限详情
     *
     * @param id 权限ID
     * @return 权限详情
     */
    @PreAuthorize("hasAuthority('system:permission:detail')")
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
    public Result<Long> create(
            @RequestBody @Validated(ValidationGroups.OnCreate.class) AdminPermissionEntity permission) {
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
    public Result<Void> update(@PathVariable Long id,
            @RequestBody @Validated(ValidationGroups.OnUpdate.class) AdminPermissionEntity permission) {
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
