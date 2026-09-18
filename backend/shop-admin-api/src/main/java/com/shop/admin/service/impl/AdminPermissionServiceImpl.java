package com.shop.admin.service.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.shop.admin.entity.AdminPermissionEntity;
import com.shop.admin.entity.AdminRoleEntity;
import com.shop.admin.entity.AdminRolePermissionEntity;
import com.shop.admin.entity.AdminUserRoleEntity;
import com.shop.admin.mapper.AdminPermissionMapper;
import com.shop.admin.mapper.AdminRoleMapper;
import com.shop.admin.mapper.AdminRolePermissionMapper;
import com.shop.admin.mapper.AdminUserRoleMapper;
import com.shop.admin.service.AdminPermissionService;
import com.shop.common.Result;
import com.shop.common.ResultCodeEnum;

import lombok.extern.slf4j.Slf4j;

/**
 * 后台权限服务实现类
 *
 * @author shop
 * @since 1.0.0
 */
@Slf4j
@Service
public class AdminPermissionServiceImpl
        extends ServiceImpl<AdminPermissionMapper, AdminPermissionEntity>
        implements AdminPermissionService {

    private static final String PERM_CACHE_PREFIX = "admin:user:permissions:";
    private static final long PERM_CACHE_HOURS = 2;

    private final AdminRolePermissionMapper rolePermissionMapper;
    private final AdminUserRoleMapper userRoleMapper;
    private final AdminRoleMapper roleMapper;
    private final StringRedisTemplate redisTemplate;

    public AdminPermissionServiceImpl(AdminRolePermissionMapper rolePermissionMapper,
                                      AdminUserRoleMapper userRoleMapper,
                                      AdminRoleMapper roleMapper,
                                      StringRedisTemplate redisTemplate) {
        this.rolePermissionMapper = rolePermissionMapper;
        this.userRoleMapper = userRoleMapper;
        this.roleMapper = roleMapper;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Result<Long> createPermission(AdminPermissionEntity permission) {
        log.info("创建权限请求, permissionName: {}, permissionCode: {}",
                permission.getPermissionName(), permission.getPermissionCode());

        // 校验权限编码唯一
        LambdaQueryWrapper<AdminPermissionEntity> codeWrapper = new LambdaQueryWrapper<>();
        codeWrapper.eq(AdminPermissionEntity::getPermissionCode, permission.getPermissionCode());
        if (this.count(codeWrapper) > 0) {
            log.warn("创建权限失败, 权限编码已存在, permissionCode: {}", permission.getPermissionCode());
            return Result.error(ResultCodeEnum.PARAM_ERROR, "权限编码已存在");
        }

        // 校验父权限存在
        if (permission.getParentId() != null && permission.getParentId() > 0) {
            AdminPermissionEntity parent = this.getById(permission.getParentId());
            if (parent == null) {
                log.warn("创建权限失败, 父权限不存在, parentId: {}", permission.getParentId());
                return Result.error(ResultCodeEnum.PARAM_ERROR, "父权限不存在");
            }
        }

        if (permission.getStatus() == null) {
            permission.setStatus(1);
        }
        if (permission.getSortOrder() == null) {
            permission.setSortOrder(0);
        }
        if (permission.getVisible() == null) {
            permission.setVisible(1);
        }

        this.save(permission);
        log.info("创建权限成功, permissionId: {}, permissionCode: {}",
                permission.getId(), permission.getPermissionCode());
        return Result.success(permission.getId());
    }

    @Override
    public Result<Void> updatePermission(AdminPermissionEntity permission) {
        log.info("更新权限信息, permissionId: {}", permission.getId());
        AdminPermissionEntity existPermission = this.getById(permission.getId());
        if (existPermission == null) {
            log.warn("更新权限失败, 权限不存在, permissionId: {}", permission.getId());
            return Result.error(ResultCodeEnum.PARAM_ERROR, "权限不存在");
        }

        // 校验权限编码唯一
        if (permission.getPermissionCode() != null
                && !permission.getPermissionCode().equals(existPermission.getPermissionCode())) {
            LambdaQueryWrapper<AdminPermissionEntity> codeWrapper = new LambdaQueryWrapper<>();
            codeWrapper.eq(AdminPermissionEntity::getPermissionCode, permission.getPermissionCode());
            if (this.count(codeWrapper) > 0) {
                log.warn("更新权限失败, 权限编码已存在, permissionCode: {}", permission.getPermissionCode());
                return Result.error(ResultCodeEnum.PARAM_ERROR, "权限编码已存在");
            }
        }

        // 不能将父权限设为自己
        if (permission.getParentId() != null && permission.getParentId().equals(permission.getId())) {
            log.warn("更新权限失败, 父权限不能为自己, permissionId: {}", permission.getId());
            return Result.error(ResultCodeEnum.PARAM_ERROR, "父权限不能为自己");
        }

        this.updateById(permission);
        log.info("更新权限成功, permissionId: {}", permission.getId());
        return Result.success();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result<Void> deletePermission(Long id) {
        log.info("删除权限请求, permissionId: {}", id);
        AdminPermissionEntity existPermission = this.getById(id);
        if (existPermission == null) {
            log.warn("删除权限失败, 权限不存在, permissionId: {}", id);
            return Result.error(ResultCodeEnum.PARAM_ERROR, "权限不存在");
        }

        // 检查是否有子权限
        LambdaQueryWrapper<AdminPermissionEntity> childWrapper = new LambdaQueryWrapper<>();
        childWrapper.eq(AdminPermissionEntity::getParentId, id);
        if (this.count(childWrapper) > 0) {
            log.warn("删除权限失败, 存在子权限, permissionId: {}", id);
            return Result.error(ResultCodeEnum.OPERATION_FAILED, "存在子权限，无法删除");
        }

        // 删除角色权限关联
        LambdaQueryWrapper<AdminRolePermissionEntity> rpWrapper = new LambdaQueryWrapper<>();
        rpWrapper.eq(AdminRolePermissionEntity::getPermissionId, id);
        rolePermissionMapper.delete(rpWrapper);

        // 删除权限
        this.removeById(id);
        log.info("删除权限成功, permissionId: {}", id);
        return Result.success();
    }

    @Override
    public Result<AdminPermissionEntity> getPermissionInfo(Long id) {
        log.info("获取权限信息, permissionId: {}", id);
        AdminPermissionEntity permission = this.getById(id);
        if (permission == null) {
            log.warn("获取权限信息失败, 权限不存在, permissionId: {}", id);
            return Result.error(ResultCodeEnum.PARAM_ERROR, "权限不存在");
        }
        return Result.success(permission);
    }

    @Override
    public Result<List<AdminPermissionEntity>> getPermissionTree() {
        log.info("获取权限树形结构");
        LambdaQueryWrapper<AdminPermissionEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminPermissionEntity::getStatus, 1);
        wrapper.orderByAsc(AdminPermissionEntity::getSortOrder);
        List<AdminPermissionEntity> allPermissions = this.list(wrapper);
        List<AdminPermissionEntity> tree = buildTree(allPermissions, 0L);
        return Result.success(tree);
    }

    @SuppressWarnings("null")
    @Override
    public List<String> getPermissionCodesByUserId(Long userId) {
        // 先从Redis缓存获取
        String cacheKey = PERM_CACHE_PREFIX + userId;
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null && !cached.isEmpty()) {
            return parsePermissionCodes(cached);
        }

        // 获取用户角色ID列表
        LambdaQueryWrapper<AdminUserRoleEntity> urWrapper = new LambdaQueryWrapper<>();
        urWrapper.eq(AdminUserRoleEntity::getUserId, userId);
        List<Long> roleIds = userRoleMapper.selectList(urWrapper)
                .stream()
                .map(AdminUserRoleEntity::getRoleId)
                .collect(Collectors.toList());

        if (roleIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 过滤禁用的角色（只保留状态为正常的角色）
        LambdaQueryWrapper<AdminRoleEntity> roleWrapper = new LambdaQueryWrapper<>();
        roleWrapper.in(AdminRoleEntity::getId, roleIds);
        roleWrapper.eq(AdminRoleEntity::getStatus, 1);
        roleIds = roleMapper.selectList(roleWrapper)
                .stream()
                .map(AdminRoleEntity::getId)
                .collect(Collectors.toList());

        if (roleIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 获取角色关联的权限ID列表
        LambdaQueryWrapper<AdminRolePermissionEntity> rpWrapper = new LambdaQueryWrapper<>();
        rpWrapper.in(AdminRolePermissionEntity::getRoleId, roleIds);
        List<Long> permissionIds = rolePermissionMapper.selectList(rpWrapper)
                .stream()
                .map(AdminRolePermissionEntity::getPermissionId)
                .distinct()
                .collect(Collectors.toList());

        if (permissionIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 获取权限编码列表
        LambdaQueryWrapper<AdminPermissionEntity> pWrapper = new LambdaQueryWrapper<>();
        pWrapper.in(AdminPermissionEntity::getId, permissionIds);
        pWrapper.eq(AdminPermissionEntity::getStatus, 1);
        pWrapper.select(AdminPermissionEntity::getPermissionCode);
        List<String> permissionCodes = this.list(pWrapper)
                .stream()
                .map(AdminPermissionEntity::getPermissionCode)
                .collect(Collectors.toList());

        // 写入Redis缓存
        if (!permissionCodes.isEmpty()) {
            String cacheValue = String.join(",", permissionCodes);
            redisTemplate.opsForValue().set(cacheKey, cacheValue, PERM_CACHE_HOURS, TimeUnit.HOURS);
        }

        return permissionCodes;
    }

    /**
     * 根据用户ID获取菜单树
     * @param userId 用户ID
     * @return 菜单树列表
     */
    @Override
    public List<AdminPermissionEntity> getMenuTreeByUserId(Long userId) {
        // 获取用户角色ID列表
        LambdaQueryWrapper<AdminUserRoleEntity> urWrapper = new LambdaQueryWrapper<>();
        urWrapper.eq(AdminUserRoleEntity::getUserId, userId);
        List<Long> roleIds = userRoleMapper.selectList(urWrapper)
                .stream()
                .map(AdminUserRoleEntity::getRoleId)
                .collect(Collectors.toList());

        if (roleIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 过滤禁用的角色
        LambdaQueryWrapper<AdminRoleEntity> roleWrapper = new LambdaQueryWrapper<>();
        roleWrapper.in(AdminRoleEntity::getId, roleIds);
        roleWrapper.eq(AdminRoleEntity::getStatus, 1);
        roleIds = roleMapper.selectList(roleWrapper)
                .stream()
                .map(AdminRoleEntity::getId)
                .collect(Collectors.toList());

        if (roleIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 获取角色关联的权限ID列表
        LambdaQueryWrapper<AdminRolePermissionEntity> rpWrapper = new LambdaQueryWrapper<>();
        rpWrapper.in(AdminRolePermissionEntity::getRoleId, roleIds);
        List<Long> permissionIds = rolePermissionMapper.selectList(rpWrapper)
                .stream()
                .map(AdminRolePermissionEntity::getPermissionId)
                .distinct()
                .collect(Collectors.toList());

        if (permissionIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 获取菜单类型的权限（目录与菜单均可导航，操作类型不进入菜单树）
        LambdaQueryWrapper<AdminPermissionEntity> pWrapper = new LambdaQueryWrapper<>();
        pWrapper.in(AdminPermissionEntity::getId, permissionIds);
        pWrapper.in(AdminPermissionEntity::getPermissionType, 1, 2);
        pWrapper.eq(AdminPermissionEntity::getStatus, 1);
        pWrapper.eq(AdminPermissionEntity::getVisible, 1);
        pWrapper.orderByAsc(AdminPermissionEntity::getSortOrder);
        List<AdminPermissionEntity> menus = this.list(pWrapper);

        return buildTree(menus, 0L);
    }

    @Override
    public void clearPermissionCache(Long userId) {
        String cacheKey = PERM_CACHE_PREFIX + userId;
        redisTemplate.delete(cacheKey);
        log.info("清除用户权限缓存, userId: {}", userId);
    }

    @Override
    public void clearAllPermissionCache() {
        Set<String> keys = redisTemplate.keys(PERM_CACHE_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
            log.info("清除所有用户权限缓存, 共{}条", keys.size());
        }
    }

    /**
     * 解析缓存中的权限编码字符串
     * @param cached 缓存值，逗号分隔
     * @return 权限编码列表
     */
    private List<String> parsePermissionCodes(String cached) {
        if (cached == null || cached.isEmpty()) {
            return Collections.emptyList();
        }
        String[] parts = cached.split(",");
        List<String> codes = new ArrayList<>(parts.length);
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                codes.add(trimmed);
            }
        }
        return codes;
    }

    /**
     * 构建树形结构
     * @param allPermissions 所有权限列表
     * @param parentId 父ID
     * @return 树形列表
     */
    private List<AdminPermissionEntity> buildTree(List<AdminPermissionEntity> allPermissions, Long parentId) {
        List<AdminPermissionEntity> tree = new ArrayList<>();
        for (AdminPermissionEntity permission : allPermissions) {
            if (parentId.equals(permission.getParentId())) {
                permission.setChildren(buildTree(allPermissions, permission.getId()));
                tree.add(permission);
            }
        }
        return tree;
    }
}
