package com.shop.admin.service;

import java.util.List;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.shop.admin.entity.AdminUserEntity;
import com.shop.common.Result;

/**
 * 后台管理用户服务接口
 *
 * @author shop
 * @since 1.0.0
 */
public interface AdminUserService extends IService<AdminUserEntity> {

    /**
     * 管理员登录，成功返回Token
     *
     * @param adminUser 管理员登录信息
     * @param ip 登录IP地址
     * @return 登录结果（含Token）
     */
    Result<String> login(AdminUserEntity adminUser, String ip);

    /**
     * 管理员登出，移除Redis中的Token
     *
     * @param token Token字符串
     * @return 登出结果
     */
    Result<Void> logout(String token);

    /**
     * 刷新Token，延长Redis中Token的有效时间
     *
     * @param token Token字符串
     * @return 刷新结果
     */
    Result<Void> refreshToken(String token);

    /**
     * 创建管理员
     *
     * @param adminUser 管理员信息
     * @return 创建结果
     */
    Result<Void> createAdminUser(AdminUserEntity adminUser);

    /**
     * 重置管理员密码为系统默认密码
     *
     * @param id 管理员ID
     * @return 重置结果
     */
    Result<Void> resetPassword(Long id);

    /**
     * 修改当前登录管理员的密码（需校验原密码）
     *
     * @param adminUserId 当前登录管理员ID
     * @param oldPassword 原密码
     * @param newPassword 新密码
     * @return 修改结果
     */
    Result<Void> changePassword(Long adminUserId, String oldPassword, String newPassword);

    /**
     * 获取系统默认密码（供前端提示展示）
     *
     * @return 默认密码
     */
    String getDefaultPassword();

    /**
     * 更新管理员信息
     *
     * @param adminUser 管理员信息
     * @return 更新结果
     */
    Result<Void> updateAdminUser(AdminUserEntity adminUser);

    /**
     * 获取管理员详情（密码置空）
     *
     * @param id 管理员ID
     * @return 管理员详情
     */
    Result<AdminUserEntity> getUserDetail(Long id);

    /**
     * 为用户分配角色（先删后插）
     *
     * @param userId 用户ID
     * @param roleIds 角色ID列表
     * @return 分配结果
     */
    Result<Void> assignRoles(Long userId, List<Long> roleIds);

    /**
     * 获取用户的角色ID列表
     *
     * @param userId 用户ID
     * @return 角色ID列表
     */
    Result<List<Long>> getUserRoleIds(Long userId);

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
    Result<IPage<AdminUserEntity>> pageAdminUser(Long pageNum, Long pageSize,
                                                   String username, String realName,
                                                   Integer status, Integer deleted);

    /**
     * 根据用户名查询管理员
     *
     * @param username 用户名
     * @return 管理员实体
     */
    AdminUserEntity getByUsername(String username);

    /**
     * 删除管理员（同时清除角色关联和权限缓存）
     * <p>当前登录管理员自身会被静默过滤：不执行删除，也不返回提示。</p>
     *
     * @param id 管理员ID
     * @param currentUserId 当前登录管理员ID（自身保护）
     * @return 删除结果
     */
    Result<Void> deleteAdminUser(Long id, Long currentUserId);

    /**
     * 批量删除管理员（同时清除角色关联和权限缓存）
     * <p>列表中的当前登录管理员自身会被静默过滤：不执行删除，也不返回提示。</p>
     *
     * @param ids 管理员ID列表
     * @param currentUserId 当前登录管理员ID（自身保护）
     * @return 删除结果
     */
    Result<Void> batchDeleteAdminUser(List<Long> ids, Long currentUserId);

    /**
     * 禁用管理员
     * <p>当前登录管理员自身会被静默过滤：不执行禁用，也不返回提示。</p>
     *
     * @param id 管理员ID
     * @param currentUserId 当前登录管理员ID（自身保护）
     * @return 禁用结果
     */
    Result<Void> disableAdminUser(Long id, Long currentUserId);

    /**
     * 启用管理员
     *
     * @param id 管理员ID
     * @return 启用结果
     */
    Result<Void> enableAdminUser(Long id);

    /**
     * 恢复已删除的管理员
     *
     * @param id 管理员ID
     * @return 恢复结果
     */
    Result<Void> restoreAdminUser(Long id);

    /**
     * 批量禁用管理员
     * <p>列表中的当前登录管理员自身会被静默过滤：不执行禁用，也不返回提示。</p>
     *
     * @param ids 管理员ID列表
     * @param currentUserId 当前登录管理员ID（自身保护）
     * @return 禁用结果
     */
    Result<Void> batchDisableAdminUser(List<Long> ids, Long currentUserId);

    /**
     * 批量启用管理员
     *
     * @param ids 管理员ID列表
     * @return 启用结果
     */
    Result<Void> batchEnableAdminUser(List<Long> ids);

    /**
     * 批量恢复已删除的管理员
     *
     * @param ids 管理员ID列表
     * @return 恢复结果
     */
    Result<Void> batchRestoreAdminUser(List<Long> ids);
}