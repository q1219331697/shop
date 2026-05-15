package com.shop.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.entity.OrderEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单Mapper接口
 * 提供订单数据的数据库操作
 */
@Mapper
public interface OrderMapper extends BaseMapper<OrderEntity> {
}
