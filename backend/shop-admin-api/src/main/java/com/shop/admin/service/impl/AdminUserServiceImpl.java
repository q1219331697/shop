package com.shop.admin.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.spring.service.impl.ServiceImpl;
import com.shop.admin.entity.AdminUserEntity;
import com.shop.admin.entity.AdminUserRoleEntity;
import com.shop.admin.mapper.AdminUserMapper;
import com.shop.admin.mapper.AdminUserRoleMapper;
import com.shop.admin.security.AdminLoginLockService;
import com.shop.admin.security.AdminProperties;
import com.shop.admin.security.AdminTokenService;
import com.shop.admin.service.AdminPermissionService;
import com.shop.admin.service.AdminUserService;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;

import lombok.extern.slf4j.Slf4j;

/**
 * 后台管理用户服务实现类
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Service
public class AdminUserServiceImpl extends ServiceImpl<AdminUserMapper, AdminUserEntity> implements AdminUserService {

    /** 密码最小长度（与 AdminUserEntity 的 @Size 契约保持一致） */
    private static final int MIN_PASSWORD_LENGTH = 4;

    /** 密码最大长度（与 AdminUserEntity 的 @Size 契约保持一致） */
    private static final int MAX_PASSWORD_LENGTH = 30;

    /** 每小时秒数（格式化锁定剩余时间用） */
    private static final long SECONDS_PER_HOUR = 3600L;

    /** 每分钟秒数（格式化锁定剩余时间用） */
    private static final long SECONDS_PER_MINUTE = 60L;

    private final AdminTokenService adminTokenService;
    private final AdminUserRoleMapper userRoleMapper;
    private final AdminPermissionService adminPermissionService;
    private final AdminLoginLockService loginLockService;
    private final AdminProperties adminProperties;

    public AdminUserServiceImpl(AdminTokenService adminTokenService, AdminUserRoleMapper userRoleMapper,
                                AdminPermissionService adminPermissionService,
                                AdminLoginLockService loginLockService,
                                AdminProperties adminProperties) {
        this.adminTokenService = adminTokenService;
        this.userRoleMapper = userRoleMapper;
        this.adminPermissionService = adminPermissionService;
        this.loginLockService = loginLockService;
        this.adminProperties = adminProperties;
    }

    /**
     * 管理员登录，成功返回Token
     *
     * @param adminUser 管理员登录信息
     * @param ip 登录IP地址
     * @return 登录结果（含Token）
     */
    @Override
    public Result<String> login(AdminUserEntity adminUser, String ip) {
        String username = adminUser.getUsername();
        log.info("管理员登录请求, username: {}, ip: {}", username, ip);

        // 锁定优先：已锁定账号不再校验密码，避免锁定期间继续撞库试探
        if (loginLockService.isLocked(username)) {
            long remainSeconds = loginLockService.getLockRemainSeconds(username);
            log.info("管理员登录失败, 账号已锁定, username: {}, remainSeconds: {}", username, remainSeconds);
            return Result.error(ResultCodeEnum.ACCOUNT_LOCKED,
                    "账号已被锁定，请于" + formatRemainTime(remainSeconds) + "后重试或联系管理员解锁");
        }

        AdminUserEntity dbUser = getByUsername(username);
        if (dbUser == null) {
            // 用户不存在不计数：避免攻击者用海量随机用户名灌爆Redis（登录结果由操作日志切面统一记录）
            log.info("管理员登录失败, 用户不存在, username: {}", username);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }

        if (!adminUser.getPassword().equals(dbUser.getPassword())) {
            int maxFailCount = adminProperties.getLock().getMaxFailCount();
            int failCount = loginLockService.incrementFail(username);
            log.info("管理员登录失败, 密码错误, username: {}, failCount: {}", username, failCount);
            if (failCount >= maxFailCount) {
                long lockHours = adminProperties.getLock().getDuration().toHours();
                return Result.error(ResultCodeEnum.ACCOUNT_LOCKED,
                        "密码错误次数过多，账号已锁定" + lockHours + "小时");
            }
            int remainCount = Math.max(maxFailCount - failCount, 0);
            return Result.error(ResultCodeEnum.PASSWORD_ERROR,
                    "密码错误，连续错误" + maxFailCount + "次将锁定账号，还可尝试" + remainCount + "次");
        }

        if (dbUser.getStatus() == 0) {
            log.info("管理员登录失败, 用户已被禁用, username: {}", username);
            return Result.error(ResultCodeEnum.USER_DISABLED, "管理员已被禁用");
        }

        // 登录成功：清除失败计数（登录结果由操作日志切面统一记录）
        loginLockService.clearFail(username);

        // 生成Token并存入Redis
        String token = adminTokenService.createToken(dbUser.getId(), dbUser.getUsername());
        log.info("管理员登录成功, adminUserId: {}, username: {}", dbUser.getId(), username);
        return Result.success(token);
    }

    /**
     * 格式化锁定剩余时间
     *
     * @param remainSeconds 剩余秒数
     * @return 形如「23小时59分钟」的可读文本；无法获取剩余时间时返回兜底文案
     */
    private String formatRemainTime(long remainSeconds) {
        if (remainSeconds <= 0) {
            return "一段时间";
        }
        long hours = remainSeconds / SECONDS_PER_HOUR;
        long minutes = remainSeconds % SECONDS_PER_HOUR / SECONDS_PER_MINUTE;
        if (hours > 0) {
            return hours + "小时" + minutes + "分钟";
        }
        return Math.max(minutes, 1) + "分钟";
    }

    /**
     * 管理员登出，移除Redis中的Token
     *
     * @param token Token字符串
     * @return 登出结果
     */
    @Override
    public Result<Void> logout(String token) {
        if (token != null && adminTokenService.validateToken(token)) {
            adminTokenService.removeToken(token);
            log.info("管理员登出成功");
            return Result.success();
        }
        log.info("管理员登出失败, token无效");
        return Result.error(ResultCodeEnum.OPERATION_FAILED, "登出失败，token无效");
    }

    /**
     * 刷新Token，延长Redis中Token的有效时间
     *
     * @param token Token字符串
     * @return 刷新结果
     */
    @Override
    public Result<Void> refreshToken(String token) {
        if (token != null && adminTokenService.validateToken(token)) {
            adminTokenService.refreshToken(token);
            log.info("Token刷新成功");
            return Result.success();
        }
        log.info("Token刷新失败, token无效");
        return Result.error(ResultCodeEnum.UNAUTHORIZED, "Token无效，请重新登录");
    }

    /**
     * 创建管理员
     *
     * @param adminUser 管理员信息
     * @return 创建结果
     */
    @Override
    public Result<Void> createAdminUser(AdminUserEntity adminUser) {
        String username = adminUser.getUsername();
        log.info("创建管理员请求, username: {}", username);

        if (isUsernameExists(username)) {
            log.info("创建管理员失败, 用户名已存在, username: {}", username);
            return Result.error(ResultCodeEnum.USERNAME_EXIST, "管理员用户名已存在");
        }

        if (adminUser.getStatus() == null) {
            adminUser.setStatus(1);
        }

        // 未指定密码时使用系统默认密码（新增表单不再要求填写密码）
        if (!StringUtils.hasText(adminUser.getPassword())) {
            adminUser.setPassword(adminProperties.getDefaultPassword());
            log.info("创建管理员未指定密码, 使用系统默认密码, username: {}", username);
        }

        this.save(adminUser);
        log.info("创建管理员成功, adminUserId: {}, username: {}", adminUser.getId(), username);
        return Result.success();
    }

    /**
     * 重置管理员密码为系统默认密码
     *
     * @param id 管理员ID
     * @return 重置结果
     */
    @Override
    public Result<Void> resetPassword(Long id) {
        log.info("重置管理员密码请求, adminUserId: {}", id);

        AdminUserEntity existUser = baseMapper.selectByIdIgnoreDeleted(id);
        if (existUser == null) {
            log.info("重置管理员密码失败, 管理员不存在, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }

        AdminUserEntity update = new AdminUserEntity();
        update.setId(id);
        update.setPassword(adminProperties.getDefaultPassword());
        baseMapper.updateByIdIgnoreDeleted(update);
        log.info("重置管理员密码成功, adminUserId: {}", id);
        return Result.success();
    }

    /**
     * 获取系统默认密码（供前端提示展示）
     *
     * @return 默认密码
     */
    @Override
    public String getDefaultPassword() {
        return adminProperties.getDefaultPassword();
    }

    /**
     * 修改当前登录管理员的密码（需校验原密码）
     *
     * @param adminUserId 当前登录管理员ID
     * @param oldPassword 原密码
     * @param newPassword 新密码
     * @return 修改结果
     */
    @Override
    public Result<Void> changePassword(Long adminUserId, String oldPassword, String newPassword) {
        log.info("修改管理员密码请求, adminUserId: {}", adminUserId);

        if (!StringUtils.hasText(oldPassword) || !StringUtils.hasText(newPassword)) {
            log.info("修改管理员密码失败, 原密码或新密码为空, adminUserId: {}", adminUserId);
            return Result.error(ResultCodeEnum.PARAM_ERROR, "请输入原密码与新密码");
        }

        AdminUserEntity existUser = baseMapper.selectByIdIgnoreDeleted(adminUserId);
        if (existUser == null) {
            log.info("修改管理员密码失败, 管理员不存在, adminUserId: {}", adminUserId);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }

        // 当前密码为明文比对（与登录校验保持一致）
        if (!oldPassword.equals(existUser.getPassword())) {
            log.info("修改管理员密码失败, 原密码错误, adminUserId: {}", adminUserId);
            return Result.error(ResultCodeEnum.PASSWORD_ERROR, "原密码错误");
        }

        if (newPassword.length() < MIN_PASSWORD_LENGTH || newPassword.length() > MAX_PASSWORD_LENGTH) {
            log.info("修改管理员密码失败, 新密码长度不合法, adminUserId: {}", adminUserId);
            return Result.error(ResultCodeEnum.PARAM_ERROR, "密码长度需在4-30位之间");
        }

        if (newPassword.equals(oldPassword)) {
            log.info("修改管理员密码失败, 新密码与原密码相同, adminUserId: {}", adminUserId);
            return Result.error(ResultCodeEnum.PARAM_ERROR, "新密码不能与原密码相同");
        }

        AdminUserEntity update = new AdminUserEntity();
        update.setId(adminUserId);
        update.setPassword(newPassword);
        baseMapper.updateByIdIgnoreDeleted(update);
        log.info("修改管理员密码成功, adminUserId: {}", adminUserId);
        return Result.success();
    }

    /**
     * 更新管理员信息
     *
     * @param adminUser 管理员信息
     * @return 更新结果
     */
    @Override
    public Result<Void> updateAdminUser(AdminUserEntity adminUser) {
        Long id = adminUser.getId();
        log.info("更新管理员信息, adminUserId: {}", id);

        AdminUserEntity existUser = baseMapper.selectByIdIgnoreDeleted(id);
        if (existUser == null) {
            log.info("更新管理员信息失败, 管理员不存在, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }

        String newUsername = adminUser.getUsername();
        if (newUsername != null && !newUsername.equals(existUser.getUsername()) && isUsernameExists(newUsername)) {
            log.info("更新管理员信息失败, 用户名已存在, username: {}", newUsername);
            return Result.error(ResultCodeEnum.USERNAME_EXIST, "管理员用户名已存在");
        }

        baseMapper.updateByIdIgnoreDeleted(adminUser);
        log.info("更新管理员信息成功, adminUserId: {}", id);
        // 用户状态变更时清除权限缓存
        adminPermissionService.clearPermissionCache(id);
        return Result.success();
    }

    /**
     * 解锁管理员登录锁定
     * <p>
     * 清除该账号在 Redis 中的锁定键与登录失败计数，解锁后可立即登录。
     * </p>
     *
     * @param id 管理员ID
     * @return 解锁结果
     */
    @Override
    public Result<Void> unlockAdminUser(Long id) {
        log.info("解锁管理员请求, adminUserId: {}", id);

        AdminUserEntity existUser = baseMapper.selectByIdIgnoreDeleted(id);
        if (existUser == null) {
            log.info("解锁管理员失败, 管理员不存在, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }

        loginLockService.unlock(existUser.getUsername());
        log.info("解锁管理员成功, adminUserId: {}, username: {}", id, existUser.getUsername());
        return Result.success();
    }

    /**
     * 获取管理员详情（密码置空）
     *
     * @param id 管理员ID
     * @return 管理员详情
     */
    @Override
    public Result<AdminUserEntity> getUserDetail(Long id) {
        log.info("获取管理员信息, adminUserId: {}", id);
        // 使用selectByIdIgnoreDeleted绕过逻辑删除，支持查询已删除用户的详情
        AdminUserEntity adminUser = baseMapper.selectByIdIgnoreDeleted(id);
        if (adminUser == null) {
            log.info("获取管理员信息失败, 管理员不存在, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }
        adminUser.setPassword(null);
        adminUser.setLocked(loginLockService.isLocked(adminUser.getUsername()));
        return Result.success(adminUser);
    }

    /**
     * 为用户分配角色（先删后插）
     *
     * @param userId 用户ID
     * @param roleIds 角色ID列表
     * @return 分配结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> assignRoles(Long userId, List<Long> roleIds) {
        log.info("为用户分配角色, userId: {}, roleIds: {}", userId, roleIds);

        if (baseMapper.selectByIdIgnoreDeleted(userId) == null) {
            log.info("分配角色失败, 用户不存在, userId: {}", userId);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }

        // 删除原有角色关联
        LambdaQueryWrapper<AdminUserRoleEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUserRoleEntity::getUserId, userId);
        userRoleMapper.delete(wrapper);

        // 批量插入新的角色关联
        if (roleIds != null && !roleIds.isEmpty()) {
            for (Long roleId : roleIds) {
                AdminUserRoleEntity ur = new AdminUserRoleEntity();
                ur.setUserId(userId);
                ur.setRoleId(roleId);
                userRoleMapper.insert(ur);
            }
        }

        log.info("为用户分配角色成功, userId: {}", userId);

        // 清除用户权限缓存
        adminPermissionService.clearPermissionCache(userId);

        return Result.success();
    }

    /**
     * 获取用户的角色ID列表
     *
     * @param userId 用户ID
     * @return 角色ID列表
     */
    @Override
    public Result<List<Long>> getUserRoleIds(Long userId) {
        log.info("获取用户角色ID列表, userId: {}", userId);
        LambdaQueryWrapper<AdminUserRoleEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUserRoleEntity::getUserId, userId);
        List<Long> roleIds = userRoleMapper.selectList(wrapper)
                .stream()
                .map(AdminUserRoleEntity::getRoleId)
                .collect(Collectors.toList());
        return Result.success(roleIds);
    }

    /**
     * 分页查询管理员（支持用户名、姓名搜索、状态筛选和删除状态筛选）
     *
     * @param pageNum 当前页码
     * @param pageSize 每页条数
     * @param username 用户名搜索
     * @param realName 姓名搜索
     * @param status 状态筛选
     * @param deleted 删除状态筛选（0-未删除，1-已删除，null-全部）
     * @return 管理员分页数据
     */
    @Override
    public Result<IPage<AdminUserEntity>> pageAdminUser(Long pageNum, Long pageSize,
                                                         String username, String realName,
                                                         Integer status, Integer deleted) {
        Page<AdminUserEntity> page = new Page<>(pageNum, pageSize);

        // 始终使用自定义查询（绕过逻辑删除），deleted为null时返回全部数据
        IPage<AdminUserEntity> result = baseMapper.selectPageIgnoreDeleted(
                page, username, realName, status, deleted);

        // 清除密码字段，并回填登录锁定状态（取自Redis锁定键，非数据库字段）
        result.getRecords().forEach(u -> {
            u.setPassword(null);
            u.setLocked(loginLockService.isLocked(u.getUsername()));
        });

        return Result.success(result);
    }

    /**
     * 根据用户名查询管理员
     *
     * @param username 用户名
     * @return 管理员实体
     */
    @Override
    public AdminUserEntity getByUsername(String username) {
        LambdaQueryWrapper<AdminUserEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUserEntity::getUsername, username);
        return this.getOne(wrapper);
    }

    /**
     * 检查用户名是否已存在
     *
     * @param username 用户名
     * @return true-已存在 false-不存在
     */
    private boolean isUsernameExists(String username) {
        LambdaQueryWrapper<AdminUserEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUserEntity::getUsername, username);
        return this.count(wrapper) > 0;
    }

    /**
     * 判断目标ID是否为当前登录管理员自身
     *
     * @param id 目标管理员ID
     * @param currentUserId 当前登录管理员ID
     * @return true-是自身 false-不是自身
     */
    private boolean isCurrentAdmin(Long id, Long currentUserId) {
        return id != null && id.equals(currentUserId);
    }

    /**
     * 从目标ID列表中剔除当前登录管理员自身（静默过滤，不产生任何提示）
     *
     * @param ids 目标管理员ID列表
     * @param currentUserId 当前登录管理员ID
     * @return 过滤后的ID列表
     */
    private List<Long> excludeCurrentAdmin(List<Long> ids, Long currentUserId) {
        return ids.stream()
                .filter(id -> !isCurrentAdmin(id, currentUserId))
                .collect(Collectors.toList());
    }

    /**
     * 删除管理员（同时清除角色关联和权限缓存）
     * <p>当前登录管理员自身会被静默过滤：不执行删除，也不返回提示。</p>
     *
     * @param id 管理员ID
     * @param currentUserId 当前登录管理员ID（自身保护）
     * @return 删除结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> deleteAdminUser(Long id, Long currentUserId) {
        log.info("删除管理员请求, adminUserId: {}", id);
        if (isCurrentAdmin(id, currentUserId)) {
            log.info("删除管理员跳过, 目标为当前登录管理员自身, adminUserId: {}", id);
            return Result.success();
        }

        AdminUserEntity existUser = baseMapper.selectByIdIgnoreDeleted(id);
        if (existUser == null) {
            log.info("删除管理员失败, 管理员不存在, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }

        if (existUser.getDeleted() == 1) {
            log.info("删除管理员失败, 管理员已被删除, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.OPERATION_FAILED, "管理员已被删除");
        }

        // 删除用户角色关联
        LambdaQueryWrapper<AdminUserRoleEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUserRoleEntity::getUserId, id);
        userRoleMapper.delete(wrapper);

        // 清除权限缓存
        adminPermissionService.clearPermissionCache(id);

        // 删除用户（绕过逻辑删除）
        baseMapper.deleteByIdIgnoreDeleted(id);
        log.info("删除管理员成功, adminUserId: {}", id);
        return Result.success();
    }

    /**
     * 批量删除管理员（同时清除角色关联和权限缓存）
     * <p>列表中的当前登录管理员自身会被静默过滤：不执行删除，也不返回提示。</p>
     *
     * @param ids 管理员ID列表
     * @param currentUserId 当前登录管理员ID（自身保护）
     * @return 删除结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> batchDeleteAdminUser(List<Long> ids, Long currentUserId) {
        log.info("批量删除管理员请求, ids: {}", ids);
        if (ids == null || ids.isEmpty()) {
            return Result.error(ResultCodeEnum.PARAM_ERROR, "请选择要删除的管理员");
        }

        // 静默过滤自身：若过滤后无目标，视为无事发生（不提示）
        List<Long> targets = excludeCurrentAdmin(ids, currentUserId);
        if (targets.isEmpty()) {
            log.info("批量删除管理员跳过, 目标均为当前登录管理员自身");
            return Result.success();
        }

        for (Long id : targets) {
            Result<Void> result = deleteAdminUser(id, currentUserId);
            if (!result.isSuccess()) {
                log.info("批量删除管理员中断, 失败的adminUserId: {}", id);
                return result;
            }
        }

        log.info("批量删除管理员成功, 共删除{}条", targets.size());
        return Result.success();
    }

    /**
     * 禁用管理员
     * <p>当前登录管理员自身会被静默过滤：不执行禁用，也不返回提示。</p>
     *
     * @param id 管理员ID
     * @param currentUserId 当前登录管理员ID（自身保护）
     * @return 禁用结果
     */
    @Override
    public Result<Void> disableAdminUser(Long id, Long currentUserId) {
        log.info("禁用管理员请求, adminUserId: {}", id);
        if (isCurrentAdmin(id, currentUserId)) {
            log.info("禁用管理员跳过, 目标为当前登录管理员自身, adminUserId: {}", id);
            return Result.success();
        }

        AdminUserEntity existUser = baseMapper.selectByIdIgnoreDeleted(id);
        if (existUser == null) {
            log.info("禁用管理员失败, 管理员不存在, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }
        if (existUser.getStatus() == 0) {
            log.info("禁用管理员失败, 管理员已被禁用, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.OPERATION_FAILED, "管理员已被禁用");
        }
        AdminUserEntity update = new AdminUserEntity();
        update.setId(id);
        update.setStatus(0);
        baseMapper.updateByIdIgnoreDeleted(update);
        log.info("禁用管理员成功, adminUserId: {}", id);
        adminPermissionService.clearPermissionCache(id);
        return Result.success();
    }

    /**
     * 启用管理员
     *
     * @param id 管理员ID
     * @return 启用结果
     */
    @Override
    public Result<Void> enableAdminUser(Long id) {
        log.info("启用管理员请求, adminUserId: {}", id);
        AdminUserEntity existUser = baseMapper.selectByIdIgnoreDeleted(id);
        if (existUser == null) {
            log.info("启用管理员失败, 管理员不存在, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }
        if (existUser.getStatus() == 1) {
            log.info("启用管理员失败, 管理员已是启用状态, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.OPERATION_FAILED, "管理员已是启用状态");
        }
        AdminUserEntity update = new AdminUserEntity();
        update.setId(id);
        update.setStatus(1);
        baseMapper.updateByIdIgnoreDeleted(update);
        log.info("启用管理员成功, adminUserId: {}", id);
        adminPermissionService.clearPermissionCache(id);
        return Result.success();
    }

    /**
     * 恢复已删除的管理员
     *
     * @param id 管理员ID
     * @return 恢复结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> restoreAdminUser(Long id) {
        log.info("恢复管理员请求, adminUserId: {}", id);
        // 使用绕过逻辑删除的查询
        AdminUserEntity existUser = baseMapper.selectByIdIgnoreDeleted(id);
        if (existUser == null) {
            log.info("恢复管理员失败, 管理员不存在, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }
        if (existUser.getDeleted() == 0) {
            log.info("恢复管理员失败, 管理员未被删除, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.OPERATION_FAILED, "管理员未被删除");
        }
        baseMapper.restoreById(id);
        log.info("恢复管理员成功, adminUserId: {}", id);
        adminPermissionService.clearPermissionCache(id);
        return Result.success();
    }

    /**
     * 批量禁用管理员
     * <p>列表中的当前登录管理员自身会被静默过滤：不执行禁用，也不返回提示。</p>
     *
     * @param ids 管理员ID列表
     * @param currentUserId 当前登录管理员ID（自身保护）
     * @return 禁用结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> batchDisableAdminUser(List<Long> ids, Long currentUserId) {
        log.info("批量禁用管理员请求, ids: {}", ids);
        if (ids == null || ids.isEmpty()) {
            return Result.error(ResultCodeEnum.PARAM_ERROR, "请选择要禁用的管理员");
        }

        // 静默过滤自身：若过滤后无目标，视为无事发生（不提示）
        List<Long> targets = excludeCurrentAdmin(ids, currentUserId);
        if (targets.isEmpty()) {
            log.info("批量禁用管理员跳过, 目标均为当前登录管理员自身");
            return Result.success();
        }

        for (Long id : targets) {
            Result<Void> result = disableAdminUser(id, currentUserId);
            if (!result.isSuccess()) {
                log.info("批量禁用管理员中断, 失败的adminUserId: {}", id);
                return result;
            }
        }
        log.info("批量禁用管理员成功, 共禁用{}条", targets.size());
        return Result.success();
    }

    /**
     * 批量启用管理员
     *
     * @param ids 管理员ID列表
     * @return 启用结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> batchEnableAdminUser(List<Long> ids) {
        log.info("批量启用管理员请求, ids: {}", ids);
        if (ids == null || ids.isEmpty()) {
            return Result.error(ResultCodeEnum.PARAM_ERROR, "请选择要启用的管理员");
        }
        for (Long id : ids) {
            Result<Void> result = enableAdminUser(id);
            if (!result.isSuccess()) {
                log.info("批量启用管理员中断, 失败的adminUserId: {}", id);
                return result;
            }
        }
        log.info("批量启用管理员成功, 共启用{}条", ids.size());
        return Result.success();
    }

    /**
     * 批量恢复已删除的管理员
     *
     * @param ids 管理员ID列表
     * @return 恢复结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> batchRestoreAdminUser(List<Long> ids) {
        log.info("批量恢复管理员请求, ids: {}", ids);
        if (ids == null || ids.isEmpty()) {
            return Result.error(ResultCodeEnum.PARAM_ERROR, "请选择要恢复的管理员");
        }
        for (Long id : ids) {
            Result<Void> result = restoreAdminUser(id);
            if (!result.isSuccess()) {
                log.info("批量恢复管理员中断, 失败的adminUserId: {}", id);
                return result;
            }
        }
        log.info("批量恢复管理员成功, 共恢复{}条", ids.size());
        return Result.success();
    }
}