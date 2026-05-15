package com.shop.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.entity.CartEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 购物车Mapper接口
 * 提供购物车数据的数据库操作
 */
@Mapper
public interface CartMapper extends BaseMapper<CartEntity> {
}
