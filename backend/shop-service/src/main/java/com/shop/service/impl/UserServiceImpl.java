package com.shop.service.impl;

import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;
import com.shop.entity.UserEntity;
import com.shop.mapper.UserMapper;
import com.shop.service.UserService;

import lombok.extern.slf4j.Slf4j;

/**
 * 用户服务实现类
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, UserEntity> implements UserService {



    @Override
    public Result<UserEntity> login(UserEntity user) {
        log.info("用户登录请求, username: {}", user.getUsername());

        // 根据用户名查询用户
        LambdaQueryWrapper<UserEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserEntity::getUsername, user.getUsername());
        UserEntity dbUser = this.getOne(wrapper);

        if (dbUser == null) {
            log.warn("用户登录失败, 用户不存在, username: {}", user.getUsername());
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "用户不存在");
        }

        // 验证密码
        if (!dbUser.getPassword().equals(user.getPassword())) {
            log.warn("用户登录失败, 密码错误, username: {}", user.getUsername());
            return Result.error(ResultCodeEnum.PASSWORD_ERROR, "密码错误");
        }

        // 检查用户状态
        if (dbUser.getStatus() == 0) {
            log.warn("用户登录失败, 用户已被禁用, username: {}", user.getUsername());
            return Result.error(ResultCodeEnum.USER_DISABLED, "用户已被禁用");
        }

        // 不返回密码
        dbUser.setPassword(null);
        log.info("用户登录成功, userId: {}, username: {}", dbUser.getId(), dbUser.getUsername());
        return Result.success(dbUser);
    }

    @Override
    public Result<Void> register(UserEntity user) {
        log.info("用户注册请求, username: {}, phone: {}", user.getUsername(), user.getPhone());

        // 检查用户名是否已存在
        LambdaQueryWrapper<UserEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserEntity::getUsername, user.getUsername());
        if (this.count(wrapper) > 0) {
            log.warn("用户注册失败, 用户名已存在, username: {}", user.getUsername());
            return Result.error(ResultCodeEnum.USERNAME_EXIST, "用户名已存在");
        }

        // 检查手机号是否已存在
        wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserEntity::getPhone, user.getPhone());
        if (this.count(wrapper) > 0) {
            log.warn("用户注册失败, 手机号已存在, phone: {}", user.getPhone());
            return Result.error(ResultCodeEnum.PHONE_EXIST, "手机号已存在");
        }

        // 设置默认状态
        if (user.getStatus() == null) {
            user.setStatus(1);
        }

        // 保存用户
        boolean success = this.save(user);
        if (success) {
            log.info("用户注册成功, userId: {}, username: {}", user.getId(), user.getUsername());
        } else {
            log.error("用户注册失败, username: {}", user.getUsername());
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "注册失败");
    }

    @Override
    public Result<UserEntity> getUserInfo(Long id) {
        log.info("获取用户信息, userId: {}", id);
        UserEntity user = this.getById(id);
        if (user == null) {
            log.warn("获取用户信息失败, 用户不存在, userId: {}", id);
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "用户不存在");
        }
        // 不返回密码
        user.setPassword(null);
        log.info("获取用户信息成功, userId: {}", id);
        return Result.success(user);
    }

    @Override
    public Result<Void> updateUser(UserEntity user) {
        log.info("更新用户信息, userId: {}", user.getId());
        UserEntity existUser = this.getById(user.getId());
        if (existUser == null) {
            log.warn("更新用户信息失败, 用户不存在, userId: {}", user.getId());
            return Result.error(ResultCodeEnum.USER_NOT_EXIST, "用户不存在");
        }

        // 如果修改用户名，检查新用户名是否已存在
        if (user.getUsername() != null && !user.getUsername().equals(existUser.getUsername())) {
            LambdaQueryWrapper<UserEntity> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(UserEntity::getUsername, user.getUsername());
            if (this.count(wrapper) > 0) {
                log.warn("更新用户信息失败, 用户名已存在, username: {}", user.getUsername());
                return Result.error(ResultCodeEnum.USERNAME_EXIST, "用户名已存在");
            }
        }

        boolean success = this.updateById(user);
        if (success) {
            log.info("更新用户信息成功, userId: {}", user.getId());
        } else {
            log.error("更新用户信息失败, userId: {}", user.getId());
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "更新失败");
    }
}
