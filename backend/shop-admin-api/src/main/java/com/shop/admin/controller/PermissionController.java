package com.shop.admin.controller;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shop.admin.dto.IdRequest;
import com.shop.admin.dto.PermissionListRequest;
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
    @PostMapping("/menus")
    public Result<List<AdminPermissionEntity>> menus(HttpServletRequest request) {
        Long adminUserId = (Long) request.getAttribute("adminUserId");
        List<AdminPermissionEntity> menuTree = adminPermissionService.getMenuTreeByUserId(adminUserId);
        return Result.success(menuTree);
    }

    /**
     * 查询权限树列表
     * <p>
     * 合并原 /tree 与 /search 两个端点：无条件时返回完整树，
     * 有任一条件时返回「命中节点 + 其祖先链」构成的树，层级始终完整、不做平铺。
     * </p>
     *
     * @param request 查询条件，允许为空 body（此时返回完整树）
     * @return 树形权限列表
     */
    @PreAuthorize("hasAuthority('system:permission:list')")
    @Operation(summary = "查询权限树列表")
    @PostMapping("/list")
    public Result<List<AdminPermissionEntity>> list(@RequestBody(required = false) PermissionListRequest request) {
        return Result.success(adminPermissionService.listPermissions(request));
    }

    /**
     * 获取权限详情
     *
     * @param request 主键请求，含权限ID
     * @return 权限详情
     */
    @PreAuthorize("hasAuthority('system:permission:detail')")
    @Operation(summary = "获取权限详情")
    @PostMapping("/detail")
    public Result<AdminPermissionEntity> detail(@RequestBody @Validated IdRequest request) {
        return adminPermissionService.getPermissionDetail(request.getId());
    }

    /**
     * 创建权限
     *
     * @param permission 权限信息
     * @return 创建结果
     */
    @PreAuthorize("hasAuthority('system:permission:create')")
    @Operation(summary = "创建权限")
    @PostMapping("/create")
    public Result<Long> create(
            @RequestBody @Validated(ValidationGroups.OnCreate.class) AdminPermissionEntity permission) {
        return adminPermissionService.createPermission(permission);
    }

    /**
     * 更新权限
     *
     * @param permission 权限信息，id 置于请求体中
     * @return 更新结果
     */
    @PreAuthorize("hasAuthority('system:permission:update')")
    @Operation(summary = "更新权限")
    @PostMapping("/update")
    public Result<Void> update(
            @RequestBody @Validated(ValidationGroups.OnUpdate.class) AdminPermissionEntity permission) {
        return adminPermissionService.updatePermission(permission);
    }

    /**
     * 删除权限
     *
     * @param request 主键请求，含权限ID
     * @return 删除结果
     */
    @PreAuthorize("hasAuthority('system:permission:delete')")
    @Operation(summary = "删除权限")
    @PostMapping("/delete")
    public Result<Void> delete(@RequestBody @Validated IdRequest request) {
        return adminPermissionService.deletePermission(request.getId());
    }
}
