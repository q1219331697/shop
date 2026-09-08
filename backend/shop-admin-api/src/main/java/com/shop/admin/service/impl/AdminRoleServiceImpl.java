
package com.shop.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shop.admin.entity.AdminRoleEntity;
import com.shop.admin.entity.AdminRolePermissionEntity;
import com.shop.admin.entity.AdminUserRoleEntity;
import com.shop.admin.mapper.AdminRoleMapper;
import com.shop.admin.mapper.AdminRolePermissionMapper;
import com.shop.admin.mapper.AdminUserRoleMapper;
import com.shop.admin.service.AdminPermissionService;
import com.shop.admin.service.AdminRoleService;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 后台角色服务实现类
 * @since 1.0.0
 */
@Slf4j
@Service
public class AdminRoleServiceImpl extends ServiceImpl<AdminRoleMapper, AdminRoleEntity> implements AdminRoleService {

    private final AdminRolePermissionMapper rolePermissionMapper;
    private final AdminUserRoleMapper userRoleMapper;
    private final AdminPermissionService adminPermissionService;

    public AdminRoleServiceImpl(AdminRolePermissionMapper rolePermissionMapper,
                                AdminUserRoleMapper userRoleMapper,
                                AdminPermissionService adminPermissionService) {
        this.rolePermissionMapper = rolePermissionMapper;
        this.userRoleMapper = userRoleMapper;
        this.adminPermissionService = adminPermissionService;
    }

    @Override
    public Result<Void> createRole(AdminRoleEntity role) {
        log.info("创建角色请求, roleName: {}", role.getRoleName());

        // 校验角色名称唯一
        LambdaQueryWrapper<AdminRoleEntity> nameWrapper = new LambdaQueryWrapper<>();
        nameWrapper.eq(AdminRoleEntity::getRoleName, role.getRoleName());
        if (this.count(nameWrapper) > 0) {
            log.warn("创建角色失败, 角色名称已存在, roleName: {}", role.getRoleName());
            return Result.error(ResultCodeEnum.PARAM_ERROR, "角色名称已存在");
        }

        if (role.getStatus() == null) {
            role.setStatus(1);
        }
        if (role.getSortOrder() == null) {
            role.setSortOrder(0);
        }

        boolean success = this.save(role);
        if (success) {
            log.info("创建角色成功, roleId: {}, roleName: {}", role.getId(), role.getRoleName());
        } else {
            log.error("创建角色失败, roleName: {}", role.getRoleName());
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "创建角色失败");
    }

