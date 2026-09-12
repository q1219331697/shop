package com.shop.admin.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.shop.admin.security.AdminAuthFilter;

/**
 * Spring Security配置类
 * <p>
 * 认证层：所有路径统一放行，由AdminAuthFilter处理Bearer Token认证（含白名单与fail-close）。
 * 授权层：启用方法级安全，由Controller上的@PreAuthorize("hasAuthority('xxx')")进行权限校验。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final AdminAuthFilter adminAuthFilter;

    public SecurityConfig(AdminAuthFilter adminAuthFilter) {
        this.adminAuthFilter = adminAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 禁用CSRF
            .csrf(AbstractHttpConfigurer::disable)
            // 禁用form登录
            .formLogin(AbstractHttpConfigurer::disable)
            // 禁用HTTP Basic认证
            .httpBasic(AbstractHttpConfigurer::disable)
            // 禁用Session
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // 全部放行，由自定义过滤器处理认证
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            )
            // 管理员Token认证过滤器
            .addFilterBefore(adminAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
