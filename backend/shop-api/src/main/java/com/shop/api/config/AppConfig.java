package com.shop.api.config;

import com.shop.util.JwtUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 应用配置类
 * <p>
 * 注册需要依赖应用配置的Bean
 * </p>
 *
 * @since 1.0.0
 */
@Configuration
public class AppConfig {

    /**
     * JWT工具类Bean
     * <p>
     * 从ApiProperties中读取JWT密钥和过期时间，构造JwtUtil实例
     * </p>
     *
     * @param apiProperties API模块配置
     * @return JwtUtil实例
     */
    @Bean
    public JwtUtil jwtUtil(ApiProperties apiProperties) {
        return new JwtUtil(
                apiProperties.getJwt().getSecret(),
                apiProperties.getJwt().getExpiration()
        );
    }
}
