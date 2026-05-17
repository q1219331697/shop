
package com.shop.admin.controller;

import com.shop.admin.entity.AdminPermissionEntity;
import com.shop.admin.service.AdminPermissionService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 后台权限管理控制器
 * @since 1.1.0
 */
@Tag(name = "后台-权限管理", description = "后台权限管理接口")
@RestController
@RequestMapping("/admin/permission")
public class AdminPermissionController {

    @Autowired
    private AdminPermissionService adminPermissionService;

    /**
     * 获取权限树形结构
     *
     * @return 权限树形结构列表
     */
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
    @Operation(summary = "创建权限")
    @PostMapping("/create")
    public Result<Void> create(@RequestBody AdminPermissionEntity permission) {
        return adminPermissionService.createPermission(permission);
    }

    /**
     * 更新权限
     *
     * @param permission 权限信息
     * @return 更新结果
     */
    @Operation(summary = "更新权限")
    @PutMapping("/update")
    public Result<Void> update(@RequestBody AdminPermissionEntity permission) {
        return adminPermissionService.updatePermission(permission);
    }

    /**
     * 删除权限
     *
     * @param id 权限ID
     * @return 删除结果
     */
    @Operation(summary = "删除权限")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return adminPermissionService.deletePermission(id);
    }
}
