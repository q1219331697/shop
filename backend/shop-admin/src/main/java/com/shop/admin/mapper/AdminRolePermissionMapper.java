
package com.shop.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.admin.entity.AdminRolePermissionEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 角色权限关联Mapper接口
 * @since 1.0.0
 */
@Mapper
public interface AdminRolePermissionMapper extends BaseMapper<AdminRolePermissionEntity> {
}
