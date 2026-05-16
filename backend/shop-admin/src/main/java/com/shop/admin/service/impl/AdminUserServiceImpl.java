package com.shop.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shop.admin.entity.AdminUserEntity;
import com.shop.admin.entity.AdminUserRoleEntity;
import com.shop.admin.mapper.AdminUserMapper;
import com.shop.admin.mapper.AdminUserRoleMapper;
import com.shop.admin.security.AdminTokenService;
import com.shop.admin.service.AdminUserService;
import com.shop.common.Result;
import com.shop.common.ResultCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    public AdminUserServiceImpl(AdminTokenService adminTokenService, AdminUserRoleMapper userRoleMapper) {
        this.adminTokenService = adminTokenService;
        this.userRoleMapper = userRoleMapper;
    }

    @Override
    public Result<String> login(AdminUserEntity adminUser, String ip) {
        log.info("管理员登录请求, username: {}", adminUser.getUsername());

        LambdaQueryWrapper<AdminUserEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUserEntity::getUsername, adminUser.getUsername());
        AdminUserEntity dbUser = this.getOne(wrapper);

        if (dbUser == null) {
            log.warn("管理员登录失败, 用户不存在, username: {}", adminUser.getUsername());
            return Result.error(ResultCode.USER_NOT_EXIST, "管理员不存在");
        }

        if (!adminUser.getPassword().equals(dbUser.getPassword())) {
            log.warn("管理员登录失败, 密码错误, username: {}", adminUser.getUsername());
            return Result.error(ResultCode.PASSWORD_ERROR, "密码错误");
        }

        if (dbUser.getStatus() == 0) {
            log.warn("管理员登录失败, 用户已被禁用, username: {}", adminUser.getUsername());
            return Result.error(ResultCode.USER_DISABLED, "管理员已被禁用");
        }

        // 更新登录信息
        dbUser.setLastLoginTime(LocalDateTime.now());
        dbUser.setLastLoginIp(ip);
        this.updateById(dbUser);

        // 生成Token并存入Redis
        String token = adminTokenService.createToken(dbUser.getId(), dbUser.getUsername());
        log.info("管理员登录成功, adminUserId: {}, username: {}", dbUser.getId(), dbUser.getUsername());
        return Result.success(token);
    }

    @Override
    public Result<Void> logout(String token) {
        log.info("管理员登出请求");
        if (token != null && adminTokenService.validateToken(token)) {
            adminTokenService.removeToken(token);
            log.info("管理员登出成功");
            return Result.success();
        }
        log.warn("管理员登出失败, token无效");
        return Result.error(ResultCode.OPERATION_FAILED, "登出失败，token无效");
    }

    @Override
    public Result<Void> createAdminUser(AdminUserEntity adminUser) {
        log.info("创建管理员请求, username: {}", adminUser.getUsername());

        LambdaQueryWrapper<AdminUserEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUserEntity::getUsername, adminUser.getUsername());
        if (this.count(wrapper) > 0) {
            log.warn("创建管理员失败, 用户名已存在, username: {}", adminUser.getUsername());
            return Result.error(ResultCode.USERNAME_EXIST, "管理员用户名已存在");
        }

        if (adminUser.getStatus() == null) {
            adminUser.setStatus(1);
        }

        boolean success = this.save(adminUser);
        if (success) {
            log.info("创建管理员成功, adminUserId: {}, username: {}", adminUser.getId(), adminUser.getUsername());
        } else {
            log.error("创建管理员失败, username: {}", adminUser.getUsername());
        }
        return success ? Result.success() : Result.error(ResultCode.OPERATION_FAILED, "创建管理员失败");
    }

    @Override
    public Result<Void> updateAdminUser(AdminUserEntity adminUser) {
        log.info("更新管理员信息, adminUserId: {}", adminUser.getId());
        AdminUserEntity existUser = this.getById(adminUser.getId());
        if (existUser == null) {
            log.warn("更新管理员信息失败, 管理员不存在, adminUserId: {}", adminUser.getId());
            return Result.error(ResultCode.USER_NOT_EXIST, "管理员不存在");
        }

        if (adminUser.getUsername() != null && !adminUser.getUsername().equals(existUser.getUsername())) {
            LambdaQueryWrapper<AdminUserEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(AdminUserEntity::getUsername, adminUser.getUsername());
            if (this.count(wrapper) > 0) {
                log.warn("更新管理员信息失败, 用户名已存在, username: {}", adminUser.getUsername());
                return Result.error(ResultCode.USERNAME_EXIST, "管理员用户名已存在");
            }
        }

        boolean success = this.updateById(adminUser);
        if (success) {
            log.info("更新管理员信息成功, adminUserId: {}", adminUser.getId());
        } else {
            log.error("更新管理员信息失败, adminUserId: {}", adminUser.getId());
        }
        return success ? Result.success() : Result.error(ResultCode.OPERATION_FAILED, "更新管理员失败");
    }

    @Override
    public Result<AdminUserEntity> getAdminUserInfo(Long id) {
        log.info("获取管理员信息, adminUserId: {}", id);
        AdminUserEntity adminUser = this.getById(id);
        if (adminUser == null) {
            log.warn("获取管理员信息失败, 管理员不存在, adminUserId: {}", id);
            return Result.error(ResultCode.USER_NOT_EXIST, "管理员不存在");
        }
        adminUser.setPassword(null);
        log.info("获取管理员信息成功, adminUserId: {}", id);
        return Result.success(adminUser);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> assignRoles(Long userId, List<Long> roleIds) {
        log.info("为用户分配角色, userId: {}, roleIds: {}", userId, roleIds);
        AdminUserEntity existUser = this.getById(userId);
        if (existUser == null) {
            log.warn("分配角色失败, 用户不存在, userId: {}", userId);
            return Result.error(ResultCode.USER_NOT_EXIST, "管理员不存在");
        }

        // 删除原有角色关联
        LambdaQueryWrapper<AdminUserRoleEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUserRoleEntity::getUserId, userId);
        userRoleMapper.delete(wrapper);

        // 批量插入新的角色关联
        if (roleIds != null && !roleIds.isEmpty()) {
            List<AdminUserRoleEntity> urList = roleIds.stream().map(roleId -> {
                AdminUserRoleEntity ur = new AdminUserRoleEntity();
                ur.setUserId(userId);
                ur.setRoleId(roleId);
                return ur;
            }).collect(Collectors.toList());
            for (AdminUserRoleEntity ur : urList) {
                userRoleMapper.insert(ur);
            }
        }

        log.info("为用户分配角色成功, userId: {}", userId);
        return Result.success();
    }

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
}