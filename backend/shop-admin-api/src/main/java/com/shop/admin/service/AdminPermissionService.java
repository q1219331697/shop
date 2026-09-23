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
     * 搜索权限节点
     * <p>
     * 按条件过滤后返回命中的节点列表（平铺，不做层级补全）。
     * 与「无条件返回完整树」的 getPermissionTree 分开，避免调用方对返回结构产生歧义。
     * </p>
     *
     * @param permissionName 权限名称，模糊匹配，可空
     * @param permissionCode 权限编码，模糊匹配，可空
     * @param permissionType 权限类型，精确匹配，可空
     * @param status 状态，精确匹配，可空（为空时默认只返回启用节点）
     * @return 命中的权限节点列表（平铺）
     */
    List<AdminPermissionEntity> searchPermissions(String permissionName, String permissionCode,
                                                  Integer permissionType, Integer status);

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
