package com.shop.admin.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.admin.entity.AdminUserRoleEntity;

/**
 * 用户角色关联Mapper接口
 *
 * @author shop
 * @since 1.0.0
 */
@Mapper
public interface AdminUserRoleMapper extends BaseMapper<AdminUserRoleEntity> {

    /**
     * 物理删除指定用户名前缀的用户的角色关联（user_id 属于用户名以该前缀开头的用户）
     * <p>prefix 需以 e2e- 开头（调用方/Service 已校验），避免误删真实业务数据</p>
     *
     * @param prefix 已校验的用户名前缀（须以 e2e- 开头）
     * @return 影响行数
     */
    int deleteByUsernamePrefix(@Param("prefix") String prefix);
}