    @Override
    public Result<Void> updateRole(AdminRoleEntity role) {
        log.info("更新角色信息, roleId: {}", role.getId());
        AdminRoleEntity existRole = this.getById(role.getId());
        if (existRole == null) {
            log.warn("更新角色失败, 角色不存在, roleId: {}", role.getId());
            return Result.error(ResultCodeEnum.PARAM_ERROR, "角色不存在");
        }

        // 校验角色名称唯一
        if (role.getRoleName() != null && !role.getRoleName().equals(existRole.getRoleName())) {
            LambdaQueryWrapper<AdminRoleEntity> nameWrapper = new LambdaQueryWrapper<>();
            nameWrapper.eq(AdminRoleEntity::getRoleName, role.getRoleName());
            if (this.count(nameWrapper) > 0) {
                log.warn("更新角色失败, 角色名称已存在, roleName: {}", role.getRoleName());
                return Result.error(ResultCodeEnum.PARAM_ERROR, "角色名称已存在");
            }
        }

        boolean success = this.updateById(role);
        if (success) {
            log.info("更新角色成功, roleId: {}", role.getId());
            // 角色状态变更时，清除拥有该角色的所有用户的权限缓存
            clearPermissionCacheByRoleId(role.getId());
        } else {
            log.error("更新角色失败, roleId: {}", role.getId());
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "更新角色失败");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> deleteRole(Long id) {
        log.info("删除角色请求, roleId: {}", id);
        AdminRoleEntity existRole = this.getById(id);
        if (existRole == null) {
            log.warn("删除角色失败, 角色不存在, roleId: {}", id);
            return Result.error(ResultCodeEnum.PARAM_ERROR, "角色不存在");
        }

        // 检查是否有用户关联此角色
        LambdaQueryWrapper<AdminUserRoleEntity> userRoleWrapper = new LambdaQueryWrapper<>();
        userRoleWrapper.eq(AdminUserRoleEntity::getRoleId, id);
        if (userRoleMapper.selectCount(userRoleWrapper) > 0) {
            log.warn("删除角色失败, 角色下存在用户, roleId: {}", id);
            return Result.error(ResultCodeEnum.OPERATION_FAILED, "该角色下存在用户，无法删除");
        }

        // 删除角色权限关联
        LambdaQueryWrapper<AdminRolePermissionEntity> rpWrapper = new LambdaQueryWrapper<>();
        rpWrapper.eq(AdminRolePermissionEntity::getRoleId, id);
        rolePermissionMapper.delete(rpWrapper);

        // 删除角色
        boolean success = this.removeById(id);
        if (success) {
            log.info("删除角色成功, roleId: {}", id);
            // 清除拥有该角色的所有用户的权限缓存
            clearPermissionCacheByRoleId(id);
        } else {
            log.error("删除角色失败, roleId: {}", id);
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "删除角色失败");
    }

    @Override
    public Result<AdminRoleEntity> getRoleInfo(Long id) {
        log.info("获取角色信息, roleId: {}", id);
        AdminRoleEntity role = this.getById(id);
        if (role == null) {
            log.warn("获取角色信息失败, 角色不存在, roleId: {}", id);
            return Result.error(ResultCodeEnum.PARAM_ERROR, "角色不存在");
        }
        return Result.success(role);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> assignPermissions(Long roleId, List<Long> permissionIds) {
        log.info("为角色分配权限, roleId: {}, permissionIds: {}", roleId, permissionIds);
        AdminRoleEntity existRole = this.getById(roleId);
        if (existRole == null) {
            log.warn("分配权限失败, 角色不存在, roleId: {}", roleId);
            return Result.error(ResultCodeEnum.PARAM_ERROR, "角色不存在");
        }

        // 前端会把「全选节点」与「半选父节点」一并提交，二者可能重复，此处去重并过滤空值
        List<Long> distinctPermissionIds = permissionIds == null
                ? Collections.emptyList()
                : permissionIds.stream()
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList());

        // 删除原有权限关联
        LambdaQueryWrapper<AdminRolePermissionEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminRolePermissionEntity::getRoleId, roleId);
        rolePermissionMapper.delete(wrapper);

        // 批量插入新的权限关联
        if (!distinctPermissionIds.isEmpty()) {
            List<AdminRolePermissionEntity> rpList = distinctPermissionIds.stream().map(permissionId -> {
                AdminRolePermissionEntity rp = new AdminRolePermissionEntity();
                rp.setRoleId(roleId);
                rp.setPermissionId(permissionId);
                return rp;
            }).collect(Collectors.toList());
            for (AdminRolePermissionEntity rp : rpList) {
                rolePermissionMapper.insert(rp);
            }
        }

        log.info("为角色分配权限成功, roleId: {}", roleId);

        // 清除拥有该角色的所有用户的权限缓存
        clearPermissionCacheByRoleId(roleId);

        return Result.success();
    }

