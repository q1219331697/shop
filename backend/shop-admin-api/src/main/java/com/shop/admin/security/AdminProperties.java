package com.shop.admin.security;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

/**
 * 管理员配置属性
 * <p>
 * 从application.yml中读取app.admin下的配置，包括Token和认证相关配置
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.admin")
public class AdminProperties {

    /**
     * Token配置
     */
    private Token token = new Token();

    /**
     * 新建管理员账号时使用的默认密码（重置密码同样重置为该值）
     * <p>
     * 由application.yml中的app.admin.default-password配置注入
     * </p>
     */
    private String defaultPassword;

    /**
     * 认证配置
     */
    private Auth auth = new Auth();

    @Data
    public static class Token {
        /**
         * Token过期时间（Spring Boot Duration格式，如 2h, 30m, 1d）
         */
        private Duration expire = Duration.ofHours(2);
    }

    @Data
    public static class Auth {
        /**
         * 前缀匹配的放行路径列表（无需认证即可访问）
         */
        private List<String> permitPrefixPaths = new ArrayList<>();
    }

}
