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

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.admin.dto.AdminUserListRequest;
import com.shop.admin.dto.AssignRolesRequest;
import com.shop.admin.dto.ChangePasswordRequest;
import com.shop.admin.dto.IdRequest;
import com.shop.admin.dto.IdsRequest;
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
 * <p>
 * 全站 POST+JSON 改造后：所有端点统一为 POST，路径末段为动作语义；
 * 单资源动作的 id 置于 body，故路径不含路径参数。
 * </p>
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
     * @param request 查询参数（含分页与过滤）
     * @return 管理员分页数据
     */
    @PreAuthorize("hasAuthority('system:admin:list')")
    @Operation(summary = "分页查询管理员列表")
    @PostMapping("/list")
    public Result<IPage<AdminUserEntity>> list(@RequestBody AdminUserListRequest request) {
        return adminUserService.pageAdminUser(
                request.getPageNum(),
                request.getPageSize(),
                request.getUsername(),
                request.getRealName(),
                request.getStatus(),
                request.getDeleted());
    }

    /**
     * 获取管理员详情
     *
     * @param request 主键请求，含管理员ID
     * @return 管理员详情
     */
    @PreAuthorize("hasAuthority('system:admin:detail')")
    @Operation(summary = "获取管理员详情")
    @PostMapping("/detail")
    public Result<AdminUserEntity> detail(@RequestBody @Validated IdRequest request) {
        return adminUserService.getUserDetail(request.getId());
    }

    /**
     * 创建管理员
     *
     * @param adminUser 管理员信息
     * @return 创建结果
     */
    @PreAuthorize("hasAuthority('system:admin:create')")
    @Operation(summary = "创建管理员")
    @PostMapping("/create")
    public Result<Void> create(@RequestBody @Validated(ValidationGroups.OnCreate.class) AdminUserEntity adminUser) {
        return adminUserService.createAdminUser(adminUser);
    }

    /**
     * 更新管理员信息
     *
     * @param adminUser 管理员信息，id 置于请求体中
     * @return 更新结果
     */
    @PreAuthorize("hasAuthority('system:admin:update')")
    @Operation(summary = "更新管理员信息")
    @PostMapping("/update")
    public Result<Void> update(@RequestBody @Validated(ValidationGroups.OnUpdate.class) AdminUserEntity adminUser) {
        return adminUserService.updateAdminUser(adminUser);
    }

    /**
     * 删除管理员（当前登录管理员自身会被静默过滤，不返回提示）
     *
     * @param request 主键请求，含管理员ID
     * @param httpRequest HTTP请求
     * @return 删除结果
     */
    @PreAuthorize("hasAuthority('system:admin:delete')")
    @Operation(summary = "删除管理员")
    @PostMapping("/delete")
    public Result<Void> delete(@RequestBody @Validated IdRequest request, HttpServletRequest httpRequest) {
        return adminUserService.deleteAdminUser(request.getId(), currentAdminUserId(httpRequest));
    }

    /**
     * 批量删除管理员（当前登录管理员自身会被静默过滤，不返回提示）
     *
     * @param request 批量主键请求，含管理员ID列表
     * @param httpRequest HTTP请求
     * @return 删除结果
     */
    @PreAuthorize("hasAuthority('system:admin:delete')")
    @Operation(summary = "批量删除管理员")
    @PostMapping("/batch-delete")
    public Result<Void> batchDelete(@RequestBody IdsRequest request, HttpServletRequest httpRequest) {
        return adminUserService.batchDeleteAdminUser(request.getIds(), currentAdminUserId(httpRequest));
    }

    /**
     * 禁用管理员（当前登录管理员自身会被静默过滤，不返回提示）
     *
     * @param request 主键请求，含管理员ID
     * @param httpRequest HTTP请求
     * @return 禁用结果
     */
    @PreAuthorize("hasAuthority('system:admin:disable')")
    @Operation(summary = "禁用管理员")
    @PostMapping("/disable")
    public Result<Void> disable(@RequestBody @Validated IdRequest request, HttpServletRequest httpRequest) {
        return adminUserService.disableAdminUser(request.getId(), currentAdminUserId(httpRequest));
    }

    /**
     * 启用管理员
     *
     * @param request 主键请求，含管理员ID
     * @return 启用结果
     */
    @PreAuthorize("hasAuthority('system:admin:enable')")
    @Operation(summary = "启用管理员")
    @PostMapping("/enable")
    public Result<Void> enable(@RequestBody @Validated IdRequest request) {
        return adminUserService.enableAdminUser(request.getId());
    }

    /**
     * 恢复已删除的管理员
     *
     * @param request 主键请求，含管理员ID
     * @return 恢复结果
     */
    @PreAuthorize("hasAuthority('system:admin:restore')")
    @Operation(summary = "恢复已删除的管理员")
    @PostMapping("/restore")
    public Result<Void> restore(@RequestBody @Validated IdRequest request) {
        return adminUserService.restoreAdminUser(request.getId());
    }

    /**
     * 批量禁用管理员（当前登录管理员自身会被静默过滤，不返回提示）
     *
     * @param request 批量主键请求，含管理员ID列表
     * @param httpRequest HTTP请求
     * @return 禁用结果
     */
    @PreAuthorize("hasAuthority('system:admin:disable')")
    @Operation(summary = "批量禁用管理员")
    @PostMapping("/batch-disable")
    public Result<Void> batchDisable(@RequestBody IdsRequest request, HttpServletRequest httpRequest) {
        return adminUserService.batchDisableAdminUser(request.getIds(), currentAdminUserId(httpRequest));
    }

    /**
     * 批量启用管理员
     *
     * @param request 批量主键请求，含管理员ID列表
     * @return 启用结果
     */
    @PreAuthorize("hasAuthority('system:admin:enable')")
    @Operation(summary = "批量启用管理员")
    @PostMapping("/batch-enable")
    public Result<Void> batchEnable(@RequestBody IdsRequest request) {
        return adminUserService.batchEnableAdminUser(request.getIds());
    }

    /**
     * 批量恢复已删除的管理员
     *
     * @param request 批量主键请求，含管理员ID列表
     * @return 恢复结果
     */
    @PreAuthorize("hasAuthority('system:admin:restore')")
    @Operation(summary = "批量恢复已删除的管理员")
    @PostMapping("/batch-restore")
    public Result<Void> batchRestore(@RequestBody IdsRequest request) {
        return adminUserService.batchRestoreAdminUser(request.getIds());
    }

    /**
     * 为用户分配角色
     *
     * @param request 分配请求，含管理员ID与角色ID列表
     * @return 分配结果
     */
    @PreAuthorize("hasAuthority('system:admin:assign-role')")
    @Operation(summary = "为管理员分配角色")
    @PostMapping("/assign-roles")
    public Result<Void> assignRoles(@RequestBody @Validated AssignRolesRequest request) {
        return adminUserService.assignRoles(request.getId(), request.getRoleIds());
    }

    /**
     * 获取用户的角色ID列表
     *
     * @param request 主键请求，含管理员ID
     * @return 角色ID列表
     */
    @PreAuthorize("hasAuthority('system:admin:list')")
    @Operation(summary = "获取管理员的角色ID列表")
    @PostMapping("/role-ids")
    public Result<List<Long>> userRoleIds(@RequestBody @Validated IdRequest request) {
        return adminUserService.getUserRoleIds(request.getId());
    }

    /**
     * 重置管理员密码为系统默认密码
     *
     * @param request 主键请求，含管理员ID
     * @return 重置结果
     */
    @PreAuthorize("hasAuthority('system:admin:reset-password')")
    @Operation(summary = "重置管理员密码")
    @PostMapping("/reset-password")
    public Result<Void> resetPassword(@RequestBody @Validated IdRequest request) {
        return adminUserService.resetPassword(request.getId());
    }

    /**
     * 获取管理员默认密码（新增/重置密码提示用）
     *
     * @return 默认密码
     */
    @PreAuthorize("hasAuthority('system:admin:list')")
    @Operation(summary = "获取管理员默认密码")
    @PostMapping("/default-password")
    public Result<String> defaultPassword() {
        return Result.success(adminUserService.getDefaultPassword());
    }

    /**
     * 修改当前登录管理员的密码（自助改密，仅需登录态，无需额外权限）
     *
     * @param request 改密请求，含原密码与新密码
     * @param httpRequest HTTP请求
     * @return 修改结果
     */
    @Operation(summary = "修改当前登录管理员密码")
    @PostMapping("/change-password")
    public Result<Void> changePassword(@RequestBody ChangePasswordRequest request, HttpServletRequest httpRequest) {
        return adminUserService.changePassword(
                currentAdminUserId(httpRequest), request.getOldPassword(), request.getNewPassword());
    }

    /**
     * 获取当前登录用户的菜单树
     *
     * @param request HTTP请求
     * @return 菜单树列表
     */
    @Operation(summary = "获取当前登录管理员的菜单树")
    @PostMapping("/menus")
    public Result<List<AdminPermissionEntity>> currentUserMenus(HttpServletRequest request) {
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
    @PostMapping("/permissions")
    public Result<List<String>> currentUserPermissions(HttpServletRequest request) {
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
    @PostMapping("/current")
    public Result<AdminUserEntity> currentUser(HttpServletRequest request) {
        return adminUserService.getUserDetail(currentAdminUserId(request));
    }

    /**
     * 获取指定管理员的权限详情（角色+权限编码+菜单树）
     * <p>
     * 用于授权管理页面，查看管理员拥有的角色和权限全貌
     * </p>
     *
     * @param request 主键请求，含管理员ID
     * @return 权限详情
     */
    @PreAuthorize("hasAuthority('system:admin:list')")
    @Operation(summary = "获取管理员权限详情")
    @PostMapping("/permission-detail")
    public Result<AdminUserPermissionVo> userPermissionDetail(@RequestBody @Validated IdRequest request) {
        Long id = request.getId();
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
