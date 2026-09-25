package com.shop.admin.service.impl;

import java.util.Set;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shop.admin.mapper.AdminPermissionMapper;
import com.shop.admin.mapper.AdminRoleMapper;
import com.shop.admin.mapper.AdminRolePermissionMapper;
import com.shop.admin.mapper.AdminUserMapper;
import com.shop.admin.mapper.AdminUserRoleMapper;
import com.shop.admin.service.TestDataCleanupService;
import com.shop.common.Result;

import lombok.extern.slf4j.Slf4j;

/**
 * E2E 测试数据清理服务实现类
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Service
public class TestDataCleanupServiceImpl implements TestDataCleanupService {

    /** E2E 测试数据固定前缀（安全校验白名单，只允许清理该前缀数据）
     * 命名规则：e2e-「用例ID」-「唯一后缀」（中杠非 SQL LIKE 通配符，前缀匹配更精确） */
    private static final String E2E_PREFIX = "e2e-";

    /**
     * 登录锁定相关 Redis 键模式（E2E 清理用）：失败计数 / 账号锁定 / 失败日志降噪
     * <p>
     * 占位符 {prefix} 由当次清理前缀替换：只清本用例造的数据，
     * 避免并发 worker 上其它用例的清理把本用例正在累积的失败计数清掉。
     * </p>
     */
    private static final String[] LOGIN_LOCK_KEY_PATTERNS = {
            "admin:login:fail:{prefix}*", "admin:login:lock:{prefix}*", "admin:login:log:dedup:{prefix}*",
    };

    /** 前缀占位符 */
    private static final String PREFIX_PLACEHOLDER = "{prefix}";

    /**
     * 内置管理员账号的登录锁定键（不在 e2e- 前缀下，需单独重置）
     * <p>
     * 错误密码类用例用的是内置 admin，失败计数会跨轮累积；
     * 24 小时内跑满阈值会锁死 admin 导致整套用例登录失败，故随清理一并重置。
     * </p>
     */
    private static final String[] BUILTIN_ACCOUNT_LOCK_KEYS = {
            "admin:login:fail:admin", "admin:login:lock:admin",
    };

    private final AdminUserMapper userMapper;
    private final AdminRoleMapper roleMapper;
    private final AdminUserRoleMapper userRoleMapper;
    private final AdminRolePermissionMapper rolePermissionMapper;
    private final AdminPermissionMapper permissionMapper;
    private final StringRedisTemplate redisTemplate;

    public TestDataCleanupServiceImpl(AdminUserMapper userMapper,
                                      AdminRoleMapper roleMapper,
                                      AdminUserRoleMapper userRoleMapper,
                                      AdminRolePermissionMapper rolePermissionMapper,
                                      AdminPermissionMapper permissionMapper,
                                      StringRedisTemplate redisTemplate) {
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.userRoleMapper = userRoleMapper;
        this.rolePermissionMapper = rolePermissionMapper;
        this.permissionMapper = permissionMapper;
        this.redisTemplate = redisTemplate;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> cleanupE2EData(String prefix) {
        // 安全校验：必须显式指定以 e2e- 开头的前缀，禁止无前缀调用（避免误删所有模块数据）
        // 按用例清理：传 e2e-<用例ID>- 可一次清掉该用例在用户/角色/权限各模块的造数
        if (prefix == null || !prefix.startsWith(E2E_PREFIX)) {
            log.warn("E2E 测试数据清理被拒绝：前缀不合法 prefix={}", prefix);
            return Result.error("清理前缀必须以 e2e- 开头");
        }

        // 删除对应前缀用户的角色关联
        int userRoleDeleted = userRoleMapper.deleteByUsernamePrefix(prefix);
        // 删除对应前缀角色的权限关联
        int rolePermDeleted = rolePermissionMapper.deleteByRoleNamePrefix(prefix);
        // 物理删除对应前缀用户
        int userDeleted = userMapper.deleteByUsernamePrefix(prefix);
        // 物理删除对应前缀角色
        int roleDeleted = roleMapper.deleteByRoleNamePrefix(prefix);
        // 物理删除对应前缀权限（含子树，忽略逻辑删除标记）
        permissionMapper.deleteByE2ENamePrefix(prefix);
        // 清理登录锁定相关 Redis 键，避免上一轮用例的失败计数/锁定残留影响本轮
        clearLoginLockKeys(prefix);

        log.info("E2E 测试数据清理完成(prefix={}): 用户角色关联[{}] 角色权限关联[{}] 用户[{}] 角色[{}] 权限[已清理]",
                prefix, userRoleDeleted, rolePermDeleted, userDeleted, roleDeleted);
        return Result.success();
    }

    /**
     * 清理登录锁定相关 Redis 键
     * <p>
     * 部分用例会故意制造登录失败（如错误密码、旧密码失效），失败计数与锁定状态存于 Redis 且跨用例保留；
     * 若不清理，24 小时内累计达到阈值会把账号锁死，导致后续用例全部登录失败，故随数据清理一并重置。
     * </p>
     *
     * @param prefix 本用例的数据前缀（e2e-&lt;用例ID&gt;-）
     */
    private void clearLoginLockKeys(String prefix) {
        for (String pattern : LOGIN_LOCK_KEY_PATTERNS) {
            String realPattern = pattern.replace(PREFIX_PLACEHOLDER, prefix);
            Set<String> keys = redisTemplate.keys(realPattern);
            if (keys == null || keys.isEmpty()) {
                continue;
            }
            Long deleted = redisTemplate.delete(keys);
            log.info("E2E 清理登录锁定键完成: pattern={}, count={}", realPattern, deleted);
        }
        // 内置账号不在 e2e- 前缀下，按固定键重置
        for (String key : BUILTIN_ACCOUNT_LOCK_KEYS) {
            redisTemplate.delete(key);
        }
    }
}
