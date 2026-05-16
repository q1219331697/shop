package com.shop.admin.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shop.admin.entity.AdminUserEntity;
import com.shop.admin.service.AdminPermissionService;
import com.shop.admin.service.AdminUserService;
import com.shop.common.Result;
import com.shop.common.ResultCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 管理员认证过滤器
 * 校验请求中的Token，验证登录状态
 * @since 1.0.0
 */
@Slf4j
@Component
public class AdminAuthFilter extends OncePerRequestFilter {

    private static final String TOKEN_HEADER = "Token";
    private static final int AUTH_HEADER_LOG_MAX_LENGTH = 10;

    private final AdminTokenService adminTokenService;
    private final AdminPermissionService adminPermissionService;
    private final AdminUserService adminUserService;
    private final ObjectMapper objectMapper;
    private final AdminAuthProperties authProperties;

    public AdminAuthFilter(AdminTokenService adminTokenService,
                           AdminPermissionService adminPermissionService,
                           AdminUserService adminUserService,
                           ObjectMapper objectMapper,
                           AdminAuthProperties authProperties) {
        this.adminTokenService = adminTokenService;
        this.adminPermissionService = adminPermissionService;
        this.adminUserService = adminUserService;
        this.objectMapper = objectMapper;
        this.authProperties = authProperties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String requestURI = request.getRequestURI();

        // 放行白名单路径（无需认证即可访问）
        if (authProperties.getPermitPrefixPaths().stream()
                .anyMatch(requestURI::startsWith)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 获取Token
        String token = extractToken(request);
        log.debug("请求路径: {}, 提取到Token: {}", requestURI, token != null ? "是" : "否");

        if (token != null) {
            // 验证Token并获取管理员信息
            AdminTokenService.AdminTokenInfo tokenInfo = adminTokenService.validateAndGetInfo(token);
            if (tokenInfo != null && handleToken(token, tokenInfo, request)) {
                filterChain.doFilter(request, response);
                return;
            }
            // Token无效或用户被禁用，返回401
            log.info("管理员Token认证失败, URI: {}", requestURI);
            writeUnauthorizedResponse(response);
            return;
        }

        // 无Token，返回401
        log.info("未携带Token, URI: {}", requestURI);
        writeUnauthorizedResponse(response);
    }

    /**
     * 处理Token认证
     * @param token token字符串
     * @param tokenInfo token解析后的管理员信息
     * @param request HTTP请求
     * @return true-认证通过 false-认证失败（用户被禁用等）
     */
    private boolean handleToken(String token,
                                   AdminTokenService.AdminTokenInfo tokenInfo,
                                   HttpServletRequest request) {
        // 刷新Token过期时间
        adminTokenService.refreshToken(token);

        // 检查用户状态
        AdminUserEntity adminUser = adminUserService.getById(tokenInfo.getAdminUserId());
        if (adminUser == null || adminUser.getStatus() == 0) {
            log.info("Token认证失败, 管理员不存在或已被禁用, adminUserId: {}", tokenInfo.getAdminUserId());
            adminTokenService.removeToken(token);
            return false;
        }

        // 将管理员信息放入请求属性
        request.setAttribute("adminUserId", tokenInfo.getAdminUserId());
        request.setAttribute("adminUsername", tokenInfo.getUsername());

        // 加载用户权限列表放入请求属性
        List<String> permissionCodes = adminPermissionService.getPermissionCodesByUserId(tokenInfo.getAdminUserId());
        request.setAttribute("adminPermissions", permissionCodes);
        return true;
    }

    /**
     * 从请求头中提取Token
     * @param request HTTP请求
     * @return token字符串
     */
    private String extractToken(HttpServletRequest request) {
        String token = request.getHeader(TOKEN_HEADER);
        if (token == null || token.isEmpty()) {
            return null;
        }
        return token;
    }

    /**
     * 写入未授权响应
     * @param response HTTP响应
     */
    private void writeUnauthorizedResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        Result<Void> result = Result.error(ResultCode.OPERATION_FAILED, "未登录或登录已过期");
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}