    @Override
    public Result<List<Long>> getRolePermissionIds(Long roleId) {
        log.info("获取角色权限ID列表, roleId: {}", roleId);
        LambdaQueryWrapper<AdminRolePermissionEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminRolePermissionEntity::getRoleId, roleId);
        List<Long> permissionIds = rolePermissionMapper.selectList(wrapper)
                .stream()
                .map(AdminRolePermissionEntity::getPermissionId)
                .collect(Collectors.toList());
        return Result.success(permissionIds);
    }

    @Override
    public List<AdminRoleEntity> getRolesByUserId(Long userId) {
        LambdaQueryWrapper<AdminUserRoleEntity> urWrapper = new LambdaQueryWrapper<>();
        urWrapper.eq(AdminUserRoleEntity::getUserId, userId);
        List<Long> roleIds = userRoleMapper.selectList(urWrapper)
                .stream()
                .map(AdminUserRoleEntity::getRoleId)
                .collect(Collectors.toList());

        if (roleIds.isEmpty()) {
            return Collections.emptyList();
        }
        return this.listByIds(roleIds);
    }

    @Override
    public Result<Void> disableRole(Long id) {
        log.info("禁用角色请求, roleId: {}", id);
        AdminRoleEntity existRole = this.getById(id);
        if (existRole == null) {
            log.warn("禁用角色失败, 角色不存在, roleId: {}", id);
            return Result.error(ResultCodeEnum.PARAM_ERROR, "角色不存在");
        }
        if (existRole.getStatus() == 0) {
            log.warn("禁用角色失败, 角色已被禁用, roleId: {}", id);
            return Result.error(ResultCodeEnum.OPERATION_FAILED, "角色已被禁用");
        }
        AdminRoleEntity update = new AdminRoleEntity();
        update.setId(id);
        update.setStatus(0);
        boolean success = this.updateById(update);
        if (success) {
            log.info("禁用角色成功, roleId: {}", id);
            clearPermissionCacheByRoleId(id);
        } else {
            log.error("禁用角色失败, roleId: {}", id);
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "禁用角色失败");
    }

    @Override
    public Result<Void> enableRole(Long id) {
        log.info("启用角色请求, roleId: {}", id);
        AdminRoleEntity existRole = this.getById(id);
        if (existRole == null) {
            log.warn("启用角色失败, 角色不存在, roleId: {}", id);
            return Result.error(ResultCodeEnum.PARAM_ERROR, "角色不存在");
        }
        if (existRole.getStatus() == 1) {
            log.warn("启用角色失败, 角色已是启用状态, roleId: {}", id);
            return Result.error(ResultCodeEnum.OPERATION_FAILED, "角色已是启用状态");
        }
        AdminRoleEntity update = new AdminRoleEntity();
        update.setId(id);
        update.setStatus(1);
        boolean success = this.updateById(update);
        if (success) {
            log.info("启用角色成功, roleId: {}", id);
            clearPermissionCacheByRoleId(id);
        } else {
            log.error("启用角色失败, roleId: {}", id);
        }
        return success ? Result.success() : Result.error(ResultCodeEnum.OPERATION_FAILED, "启用角色失败");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> batchDisableRole(List<Long> ids) {
        log.info("批量禁用角色请求, ids: {}", ids);
        if (ids == null || ids.isEmpty()) {
            return Result.error(ResultCodeEnum.PARAM_ERROR, "请选择要禁用的角色");
        }
        for (Long id : ids) {
            Result<Void> result = disableRole(id);
            if (!result.isSuccess()) {
                log.info("批量禁用角色中断, 失败的roleId: {}", id);
                return result;
            }
        }
        log.info("批量禁用角色成功, 共禁用{}条", ids.size());
        return Result.success();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> batchEnableRole(List<Long> ids) {
        log.info("批量启用角色请求, ids: {}", ids);
        if (ids == null || ids.isEmpty()) {
            return Result.error(ResultCodeEnum.PARAM_ERROR, "请选择要启用的角色");
        }
        for (Long id : ids) {
            Result<Void> result = enableRole(id);
            if (!result.isSuccess()) {
                log.info("批量启用角色中断, 失败的roleId: {}", id);
                return result;
            }
        }
        log.info("批量启用角色成功, 共启用{}条", ids.size());
        return Result.success();
    }

    /**
     * 根据角色ID清除拥有该角色的所有用户的权限缓存
     * @param roleId 角色ID
     */
    private void clearPermissionCacheByRoleId(Long roleId) {
        LambdaQueryWrapper<AdminUserRoleEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminUserRoleEntity::getRoleId, roleId);
        List<Long> userIds = userRoleMapper.selectList(wrapper)
                .stream()
                .map(AdminUserRoleEntity::getUserId)
                .distinct()
                .collect(Collectors.toList());
        for (Long userId : userIds) {
            adminPermissionService.clearPermissionCache(userId);
        }
        if (!userIds.isEmpty()) {
            log.info("清除角色关联用户权限缓存, roleId: {}, 受影响用户数: {}", roleId, userIds.size());
        }
    }
}
