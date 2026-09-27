package com.shop.admin.service;

import java.util.List;

import com.baomidou.mybatisplus.spring.service.IService;
import com.shop.admin.entity.AdminRoleEntity;
import com.shop.common.Result;

/**
 * 后台角色服务接口
 *
 * @author shop
 * @since 1.0.0
 */
public interface AdminRoleService extends IService<AdminRoleEntity> {

    /**
     * 创建角色
     * @param role 角色信息
     * @return 创建结果
     */
    Result<Void> createRole(AdminRoleEntity role);

    /**
     * 更新角色
     * @param role 角色信息
     * @return 更新结果
     */
    Result<Void> updateRole(AdminRoleEntity role);

    /**
     * 删除角色
     * @param id 角色ID
     * @return 删除结果
     */
    Result<Void> deleteRole(Long id);

    /**
     * 获取角色详情
     * @param id 角色ID
     * @return 角色信息
     */
    Result<AdminRoleEntity> getRoleDetail(Long id);

    /**
     * 为角色分配权限
     * @param roleId 角色ID
     * @param permissionIds 权限ID列表
     * @return 分配结果
     */
    Result<Void> assignPermissions(Long roleId, List<Long> permissionIds);

    /**
     * 获取角色的权限ID列表
     * @param roleId 角色ID
     * @return 权限ID列表
     */
    Result<List<Long>> getRolePermissionIds(Long roleId);

    /**
     * 禁用角色
     * @param id 角色ID
     * @return 禁用结果
     */
    Result<Void> disableRole(Long id);

    /**
     * 启用角色
     * @param id 角色ID
     * @return 启用结果
     */
    Result<Void> enableRole(Long id);

    /**
     * 批量禁用角色
     * @param ids 角色ID列表
     * @return 禁用结果
     */
    Result<Void> batchDisableRole(List<Long> ids);

    /**
     * 批量启用角色
     * @param ids 角色ID列表
     * @return 启用结果
     */
    Result<Void> batchEnableRole(List<Long> ids);

    /**
     * 根据用户ID获取角色列表
     * @param userId 用户ID
     * @return 角色列表
     */
    List<AdminRoleEntity> getRolesByUserId(Long userId);
}
