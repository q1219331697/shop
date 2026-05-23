package com.shop.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shop.admin.entity.AdminUserEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 后台管理用户Mapper接口
 * 提供管理用户数据的数据库操作
 * @since 1.0.0
 */
@Mapper
public interface AdminUserMapper extends BaseMapper<AdminUserEntity> {

    /**
     * 恢复已删除的管理员（绕过逻辑删除）
     *
     * @param id 管理员ID
     * @return 影响行数
     */
    int restoreById(Long id);

    /**
     * 根据ID查询记录（包含已删除的，绕过逻辑删除）
     *
     * @param id 管理员ID
     * @return 管理员实体
     */
    AdminUserEntity selectByIdIgnoreDeleted(Long id);

    /**
     * 分页查询管理员（包含已删除的，绕过逻辑删除）
     *
     * @param page 分页对象
     * @param username 用户名搜索（可选）
     * @param realName 姓名搜索（可选）
     * @param status 状态筛选（可选）
     * @param deleted 删除状态筛选（可选）
     * @return 管理员分页数据
     */
    IPage<AdminUserEntity> selectPageIgnoreDeleted(Page<AdminUserEntity> page,
                                                    @Param("username") String username,
                                                    @Param("realName") String realName,
                                                    @Param("status") Integer status,
                                                    @Param("deleted") Integer deleted);
}