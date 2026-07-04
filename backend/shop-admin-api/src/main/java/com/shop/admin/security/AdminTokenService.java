package com.shop.admin.security;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
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
    private static final String VALUE_SEPARATOR = ":";
    private static final int MASK_MIN_TOKEN_LENGTH = 8;
    private static final int MASK_VISIBLE_CHARS = 4;

    private final AdminProperties adminProperties;
    private final StringRedisTemplate redisTemplate;

    public AdminTokenService(AdminProperties adminProperties, StringRedisTemplate redisTemplate) {
        this.adminProperties = adminProperties;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Token解析后的管理员信息
     */
    @Getter
    public static class AdminTokenInfo {
        private final Long adminUserId;
        private final String username;

        public AdminTokenInfo(Long adminUserId, String username) {
            this.adminUserId = adminUserId;
            this.username = username;
        }
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
        // 格式：adminUserId:username
        String value = adminUserId + VALUE_SEPARATOR + username;
        long expireSeconds = adminProperties.getToken().getExpire().toSeconds();
        redisTemplate.opsForValue().set(key, value, expireSeconds, TimeUnit.SECONDS);
        log.info("创建管理员Token, adminUserId: {}, username: {}", adminUserId, username);
        return token;
    }

    /**
     * 验证Token并获取管理员信息
     * <p>一次性从Redis获取值并解析，避免多次Redis访问间的竞态问题</p>
     * @param token token字符串
     * @return 管理员信息，Token无效返回null
     */
    public AdminTokenInfo validateAndGetInfo(String token) {
        String value = getTokenValue(token);
        if (value == null) {
            return null;
        }
        try {
            // 格式：adminUserId:username
            String[] parts = value.split(VALUE_SEPARATOR, 2);
            if (parts.length != 2) {
                log.warn("Token值格式异常: {}", maskToken(token));
                return null;
            }
            Long adminUserId = Long.valueOf(parts[0]);
            String username = parts[1];
            if (username.isEmpty()) {
                log.warn("Token中用户名为空: {}", maskToken(token));
                return null;
            }
            return new AdminTokenInfo(adminUserId, username);
        } catch (NumberFormatException e) {
            log.warn("Token中管理员ID格式异常: {}", maskToken(token));
            return null;
        }
    }

    /**
     * 验证Token是否有效
     * @param token token字符串
     * @return 是否有效
     */
    public boolean validateToken(String token) {
        return getTokenValue(token) != null;
    }

    /**
     * 刷新Token过期时间
     * @param token token字符串
     */
    public void refreshToken(String token) {
        String key = TOKEN_KEY_PREFIX + token;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
            redisTemplate.expire(key, adminProperties.getToken().getExpire().toSeconds(), TimeUnit.SECONDS);
        }
    }

    /**
     * 删除Token（登出）
     * @param token token字符串
     */
    public void removeToken(String token) {
        String key = TOKEN_KEY_PREFIX + token;
        redisTemplate.delete(key);
        log.info("删除管理员Token: {}", maskToken(token));
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

    /**
     * 对Token进行脱敏处理，显示前4位和后4位，中间用****替代
     * @param token 原始token
     * @return 脱敏后的token
     */
    private String maskToken(String token) {
        if (token == null || token.length() <= MASK_MIN_TOKEN_LENGTH) {
            return "****";
        }
        return token.substring(0, MASK_VISIBLE_CHARS) + "****"
                + token.substring(token.length() - MASK_VISIBLE_CHARS);
    }
}