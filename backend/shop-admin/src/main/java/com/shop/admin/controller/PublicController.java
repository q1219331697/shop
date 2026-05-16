
package com.shop.admin.controller;

import com.shop.admin.entity.AdminUserEntity;
import com.shop.admin.service.AdminUserService;
import com.shop.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 公开接口控制器
 * <p>
 * 无需认证即可访问的接口，路径前缀为/public/
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Tag(name = "后台-公开接口", description = "无需认证的公开接口")
@RestController
@RequestMapping("/public")
public class PublicController {

    private static final String TOKEN_HEADER = "Authorization";
    private static final String TOKEN_PREFIX = "Bearer ";

    private final AdminUserService adminUserService;

    public PublicController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    /**
     * 管理员登录
     */
    @Operation(summary = "管理员登录")
    @PostMapping("/login")
    public Result<String> login(@RequestBody AdminUserEntity adminUser,
                                HttpServletRequest request) {
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
