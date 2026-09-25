package com.shop.admin.controller;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shop.admin.entity.AdminUserEntity;
import com.shop.admin.security.AdminTokenService;
import com.shop.admin.service.AdminUserService;
import com.shop.common.Result;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 公开接口控制器
 * <p>
 * 无需认证即可访问的接口，路径前缀为/public/
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Tag(name = "公开接口", description = "无需认证的公开接口")
@RestController
@RequestMapping("/public")
public class PublicController {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final AdminUserService adminUserService;
    private final AdminTokenService adminTokenService;

    public PublicController(AdminUserService adminUserService,
                           AdminTokenService adminTokenService) {
        this.adminUserService = adminUserService;
        this.adminTokenService = adminTokenService;
    }

    /**
     * 管理员登录
     * <p>
     * 登录成功后返回Token，前端需将Token存入请求头后续请求使用
     * </p>
     *
     * @param adminUser 管理员登录信息
     * @param request HTTP请求
     * @return 登录结果（含Token）
     */
    @Operation(summary = "管理员登录")
    @PostMapping("/login")
    public Result<String> login(@RequestBody AdminUserEntity adminUser,
                                HttpServletRequest request) {
        String ip = getClientIp(request);
        return adminUserService.login(adminUser, ip);
    }

    /**
     * 管理员登出
     * <p>
     * 登出后从Redis中移除Token
     * </p>
     *
     * @param authorization 标准Authorization请求头
     * @param request HTTP请求
     * @return 登出结果
     */
    @Operation(summary = "管理员登出")
    @PostMapping("/logout")
    public Result<Void> logout(
            @RequestHeader(value = AUTHORIZATION_HEADER, required = false) String authorization,
            HttpServletRequest request) {
        String token = null;
        if (authorization != null && authorization.startsWith(BEARER_PREFIX)) {
            token = authorization.substring(BEARER_PREFIX.length()).trim();
        }
        if (token != null) {
            AdminTokenService.AdminTokenInfo tokenInfo = adminTokenService.validateAndGetInfo(token);
            if (tokenInfo != null) {
                request.setAttribute("adminUserId", tokenInfo.getAdminUserId());
                request.setAttribute("adminUsername", tokenInfo.getUsername());
            }
        }
        return adminUserService.logout(token);
    }

    /**
     * 刷新Token
     * <p>
     * 用于前端定时任务每25分钟调用一次，延长Token有效时间
     * </p>
     *
     * @param authorization 标准Authorization请求头
     * @return 刷新结果
     */
    @Operation(summary = "刷新Token")
    @PostMapping("/token/refresh")
    public Result<Void> refreshToken(
            @RequestHeader(value = AUTHORIZATION_HEADER, required = false) String authorization) {
        String token = null;
        if (authorization != null && authorization.startsWith(BEARER_PREFIX)) {
            token = authorization.substring(BEARER_PREFIX.length()).trim();
        }
        return adminUserService.refreshToken(token);
    }

    /**
     * 获取客户端真实IP地址
     * <p>
     * 前后端分离架构下，请求经过 Nginx/Vite 代理，
     * request.getRemoteAddr() 获取的是代理服务器 IP，
     * 需要从代理转发的请求头中获取真实客户端 IP。
     * </p>
     *
     * @param request HTTP请求
     * @return 客户端真实IP地址
     */
    private String getClientIp(HttpServletRequest request) {
        // 优先级：X-Real-IP > X-Forwarded-For 第一个 > remoteAddr
        String ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty() && !"unknown".equalsIgnoreCase(forwarded)) {
            // X-Forwarded-For: client, proxy1, proxy2 — 取第一个
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}