package com.shop.admin.service.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
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

    /**
     * 权限类型：目录（仅作导航分组，不参与授权，允许权限编码为空）
     */
    private static final int DIRECTORY_TYPE = 1;

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
        // 空白编码归一化为 null，避免多个目录节点的空串触发唯一索引冲突
        normalizeBlankCode(permission);

        log.info("创建权限请求, permissionName: {}, permissionCode: {}",
                permission.getPermissionName(), permission.getPermissionCode());

        // 非目录节点必须填写权限编码（目录仅作导航分组，不参与授权）
        if (!isDirectory(permission) && !StringUtils.hasText(permission.getPermissionCode())) {
            log.warn("创建权限失败, 非目录节点未填写权限编码, permissionName: {}",
                    permission.getPermissionName());
            return Result.error(ResultCodeEnum.PARAM_ERROR, "请输入权限编码");
        }

        // 校验权限编码唯一（空编码不参与校验）
        if (StringUtils.hasText(permission.getPermissionCode())) {
            LambdaQueryWrapper<AdminPermissionEntity> codeWrapper = new LambdaQueryWrapper<>();
            codeWrapper.eq(AdminPermissionEntity::getPermissionCode, permission.getPermissionCode());
            if (this.count(codeWrapper) > 0) {
                log.warn("创建权限失败, 权限编码已存在, permissionCode: {}", permission.getPermissionCode());
                return Result.error(ResultCodeEnum.PARAM_ERROR, "权限编码已存在");
            }
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
        // 空白编码归一化为 null，避免多个目录节点的空串触发唯一索引冲突
        normalizeBlankCode(permission);

        log.info("更新权限信息, permissionId: {}", permission.getId());
        AdminPermissionEntity existPermission = this.getById(permission.getId());
        if (existPermission == null) {
            log.warn("更新权限失败, 权限不存在, permissionId: {}", permission.getId());
            return Result.error(ResultCodeEnum.PARAM_ERROR, "权限不存在");
        }

        // 非目录节点必须填写权限编码（目录仅作导航分组，不参与授权）
        if (!isDirectory(permission) && !StringUtils.hasText(permission.getPermissionCode())) {
            log.warn("更新权限失败, 非目录节点未填写权限编码, permissionId: {}", permission.getId());
            return Result.error(ResultCodeEnum.PARAM_ERROR, "请输入权限编码");
        }

        // 校验权限编码唯一（空编码不参与校验）
        if (StringUtils.hasText(permission.getPermissionCode())
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

        // 编码由有值改为空时，MyBatis-Plus 默认忽略 null 字段，需用 UpdateWrapper 显式置空
        if (permission.getPermissionCode() == null) {
            LambdaUpdateWrapper<AdminPermissionEntity> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(AdminPermissionEntity::getId, permission.getId());
            updateWrapper.set(AdminPermissionEntity::getPermissionCode, null);
            this.update(permission, updateWrapper);
        } else {
            this.updateById(permission);
        }
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
    public List<AdminPermissionEntity> searchPermissions(String permissionName, String permissionCode,
                                                         Integer permissionType, Integer status) {
        log.info("搜索权限节点, name={}, code={}, type={}, status={}",
                permissionName, permissionCode, permissionType, status);
        return this.list(buildSearchWrapper(permissionName, permissionCode, permissionType, status));
    }

    /**
     * 构建搜索条件：名称与编码模糊匹配，类型与状态精确匹配
     * <p>
     * 状态未显式传入时默认只查启用节点，与权限树保持一致。
     * </p>
     */
    private LambdaQueryWrapper<AdminPermissionEntity> buildSearchWrapper(String permissionName, String permissionCode,
                                                                        Integer permissionType, Integer status) {
        LambdaQueryWrapper<AdminPermissionEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AdminPermissionEntity::getStatus, status != null ? status : 1);
        wrapper.like(StringUtils.hasText(permissionName), AdminPermissionEntity::getPermissionName, permissionName);
        wrapper.like(StringUtils.hasText(permissionCode), AdminPermissionEntity::getPermissionCode, permissionCode);
        wrapper.eq(permissionType != null, AdminPermissionEntity::getPermissionType, permissionType);
        wrapper.orderByAsc(AdminPermissionEntity::getSortOrder);
        return wrapper;
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

        // 获取权限编码列表（目录节点编码为 null，需过滤，避免污染缓存与鉴权集合）
        LambdaQueryWrapper<AdminPermissionEntity> pWrapper = new LambdaQueryWrapper<>();
        pWrapper.in(AdminPermissionEntity::getId, permissionIds);
        pWrapper.eq(AdminPermissionEntity::getStatus, 1);
        pWrapper.select(AdminPermissionEntity::getPermissionCode);
        List<AdminPermissionEntity> rows = this.list(pWrapper);
        if (rows == null || rows.isEmpty()) {
            log.warn("用户无可用权限编码, userId: {}", userId);
            return Collections.emptyList();
        }
        // 注意：仅 select 单列时，该列为 NULL 的行（目录节点）会被 MyBatis 映射为 null 元素
        // （returnInstanceForEmptyRow 默认为 false），故需先过滤 null 元素再取编码
        List<String> permissionCodes = rows.stream()
                .filter(Objects::nonNull)
                .map(AdminPermissionEntity::getPermissionCode)
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());
        log.info("用户权限编码解析完成, userId: {}, 原始行数: {}, 有效编码数: {}",
                userId, rows.size(), permissionCodes.size());

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

        // 获取目录与菜单（含 visible=0 的隐藏任务页）：
        // 前端需据此生成完整路由，是否显示在侧边栏由 visible 字段决定，故此处不过滤 visible
        LambdaQueryWrapper<AdminPermissionEntity> pWrapper = new LambdaQueryWrapper<>();
        pWrapper.in(AdminPermissionEntity::getId, permissionIds);
        pWrapper.in(AdminPermissionEntity::getPermissionType, 1, 2);
        pWrapper.eq(AdminPermissionEntity::getStatus, 1);
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
     * 判断是否为目录节点
     * <p>
     * 目录仅作导航分组，不参与授权，因此允许权限编码为空。
     * </p>
     *
     * @param permission 权限信息
     * @return true-目录节点 false-菜单/任务页/操作按钮
     */
    private boolean isDirectory(AdminPermissionEntity permission) {
        return permission.getPermissionType() != null
                && permission.getPermissionType() == DIRECTORY_TYPE;
    }

    /**
     * 将空白权限编码归一化为 null
     * <p>
     * 前端对目录节点可能提交空串，若直接入库会导致唯一索引 uk_permission_code 冲突。
     * </p>
     *
     * @param permission 权限信息
     */
    private void normalizeBlankCode(AdminPermissionEntity permission) {
        if (permission.getPermissionCode() != null && permission.getPermissionCode().trim().isEmpty()) {
            permission.setPermissionCode(null);
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
