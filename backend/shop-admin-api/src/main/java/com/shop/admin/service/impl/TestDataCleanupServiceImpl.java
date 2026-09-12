package com.shop.admin.service.impl;

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

    private final AdminUserMapper userMapper;
    private final AdminRoleMapper roleMapper;
    private final AdminUserRoleMapper userRoleMapper;
    private final AdminRolePermissionMapper rolePermissionMapper;
    private final AdminPermissionMapper permissionMapper;

    public TestDataCleanupServiceImpl(AdminUserMapper userMapper,
                                      AdminRoleMapper roleMapper,
                                      AdminUserRoleMapper userRoleMapper,
                                      AdminRolePermissionMapper rolePermissionMapper,
                                      AdminPermissionMapper permissionMapper) {
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.userRoleMapper = userRoleMapper;
        this.rolePermissionMapper = rolePermissionMapper;
        this.permissionMapper = permissionMapper;
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

        log.info("E2E 测试数据清理完成(prefix={}): 用户角色关联[{}] 角色权限关联[{}] 用户[{}] 角色[{}] 权限[已清理]",
                prefix, userRoleDeleted, rolePermDeleted, userDeleted, roleDeleted);
        return Result.success();
    }
}
