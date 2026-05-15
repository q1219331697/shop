package com.shop.admin.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.shop.admin.entity.AdminUserEntity;
import com.shop.common.Result;

/**
 * 后台管理用户服务接口
 * @since 1.0.0
 */
public interface AdminUserService extends IService<AdminUserEntity> {

    /**
     * 管理员登录
     * @param adminUser 管理员信息
     * @param ip 登录IP
     * @return 登录结果（含token）
     */
    Result<String> login(AdminUserEntity adminUser, String ip);

    /**
     * 管理员登出
     * @param token token字符串
     * @return 登出结果
     */
    Result<Void> logout(String token);

    /**
     * 创建管理员
     * @param adminUser 管理员信息
     * @return 创建结果
     */
    Result<Void> createAdminUser(AdminUserEntity adminUser);

    /**
     * 更新管理员信息
     * @param adminUser 管理员信息
     * @return 更新结果
     */
    Result<Void> updateAdminUser(AdminUserEntity adminUser);

    /**
     * 获取管理员详情
     * @param id 管理员ID
     * @return 管理员信息
     */
    Result<AdminUserEntity> getAdminUserInfo(Long id);
}