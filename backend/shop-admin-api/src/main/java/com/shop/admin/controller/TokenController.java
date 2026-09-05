package com.shop.admin.controller;

import com.shop.common.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Token管理控制器
 * <p>
 * 提供Token心跳续期接口，用于前端定时发送请求触发后端滑动过期续期。
 * 该接口需要认证（携带有效Token），但不需要特定权限（无@PreAuthorize注解），
 * 确保任何已登录用户都能调用。
 * </p>
 *
 * @since 1.0.0
 */
@Tag(name = "Token管理", description = "Token心跳续期接口")
@RestController
@RequestMapping("/token")
public class TokenController {

    @Operation(summary = "Token心跳续期", description = "前端定时调用此接口，触发后端滑动过期机制自动延长Token有效期")
    @GetMapping("/heartbeat")
    public Result<Void> heartbeat() {
        // 后端 AdminAuthFilter 在认证通过后已自动调用 refreshToken 延长过期时间
        // 此接口只需返回成功即可
        return Result.success();
    }
}
