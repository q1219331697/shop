package com.shop.admin.controller;

import java.util.List;
import java.util.Map;

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

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.admin.entity.AdminPermissionEntity;
import com.shop.admin.entity.AdminUserEntity;
import com.shop.admin.service.AdminPermissionService;
import com.shop.admin.service.AdminRoleService;
import com.shop.admin.service.AdminUserService;
import com.shop.admin.validation.ValidationGroups;
import com.shop.admin.vo.AdminUserPermissionVo;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 管理员管理控制器
 *
 * @author shop
 * @since 1.0.0
 */
@Tag(name = "管理员管理", description = "管理员管理接口")
@RestController
@RequestMapping("/adminUser")
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private AdminPermissionService adminPermissionService;

    @Autowired
    private AdminRoleService adminRoleService;

    /**
     * 分页查询管理员列表
     *
     * @param pageNum 页码
     * @param pageSize 每页条数
     * @param username 用户名
     * @param realName 真实姓名
     * @param status 状态
     * @param deleted 是否删除
     * @return 管理员分页数据
     */
    @PreAuthorize("hasAuthority('system:admin:list')")
    @Operation(summary = "分页查询管理员列表")
    @GetMapping
    public Result<IPage<AdminUserEntity>> list(
            @RequestParam(defaultValue = "1") Long pageNum,
            @RequestParam(defaultValue = "10") Long pageSize,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String realName,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer deleted) {
        return adminUserService.pageAdminUser(pageNum, pageSize, username, realName, status, deleted);
    }

    /**
     * 获取管理员详情
     *
     * @param id 管理员ID
     * @return 管理员详情
     */
    @PreAuthorize("hasAuthority('system:admin:list')")
    @Operation(summary = "获取管理员详情")
    @GetMapping("/{id}")
    public Result<AdminUserEntity> getById(@PathVariable Long id) {
        return adminUserService.getAdminUserInfo(id);
    }

    /**
     * 创建管理员
     *
     * @param adminUser 管理员信息
     * @return 创建结果
     */
    @PreAuthorize("hasAuthority('system:admin:create')")
    @Operation(summary = "创建管理员")
    @PostMapping
    public Result<Void> create(@RequestBody @Validated(ValidationGroups.OnCreate.class) AdminUserEntity adminUser) {
        return adminUserService.createAdminUser(adminUser);
    }

    /**
     * 更新管理员信息
     *
     * @param id 管理员ID
     * @param adminUser 管理员信息
     * @return 更新结果
     */
    @PreAuthorize("hasAuthority('system:admin:update')")
    @Operation(summary = "更新管理员信息")
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id,
            @RequestBody @Validated(ValidationGroups.OnUpdate.class) AdminUserEntity adminUser) {
        adminUser.setId(id);
        return adminUserService.updateAdminUser(adminUser);
    }

    /**
     * 重置管理员密码为系统默认密码
     *
     * @param id 管理员ID
     * @return 重置结果
     */
    @PreAuthorize("hasAuthority('system:admin:update')")
    @Operation(summary = "重置管理员密码")
    @PutMapping("/{id}/reset-password")
    public Result<Void> resetPassword(@PathVariable Long id) {
        return adminUserService.resetPassword(id);
    }

    /**
     * 获取管理员默认密码（新增/重置密码提示用）
     *
     * @return 默认密码
     */
    @PreAuthorize("hasAuthority('system:admin:list')")
    @Operation(summary = "获取管理员默认密码")
    @GetMapping("/default-password")
    public Result<String> getDefaultPassword() {
        return Result.success(adminUserService.getDefaultPassword());
    }

    /**
     * 删除管理员（当前登录管理员自身会被静默过滤，不返回提示）
     *
     * @param id 管理员ID
     * @param request HTTP请求
     * @return 删除结果
     */
    @PreAuthorize("hasAuthority('system:admin:delete')")
    @Operation(summary = "删除管理员")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        return adminUserService.deleteAdminUser(id, currentAdminUserId(request));
    }

    /**
     * 批量删除管理员（当前登录管理员自身会被静默过滤，不返回提示）
     *
     * @param params 包含ids列表
     * @param request HTTP请求
     * @return 删除结果
     */
    @PreAuthorize("hasAuthority('system:admin:delete')")
    @Operation(summary = "批量删除管理员")
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody Map<String, List<Long>> params, HttpServletRequest request) {
        return adminUserService.batchDeleteAdminUser(params.get("ids"), currentAdminUserId(request));
    }

    /**
     * 为用户分配角色
     *
     * @param userId 管理员ID
     * @param params 包含roleIds列表
     * @return 分配结果
     */
    @PreAuthorize("hasAuthority('system:admin:update')")
    @Operation(summary = "为管理员分配角色")
    @PostMapping("/{id}/roles")
    public Result<Void> assignRoles(@PathVariable("id") Long userId,
                                    @RequestBody Map<String, List<Long>> params) {
        return adminUserService.assignRoles(userId, params.get("roleIds"));
    }

    /**
     * 获取用户的角色ID列表
     *
     * @param userId 管理员ID
     * @return 角色ID列表
     */
    @PreAuthorize("hasAuthority('system:admin:list')")
    @Operation(summary = "获取管理员的角色ID列表")
    @GetMapping("/{id}/roles")
    public Result<List<Long>> getUserRoleIds(@PathVariable("id") Long userId) {
        return adminUserService.getUserRoleIds(userId);
    }

    /**
     * 禁用管理员（当前登录管理员自身会被静默过滤，不返回提示）
     *
     * @param id 管理员ID
     * @param request HTTP请求
     * @return 禁用结果
     */
    @PreAuthorize("hasAuthority('system:admin:update')")
    @Operation(summary = "禁用管理员")
    @PutMapping("/{id}/disable")
    public Result<Void> disable(@PathVariable Long id, HttpServletRequest request) {
        return adminUserService.disableAdminUser(id, currentAdminUserId(request));
    }

    /**
     * 启用管理员
     *
     * @param id 管理员ID
     * @return 启用结果
     */
    @PreAuthorize("hasAuthority('system:admin:update')")
    @Operation(summary = "启用管理员")
    @PutMapping("/{id}/enable")
    public Result<Void> enable(@PathVariable Long id) {
        return adminUserService.enableAdminUser(id);
    }

    /**
     * 恢复已删除的管理员
     *
     * @param id 管理员ID
     * @return 恢复结果
     */
    @PreAuthorize("hasAuthority('system:admin:update')")
    @Operation(summary = "恢复已删除的管理员")
    @PutMapping("/{id}/restore")
    public Result<Void> restore(@PathVariable Long id) {
        return adminUserService.restoreAdminUser(id);
    }

    /**
     * 批量禁用管理员（当前登录管理员自身会被静默过滤，不返回提示）
     *
     * @param params 包含ids列表
     * @param request HTTP请求
     * @return 禁用结果
     */
    @PreAuthorize("hasAuthority('system:admin:update')")
    @Operation(summary = "批量禁用管理员")
    @PutMapping("/batch-disable")
    public Result<Void> batchDisable(@RequestBody Map<String, List<Long>> params, HttpServletRequest request) {
        return adminUserService.batchDisableAdminUser(params.get("ids"), currentAdminUserId(request));
    }

    /**
     * 批量启用管理员
     *
     * @param params 包含ids列表
     * @return 启用结果
     */
    @PreAuthorize("hasAuthority('system:admin:update')")
    @Operation(summary = "批量启用管理员")
    @PutMapping("/batch-enable")
    public Result<Void> batchEnable(@RequestBody Map<String, List<Long>> params) {
        return adminUserService.batchEnableAdminUser(params.get("ids"));
    }

    /**
     * 批量恢复已删除的管理员
     *
     * @param params 包含ids列表
     * @return 恢复结果
     */
    @PreAuthorize("hasAuthority('system:admin:update')")
    @Operation(summary = "批量恢复已删除的管理员")
    @PutMapping("/batch-restore")
    public Result<Void> batchRestore(@RequestBody Map<String, List<Long>> params) {
        return adminUserService.batchRestoreAdminUser(params.get("ids"));
    }

    /**
     * 获取当前登录用户的菜单树
     *
     * @param request HTTP请求
     * @return 菜单树列表
     */
    @Operation(summary = "获取当前登录管理员的菜单树")
    @GetMapping("/menus")
    public Result<List<AdminPermissionEntity>> getCurrentUserMenus(HttpServletRequest request) {
        List<AdminPermissionEntity> menus = adminPermissionService.getMenuTreeByUserId(currentAdminUserId(request));
        return Result.success(menus);
    }

    /**
     * 获取当前登录用户的权限编码列表
     *
     * @param request HTTP请求
     * @return 权限编码列表
     */
    @Operation(summary = "获取当前登录管理员的权限编码列表")
    @GetMapping("/permissions")
    public Result<List<String>> getCurrentUserPermissions(HttpServletRequest request) {
        List<String> codes = adminPermissionService.getPermissionCodesByUserId(currentAdminUserId(request));
        return Result.success(codes);
    }

    /**
     * 获取当前登录管理员信息（密码置空）
     * <p>Token 存 Cookie，刷新后前端需回后端取回「我是谁」，用于顶栏账号展示与自身保护判断。</p>
     *
     * @param request HTTP请求
     * @return 当前登录管理员信息
     */
    @Operation(summary = "获取当前登录管理员信息")
    @GetMapping("/current")
    public Result<AdminUserEntity> getCurrentUser(HttpServletRequest request) {
        return adminUserService.getAdminUserInfo(currentAdminUserId(request));
    }

    /**
     * 修改当前登录管理员的密码（自助改密，仅需登录态，无需额外权限）
     *
     * @param params  包含原密码 oldPassword 与新密码 newPassword
     * @param request HTTP请求
     * @return 修改结果
     */
    @Operation(summary = "修改当前登录管理员密码")
    @PutMapping("/password")
    public Result<Void> changePassword(@RequestBody Map<String, String> params, HttpServletRequest request) {
        return adminUserService.changePassword(currentAdminUserId(request),
                params.get("oldPassword"), params.get("newPassword"));
    }

    /**
     * 获取指定管理员的权限详情（角色+权限编码+菜单树）
     * <p>
     * 用于授权管理页面，查看管理员拥有的角色和权限全貌
     * </p>
     *
     * @param id 管理员ID
     * @return 权限详情
     */
    @PreAuthorize("hasAuthority('system:admin:list')")
    @Operation(summary = "获取管理员权限详情")
    @GetMapping("/{id}/permission-detail")
    public Result<AdminUserPermissionVo> getUserPermissionDetail(@PathVariable Long id) {
        AdminUserEntity adminUser = adminUserService.getById(id);
        if (adminUser == null) {
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }
        AdminUserPermissionVo vo = new AdminUserPermissionVo();
        vo.setUserId(id);
        vo.setUsername(adminUser.getUsername());
        vo.setRoles(adminRoleService.getRolesByUserId(id));
        vo.setPermissionCodes(adminPermissionService.getPermissionCodesByUserId(id));
        vo.setMenus(adminPermissionService.getMenuTreeByUserId(id));
        return Result.success(vo);
    }

    /**
     * 从请求属性中取当前登录管理员ID（由 AdminAuthFilter 在认证通过后写入）
     *
     * @param request HTTP请求
     * @return 当前登录管理员ID，未认证时为 null
     */
    private Long currentAdminUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("adminUserId");
    }

}