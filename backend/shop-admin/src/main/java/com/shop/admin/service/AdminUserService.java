package com.shop.admin.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.shop.admin.entity.AdminUserEntity;
import com.shop.common.Result;
import java.util.List;

/**
 * 后台管理用户服务接口
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
     * 创建管理员
     *
     * @param adminUser 管理员信息
     * @return 创建结果
     */
    Result<Void> createAdminUser(AdminUserEntity adminUser);

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
    Result<AdminUserEntity> getAdminUserInfo(Long id);

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
     * 分页查询管理员（支持用户名、姓名搜索和状态筛选）
     *
     * @param pageNum 当前页码
     * @param pageSize 每页条数
     * @param username 用户名搜索
     * @param realName 姓名搜索
     * @param status 状态筛选
     * @return 管理员分页数据
     */
    Result<IPage<AdminUserEntity>> pageAdminUser(Long pageNum, Long pageSize, String username, String realName, Integer status);

    /**
     * 根据用户名查询管理员
     *
     * @param username 用户名
     * @return 管理员实体
     */
    AdminUserEntity getByUsername(String username);

    /**
     * 删除管理员（同时清除角色关联和权限缓存）
     *
     * @param id 管理员ID
     * @return 删除结果
     */
    Result<Void> deleteAdminUser(Long id);
}