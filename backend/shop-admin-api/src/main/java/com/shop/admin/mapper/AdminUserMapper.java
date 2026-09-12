package com.shop.admin.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shop.admin.entity.AdminUserEntity;

/**
 * 后台管理用户Mapper接口
 * 提供管理用户数据的数据库操作
 *
 * @author shop
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

    /**
     * 根据ID更新记录（绕过逻辑删除）
     *
     * @param entity 管理员实体
     * @return 影响行数
     */
    int updateByIdIgnoreDeleted(AdminUserEntity entity);

    /**
     * 根据ID逻辑删除记录（绕过逻辑删除查询）
     *
     * @param id 管理员ID
     * @return 影响行数
     */
    int deleteByIdIgnoreDeleted(Long id);

    /**
     * 物理删除指定用户名前缀的测试用户（用于 E2E 测试数据清理）
     * <p>prefix 需以 e2e- 开头（调用方/Service 已校验），避免误删真实业务数据</p>
     *
     * @param prefix 已校验的用户名前缀（须以 e2e- 开头）
     * @return 影响行数
     */
    int deleteByUsernamePrefix(@Param("prefix") String prefix);
}