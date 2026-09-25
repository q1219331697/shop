package com.shop.admin.security;

import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * 管理员登录锁定服务
 * <p>
 * 以 Redis 承载登录失败计数与账号锁定状态，共三类键：
 * 1. 失败计数键 {@code admin:login:fail:{username}}：每次密码错误递增，达到阈值后写入锁定键并清除自身；
 * 2. 锁定键 {@code admin:login:lock:{username}}：TTL 即自动解锁机制，到期自动解锁，无需定时任务；
 * 3. 失败日志降噪键 {@code admin:login:log:dedup:{username}:{ip}}：60 秒内同账号同 IP 只落一条日志，
 *    避免暴力破解把日志表刷爆。
 * </p>
 * <p>
 * 仅对「用户存在但密码错误」计数：用户不存在不写 Redis，防止攻击者用海量随机用户名撑爆内存。
 * </p>
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Component
public class AdminLoginLockService {

    private static final String FAIL_KEY_PREFIX = "admin:login:fail:";
    private static final String LOCK_KEY_PREFIX = "admin:login:lock:";
    private static final String LOG_DEDUP_KEY_PREFIX = "admin:login:log:dedup:";
    private static final String KEY_SEPARATOR = ":";
    private static final String LOCK_VALUE = "1";

    /** 失败日志降噪窗口（秒） */
    private static final long LOG_DEDUP_SECONDS = 60L;

    private final AdminProperties adminProperties;
    private final StringRedisTemplate redisTemplate;

    public AdminLoginLockService(AdminProperties adminProperties, StringRedisTemplate redisTemplate) {
        this.adminProperties = adminProperties;
        this.redisTemplate = redisTemplate;
    }

    /**
     * 判断账号是否处于锁定状态
     *
     * @param username 用户名
     * @return true-已锁定 false-未锁定
     */
    public boolean isLocked(String username) {
        if (!StringUtils.hasText(username)) {
            return false;
        }
        return Boolean.TRUE.equals(redisTemplate.hasKey(lockKey(username)));
    }

    /**
     * 获取锁定剩余秒数
     *
     * @param username 用户名
     * @return 剩余秒数；未锁定或键无过期时间时返回 0
     */
    public long getLockRemainSeconds(String username) {
        if (!StringUtils.hasText(username)) {
            return 0L;
        }
        Long ttl = redisTemplate.getExpire(lockKey(username));
        return ttl == null || ttl < 0 ? 0L : ttl;
    }

    /**
     * 登录失败计数递增
     * <p>
     * 首次递增时设置计数键过期时间（滚动窗口）；次数达到阈值时写入锁定键并清除计数键。
     * </p>
     *
     * @param username 用户名
     * @return 递增后的失败次数
     */
    public int incrementFail(String username) {
        String key = failKey(username);
        Long count = redisTemplate.opsForValue().increment(key);
        if (count == null) {
            return 0;
        }
        if (count == 1L) {
            redisTemplate.expire(key, adminProperties.getLock().getFailCountExpire().toSeconds(), TimeUnit.SECONDS);
        }
        if (count >= adminProperties.getLock().getMaxFailCount()) {
            lock(username);
        }
        return count.intValue();
    }

    /**
     * 登录成功后清除失败计数
     *
     * @param username 用户名
     */
    public void clearFail(String username) {
        if (!StringUtils.hasText(username)) {
            return;
        }
        redisTemplate.delete(failKey(username));
    }

    /**
     * 解除锁定（后台管理员手动解锁）
     * <p>
     * 同时删除锁定键与失败计数键，解锁后账号立即可登录。
     * </p>
     *
     * @param username 用户名
     */
    public void unlock(String username) {
        if (!StringUtils.hasText(username)) {
            return;
        }
        redisTemplate.delete(lockKey(username));
        redisTemplate.delete(failKey(username));
        log.info("管理员账号已解锁, username: {}", username);
    }

    /**
     * 失败日志降噪：判断本次失败是否需要跳过日志记录
     * <p>
     * 60 秒窗口内同一账号 + 同一 IP 的失败只记录一次；首次调用返回 false（可记录），
     * 窗口内再次调用返回 true（跳过）。
     * </p>
     *
     * @param username 用户名
     * @param ip 客户端IP
     * @return true-跳过记录 false-可以记录
     */
    public boolean shouldSkipFailLog(String username, String ip) {
        String key = LOG_DEDUP_KEY_PREFIX + username + KEY_SEPARATOR + ip;
        Boolean absent = redisTemplate.opsForValue()
                .setIfAbsent(key, LOCK_VALUE, LOG_DEDUP_SECONDS, TimeUnit.SECONDS);
        return !Boolean.TRUE.equals(absent);
    }

    /**
     * 写入锁定键并清除失败计数
     *
     * @param username 用户名
     */
    private void lock(String username) {
        long seconds = adminProperties.getLock().getDuration().toSeconds();
        redisTemplate.opsForValue().set(lockKey(username), LOCK_VALUE, seconds, TimeUnit.SECONDS);
        redisTemplate.delete(failKey(username));
        log.info("管理员账号已锁定, username: {}, lockSeconds: {}", username, seconds);
    }

    /**
     * 构建失败计数键
     *
     * @param username 用户名
     * @return Redis键
     */
    private String failKey(String username) {
        return FAIL_KEY_PREFIX + username;
    }

    /**
     * 构建锁定键
     *
     * @param username 用户名
     * @return Redis键
     */
    private String lockKey(String username) {
        return LOCK_KEY_PREFIX + username;
    }
}
