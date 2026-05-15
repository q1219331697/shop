package com.shop.admin.security;

import com.fasterxml.jackson.databind.ObjectMapper;
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

/**
 * 管理员认证过滤器
 * 校验请求中的Token，验证登录状态
 * @since 1.0.0
 */
@Slf4j
@Component
public class AdminAuthFilter extends OncePerRequestFilter {

    private static final String TOKEN_HEADER = "Authorization";
    private static final String TOKEN_PREFIX = "Bearer ";

    private final AdminTokenService adminTokenService;
    private final ObjectMapper objectMapper;

    public AdminAuthFilter(AdminTokenService adminTokenService, ObjectMapper objectMapper) {
        this.adminTokenService = adminTokenService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String requestURI = request.getRequestURI();

        // 放行登录接口
        if (requestURI.equals("/admin-user/login")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 放行Knife4j相关接口
        if (requestURI.startsWith("/doc.html") || requestURI.startsWith("/webjars/")
                || requestURI.startsWith("/v3/api-docs") || requestURI.startsWith("/swagger-resources")
                || requestURI.startsWith("/favicon.ico")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 获取Token
        String token = extractToken(request);
        if (token == null || !adminTokenService.validateToken(token)) {
            log.warn("管理员Token验证失败, URI: {}, token: {}", requestURI, token);
            writeUnauthorizedResponse(response);
            return;
        }

        // 刷新Token过期时间
        adminTokenService.refreshToken(token);

        // 将管理员信息放入请求属性
        Long adminUserId = adminTokenService.getAdminUserId(token);
        String username = adminTokenService.getUsername(token);
        request.setAttribute("adminUserId", adminUserId);
        request.setAttribute("adminUsername", username);

        filterChain.doFilter(request, response);
    }

    /**
     * 从请求头中提取Token
     * @param request HTTP请求
     * @return token字符串
     */
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(TOKEN_HEADER);
        if (bearerToken != null && bearerToken.startsWith(TOKEN_PREFIX)) {
            return bearerToken.substring(TOKEN_PREFIX.length());
        }
        return null;
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