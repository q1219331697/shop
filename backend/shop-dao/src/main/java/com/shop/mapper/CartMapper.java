package com.shop.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.entity.CartEntity;

/**
 * 购物车Mapper接口
 * 提供购物车数据的数据库操作
 *
 * @author shop
 * @since 1.0.0
 */
@Mapper
public interface CartMapper extends BaseMapper<CartEntity> {
}
