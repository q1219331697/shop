package com.shop.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.shop.common.Result;
import com.shop.entity.UserEntity;

/**
 * 用户服务接口
 *
 * @author shop
 * @since 1.0.0
 */
public interface UserService extends IService<UserEntity> {

    /**
     * 用户登录验证
     * @param user 用户信息（username + password）
     * @return 登录成功返回用户实体，失败返回错误信息
     */
    Result<UserEntity> login(UserEntity user);

    /**
     * 用户注册
     * @param user 用户信息
     * @return 注册结果
     */
    Result<Void> register(UserEntity user);

    /**
     * 获取用户信息
     * @param id 用户ID
     * @return 用户信息
     */
    Result<UserEntity> getUserInfo(Long id);

    /**
     * 更新用户信息
     * @param user 用户信息
     * @return 更新结果
     */
    Result<Void> updateUser(UserEntity user);
}
