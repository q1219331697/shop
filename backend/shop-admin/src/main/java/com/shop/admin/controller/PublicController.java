
package com.shop.admin.controller;

import com.shop.admin.entity.AdminUserEntity;
import com.shop.admin.service.AdminUserService;
import com.shop.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

    private static final String TOKEN_HEADER = "Token";

    private final AdminUserService adminUserService;

    public PublicController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    /**
     * 管理员登录
     * <p>
     * 登录成功后返回Token，前端需将Token存入请求头后续请求使用
     * </p>
     *
     * @param adminUser 管理员登录信息
     * @param request HTTP请求
     * @param response HTTP响应
     * @return 登录结果（含Token）
     */
    @Operation(summary = "管理员登录")
    @PostMapping("/login")
    public Result<String> login(@RequestBody AdminUserEntity adminUser,
                                HttpServletRequest request,
                                HttpServletResponse response) {
        String ip = request.getRemoteAddr();
        Result<String> result = adminUserService.login(adminUser, ip);
        // 登录成功，将Token写入响应头，方便前端获取
        if (result.getData() != null) {
            response.setHeader(TOKEN_HEADER, result.getData());
        }
        return result;
    }

    /**
     * 管理员登出
     * <p>
     * 登出后从Redis中移除Token
     * </p>
     *
     * @param token Token字符串
     * @return 登出结果
     */
    @Operation(summary = "管理员登出")
    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader(value = TOKEN_HEADER, required = false) String token) {
        return adminUserService.logout(token);
    }
}
