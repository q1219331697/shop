package com.shop.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.entity.UserEntity;

/**
 * 用户Mapper接口
 * 提供用户数据的数据库操作
 *
 * @author shop
 * @since 1.0.0
 */
@Mapper
public interface UserMapper extends BaseMapper<UserEntity> {
}
