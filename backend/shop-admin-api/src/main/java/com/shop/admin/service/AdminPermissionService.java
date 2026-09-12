package com.shop.admin.service;

import java.util.List;

import com.baomidou.mybatisplus.extension.service.IService;
import com.shop.admin.entity.AdminPermissionEntity;
import com.shop.common.Result;

/**
 * 后台权限服务接口
 *
 * @author shop
 * @since 1.0.0
 */
public interface AdminPermissionService extends IService<AdminPermissionEntity> {

    /**
     * 创建权限
     * @param permission 权限信息
     * @return 新创建权限的 ID
     */
    Result<Long> createPermission(AdminPermissionEntity permission);

    /**
     * 更新权限
     * @param permission 权限信息
     * @return 更新结果
     */
    Result<Void> updatePermission(AdminPermissionEntity permission);

    /**
     * 删除权限
     * @param id 权限ID
     * @return 删除结果
     */
    Result<Void> deletePermission(Long id);

    /**
     * 获取权限详情
     * @param id 权限ID
     * @return 权限信息
     */
    Result<AdminPermissionEntity> getPermissionInfo(Long id);

    /**
     * 获取权限树形结构
     * @return 树形权限列表
     */
    Result<List<AdminPermissionEntity>> getPermissionTree();

    /**
     * 根据用户ID获取权限编码列表
     * @param userId 用户ID
     * @return 权限编码列表
     */
    List<String> getPermissionCodesByUserId(Long userId);

    /**
     * 根据用户ID获取菜单树形结构
     * @param userId 用户ID
     * @return 菜单树形列表
     */
    List<AdminPermissionEntity> getMenuTreeByUserId(Long userId);

    /**
     * 清除指定用户的权限缓存
     * @param userId 用户ID
     */
    void clearPermissionCache(Long userId);

    /**
     * 清除所有用户的权限缓存
     */
    void clearAllPermissionCache();
}
