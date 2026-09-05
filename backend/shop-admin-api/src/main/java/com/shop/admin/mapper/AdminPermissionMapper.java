
package com.shop.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.admin.entity.AdminPermissionEntity;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 后台权限Mapper接口
 * @since 1.0.0
 */
@Mapper
public interface AdminPermissionMapper extends BaseMapper<AdminPermissionEntity> {

    /**
     * 物理删除 E2E 测试产生的权限数据（忽略逻辑删除标记）。
     * 按权限名称前缀匹配，覆盖整棵子树（子节点名称同样带前缀）。
     *
     * @param prefix 权限名称前缀（须以 e2e_ 开头）
     */
    @Delete("DELETE FROM t_admin_permission WHERE permission_name LIKE CONCAT(#{prefix}, '%')")
    void deleteByE2ENamePrefix(@Param("prefix") String prefix);
}
