package com.shop.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shop.admin.entity.AdminUserEntity;
import com.shop.admin.entity.AdminUserRoleEntity;
import com.shop.admin.mapper.AdminUserMapper;
import com.shop.admin.mapper.AdminUserRoleMapper;
import com.shop.admin.security.AdminTokenService;
import com.shop.admin.service.AdminLoginLogService;
import com.shop.admin.service.AdminPermissionService;
import com.shop.admin.service.AdminUserService;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 后台管理用户服务实现类
 * @since 1.0.0
 */
@Slf4j
@Service
public class AdminUserServiceImpl extends ServiceImpl<AdminUserMapper, AdminUserEntity> implements AdminUserService {

    private final AdminTokenService adminTokenService;
    private final AdminUserRoleMapper userRoleMapper;
    private final AdminPermissionService adminPermissionService;
    private final AdminLoginLogService adminLoginLogService;

    public AdminUserServiceImpl(AdminTokenService adminTokenService, AdminUserRoleMapper userRoleMapper,
                                AdminPermissionService adminPermissionService,
                                AdminLoginLogService adminLoginLogService) {
        this.adminTokenService = adminTokenService;
        this.userRoleMapper = userRoleMapper;
        this.adminPermissionService = adminPermissionService;
        this.adminLoginLogService = adminLoginLogService;
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
        log.info("管理员登录请求, username: {}", username);

        AdminUserEntity dbUser = getByUsername(username);
        if (dbUser == null) {
            log.warn("管理员登录失败, 用户不存在, username: {}", username);
            adminLoginLogService.recordLoginLog(null, username, 0, "管理员不存在");
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }

        if (!adminUser.getPassword().equals(dbUser.getPassword())) {
            log.warn("管理员登录失败, 密码错误, username: {}", username);
            adminLoginLogService.recordLoginLog(dbUser.getId(), username, 0, "密码错误");
            return Result.error(ResultCodeEnum.PASSWORD_ERROR, "密码错误");
        }

        if (dbUser.getStatus() == 0) {
            log.warn("管理员登录失败, 用户已被禁用, username: {}", username);
            adminLoginLogService.recordLoginLog(dbUser.getId(), username, 0, "管理员已被禁用");
            return Result.error(ResultCodeEnum.USER_DISABLED, "管理员已被禁用");
        }

        // 生成Token并存入Redis
        String token = adminTokenService.createToken(dbUser.getId(), dbUser.getUsername());
        log.info("管理员登录成功, adminUserId: {}, username: {}", dbUser.getId(), username);
        adminLoginLogService.recordLoginLog(dbUser.getId(), username, 1, "登录成功");
        return Result.success(token);
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
        log.warn("管理员登出失败, token无效");
        return Result.error(ResultCodeEnum.OPERATION_FAILED, "登出失败，token无效");
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
            log.warn("创建管理员失败, 用户名已存在, username: {}", username);
            return Result.error(ResultCodeEnum.USERNAME_EXIST, "管理员用户名已存在");
        }

        if (adminUser.getStatus() == null) {
            adminUser.setStatus(1);
        }

        boolean success = this.save(adminUser);
        if (success) {
            log.info("创建管理员成功, adminUserId: {}, username: {}", adminUser.getId(), username);
        } else {
            log.error("创建管理员失败, username: {}", username);
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "创建管理员失败");
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

        AdminUserEntity existUser = this.getById(id);
        if (existUser == null) {
            log.warn("更新管理员信息失败, 管理员不存在, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }

        String newUsername = adminUser.getUsername();
        if (newUsername != null && !newUsername.equals(existUser.getUsername()) && isUsernameExists(newUsername)) {
            log.warn("更新管理员信息失败, 用户名已存在, username: {}", newUsername);
            return Result.error(ResultCodeEnum.USERNAME_EXIST, "管理员用户名已存在");
        }

        boolean success = this.updateById(adminUser);
        if (success) {
            log.info("更新管理员信息成功, adminUserId: {}", id);
            // 用户状态变更时清除权限缓存
            adminPermissionService.clearPermissionCache(id);
        } else {
            log.error("更新管理员信息失败, adminUserId: {}", id);
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "更新管理员失败");
    }

    /**
     * 获取管理员详情（密码置空）
     *
     * @param id 管理员ID
     * @return 管理员详情
     */
    @Override
    public Result<AdminUserEntity> getAdminUserInfo(Long id) {
        log.info("获取管理员信息, adminUserId: {}", id);
        AdminUserEntity adminUser = this.getById(id);
        if (adminUser == null) {
            log.warn("获取管理员信息失败, 管理员不存在, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }
        adminUser.setPassword(null);
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

        if (this.getById(userId) == null) {
            log.warn("分配角色失败, 用户不存在, userId: {}", userId);
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
     * 分页查询管理员（支持用户名、姓名搜索和状态筛选）
     *
     * @param pageNum 当前页码
     * @param pageSize 每页条数
     * @param username 用户名搜索
     * @param realName 姓名搜索
     * @param status 状态筛选
     * @return 管理员分页数据
     */
    @Override
    public Result<IPage<AdminUserEntity>> pageAdminUser(Long pageNum, Long pageSize, String username, String realName, Integer status) {
        Page<AdminUserEntity> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<AdminUserEntity> wrapper = new LambdaQueryWrapper<>();

        // 用户名搜索
        if (StringUtils.hasText(username)) {
            wrapper.like(AdminUserEntity::getUsername, username);
        }

        // 姓名搜索
        if (StringUtils.hasText(realName)) {
            wrapper.like(AdminUserEntity::getRealName, realName);
        }

        // 状态筛选
        if (status != null) {
            wrapper.eq(AdminUserEntity::getStatus, status);
        }

        wrapper.orderByDesc(AdminUserEntity::getCreateTime);

        IPage<AdminUserEntity> result = this.page(page, wrapper);

        // 清除密码字段
        result.getRecords().forEach(u -> u.setPassword(null));

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
     * 删除管理员（同时清除角色关联和权限缓存）
     *
     * @param id 管理员ID
     * @return 删除结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> deleteAdminUser(Long id) {
        log.info("删除管理员请求, adminUserId: {}", id);
        AdminUserEntity existUser = this.getById(id);
        if (existUser == null) {
            log.warn("删除管理员失败, 管理员不存在, adminUserId: {}", id);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "管理员不存在");
        }

        // 删除用户角色关联
        LambdaQueryWrapper<AdminUserRoleEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUserRoleEntity::getUserId, id);
        userRoleMapper.delete(wrapper);

        // 清除权限缓存
        adminPermissionService.clearPermissionCache(id);

        // 删除用户
        boolean success = this.removeById(id);
        if (success) {
            log.info("删除管理员成功, adminUserId: {}", id);
        } else {
            log.error("删除管理员失败, adminUserId: {}", id);
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "删除管理员失败");
    }
}