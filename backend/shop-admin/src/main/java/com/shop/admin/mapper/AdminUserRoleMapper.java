
package com.shop.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.admin.entity.AdminUserRoleEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户角色关联Mapper接口
 * @since 1.1.0
 */
@Mapper
public interface AdminUserRoleMapper extends BaseMapper<AdminUserRoleEntity> {
}
