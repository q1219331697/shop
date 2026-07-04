package com.shop.api.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;


import java.util.ArrayList;
import java.util.List;

/**
 * API模块配置属性
 * <p>
 * 从application.yml中读取app.api下的配置，包括JWT和认证相关配置
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.api")
public class ApiProperties {

    /**
     * JWT配置
     */
    private Jwt jwt = new Jwt();

    /**
     * 认证配置
     */
    private Auth auth = new Auth();

    @Data
    public static class Jwt {
        /**
         * 7天的毫秒数
         */
        private static final long SEVEN_DAYS_MS = 7L * 24 * 60 * 60 * 1000;

        /**
         * JWT密钥（生产环境必须修改为强密钥，≥32字符）
         */
        private String secret = "shop-secret-key-for-jwt-token-generation";

        /**
         * JWT过期时间（毫秒），默认7天
         */
        private Long expiration = SEVEN_DAYS_MS;
    }

    @Data
    public static class Auth {
        /**
         * 前缀匹配的放行路径列表（无需认证即可访问）
         */
        private List<String> permitPrefixPaths = new ArrayList<>();
    }
}
