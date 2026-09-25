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

    /**
     * 登录锁定配置（连续失败锁账号）
     */
    private Lock lock = new Lock();

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

    @Data
    public static class Lock {
        /**
         * 默认连续失败阈值
         */
        private static final int DEFAULT_MAX_FAIL_COUNT = 5;

        /**
         * 默认锁定时长（小时）：24 小时后自动解锁
         */
        private static final int DEFAULT_LOCK_HOURS = 24;

        /**
         * 连续登录失败达到该次数后锁定账号
         */
        private int maxFailCount = DEFAULT_MAX_FAIL_COUNT;

        /**
         * 锁定时长（Duration格式，如 24h、30m）；锁定键 TTL 到期即自动解锁，无需定时任务
         */
        private Duration duration = Duration.ofHours(DEFAULT_LOCK_HOURS);

        /**
         * 失败计数的保留时长，超过该时长未再失败则重新计数
         */
        private Duration failCountExpire = Duration.ofHours(DEFAULT_LOCK_HOURS);
    }

}
