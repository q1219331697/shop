package com.shop.admin.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

/**
 * RBAC权限校验拦截器
 * <p>
 * 读取Controller方法或类上的 @RequirePermission 注解，
 * 校验当前登录用户是否拥有对应权限编码。
 * 无注解的方法默认放行。
 * </p>
 *
 * @since 1.1.0
 */
@Slf4j
@Component
public class RbacInterceptor implements HandlerInterceptor {

    private final ObjectMapper objectMapper;

    public RbacInterceptor(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                            Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        // 获取方法或类上的 @RequirePermission 注解（方法优先于类）
        RequirePermission methodAnnotation = handlerMethod.getMethodAnnotation(RequirePermission.class);
        RequirePermission classAnnotation = handlerMethod.getBeanType().getAnnotation(RequirePermission.class);
        RequirePermission annotation = Optional.ofNullable(methodAnnotation).orElse(classAnnotation);

        // 没有注解则放行
        if (annotation == null) {
            return true;
        }

        // 获取当前用户的权限编码列表
        @SuppressWarnings("unchecked")
        List<String> permissions = (List<String>) request.getAttribute("adminPermissions");
        if (permissions == null || permissions.isEmpty()) {
            log.warn("权限校验失败, 用户无任何权限, URI: {}, 需要权限: {}",
                    request.getRequestURI(), annotation.value());
            writeForbiddenResponse(response);
            return false;
        }

        // 校验权限编码
        String requiredCode = annotation.value();
        if (!permissions.contains(requiredCode)) {
            Long adminUserId = (Long) request.getAttribute("adminUserId");
            log.warn("权限校验失败, adminUserId: {}, 需要权限: {}, 用户权限: {}, URI: {}",
                    adminUserId, requiredCode, permissions, request.getRequestURI());
            writeForbiddenResponse(response);
            return false;
        }

        return true;
    }

    /**
     * 写入403禁止访问响应
     *
     * @param response HTTP响应
     * @throws IOException IO异常
     */
    private void writeForbiddenResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        Result<Void> result = ResultCodeEnum.FORBIDDEN.toResult();
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}
