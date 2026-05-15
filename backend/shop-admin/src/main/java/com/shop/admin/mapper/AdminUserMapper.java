package com.shop.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.admin.entity.AdminUserEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 后台管理用户Mapper接口
 * 提供管理用户数据的数据库操作
 * @since 1.0.0
 */
@Mapper
public interface AdminUserMapper extends BaseMapper<AdminUserEntity> {
}