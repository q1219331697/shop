
package com.shop.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.admin.entity.AdminRoleEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 后台角色Mapper接口
 * @since 1.0.0
 */
@Mapper
public interface AdminRoleMapper extends BaseMapper<AdminRoleEntity> {

    /**
     * 物理删除指定角色名前缀的测试角色（用于 E2E 测试数据清理）
     * <p>prefix 需以 e2e_ 开头（调用方/Service 已校验），避免误删真实业务数据</p>
     *
     * @param prefix 已校验的角色名前缀（须以 e2e_ 开头）
     * @return 影响行数
     */
    int deleteByRoleNamePrefix(@Param("prefix") String prefix);
}
