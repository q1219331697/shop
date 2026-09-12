package com.shop.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shop.entity.OrderItemEntity;

/**
 * 订单详情Mapper接口
 * 提供订单详情数据的数据库操作
 *
 * @author shop
 * @since 1.0.0
 */
@Mapper
public interface OrderItemMapper extends BaseMapper<OrderItemEntity> {
}
