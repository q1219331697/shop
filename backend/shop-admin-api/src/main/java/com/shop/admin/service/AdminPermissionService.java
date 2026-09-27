package com.shop.admin.service;

import java.util.List;

import com.baomidou.mybatisplus.spring.service.IService;
import com.shop.admin.dto.PermissionListRequest;
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
    Result<AdminPermissionEntity> getPermissionDetail(Long id);

    /**
     * 查询权限树列表
     * <p>
     * 合并原「树查询」与「搜索」两条链路：二者语义本就重叠（前者等价于全条件为空的后者 + 建树），
     * 拆开反而把「要不要做层级补全」的判断推给了调用方。
     * </p>
     * <p>
     * 统一后的约定：
     * <ul>
     *   <li>四个条件全为空：返回完整树；</li>
     *   <li>任一条件非空：返回「命中节点 + 其所有祖先链」构成的树，保持层级完整，不做平铺。</li>
     * </ul>
     * </p>
     *
     * @param request 查询条件，可为 null（此时等价于全条件为空）
     * @return 树形权限列表
     */
    List<AdminPermissionEntity> listPermissions(PermissionListRequest request);

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
