package com.shop.admin.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shop.admin.entity.AdminUserEntity;
import com.shop.admin.service.AdminPermissionService;
import com.shop.admin.service.AdminUserService;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * 管理员认证过滤器
 * <p>
 * 支持多种认证方式（优先级从高到低）：
 * 1. Token请求头 - 已登录用户携带Token访问
 * 2. HTTP Basic认证 - Swagger UI授权弹窗输入用户名密码，验证后自动生成Token写入Redis
 * </p>
 *
 * @since 1.0.0
 */
@Slf4j
@Component
public class AdminAuthFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String BASIC_PREFIX = "Basic ";

    private final AdminTokenService adminTokenService;
    private final AdminPermissionService adminPermissionService;
    private final AdminUserService adminUserService;
    private final ObjectMapper objectMapper;
    private final AdminProperties adminProperties;

    public AdminAuthFilter(AdminTokenService adminTokenService,
                           AdminPermissionService adminPermissionService,
                           AdminUserService adminUserService,
                           ObjectMapper objectMapper,
                           AdminProperties adminProperties) {
        this.adminTokenService = adminTokenService;
        this.adminPermissionService = adminPermissionService;
        this.adminUserService = adminUserService;
        this.objectMapper = objectMapper;
        this.adminProperties = adminProperties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String requestURI = request.getRequestURI();

        // 放行白名单路径（无需认证即可访问）
        if (isPermittedPath(requestURI)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 1. 优先从Token请求头获取
        String token = extractToken(request);
        if (token != null) {
            if (authenticateByToken(token, request)) {
                filterChain.doFilter(request, response);
                return;
            }
            handleAuthFailure(response, "Token认证失败, URI: " + requestURI);
            return;
        }

        // 2. 尝试从Authorization: Basic头解析（Swagger UI授权弹窗）
        String basicCredentials = extractBasicCredentials(request);
        if (basicCredentials != null) {
            if (authenticateByBasic(basicCredentials, request, response)) {
                filterChain.doFilter(request, response);
                return;
            }
            handleAuthFailure(response, "Basic认证失败, URI: " + requestURI);
            return;
        }

        // 无任何认证信息，返回401
        handleAuthFailure(response, "未携带认证信息, URI: " + requestURI);
    }

    /**
     * 判断请求路径是否在白名单中
     *
     * @param requestURI 请求路径
     * @return true-在白名单中 false-不在白名单中
     */
    private boolean isPermittedPath(String requestURI) {
        return adminProperties.getAuth().getPermitPrefixPaths().stream()
                .anyMatch(requestURI::startsWith);
    }

    /**
     * 统一处理认证失败：记录日志并写入401响应
     *
     * @param response HTTP响应
     * @param message 失败信息
     * @throws IOException IO异常
     */
    private void handleAuthFailure(HttpServletResponse response, String message) throws IOException {
        log.info(message);
        writeUnauthorizedResponse(response);
    }

    /**
     * Token认证：验证Token有效性，刷新过期时间，设置请求属性
     *
     * @param token Token字符串
     * @param request HTTP请求
     * @return true-认证通过 false-认证失败
     */
    private boolean authenticateByToken(String token, HttpServletRequest request) {
        AdminTokenService.AdminTokenInfo tokenInfo = adminTokenService.validateAndGetInfo(token);
        if (tokenInfo == null) {
            return false;
        }

        // 检查用户状态
        AdminUserEntity adminUser = adminUserService.getById(tokenInfo.getAdminUserId());
        if (adminUser == null || adminUser.getStatus() == 0) {
            log.info("Token认证失败, 管理员不存在或已被禁用, adminUserId: {}", tokenInfo.getAdminUserId());
            adminTokenService.removeToken(token);
            return false;
        }

        // 刷新Token过期时间
        adminTokenService.refreshToken(token);

        // 将管理员信息和权限放入请求属性
        setAdminRequestAttributes(request, tokenInfo.getAdminUserId(), tokenInfo.getUsername());
        return true;
    }

    /**
     * Basic认证：解析用户名密码，验证后生成Token写入Redis，通过响应头返回Token
     *
     * @param credentials Base64解码后的用户名:密码
     * @param request HTTP请求
     * @param response HTTP响应
     * @return true-认证通过 false-认证失败
     */
    private boolean authenticateByBasic(String credentials, HttpServletRequest request,
                                        HttpServletResponse response) {
        String[] parts = credentials.split(":", 2);
        if (parts.length != 2) {
            log.warn("Basic认证凭据格式错误");
            return false;
        }

        String username = parts[0];
        String password = parts[1];

        if (!StringUtils.hasText(username) || !StringUtils.hasText(password)) {
            log.warn("Basic认证用户名或密码为空");
            return false;
        }

        // 查询并验证管理员
        AdminUserEntity adminUser = adminUserService.getByUsername(username);
        if (adminUser == null) {
            log.warn("Basic认证失败, 用户不存在, username: {}", username);
            return false;
        }
        if (!MessageDigest.isEqual(password.getBytes(StandardCharsets.UTF_8),
                adminUser.getPassword().getBytes(StandardCharsets.UTF_8))) {
            log.warn("Basic认证失败, 密码错误, username: {}", username);
            return false;
        }
        if (adminUser.getStatus() == 0) {
            log.warn("Basic认证失败, 用户已被禁用, username: {}", username);
            return false;
        }

        // 生成Token并写入Redis
        String token = adminTokenService.createToken(adminUser.getId(), adminUser.getUsername());
        log.info("Basic认证成功, adminUserId: {}, username: {}", adminUser.getId(), adminUser.getUsername());

        // 将管理员信息和权限放入请求属性
        setAdminRequestAttributes(request, adminUser.getId(), adminUser.getUsername());

        return true;
    }

    /**
     * 将管理员信息和权限列表放入请求属性
     *
     * @param request HTTP请求
     * @param adminUserId 管理员ID
     * @param username 管理员用户名
     */
    private void setAdminRequestAttributes(HttpServletRequest request, Long adminUserId, String username) {
        request.setAttribute("adminUserId", adminUserId);
        request.setAttribute("adminUsername", username);
        request.setAttribute("adminPermissions", adminPermissionService.getPermissionCodesByUserId(adminUserId));
    }

    /**
     * 从请求头中提取Token
     * <p>
     * 从标准 Authorization: Bearer 头提取（RFC 6750）
     * </p>
     *
     * @param request HTTP请求
     * @return Token字符串，无则返回null
     */
    private String extractToken(HttpServletRequest request) {
        String authorization = request.getHeader(AUTHORIZATION_HEADER);
        if (authorization != null && authorization.startsWith(BEARER_PREFIX)) {
            String token = authorization.substring(BEARER_PREFIX.length()).trim();
            if (StringUtils.hasText(token)) {
                return token;
            }
        }
        return null;
    }

    /**
     * 从Authorization头中提取Basic认证凭据
     *
     * @param request HTTP请求
     * @return Base64解码后的用户名:密码，无则返回null
     */
    private String extractBasicCredentials(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith(BASIC_PREFIX)) {
            return null;
        }
        String base64Credentials = authorization.substring(BASIC_PREFIX.length()).trim();
        try {
            byte[] decoded = Base64.getDecoder().decode(base64Credentials);
            return new String(decoded, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            log.warn("Basic认证Base64解码失败");
            return null;
        }
    }

    /**
     * 写入401未授权响应
     *
     * @param response HTTP响应
     * @throws IOException IO异常
     */
    private void writeUnauthorizedResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        Result<Void> result = Result.error(ResultCodeEnum.UNAUTHORIZED, "未登录或登录已过期");
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}