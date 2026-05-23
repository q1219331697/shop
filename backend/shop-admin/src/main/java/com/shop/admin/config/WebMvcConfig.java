package com.shop.admin.config;

import com.shop.admin.security.RbacInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC配置类
 * <p>
 * 注册RBAC权限校验拦截器，对需要认证的路径进行权限校验，
 * 排除公开路径和Swagger文档路径
 * </p>
 *
 * @since 1.0.0
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final RbacInterceptor rbacInterceptor;

    public WebMvcConfig(RbacInterceptor rbacInterceptor) {
        this.rbacInterceptor = rbacInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rbacInterceptor)
                // 拦截需要认证的路径
                .addPathPatterns("/**")
                // 排除公开路径和文档路径
                .excludePathPatterns(
                        "/public/**",
                        "/favicon.ico",
                        "/doc.html",
                        "/webjars/**",
                        "/v3/api-docs/**",
                        "/swagger-resources/**",
                        "/swagger-ui/**",
                        "/api-docs/**",
                        "/actuator/**"
                );
    }
}
