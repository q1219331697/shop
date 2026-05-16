package com.shop.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.admin.entity.AdminPermissionEntity;
import com.shop.admin.entity.AdminUserEntity;
import com.shop.admin.service.AdminPermissionService;
import com.shop.admin.service.AdminUserService;
import com.shop.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
 * 后台管理用户控制器
 * @since 1.0.0
 */
@Tag(name = "后台-管理员管理", description = "后台管理员管理接口")
@RestController
@RequestMapping("/admin-user")
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private AdminPermissionService adminPermissionService;

    /**
     * 分页查询管理员列表
     */
    @Operation(summary = "分页查询管理员列表")
    @GetMapping("/list")
    public Result<IPage<AdminUserEntity>> list(
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size) {
        return Result.success(adminUserService.page(
                new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(current, size)));
    }

    /**
     * 获取管理员详情
     */
    @Operation(summary = "获取管理员详情")
    @GetMapping("/{id}")
    public Result<AdminUserEntity> getById(@PathVariable Long id) {
        return adminUserService.getAdminUserInfo(id);
    }

    /**
     * 创建管理员
     */
    @Operation(summary = "创建管理员")
    @PostMapping("/create")
    public Result<Void> create(@RequestBody AdminUserEntity adminUser) {
        return adminUserService.createAdminUser(adminUser);
    }

    /**
     * 更新管理员信息
     */
    @Operation(summary = "更新管理员信息")
    @PutMapping("/update")
    public Result<Void> update(@RequestBody AdminUserEntity adminUser) {
        return adminUserService.updateAdminUser(adminUser);
    }

    /**
     * 删除管理员
     */
    @Operation(summary = "删除管理员")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return adminUserService.removeById(id) ? Result.success() : Result.error("删除管理员失败");
    }

    /**
     * 为用户分配角色
     */
    @Operation(summary = "为用户分配角色")
    @PostMapping("/{id}/roles")
    public Result<Void> assignRoles(@PathVariable("id") Long userId,
                                    @RequestBody List<Long> roleIds) {
        return adminUserService.assignRoles(userId, roleIds);
    }

    /**
     * 获取用户的角色ID列表
     */
    @Operation(summary = "获取用户的角色ID列表")
    @GetMapping("/{id}/roles")
    public Result<List<Long>> getUserRoleIds(@PathVariable("id") Long userId) {
        return adminUserService.getUserRoleIds(userId);
    }

    /**
     * 获取当前登录用户的菜单树
     */
    @Operation(summary = "获取当前登录用户的菜单树")
    @GetMapping("/menus")
    public Result<List<AdminPermissionEntity>> getCurrentUserMenus(HttpServletRequest request) {
        Long adminUserId = (Long) request.getAttribute("adminUserId");
        List<AdminPermissionEntity> menus = adminPermissionService.getMenuTreeByUserId(adminUserId);
        return Result.success(menus);
    }

    /**
     * 获取当前登录用户的权限编码列表
     */
    @Operation(summary = "获取当前登录用户的权限编码列表")
    @GetMapping("/permissions")
    public Result<List<String>> getCurrentUserPermissions(HttpServletRequest request) {
        Long adminUserId = (Long) request.getAttribute("adminUserId");
        List<String> permissionCodes = adminPermissionService.getPermissionCodesByUserId(adminUserId);
        return Result.success(permissionCodes);
    }

}