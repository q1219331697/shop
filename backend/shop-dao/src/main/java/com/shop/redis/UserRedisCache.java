package com.shop.redis;

import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import com.shop.entity.UserEntity;

/**
 * 用户 Redis 缓存操作类
 *
 * @author shop
 * @since 1.0.0
 */
@Component
public class UserRedisCache {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 缓存用户信息
     * @param user 用户信息
     */
    public void cacheUser(UserEntity user) {
        if (user != null && user.getId() != null) {
            String key = "user:" + user.getId();
            redisTemplate.opsForValue().set(key, user, 1, TimeUnit.HOURS);
        }
    }

    /**
     * 获取缓存的用户信息
     * @param userId 用户ID
     * @return 用户信息
     */
    public UserEntity getCachedUser(Long userId) {
        if (userId == null) {
            return null;
        }
        String key = "user:" + userId;
        return (UserEntity) redisTemplate.opsForValue().get(key);
    }

    /**
     * 删除用户缓存
     * @param userId 用户ID
     */
    public void evictUserCache(Long userId) {
        if (userId != null) {
            String key = "user:" + userId;
            redisTemplate.delete(key);
        }
    }
}
