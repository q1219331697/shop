package com.shop.admin.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.admin.entity.AdminPermissionEntity;

/**
 * 后台权限Mapper接口
 *
 * @author shop
 * @since 1.0.0
 */
@Mapper
public interface AdminPermissionMapper extends BaseMapper<AdminPermissionEntity> {

    /**
     * 物理删除 E2E 测试产生的权限数据（忽略逻辑删除标记）。
     * 按权限名称前缀匹配，覆盖整棵子树（子节点名称同样带前缀）。
     * SQL 见 resources/mapper/AdminPermissionMapper.xml
     *
     * @param prefix 权限名称前缀（须以 e2e- 开头）
     */
    void deleteByE2ENamePrefix(@Param("prefix") String prefix);
}
