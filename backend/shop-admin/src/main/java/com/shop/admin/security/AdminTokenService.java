package com.shop.admin.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 管理员Token服务
 * 使用Token+Redis方式管理登录状态
 * @since 1.0.0
 */
@Slf4j
@Component
public class AdminTokenService {

    private static final String TOKEN_KEY_PREFIX = "admin:token:";

    @Value("${admin.token.expire-hours:24}")
    private int expireHours;

    private final StringRedisTemplate redisTemplate;

    public AdminTokenService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * 创建Token并存入Redis
     * @param adminUserId 管理员ID
     * @param username 用户名
     * @return token字符串
     */
    public String createToken(Long adminUserId, String username) {
        String token = UUID.randomUUID().toString().replace("-", "");
        String key = TOKEN_KEY_PREFIX + token;
        String value = adminUserId + ":" + username;
        redisTemplate.opsForValue().set(key, value, expireHours, TimeUnit.HOURS);
        log.info("创建管理员Token, adminUserId: {}, username: {}", adminUserId, username);
        return token;
    }

    /**
     * 验证Token是否有效
     * @param token token字符串
     * @return 是否有效
     */
    public boolean validateToken(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }
        String key = TOKEN_KEY_PREFIX + token;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * 从Token中获取管理员ID
     * @param token token字符串
     * @return 管理员ID，无效返回null
     */
    public Long getAdminUserId(String token) {
        String value = getTokenValue(token);
        if (value == null) {
            return null;
        }
        return Long.valueOf(value.split(":")[0]);
    }

    /**
     * 从Token中获取用户名
     * @param token token字符串
     * @return 用户名，无效返回null
     */
    public String getUsername(String token) {
        String value = getTokenValue(token);
        if (value == null) {
            return null;
        }
        return value.split(":")[1];
    }

    /**
     * 刷新Token过期时间
     * @param token token字符串
     */
    public void refreshToken(String token) {
        String key = TOKEN_KEY_PREFIX + token;
        redisTemplate.expire(key, expireHours, TimeUnit.HOURS);
    }

    /**
     * 删除Token（登出）
     * @param token token字符串
     */
    public void removeToken(String token) {
        String key = TOKEN_KEY_PREFIX + token;
        redisTemplate.delete(key);
        log.info("删除管理员Token");
    }

    /**
     * 获取Token存储的值
     * @param token token字符串
     * @return 存储值
     */
    private String getTokenValue(String token) {
        if (token == null || token.isEmpty()) {
            return null;
        }
        String key = TOKEN_KEY_PREFIX + token;
        return redisTemplate.opsForValue().get(key);
    }
}