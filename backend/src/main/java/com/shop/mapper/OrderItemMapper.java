package com.shop.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.entity.OrderItemEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单详情Mapper接口
 * 提供订单详情数据的数据库操作
 */
@Mapper
public interface OrderItemMapper extends BaseMapper<OrderItemEntity> {
}
