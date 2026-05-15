package com.shop.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.shop.admin.entity.AdminUserEntity;
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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 后台管理用户控制器
 * @since 1.0.0
 */
@Tag(name = "后台-管理员管理", description = "后台管理员管理接口")
@RestController
@RequestMapping("/admin-user")
public class AdminUserController {

    private static final String TOKEN_HEADER = "Authorization";
    private static final String TOKEN_PREFIX = "Bearer ";

    @Autowired
    private AdminUserService adminUserService;

    /**
     * 管理员登录
     */
    @Operation(summary = "管理员登录")
    @PostMapping("/login")
    public Result<String> login(@RequestBody AdminUserEntity adminUser, HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        return adminUserService.login(adminUser, ip);
    }

    /**
     * 管理员登出
     */
    @Operation(summary = "管理员登出")
    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader(TOKEN_HEADER) String authorization) {
        String token = extractToken(authorization);
        return adminUserService.logout(token);
    }

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
     * 从Authorization头中提取Token
     * @param authorization Authorization请求头
     * @return token字符串
     */
    private String extractToken(String authorization) {
        if (authorization != null && authorization.startsWith(TOKEN_PREFIX)) {
            return authorization.substring(TOKEN_PREFIX.length());
        }
        return null;
    }
}